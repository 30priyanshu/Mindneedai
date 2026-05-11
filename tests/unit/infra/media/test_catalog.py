from pathlib import Path

import pytest

from server.exceptions import ValidationError
from server.infra.media.catalog import LocalMediaCatalog, MediaCatalogConfig, validate_media_key


def _catalog(root: Path) -> LocalMediaCatalog:
    return LocalMediaCatalog(
        MediaCatalogConfig(
            media_type="music",
            root=root,
            extensions=frozenset({".mp3"}),
            emotions=("Happy", "Sad"),
            ttl_seconds=300,
        )
    )


def test_catalog_returns_only_existing_streamable_files(tmp_path: Path) -> None:
    folder = tmp_path / "Happy"
    folder.mkdir()
    (folder / "play me.mp3").write_bytes(b"audio")
    (folder / "empty.mp3").write_bytes(b"")
    (folder / "ignore.txt").write_text("nope")

    assert _catalog(tmp_path).get() == {"Happy": ["Happy/play me.mp3"]}


def test_catalog_excludes_reported_failed_file(tmp_path: Path) -> None:
    folder = tmp_path / "Happy"
    folder.mkdir()
    (folder / "broken.mp3").write_bytes(b"audio")
    catalog = _catalog(tmp_path)

    catalog.mark_failed("Happy/broken.mp3", "user_1")

    assert catalog.get() == {}


@pytest.mark.parametrize("key", ["../x.mp3", "Happy/../x.mp3", "/Happy/x.mp3", "Happy\\x.mp3"])
def test_validate_media_key_rejects_path_traversal(key: str) -> None:
    with pytest.raises(ValidationError):
        validate_media_key(key)
