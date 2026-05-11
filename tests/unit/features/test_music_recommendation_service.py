from pathlib import Path
from unittest.mock import Mock

from server.features.recommendations.music import service as music_service
from server.features.recommendations.music.service import MusicRecommendationService
from server.infra.media.catalog import LocalMediaCatalog, MediaCatalogConfig


def _use_catalog(monkeypatch, root: Path) -> None:
    catalog = LocalMediaCatalog(
        MediaCatalogConfig(
            media_type="music",
            root=root,
            extensions=frozenset({".mp3"}),
            emotions=("Happy",),
            ttl_seconds=300,
        )
    )
    monkeypatch.setattr(music_service, "_catalog", catalog)


def test_recommend_ignores_stale_session_choice(monkeypatch, tmp_path: Path) -> None:
    folder = tmp_path / "Happy"
    folder.mkdir()
    (folder / "fresh.mp3").write_bytes(b"audio")
    _use_catalog(monkeypatch, tmp_path)
    store = Mock()
    store.get_session_choice.return_value = "Happy/missing.mp3"
    store.get_played_keys.return_value = []
    svc = MusicRecommendationService(store)

    result = svc.recommend("user_1", "happy", "session_1")

    assert result.success is True
    assert result.music_file == "Happy/fresh.mp3"
    store.cache_session_choice.assert_called_once()


def test_report_failed_excludes_file_from_next_recommendation(monkeypatch, tmp_path: Path) -> None:
    folder = tmp_path / "Happy"
    folder.mkdir()
    (folder / "broken.mp3").write_bytes(b"audio")
    _use_catalog(monkeypatch, tmp_path)
    store = Mock()
    store.get_session_choice.return_value = None
    store.get_played_keys.return_value = []
    svc = MusicRecommendationService(store)

    svc.report_failed("user_1", "Happy/broken.mp3")
    result = svc.recommend("user_1", "happy", "session_1")

    assert result.success is False
    assert result.music_file is None
