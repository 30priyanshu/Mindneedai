from abc import ABC, abstractmethod
from typing import Any, Dict

class BaseLearner(ABC):
    """
    Abstract Base Class for modality continuous learning.
    Responsibility: Manage async feedback loops and data prep for fine-tuning.
    """

    @abstractmethod
    def collect_feedback(self, analysis_id: str, feedback: Dict[str, Any]) -> None:
        """Record user/clinical feedback for a specific analysis."""
        pass

    @abstractmethod
    def trigger_cycle(self) -> None:
        """Trigger feedback dataset preparation or fine-tuning process."""
        pass
