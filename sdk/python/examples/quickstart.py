#!/usr/bin/env python3
"""
CloudProof Python SDK Quickstart Example
========================================
Demonstrates programmatic incident remediation using the CloudProof Python SDK.
"""
import sys
import os

# Ensure sdk is in python path
SDK_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if SDK_DIR not in sys.path:
    sys.path.insert(0, SDK_DIR)

from cloudproof_client import CloudProofClient


def main():
    client = CloudProofClient(base_url="http://localhost:8000/api/v1")

    # 1. Health check
    health = client.check_health()
    print(f"[+] Connected to CloudProof: {health['service']} (v{health['version']})")

    # 2. Login as student
    print("[*] Logging in as student@college.edu...")
    token = client.login("student@college.edu", "DemoStudent123!")
    print(f"[+] Authenticated successfully. JWT token length: {len(token)}")

    # 3. Retrieve student dashboard
    dash = client.get_student_dashboard()
    print(f"[+] Enrolled in {len(dash.get('classes', []))} class(es).")
    print(f"[+] Virtual Hint Token Balance: {dash.get('wallet', {}).get('balance', 0)} tokens.")


if __name__ == "__main__":
    main()
