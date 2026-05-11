"""
Timezone-aware datetime utilities.

Requires Python ≥ 3.9 for stdlib zoneinfo (guaranteed on 3.12).
No pytz dependency — zoneinfo reads the system IANA database.

Public API
----------
utc_now()                          -> datetime (UTC, aware)
to_utc(dt)                         -> datetime (UTC, aware)
convert_to_tz(dt, tz_name)         -> datetime (target tz, aware)
format_datetime(dt, tz_name, fmt)  -> str
format_datetime_short(dt, tz_name) -> str

All functions accept both naive (assumed UTC) and aware datetimes.
"""
from __future__ import annotations

from datetime import datetime, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

UTC = timezone.utc
_DEFAULT_TZ = "UTC"

_ABBR_MAP: dict[str, str] = {
    "Asia/Kolkata": "IST",
    "Asia/Calcutta": "IST",
    "America/New_York": "ET",
    "America/Los_Angeles": "PT",
    "America/Chicago": "CT",
    "Europe/London": "GMT",
    "UTC": "UTC",
}


def utc_now() -> datetime:
    """Return the current moment as a timezone-aware UTC datetime."""
    return datetime.now(UTC)


def to_utc(dt: datetime) -> datetime:
    """Ensure *dt* is UTC-aware.  Naive datetimes are treated as UTC."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=UTC)
    return dt.astimezone(UTC)


def convert_to_tz(dt: datetime, tz_name: str = _DEFAULT_TZ) -> datetime:
    """Convert *dt* to the named IANA timezone.

    Falls back to UTC silently when the timezone name is invalid so that
    a misconfigured user preference never crashes the response pipeline.
    """
    dt = to_utc(dt)
    try:
        return dt.astimezone(ZoneInfo(tz_name))
    except (ZoneInfoNotFoundError, KeyError):
        return dt


def _tz_abbr(tz_name: str) -> str:
    return _ABBR_MAP.get(tz_name, tz_name.split("/")[-1][:3].upper())


def format_datetime(
    dt: datetime,
    tz_name: str = _DEFAULT_TZ,
    include_seconds: bool = False,
) -> str:
    """Return a human-readable string like 'March 25, 2026 at 10:30 AM IST'."""
    local = convert_to_tz(dt, tz_name)
    abbr = _tz_abbr(tz_name)
    fmt = "%B %d, %Y at %I:%M:%S %p" if include_seconds else "%B %d, %Y at %I:%M %p"
    return f"{local.strftime(fmt)} {abbr}"


def format_datetime_short(dt: datetime, tz_name: str = _DEFAULT_TZ) -> str:
    """Return a compact string like '2026-03-25 10:30 IST'."""
    local = convert_to_tz(dt, tz_name)
    abbr = _tz_abbr(tz_name)
    return f"{local.strftime('%Y-%m-%d %H:%M')} {abbr}"
