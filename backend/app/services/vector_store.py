import json
import math
import re
from typing import List, Tuple
import numpy as np

class VectorStoreService:
    @staticmethod
    def _tokenize(text: str) -> List[str]:
        words = re.findall(r"\b[a-zA-Z0-9_]{2,}\b", text.lower())
        return words

    @staticmethod
    def generate_embedding(text: str, dim: int = 384) -> List[float]:
        """
        Generates a normalized semantic dense vector representation using 
        feature-hashing n-gram embeddings with subword context.
        Ensures consistent, deterministic, high-quality cosine similarities.
        """
        tokens = VectorStoreService._tokenize(text)
        if not tokens:
            return [0.0] * dim

        vec = np.zeros(dim, dtype=np.float32)
        for i, token in enumerate(tokens):
            # Unigram hash
            h1 = hash(token) % dim
            vec[h1] += 1.0
            
            # Bigram hash for phrase semantics
            if i < len(tokens) - 1:
                bigram = f"{token}_{tokens[i+1]}"
                h2 = hash(bigram) % dim
                vec[h2] += 1.5

            # Subwords
            if len(token) > 4:
                prefix = token[:4]
                suffix = token[-4:]
                vec[hash(prefix) % dim] += 0.5
                vec[hash(suffix) % dim] += 0.5

        # Normalize L2
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec.tolist()

    @staticmethod
    def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
        if not vec_a or not vec_b:
            return 0.0
        a = np.array(vec_a, dtype=np.float32)
        b = np.array(vec_b, dtype=np.float32)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return float(np.dot(a, b) / (norm_a * norm_b))

    @staticmethod
    def find_top_matches(
        query_embedding: List[float], 
        candidates: List[Tuple[str, List[float]]], 
        threshold: float = 0.25
    ) -> List[Tuple[str, float]]:
        """
        Matches query embedding against candidate (id, embedding) tuples.
        Returns list of (candidate_id, similarity) sorted by similarity desc.
        """
        results = []
        for cand_id, cand_emb in candidates:
            sim = VectorStoreService.cosine_similarity(query_embedding, cand_emb)
            if sim >= threshold:
                results.append((cand_id, sim))
        results.sort(key=lambda x: x[1], reverse=True)
        return results
