#!/usr/bin/env python3
"""
Setup CML project for Agent Workflow UI deployment.

1. Search for existing project or create new one from git
2. Wait for git clone to complete
3. Write project_id to /tmp/project_id.txt for GitHub Actions

Run as the first step in the GitHub Actions workflow.
"""

import json
import os
import sys
import time
import requests
from typing import Optional


class ProjectSetup:

    def __init__(self):
        self.cml_host = os.environ.get("CML_HOST")
        self.api_key = os.environ.get("CML_API_KEY")
        self.github_repo = os.environ.get("GITHUB_REPOSITORY")
        self.gh_pat = os.environ.get("GH_PAT") or os.environ.get("GITHUB_TOKEN")
        self.project_name = "agent-workflow-ui"

        if not all([self.cml_host, self.api_key]):
            print("❌ Missing required env vars: CML_HOST, CML_API_KEY")
            sys.exit(1)

        self.api_url = f"{self.cml_host.rstrip('/')}/api/v2"
        self.headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": f"Bearer {self.api_key.strip()}",
        }

    def _request(self, method: str, endpoint: str, data: dict = None, params: dict = None) -> Optional[dict]:
        url = f"{self.api_url}/{endpoint.lstrip('/')}"
        try:
            resp = requests.request(method, url, headers=self.headers, json=data, params=params, timeout=30)
            if 200 <= resp.status_code < 300:
                return resp.json() if resp.text else {}
            print(f"❌ API {resp.status_code}: {resp.text[:200]}")
            return None
        except Exception as e:
            print(f"❌ Request error: {e}")
            return None

    def search_project(self) -> Optional[str]:
        print(f"🔍 Searching for project: {self.project_name}")
        result = self._request("GET", "projects", params={
            "search_filter": f'{{"name":"{self.project_name}"}}',
            "page_size": 50,
        })
        if result:
            projects = result.get("projects", [])
            if projects:
                pid = projects[0]["id"]
                print(f"✅ Found existing project: {pid}")
                return pid
        print("   No existing project found")
        return None

    def create_project(self) -> Optional[str]:
        if not self.github_repo:
            print("❌ GITHUB_REPOSITORY not set — cannot create project")
            return None
        print(f"📝 Creating project: {self.project_name}")
        result = self._request("POST", "projects", data={
            "name": self.project_name,
            "description": "Modularized Agent Workflow UI",
            "template": "git",
            "project_visibility": "private",
            "git_url": f"https://github.com/{self.github_repo}",
        })
        if result:
            pid = result.get("id")
            print(f"✅ Project created: {pid}")
            return pid
        return None

    def wait_for_clone(self, project_id: str, timeout: int = 900) -> bool:
        print(f"\n⏳ Waiting for git clone (timeout: {timeout}s)…")
        start = time.time()
        while time.time() - start < timeout:
            elapsed = int(time.time() - start)
            result = self._request("GET", f"projects/{project_id}")
            if result:
                status = result.get("creation_status", "unknown")
                print(f"   [{elapsed}s] {status}")
                if status == "error":
                    print(f"❌ Clone failed: {result.get('error_message')}")
                    return False
                if status in ("success", "ready", "running"):
                    print("   Waiting 30s for files to land on disk…")
                    time.sleep(30)
                    print("✅ Clone complete")
                    return True
            time.sleep(10)
        print(f"❌ Clone timeout ({int(time.time()-start)}s)")
        return False

    def run(self) -> bool:
        print("=" * 70)
        print("🚀 CML Project Setup — Agent Workflow UI")
        print("=" * 70)

        project_id = self.search_project() or self.create_project()
        if not project_id:
            return False

        if self.github_repo and not self.wait_for_clone(project_id):
            return False

        print(f"\nProject ID: {project_id}")
        with open("/tmp/project_id.txt", "w") as f:
            f.write(project_id)
        print("✅ Setup complete")
        return True


if __name__ == "__main__":
    try:
        sys.exit(0 if ProjectSetup().run() else 1)
    except Exception as e:
        import traceback; traceback.print_exc()
        sys.exit(1)
