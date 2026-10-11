import os
import re
import pytest
import yaml

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


def test_docker_compose_files_valid_yaml_and_topology():
    """Verify all docker compose files parse as valid YAML and contain expected service topology."""
    compose_files = {
        "dev": os.path.join(REPO_ROOT, "docker-compose.yml"),
        "prod": os.path.join(REPO_ROOT, "docker-compose.prod.yml"),
        "sqlite": os.path.join(REPO_ROOT, "docker-compose.sqlite.yml"),
    }

    for name, path in compose_files.items():
        assert os.path.exists(path), f"Missing {name} compose file at {path}"
        with open(path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)

        assert "services" in data, f"Services section missing in {name}"
        services = data["services"]

        if name == "prod":
            assert "nginx" in services, "Nginx service missing in production compose"
            assert "postgres" in services, "Postgres service missing in production compose"
            assert "backend" in services, "Backend service missing in production compose"
            assert "frontend" in services, "Frontend service missing in production compose"

            # Check production security: postgres port 5432 must NOT be exposed to host
            assert "ports" not in services["postgres"], "Security alert: PostgreSQL port 5432 should not be mapped to host in prod compose"

            # Check health checks configured
            assert "healthcheck" in services["backend"]
            assert "healthcheck" in services["postgres"]

        elif name == "sqlite":
            assert "backend" in services
            assert "frontend" in services
            assert "postgres" not in services, "SQLite compose should not include Postgres container"

        elif name == "dev":
            assert "backend" in services
            assert "frontend" in services
            assert "postgres" in services


def test_nginx_production_configuration_routing():
    """Verify Nginx reverse proxy configuration defines valid upstreams and routing locations."""
    nginx_conf_path = os.path.join(REPO_ROOT, "deployment", "nginx", "nginx.conf")
    assert os.path.exists(nginx_conf_path), f"Nginx config not found at {nginx_conf_path}"

    with open(nginx_conf_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Upstreams
    assert "upstream backend_upstream" in content
    assert "server backend:8000" in content
    assert "upstream frontend_upstream" in content
    assert "server frontend:3000" in content

    # Routing locations
    assert "location /api/" in content
    assert "proxy_pass http://backend_upstream/api/;" in content

    assert "location / {" in content
    assert "proxy_pass http://frontend_upstream;" in content

    # Health check endpoint
    assert "location /nginx-health" in content


def test_production_env_example_template_keys():
    """Verify production environment example template contains all required keys."""
    env_example_path = os.path.join(REPO_ROOT, ".env.production.example")
    assert os.path.exists(env_example_path), f".env.production.example not found at {env_example_path}"

    with open(env_example_path, "r", encoding="utf-8") as f:
        content = f.read()

    required_keys = [
        "ENVIRONMENT=production",
        "POSTGRES_USER",
        "POSTGRES_PASSWORD",
        "POSTGRES_DB",
        "JWT_SECRET",
        "JWT_ALGORITHM",
        "ACCESS_TOKEN_EXPIRE_MINUTES",
        "CORS_ORIGINS",
        "RATE_LIMIT_ENABLED",
        "NEXT_PUBLIC_API_URL"
    ]

    for key in required_keys:
        assert key in content, f"Required key or prefix '{key}' missing in .env.production.example"


def test_deployment_scripts_syntax_and_presence():
    """Verify cross-platform deployment orchestration scripts exist and define target modes."""
    bash_script = os.path.join(REPO_ROOT, "scripts", "deploy.sh")
    ps_script = os.path.join(REPO_ROOT, "scripts", "deploy.ps1")

    assert os.path.exists(bash_script), f"deploy.sh not found at {bash_script}"
    assert os.path.exists(ps_script), f"deploy.ps1 not found at {ps_script}"

    with open(bash_script, "r", encoding="utf-8") as f:
        bash_content = f.read()
    assert "--prod" in bash_content
    assert "--sqlite" in bash_content
    assert "--down" in bash_content

    with open(ps_script, "r", encoding="utf-8") as f:
        ps_content = f.read()
    assert "Prod" in ps_content
    assert "Sqlite" in ps_content
    assert "Down" in ps_content
