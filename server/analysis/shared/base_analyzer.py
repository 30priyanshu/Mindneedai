from abc import ABC, abstractmethod
from typing import Any, Dict


class BaseAnalyzer(ABC):

    @abstractmethod
    def load_model(self) -> None:
        ...

    @abstractmethod
    def predict(self, input_data: Any) -> Dict[str, Any]:
        ...

    @abstractmethod
    def unload(self) -> None:
        ...

    @property
    @abstractmethod
    def is_loaded(self) -> bool:
        ...

    def health_check(self) -> Dict[str, Any]:
        return {"loaded": self.is_loaded}
