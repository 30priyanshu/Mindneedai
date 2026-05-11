import logging
from typing import Any, Dict, Optional

import json
import tempfile
from pathlib import Path
from datetime import datetime, timezone

from server.analysis.shared.base_learner import BaseLearner
from server.db.session import SessionLocal
from server.config.settings import settings

logger = logging.getLogger(__name__)

class TextLearner(BaseLearner):
    """
    Text Modality Learner.
    Responsibility: Manage async feedback loops and data prep for text fine-tuning.
    """

    def __init__(self, cache_dir: str = "./model_cache/text_analysis"):
        self.cache_dir = Path(cache_dir)
        self.feedback_dir = self.cache_dir / "feedback"
        self.feedback_dir.mkdir(parents=True, exist_ok=True)
        self._feedback_buffer = []

    def collect_feedback(self, analysis_id: str, feedback: Dict[str, Any]) -> None:
        if not analysis_id or not feedback:
            raise ValueError("Analysis ID and feedback data are required.")
        if len(self._feedback_buffer) >= settings.max_feedback_buffer_size:
            logger.warning("text_feedback_buffer_full", extra={"size": len(self._feedback_buffer)})
            return
        record = {
            "analysis_id": analysis_id,
            "feedback": feedback,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        self._feedback_buffer.append(record)
        fb_file = self.feedback_dir / f"fb_{analysis_id}.json"
        fd, tmp = tempfile.mkstemp(dir=str(self.feedback_dir), suffix=".tmp")
        try:
            with open(fd, "w") as f:
                json.dump(record, f)
            Path(tmp).replace(fb_file)
        except Exception:
            Path(tmp).unlink(missing_ok=True)
            raise
        logger.info("text_feedback_collected", extra={"analysis_id": analysis_id, "buffer_size": len(self._feedback_buffer)})

    def trigger_cycle(self) -> None:
        if not self._feedback_buffer:
            logger.info("No text feedback data available to trigger cycle.")
            return
            
        logger.info(f"Triggering dataset prep for {len(self._feedback_buffer)} text records.")
        # Minimal extraction of dataset prep logic
        dataset = []
        for fb in self._feedback_buffer:
            if "human_correction" in fb["feedback"]:
                dataset.append({
                    "text": fb["feedback"].get("original_text", ""),
                    "label": fb["feedback"]["human_correction"]
                })
        
        if len(dataset) > 10:
            logger.info(f"Initiated fine-tuning process pipeline with {len(dataset)} examples (mock).")
            # Usually here we would trigger HF Trainer via ModelManager.fine_tune_model
        
        self._feedback_buffer.clear()

