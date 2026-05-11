import mimetypes
import os
from inspect import isawaitable
from stat import S_ISDIR

from fastapi import HTTPException
from fastapi.responses import Response, StreamingResponse
from fastapi.staticfiles import StaticFiles
from loguru import logger
from starlette.datastructures import Headers
from starlette.types import Scope


class AudioStaticFiles(StaticFiles):
    """
    Subclass of StaticFiles configured for audio/video streaming.
    Adds `Accept-Ranges: bytes` support and proper `Content-Range` headers for 206 limits.
    """

    async def _lookup_file(self, path: str) -> tuple[str, os.stat_result]:
        try:
            result = self.lookup_path(path)
            if isawaitable(result):
                result = await result
            full_path, stat_result = result
        except Exception as exc:
            logger.warning(
                "media_static_lookup_failed",
                extra={"path": path, "error_type": type(exc).__name__},
            )
            raise HTTPException(status_code=404, detail="File Not Found")
        if stat_result is None or S_ISDIR(stat_result.st_mode):
            raise HTTPException(status_code=404, detail="File Not Found")
        return full_path, stat_result

    async def get_response(self, path: str, scope: Scope) -> Response:
        """Override to implement proper byte-range partial responses for audio streaming."""
        full_path, stat_result = await self._lookup_file(path)
        file_size = stat_result.st_size
        range_header: str | None = Headers(scope=scope).get("Range")
        if not range_header:
            response = await super().get_response(path, scope)
            response.headers["Accept-Ranges"] = "bytes"
            return response

        start, end = _parse_range(range_header, file_size)
        end = min(end, file_size - 1)
        return StreamingResponse(
            _file_iterator(full_path, start, end),
            status_code=206,
            headers=_range_headers(full_path, start, end, file_size),
        )


def _parse_range(range_header: str, file_size: int) -> tuple[int, int]:
    try:
        byte_range = range_header.replace("bytes=", "", 1).split("-")
        start = int(byte_range[0]) if byte_range[0] else 0
        end = int(byte_range[1]) if len(byte_range) > 1 and byte_range[1] else file_size - 1
    except (IndexError, ValueError):
        raise HTTPException(status_code=416, detail="Requested Range Not Satisfiable")
    if start >= file_size or end < start:
        raise HTTPException(status_code=416, detail="Requested Range Not Satisfiable")
    return start, end


def _file_iterator(file_path: str, start_byte: int, end_byte: int):
    with open(file_path, "rb") as f:
        f.seek(start_byte)
        remaining = end_byte - start_byte + 1
        while remaining > 0:
            data = f.read(min(65536, remaining))
            if not data:
                break
            remaining -= len(data)
            yield data


def _range_headers(file_path: str, start: int, end: int, file_size: int) -> dict[str, str]:
    headers = {
        "Accept-Ranges": "bytes",
        "Content-Range": f"bytes {start}-{end}/{file_size}",
        "Content-Length": str(end - start + 1),
    }
    content_type, _ = mimetypes.guess_type(file_path)
    if content_type:
        headers["Content-Type"] = content_type
    return headers
