"""Periodic ``torch.cuda.empty_cache`` to bound long-run GPU fragmentation."""
from __future__ import annotations

import asyncio

from loguru import logger


async def gpu_cache_cleaner(interval_s: int) -> None:
    if interval_s <= 0:
        return
    try:
        import torch
    except ImportError:
        return
    if not torch.cuda.is_available():
        return
    try:
        while True:
            await asyncio.sleep(interval_s)
            try:
                torch.cuda.empty_cache()
                logger.debug("gpu_cache_cleared")
            except Exception as exc:
                logger.warning("gpu_cache_clear_failed", extra={"error": str(exc)})
    except asyncio.CancelledError:
        return
