from pydantic import BaseModel


class JoinRoom(BaseModel):
    username: str