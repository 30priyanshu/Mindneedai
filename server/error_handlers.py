"""
FastAPI exception handlers.

Single canonical error response shape for every error path:
    { "error": { "message": str, "code": int, "request_id": str } }

Starlette resolves handlers by walking the exception class MRO, so one
handler for MindNeedError covers all named subtypes.  A separate handler
for RequestValidationError normalises FastAPI's built-in 422 shape.
The fallback Exception handler catches everything else as 500 — it logs
the full traceback internally but never exposes it in the response body.
"""
import traceback

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from loguru import logger

from server.exceptions import MindNeedError


def _error_body(message: str, code: int, request_id: str) -> dict:
    return {"error": {"message": message, "code": code, "request_id": request_id}}


def _request_id(request: Request) -> str:
    return getattr(request.state, "request_id", "unknown")


def register_error_handlers(app: FastAPI) -> None:
    """Attach all exception handlers to the FastAPI application instance."""

    @app.exception_handler(MindNeedError)
    async def mindneed_handler(request: Request, exc: MindNeedError) -> JSONResponse:
        rid = _request_id(request)
        logger.warning(
            "domain_error",
            extra={
                "request_id": rid,
                "error_type": type(exc).__name__,
                "code": exc.code,
                "message": exc.message,
            },
        )
        return JSONResponse(
            status_code=exc.code,
            content=_error_body(exc.message, exc.code, rid),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        rid = _request_id(request)
        first_error = exc.errors()[0] if exc.errors() else {}
        message = first_error.get("msg", "Invalid request payload")
        logger.info(
            "validation_error",
            extra={"request_id": rid, "detail": exc.errors()},
        )
        return JSONResponse(
            status_code=422,
            content=_error_body(message, 422, rid),
        )

    @app.exception_handler(Exception)
    async def fallback_handler(request: Request, exc: Exception) -> JSONResponse:
        rid = _request_id(request)
        logger.error(
            "unhandled_exception",
            extra={
                "request_id": rid,
                "exception_type": type(exc).__name__,
                "traceback": traceback.format_exc(),
            },
        )
        return JSONResponse(
            status_code=500,
            content=_error_body("Internal server error", 500, rid),
        )
