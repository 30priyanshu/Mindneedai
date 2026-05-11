"""
User Preferences schemas.

Single responsibility: Pydantic input/output contracts for preferences endpoints.
No business logic or DB access.
"""
from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


FontSize = Literal["small", "normal", "large", "xlarge"]


class UserPreferencesRequest(BaseModel):
    fontSize: FontSize = Field("normal", description="UI font size preset")
    highContrast: bool = False
    reduceMotion: bool = False
    textToSpeech: bool = False
    autoSave: bool = True
    notifications: bool = True


class UserPreferencesResponse(BaseModel):
    user_id: str
    fontSize: str
    highContrast: bool
    reduceMotion: bool
    textToSpeech: bool
    autoSave: bool
    notifications: bool
    updated_at: Optional[datetime]

    model_config = {"from_attributes": True}
