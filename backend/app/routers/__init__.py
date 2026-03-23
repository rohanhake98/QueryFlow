from app.routers.auth import router as auth_router
from app.routers.connections import router as connections_router
from app.routers.query import router as query_router
from app.routers.history import router as history_router
from app.routers.upload import router as upload_router

__all__ = ["auth_router", "connections_router", "query_router", "history_router", "upload_router"]
