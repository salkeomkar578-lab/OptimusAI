from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.schemas import (
    User, UserCreate, UserResponse,
    AvailabilitySlot, AvailabilitySlotCreate, AvailabilitySlotResponse,
    generate_uuid
)

router = APIRouter(prefix="/users", tags=["Users & Availability"])

@router.post("", response_model=UserResponse)
def create_or_get_user(payload: UserCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        user = User(
            id=generate_uuid(),
            email=payload.email,
            name=payload.name,
            target_exam_date=payload.target_exam_date,
            created_at=datetime.utcnow()
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Update target exam date if modified
        user.name = payload.name
        user.target_exam_date = payload.target_exam_date
        db.commit()
        db.refresh(user)
    return user

@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/{user_id}/availability", response_model=List[AvailabilitySlotResponse])
def set_user_availability(
    user_id: str, 
    slots: List[AvailabilitySlotCreate], 
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Replace existing slots
    db.query(AvailabilitySlot).filter(AvailabilitySlot.user_id == user_id).delete()
    
    new_slots = []
    for s in slots:
        slot_obj = AvailabilitySlot(
            id=generate_uuid(),
            user_id=user_id,
            day_of_week=s.day_of_week,
            start_time=s.start_time,
            end_time=s.end_time,
            is_recurring=s.is_recurring
        )
        db.add(slot_obj)
        new_slots.append(slot_obj)

    db.commit()
    for s in new_slots:
        db.refresh(s)
    return new_slots

@router.get("/{user_id}/availability", response_model=List[AvailabilitySlotResponse])
def get_user_availability(user_id: str, db: Session = Depends(get_db)):
    slots = db.query(AvailabilitySlot).filter(AvailabilitySlot.user_id == user_id).order_by(AvailabilitySlot.day_of_week).all()
    return slots
