from pydantic import BaseModel


class StartGame(BaseModel):
    host: str