"""Qdrant client factory with automatic local fallback.

Cloud is used when QDRANT_URL / QDRANT_API_KEY are reachable. If the cloud
endpoint cannot be reached, the project falls back to a local Qdrant instance
(start it with setup_local_qdrant.bat).

Environment:
    QDRANT_URL              Cloud cluster URL
    QDRANT_API_KEY          Cloud cluster API key
    QDRANT_LOCAL_URL        Local URL (default http://localhost:6333)
    QDRANT_LOCAL_API_KEY    Local API key (default: none; only if you secured it)
    QDRANT_MODE             auto (default), cloud, or local
"""

import os

from dotenv import load_dotenv
from qdrant_client.qdrant_remote import QdrantRemote as QdrantClient

load_dotenv()

DEFAULT_LOCAL_URL = "http://localhost:6333"

_client: QdrantClient | None = None


def _make(url: str, api_key: str | None) -> QdrantClient:
    return QdrantClient(
        url=url,
        api_key=api_key or None,
        timeout=5,
        check_compatibility=False,
    )


def cloud_client() -> QdrantClient | None:
    url = os.getenv("QDRANT_URL")
    key = os.getenv("QDRANT_API_KEY")
    if not url or not key:
        return None
    return _make(url, key)


def local_client() -> QdrantClient:
    return _make(
        os.getenv("QDRANT_LOCAL_URL", DEFAULT_LOCAL_URL),
        os.getenv("QDRANT_LOCAL_API_KEY") or None,
    )


def get_qdrant(force_local: bool = False) -> QdrantClient:
    """Return a working Qdrant client, cached for the process."""
    global _client

    mode = os.getenv("QDRANT_MODE", "auto").lower()
    if force_local or mode == "local":
        return local_client()

    if _client is not None:
        return _client

    cloud = cloud_client()
    if mode != "local" and cloud is not None:
        try:
            cloud.get_collections()
            _client = cloud
            print("[qdrant] Using Qdrant Cloud")
            return _client
        except Exception as exc:
            if mode == "cloud":
                raise
            print(f"[qdrant] Cloud unavailable ({type(exc).__name__}); trying local fallback")

    local = local_client()
    try:
        local.get_collections()
    except Exception as exc:
        raise RuntimeError(
            "Qdrant Cloud is unreachable and local Qdrant is not running. "
            "Run setup_local_qdrant.bat to start the local fallback."
        ) from exc

    _client = local
    print(
        "[qdrant] Using local Qdrant at "
        f"{os.getenv('QDRANT_LOCAL_URL', DEFAULT_LOCAL_URL)}"
    )
    return _client
