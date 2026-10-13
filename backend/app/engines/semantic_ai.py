import json
import logging
from datetime import datetime
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.schemas import (
    Syllabus, Subject, Unit, Topic, PYQDocument, TopicPYQMapping, generate_uuid
)
from app.services.ai_gateway import ai_gateway
from app.services.vector_store import VectorStoreService

logger = logging.getLogger("optimus.semantic_ai")

class SemanticAIEngine:
    @staticmethod
    def process_and_store_syllabus(
        db: Session, 
        user_id: str, 
        title: str, 
        raw_text: str, 
        file_url: str = None
    ) -> Syllabus:
        """
        Parses raw syllabus text via Semantic AI, generates embeddings for each topic,
        and persists the entire hierarchy: Syllabus -> Subjects -> Units -> Topics.
        """
        parsed_data = ai_gateway.parse_syllabus(raw_text)
        
        # Create Syllabus entity
        syllabus = Syllabus(
            id=generate_uuid(),
            user_id=user_id,
            title=title,
            raw_file_url=file_url,
            created_at=datetime.utcnow()
        )
        db.add(syllabus)
        db.flush()

        subjects_data = parsed_data.get("subjects", [])
        for s_idx, subj_data in enumerate(subjects_data):
            subject = Subject(
                id=generate_uuid(),
                syllabus_id=syllabus.id,
                name=subj_data.get("name", f"Subject {s_idx + 1}"),
                order_index=s_idx
            )
            db.add(subject)
            db.flush()

            units_data = subj_data.get("units", [])
            for u_idx, unit_data in enumerate(units_data):
                unit = Unit(
                    id=generate_uuid(),
                    subject_id=subject.id,
                    name=unit_data.get("name", f"Unit {u_idx + 1}"),
                    order_index=u_idx
                )
                db.add(unit)
                db.flush()

                topics_data = unit_data.get("topics", [])
                for t_idx, topic_data in enumerate(topics_data):
                    t_name = topic_data.get("name", f"Topic {t_idx + 1}")
                    est_hours = float(topic_data.get("estimated_hours", 2.0))
                    
                    # Compute dense semantic embedding vector
                    semantic_text = f"{subject.name} {unit.name} {t_name}"
                    emb = VectorStoreService.generate_embedding(semantic_text)

                    topic = Topic(
                        id=generate_uuid(),
                        unit_id=unit.id,
                        name=t_name,
                        description=f"Comprehensive coverage of {t_name} in {unit.name}.",
                        estimated_hours=est_hours,
                        pyq_weight_score=0.0,
                        user_mastery_score=0.0,
                        calculated_priority=5.0, # Initial default
                        embedding_json=json.dumps(emb)
                    )
                    db.add(topic)
                    db.flush()

        db.commit()
        db.refresh(syllabus)
        return syllabus

    @staticmethod
    def map_pyq_document(
        db: Session,
        subject_id: str,
        year: int,
        raw_text: str,
        file_url: str = None
    ) -> Dict[str, Any]:
        """
        Extracts questions from past exam paper, computes embeddings, performs
        semantic matching against all topics under the subject, and updates pyq_weight_score.
        """
        # Save PYQ Document record
        pyq_doc = PYQDocument(
            id=generate_uuid(),
            subject_id=subject_id,
            year=year,
            file_url=file_url,
            extracted_text=raw_text[:10000],
            created_at=datetime.utcnow()
        )
        db.add(pyq_doc)
        db.flush()

        # Extract discrete exam questions with weights
        questions = ai_gateway.extract_pyq_questions(raw_text)
        
        # Load all topics for this subject
        topics = (
            db.query(Topic)
            .join(Unit, Topic.unit_id == Unit.id)
            .filter(Unit.subject_id == subject_id)
            .all()
        )

        if not topics:
            db.commit()
            return {"pyq_id": pyq_doc.id, "mapped_questions": 0, "topics_updated": 0}

        topic_embeddings = []
        for t in topics:
            emb = json.loads(t.embedding_json) if t.embedding_json else VectorStoreService.generate_embedding(t.name)
            topic_embeddings.append((t.id, emb))

        topic_accumulated_weight: Dict[str, float] = {t.id: 0.0 for t in topics}
        total_mappings_created = 0

        for q in questions:
            q_text = q.get("text", "")
            q_weight = float(q.get("weight", 5.0))
            q_emb = VectorStoreService.generate_embedding(q_text)

            matches = VectorStoreService.find_top_matches(q_emb, topic_embeddings, threshold=0.15)
            
            # Map top matches
            for matched_topic_id, sim in matches[:3]:
                mapping = TopicPYQMapping(
                    id=generate_uuid(),
                    topic_id=matched_topic_id,
                    pyq_id=pyq_doc.id,
                    question_text=q_text,
                    relevance_score=float(sim),
                    weight=q_weight,
                    embedding_json=json.dumps(q_emb)
                )
                db.add(mapping)
                topic_accumulated_weight[matched_topic_id] += (sim * q_weight)
                total_mappings_created += 1

        # Normalize and update pyq_weight_score for each topic (0.0 to 10.0 scale)
        max_accumulated = max(topic_accumulated_weight.values()) if topic_accumulated_weight.values() else 1.0
        if max_accumulated == 0:
            max_accumulated = 1.0

        for t in topics:
            acc = topic_accumulated_weight.get(t.id, 0.0)
            # Scale from 0 to 10
            normalized_score = round(min(10.0, (acc / max_accumulated) * 10.0), 2)
            # Combine with prior if existing
            t.pyq_weight_score = max(t.pyq_weight_score, normalized_score)

        db.commit()
        return {
            "pyq_id": pyq_doc.id,
            "mapped_questions": total_mappings_created,
            "topics_updated": len(topics)
        }
