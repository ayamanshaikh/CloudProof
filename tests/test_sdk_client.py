"""
Unit tests for CloudProof Python Client SDK.
Validates SDK methods, Bearer token injection, and API contract compliance.
"""
from unittest.mock import MagicMock, patch
import pytest
from sdk.python.cloudproof_client import CloudProofClient


def test_sdk_client_initialization_and_health():
    client = CloudProofClient(base_url="http://testserver/api/v1")
    assert client.base_url == "http://testserver/api/v1"
    assert client.token is None

    with patch.object(client._session, "get") as mock_get:
        mock_resp = MagicMock()
        mock_resp.json.return_value = {"status": "healthy", "service": "CloudProof API"}
        mock_resp.raise_for_status = MagicMock()
        mock_get.return_value = mock_resp

        health = client.check_health()
        assert health["status"] == "healthy"
        mock_get.assert_called_once_with("http://testserver/api/v1/health")


def test_sdk_client_login_and_auth_header():
    client = CloudProofClient(base_url="http://testserver/api/v1")

    with patch.object(client._session, "post") as mock_post:
        mock_resp = MagicMock()
        mock_resp.json.return_value = {"access_token": "mock_jwt_token_12345", "token_type": "bearer"}
        mock_resp.raise_for_status = MagicMock()
        mock_post.return_value = mock_resp

        token = client.login("student@college.edu", "password123")
        assert token == "mock_jwt_token_12345"
        assert client.token == "mock_jwt_token_12345"
        assert client._session.headers.get("Authorization") == "Bearer mock_jwt_token_12345"


def test_sdk_client_verify_attempt_payload():
    client = CloudProofClient(base_url="http://testserver/api/v1", token="valid_token")

    with patch.object(client._session, "post") as mock_post:
        mock_resp = MagicMock()
        mock_resp.json.return_value = {"status": "PASSED", "final_score": 100}
        mock_resp.raise_for_status = MagicMock()
        mock_post.return_value = mock_resp

        res = client.verify_attempt("att-123", {"BlockPublicAcls": True})
        assert res["status"] == "PASSED"
        mock_post.assert_called_once_with(
            "http://testserver/api/v1/missions/att-123/verify",
            json={"BlockPublicAcls": True}
        )
