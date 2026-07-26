from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def health_check():
    return {
        "project": "Monopoly Online",
        "status": "Backend Running 🚀",
        "version": "0.1.0"
    }