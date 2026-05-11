"""
Entry point for the MindNeedAI server.

Module-level `app` is the ASGI application importable by uvicorn as "main:app".
The `if __name__` block is used for local development only; production deployments
run uvicorn directly: `uvicorn main:app --host 0.0.0.0 --port 8000`.
"""
import uvicorn

from server.config.settings import settings
from server.main import create_app

app = create_app()

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.api_host,
        port=settings.api_port,
        log_level=settings.log_level.lower(),
        reload=settings.environment == "development",
    )
