from fastapi import APIRouter, HTTPException
from uuid import uuid4

from app.schemas.room import RoomCreate
from app.schemas.join_room import JoinRoom

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

@router.post("/rooms/{room_id}/join")
def join_room(room_id: str, player: JoinRoom):

    for room in rooms:

        if room["room_id"] == room_id:

            if room["game_started"]:
                raise HTTPException(
                    status_code=400,
                    detail="Game already started"
                )

            if player.username in room["players"]:
                raise HTTPException(
                    status_code=400,
                    detail="Player already joined"
                )

            room["players"].append(player.username)

            return {
                "message": f"{player.username} joined successfully",
                "room": room
            }

    raise HTTPException(
        status_code=404,
        detail="Room not found"
    )