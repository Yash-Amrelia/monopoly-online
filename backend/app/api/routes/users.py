from fastapi import APIRouter

from app.schemas.player import PlayerCreate

router = APIRouter()

users = []


@router.post("/users")
def create_user(player: PlayerCreate):

    user = {
        "id": len(users) + 1,
        "username": player.username
    }

    users.append(user)

    return {
        "message": "User created successfully",
        "user": user
    }