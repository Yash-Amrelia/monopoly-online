import random

from fastapi import APIRouter, HTTPException
from uuid import uuid4

from app.schemas.room import RoomCreate
from app.schemas.join_room import JoinRoom
from app.schemas.start_game import StartGame
from app.schemas.roll_dice import RollDice
from app.game.board import BOARD

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

@router.post("/rooms/{room_id}/start")
def start_game(room_id: str, data: StartGame):

    for room in rooms:

        if room["room_id"] == room_id:

            if room["host"] != data.host:
                raise HTTPException(
                    status_code=403,
                    detail="Only the host can start the game"
                )

            if room["game_started"]:
                raise HTTPException(
                    status_code=400,
                    detail="Game already started"
                )

            if len(room["players"]) < 2:
                raise HTTPException(
                    status_code=400,
                    detail="Minimum 2 players required"
                )

            room["game_started"] = True

            # Initialize Monopoly players
            game_players = []

            for username in room["players"]:
                game_players.append({
                    "username": username,
                    "money": 1500,
                    "position": 0,
                    "properties": [],
                    "in_jail": False,
                    "jail_turns": 0,
                    "is_bankrupt": False
                })

            # Initialize game state
            room["game_state"] = {
                "current_turn": game_players[0]["username"],
                "turn_number": 1,
                "players": game_players
            }

            return {
                "message": "Game started successfully",
                "room": room
            }

    raise HTTPException(
        status_code=404,
        detail="Room not found"
    )

@router.post("/rooms/{room_id}/roll-dice")
def roll_dice(room_id: str, data: RollDice):

    for room in rooms:

        if room["room_id"] == room_id:

            if not room["game_started"]:
                raise HTTPException(
                    status_code=400,
                    detail="Game has not started"
                )

            game_state = room["game_state"]

            if game_state["current_turn"] != data.username:
                raise HTTPException(
                    status_code=400,
                    detail="Not your turn"
                )

            dice1 = random.randint(1, 6)
            dice2 = random.randint(1, 6)
            total = dice1 + dice2

            for player in game_state["players"]:

                if player["username"] == data.username:

                    player["position"] = (player["position"] + total) % 40
                    landed_tile = BOARD[player["position"]]

                    current_index = game_state["players"].index(player)
                    next_index = (current_index + 1) % len(game_state["players"])

                    game_state["current_turn"] = game_state["players"][next_index]["username"]
                    game_state["turn_number"] += 1

                    return {
                        "dice": [dice1, dice2],
                        "total": total,
                        "current_turn": game_state["current_turn"],
                        "turn_number": game_state["turn_number"],
                        "player": player,
                        "landed_on": landed_tile
                    }

    raise HTTPException(
        status_code=404,
        detail="Room not found"
    )