from pydantic import BaseModel


class PlayerCreate(BaseModel):
    username: str