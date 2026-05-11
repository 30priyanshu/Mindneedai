"""
Request body size-limit middleware.

Rejects multipart/binary uploads that exceed MAX_UPLOAD_BYTES (50 MB) by
inspecting the Content-Length header before the body reaches any handler.

Failure modes handled:
- Content-Length header absent         → pass through (no early rejection)
- Content-Length header not an integer → pass through (malformed; let uvicorn handle)
- Content-Length > MAX_UPLOAD_BYTES    → 413 with canonical error shape

Response body size is NOT inspected here because streaming responses do not
expose a synchronous .body attribute.  Payload size on egress is instead
controlled via pagination limits on all list endpoints.
"""
from fastapi import Request
from fastapi.responses import JSONResponse
from loguru import logger
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

MAX_UPLOAD_BYTES: int = 50 * 1024 * 1024  # 50 MB


def _request_id(request: Request) -> str:
    return getattr(request.state, "request_id", "unknown")


class ResponseSizeLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        if request.method in {"POST", "PUT", "PATCH"}:
            raw = request.headers.get("content-length")
            if raw is not None:
                try:
                    size = int(raw)
                except ValueError:
                    size = None

                if size is not None and size > MAX_UPLOAD_BYTES:
                    rid = _request_id(request)
                    limit_mb = MAX_UPLOAD_BYTES // (1024 * 1024)
                    logger.warning(
                        "upload_too_large",
                        extra={
                            "request_id": rid,
                            "bytes": size,
                            "limit_bytes": MAX_UPLOAD_BYTES,
                        },
                    )
                    return JSONResponse(
                        status_code=413,
                        content={
                            "error": {
                                "message": f"Upload exceeds {limit_mb} MB limit",
                                "code": 413,
                                "request_id": rid,
                            }
                        },
                    )

        return await call_next(request)
