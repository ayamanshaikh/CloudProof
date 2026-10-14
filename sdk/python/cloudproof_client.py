"""
CloudProof Official Python Client SDK
=====================================
A synchronous & asynchronous client library for interacting with CloudProof APIs:
  - Authentication & Token Management
  - Mission Catalog & Assignment Exploration
  - Attempt Lifecycle (Start, Update, Verify)
  - Virtual Hint Economy Unlock
  - Grounded AI Post-Mortem Retrieval
"""
import requests
from typing import Dict, Any, List, Optional


class CloudProofClient:
    """Synchronous Python client for CloudProof API."""

    def __init__(self, base_url: str = "http://localhost:8000/api/v1", token: Optional[str] = None):
        self.base_url = base_url.rstrip("/")
        self.token = token
        self._session = requests.Session()
        if self.token:
            self._session.headers.update({"Authorization": f"Bearer {self.token}"})

    def check_health(self) -> Dict[str, Any]:
        """Checks API health and returns service metadata."""
        resp = self._session.get(f"{self.base_url}/health")
        resp.raise_for_status()
        return resp.json()

    def login(self, email: str, password: str) -> str:
        """Authenticates user and sets internal Bearer token."""
        resp = self._session.post(
            f"{self.base_url}/auth/login",
            data={"username": email, "password": password}
        )
        resp.raise_for_status()
        data = resp.json()
        self.token = data["access_token"]
        self._session.headers.update({"Authorization": f"Bearer {self.token}"})
        return self.token

    def get_student_dashboard(self) -> Dict[str, Any]:
        """Retrieves active student classes, missions, and token balance."""
        resp = self._session.get(f"{self.base_url}/student/dashboard")
        resp.raise_for_status()
        return resp.json()

    def start_mission(self, mission_id: str, mode: str = "simulation") -> Dict[str, Any]:
        """Initiates an incident mission attempt in simulation or real AWS mode."""
        resp = self._session.post(
            f"{self.base_url}/missions/start",
            json={"mission_id": mission_id, "mode": mode}
        )
        resp.raise_for_status()
        return resp.json()

    def verify_attempt(self, attempt_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Submits candidate configuration to the deterministic verification engine."""
        resp = self._session.post(
            f"{self.base_url}/missions/{attempt_id}/verify",
            json=payload
        )
        resp.raise_for_status()
        return resp.json()

    def unlock_hint(self, attempt_id: str, level: int) -> Dict[str, Any]:
        """Unlocks a tiered hint for the active attempt."""
        resp = self._session.post(
            f"{self.base_url}/hints/attempt/{attempt_id}/unlock",
            json={"level": level}
        )
        resp.raise_for_status()
        return resp.json()

    def get_post_mortem(self, attempt_id: str) -> Dict[str, Any]:
        """Retrieves the grounded 6-part AI incident post-mortem."""
        resp = self._session.get(f"{self.base_url}/postmortem/attempt/{attempt_id}")
        resp.raise_for_status()
        return resp.json()
