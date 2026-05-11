from abc import ABC, abstractmethod

class BaseModelManager(ABC):
    """
    Abstract Base Class for model version management.
    Responsibility: Handle A/B testing, rollout, and fallback of models.
    """

    @abstractmethod
    def get_active_version(self) -> str:
        """Retrieve the currently active model version ID."""
        pass

    @abstractmethod
    def activate_version(self, version_id: str) -> None:
        """Set a specific version as the active model."""
        pass

    @abstractmethod
    def rollback(self) -> None:
        """Revert to the previously active model version."""
        pass
