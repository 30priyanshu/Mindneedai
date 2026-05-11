"""
Pagination utilities.

PaginatedResponse[T]
    Generic Pydantic model returned by every list endpoint.

paginate_query(session, stmt, page, size)
    Executes two SQLAlchemy 2.0-style queries against the given Session:
    one COUNT for the total and one paginated SELECT for the items.
    Max page size is capped at MAX_PAGE_SIZE (100) regardless of the
    caller-supplied value; minimum page number is 1.

Failure modes
-------------
- page < 1  → silently clamped to 1
- size < 1  → silently clamped to 1
- size > 100 → silently clamped to 100
"""
from __future__ import annotations

import math
from typing import Generic, TypeVar

from pydantic import BaseModel
from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

T = TypeVar("T")

MAX_PAGE_SIZE: int = 100
MIN_PAGE_SIZE: int = 1


class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int
    total_pages: int


def paginate_query(
    session: Session,
    stmt: Select,
    page: int,
    size: int,
) -> tuple[list, int]:
    """Return *(items, total)* for the given SELECT statement.

    Parameters
    ----------
    session : SQLAlchemy Session (sync)
    stmt    : A ``select()`` statement — must NOT already have limit/offset applied
    page    : 1-indexed page number
    size    : Items per page (clamped to [1, 100])
    """
    page = max(1, page)
    size = max(MIN_PAGE_SIZE, min(size, MAX_PAGE_SIZE))

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total: int = session.execute(count_stmt).scalar_one()

    items = session.execute(
        stmt.offset((page - 1) * size).limit(size)
    ).scalars().all()

    return list(items), total


def build_paginated_response(
    items: list[T],
    total: int,
    page: int,
    size: int,
) -> PaginatedResponse[T]:
    """Construct a PaginatedResponse from already-fetched items."""
    size = max(MIN_PAGE_SIZE, min(size, MAX_PAGE_SIZE))
    total_pages = math.ceil(total / size) if size else 0
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=size,
        total_pages=total_pages,
    )
