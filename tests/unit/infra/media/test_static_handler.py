from pathlib import Path

from fastapi import FastAPI
from fastapi.testclient import TestClient

from server.infra.media.static_handler import AudioStaticFiles


def _client(root: Path) -> TestClient:
    app = FastAPI()
    app.mount("/Data/music", AudioStaticFiles(directory=str(root)), name="music")
    return TestClient(app)


def test_static_media_serves_encoded_filename(tmp_path: Path) -> None:
    folder = tmp_path / "Happy"
    folder.mkdir()
    (folder / "Film(chosic.com).mp3").write_bytes(b"abcdef")

    response = _client(tmp_path).get("/Data/music/Happy/Film%28chosic.com%29.mp3")

    assert response.status_code == 200
    assert response.headers["accept-ranges"] == "bytes"
    assert response.content == b"abcdef"


def test_static_media_serves_byte_range(tmp_path: Path) -> None:
    folder = tmp_path / "Happy"
    folder.mkdir()
    (folder / "track.mp3").write_bytes(b"abcdef")

    response = _client(tmp_path).get("/Data/music/Happy/track.mp3", headers={"Range": "bytes=1-3"})

    assert response.status_code == 206
    assert response.headers["content-range"] == "bytes 1-3/6"
    assert response.content == b"bcd"
