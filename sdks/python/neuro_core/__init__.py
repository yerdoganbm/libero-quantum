"""
@libero/neuro-core-python
Universal Neuro-Core for Python (Flask, FastAPI, Django, Celery).
Her UI uygulamasında kendini otomatik geliştirir - backend events.
"""

import os
import uuid
import time
import requests
from typing import Optional, Dict, Any

_default_api = os.environ.get("NEURO_CORE_API", "http://localhost:3001/api")
_default_app = os.environ.get("NEURO_CORE_APP", "unknown")
_session_id = None


def _session_id_fn():
    global _session_id
    if _session_id is None:
        _session_id = f"py_{int(time.time())}_{uuid.uuid4().hex[:8]}"
    return _session_id


class NeuroCore:
    """Python client for Libero Neuro-Core (tracking, A/B, evolution, GDPR)."""

    def __init__(
        self,
        app_name: str = _default_app,
        api_url: str = _default_api,
    ):
        self.app_name = app_name
        self.base = api_url.rstrip("/").replace("/api", "") or "http://localhost:3001"
        self.api = self.base + "/api"
        self._session_id = _session_id_fn()

    def _post(self, path: str, json: Dict[str, Any]) -> bool:
        try:
            r = requests.post(self.api + path, json=json, timeout=5)
            return r.status_code in (200, 201)
        except Exception:
            return False

    def _get(self, path: str, params: Optional[Dict] = None):
        try:
            r = requests.get(self.api + path, params=params or {}, timeout=5)
            return r.json() if r.status_code == 200 else None
        except Exception:
            return None

    def track_event(
        self,
        user_id: str,
        action: str,
        screen: str = "api",
        metadata: Optional[Dict] = None,
    ) -> bool:
        """Track server-side event (e.g. payment_success, signup_complete)."""
        return self._post(
            "/synapse",
            {
                "userId": user_id,
                "sessionId": self._session_id,
                "action": action,
                "screen": screen,
                "duration": 0,
                "metadata": metadata or {},
                "appName": self.app_name,
            },
        )

    def track_conversion(
        self,
        feature: str,
        variant: str,
        success: bool,
        revenue: Optional[float] = None,
    ) -> bool:
        return self._post(
            "/ab-result",
            {
                "feature": feature,
                "variant": variant,
                "success": success,
                "revenue": revenue,
                "appName": self.app_name,
            },
        )

    def get_variant(self, feature: str, user_id: str) -> Optional[Dict]:
        data = self._get(f"/variant/{feature}", {"userId": user_id, "appName": self.app_name})
        return data

    def get_analytics(self, days: int = 30) -> Optional[Dict]:
        return self._get("/analytics", {"appName": self.app_name, "days": days})

    def get_patches(self) -> list:
        data = self._get("/evolution/patches", {"appName": self.app_name})
        return (data or {}).get("patches", [])

    def run_evolution_analyze(self) -> bool:
        return self._post("/evolution/analyze", {"appName": self.app_name})

    def churn_prediction(self, user_id: str) -> Optional[Dict]:
        return self._get("/predictions/churn", {"userId": user_id, "appName": self.app_name})

    def anomaly_detect(self, metric: str = "dopamine", hours: int = 24) -> Optional[Dict]:
        return self._get("/anomaly/detect", {"appName": self.app_name, "metric": metric, "hours": hours})

    def gdpr_export(self, user_id: str) -> Optional[Dict]:
        return self._get("/gdpr/export", {"userId": user_id})

    def gdpr_delete(self, user_id: str) -> Optional[Dict]:
        try:
            r = requests.delete(self.api + "/gdpr/delete", params={"userId": user_id}, timeout=10)
            return r.json() if r.status_code == 200 else None
        except Exception:
            return None


# Singleton-style default instance
_default_client: Optional[NeuroCore] = None


def init(app_name: str = _default_app, api_url: str = _default_api) -> NeuroCore:
    global _default_client
    _default_client = NeuroCore(app_name=app_name, api_url=api_url)
    return _default_client


def get_client() -> NeuroCore:
    if _default_client is None:
        return init()
    return _default_client
