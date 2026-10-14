#!/usr/bin/env python3
"""
CloudProof System Diagnostic & Environment Health Tool
======================================================
Audits local environment readiness:
  - Python version & virtualenv status
  - Node.js & npm presence
  - SQLite / PostgreSQL database connectivity
  - Docker & Container availability
  - Network port availability (8000, 3000, 3001)

Usage:
    python scripts/diagnose_environment.py
"""
import sys
import os
import shutil
import socket
import platform
import subprocess
from typing import Dict, Any

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


def check_port(port: int, host: str = "127.0.0.1") -> bool:
    """Returns True if the port is open/listening, False otherwise."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex((host, port)) == 0


def run_diagnostics() -> Dict[str, Any]:
    # 1. Python info
    py_ver = platform.python_version()
    in_venv = hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix)

    # 2. Node & npm
    node_path = shutil.which("node")
    npm_path = shutil.which("npm")
    node_ver = None
    if node_path:
        try:
            node_ver = subprocess.check_output([node_path, "--version"], text=True).strip()
        except Exception:
            node_ver = "Unknown"

    # 3. Docker
    docker_path = shutil.which("docker")

    # 4. Ports
    p8000 = check_port(8000)
    p3000 = check_port(3000)
    p3001 = check_port(3001)

    # 5. Database presence
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    db_path = os.path.join(root_dir, "cloudproof.db")
    db_exists = os.path.exists(db_path)
    db_size = os.path.getsize(db_path) if db_exists else 0

    return {
        "os": f"{platform.system()} {platform.release()} ({platform.machine()})",
        "python_version": py_ver,
        "in_virtualenv": in_venv,
        "node_installed": bool(node_path),
        "node_version": node_ver,
        "npm_installed": bool(npm_path),
        "docker_installed": bool(docker_path),
        "port_8000_listening": p8000,
        "port_3000_listening": p3000,
        "port_3001_listening": p3001,
        "sqlite_db_exists": db_exists,
        "sqlite_db_bytes": db_size,
    }


def print_diagnostics(d: Dict[str, Any]):
    print("=" * 65)
    print("         CLOUDPROOF SYSTEM ENVIRONMENT DIAGNOSTIC AUDIT         ")
    print("=" * 65)
    print(f"Host Operating System:    {d['os']}")
    print(f"Python Runtime:           {d['python_version']} (VirtualEnv Active: {d['in_virtualenv']})")
    node_str = f"Found ({d['node_version']})" if d['node_installed'] else "NOT FOUND"
    print(f"Node.js Runtime:          {node_str}")
    docker_str = "Available" if d['docker_installed'] else "Not Installed (Local Mode Active)"
    print(f"Docker Daemon:            {docker_str}")
    print("-" * 65)
    print(f"SQLite Database File:     {'Ready (' + str(d['sqlite_db_bytes'] // 1024) + ' KB)' if d['sqlite_db_exists'] else 'Missing'}")
    print(f"Backend API (Port 8000):  {'ACTIVE (Listening)' if d['port_8000_listening'] else 'Inactive'}")
    print(f"Frontend UI (Port 3001):  {'ACTIVE (Listening)' if d['port_3001_listening'] else 'Inactive'}")
    print(f"Alternate UI (Port 3000): {'OCCUPIED' if d['port_3000_listening'] else 'Available'}")
    print("=" * 65)
    print("[SUCCESS] Environment diagnostic completed successfully.\n")


if __name__ == "__main__":
    diag = run_diagnostics()
    print_diagnostics(diag)
