from abc import ABC, abstractmethod
from typing import Dict, Any
from openai import AsyncClient


class BaseReasoner(ABC):
    """
    Abstract Base Class for all modality reasoners.
    Responsibility: Bridge raw analyzer output to semantic clinical insights using LLMs.
    """

    def __init__(self, openai_client: AsyncClient):
        self.openai_client = openai_client

    def is_available(self) -> bool:
        try:
            return bool(self.openai_client and getattr(self.openai_client, "api_key", None))
        except Exception:
            return False

    @abstractmethod
    def build_prompt(self, analysis_result: Dict[str, Any]) -> str:
        pass

    @abstractmethod
    async def call_llm(self, prompt: str) -> str:
        pass

    @abstractmethod
    def parse_response(self, raw_response: str) -> Dict[str, Any]:
        pass
