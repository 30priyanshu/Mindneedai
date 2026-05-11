"""
Request-ID tracing middleware.

Reads X-Request-ID from the incoming request header; generates a UUID v4
when absent.  Stores the ID on request.state.request_id so every handler
and exception handler can embed it in log records and error responses.
Echoes the same ID on the outgoing response header.
"""
import uuid

from fastapi import Request
from loguru import logger
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response


class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        request.state.request_id = request_id

        with logger.contextualize(request_id=request_id):
            response: Response = await call_next(request)

        response.headers["X-Request-ID"] = request_id
        return response
