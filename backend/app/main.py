from fastapi import FastAPI

from app.api.router import api_router

app = FastAPI(
    title="Monopoly Online API",
    version="0.1.0",
    description="Backend API for the Monopoly Online multiplayer game."
)

app.include_router(api_router)