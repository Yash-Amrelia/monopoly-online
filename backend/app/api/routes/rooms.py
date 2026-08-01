from fastapi import APIRouter, HTTPException
from uuid import uuid4

from app.schemas.room import RoomCreate

router = APIRouter()

rooms = []


@router.post("/rooms")
def create_room(room: RoomCreate):

    room_data = {
        "room_id": str(uuid4())[:8],
        "room_name": room.room_name,
        "host": room.host,
        "players": [room.host],
        "game_started": False
    }

    rooms.append(room_data)

    return room_data


@router.get("/rooms")
def get_rooms():
    return {
        "total_rooms": len(rooms),
        "rooms": rooms
    }


@router.get("/rooms/{room_id}")
def get_room(room_id: str):

    for room in rooms:
        if room["room_id"] == room_id:
            return room

    raise HTTPException(
        status_code=404,
        detail="Room not found"
    )