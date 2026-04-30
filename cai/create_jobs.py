#!/usr/bin/env python3
"""
Create or update CML Jobs and the CML Application from jobs_config.yaml.

Run in GitHub Actions after setup_project.py completes.
"""

import argparse
import json
import os
import sys
import yaml
import requests
from pathlib import Path
from typing import Dict, Optional, Any


class DeploymentManager:

    def __init__(self):
        self.cml_host = os.environ.get("CML_HOST")
        self.api_key = os.environ.get("CML_API_KEY")
        if not all([self.cml_host, self.api_key]):
            print("❌ Missing required env vars: CML_HOST, CML_API_KEY")
            sys.exit(1)

        self.api_url = f"{self.cml_host.rstrip('/')}/api/v2"
        self.headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": f"Bearer {self.api_key.strip()}",
        }

    def _request(self, method: str, endpoint: str, data=None, params=None) -> Optional[dict]:
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

    def load_config(self) -> Dict[str, Any]:
        config_path = Path(__file__).parent / "jobs_config.yaml"
        with open(config_path) as f:
            return yaml.safe_load(f)

    def get_runtime(self) -> str:
        runtime = os.environ.get("RUNTIME_IDENTIFIER", "").strip()
        if not runtime:
            print("❌ RUNTIME_IDENTIFIER is not set.")
            print("   Pass it as a workflow_dispatch input or set it as a GitHub secret.")
            sys.exit(1)
        print(f"✅ Runtime: {runtime[:80]}…")
        return runtime

    # ── Jobs ─────────────────────────────────────────────────────────────────

    def list_jobs(self, project_id: str) -> Dict[str, str]:
        result = self._request("GET", f"projects/{project_id}/jobs")
        if result:
            return {j["name"]: j["id"] for j in result.get("jobs", [])}
        return {}

    def create_job(self, project_id: str, cfg: Dict, runtime: Optional[str]) -> Optional[str]:
        print(f"   📝 Creating: {cfg['name']}")
        data = {
            "name": cfg["name"],
            "script": cfg["script"],
            "cpu": cfg.get("cpu", 2),
            "memory": cfg.get("memory", 4),
            "timeout": cfg.get("timeout", 600),
        }
        if runtime:
            data["runtime_identifier"] = runtime
        result = self._request("POST", f"projects/{project_id}/jobs", data=data)
        if result:
            jid = result["id"]
            print(f"      ✅ {jid}")
            return jid
        return None

    def update_job(self, project_id: str, job_id: str, cfg: Dict, runtime: Optional[str]) -> bool:
        print(f"   🔄 Updating: {cfg['name']}")
        data = {
            "name": cfg["name"],
            "script": cfg["script"],
            "cpu": cfg.get("cpu", 2),
            "memory": cfg.get("memory", 4),
            "timeout": cfg.get("timeout", 600),
        }
        if runtime:
            data["runtime_identifier"] = runtime
        result = self._request("PATCH", f"projects/{project_id}/jobs/{job_id}", data=data)
        if result is not None:
            print(f"      ✅ updated")
            return True
        return False

    def create_or_update_jobs(self, project_id: str, config: Dict) -> Dict[str, str]:
        print("\n📋 Jobs")
        print("-" * 60)
        runtime = self.get_runtime()
        existing = self.list_jobs(project_id)
        job_ids: Dict[str, str] = {}

        for key, cfg in config.get("jobs", {}).items():
            name = cfg["name"]
            if name in existing:
                jid = existing[name]
                if self.update_job(project_id, jid, cfg, runtime):
                    job_ids[key] = jid
            else:
                jid = self.create_job(project_id, cfg, runtime)
                if jid:
                    job_ids[key] = jid

        return job_ids

    # ── Application ───────────────────────────────────────────────────────────

    def list_applications(self, project_id: str) -> Dict[str, str]:
        result = self._request("GET", f"projects/{project_id}/applications")
        if result:
            return {a["name"]: a["id"] for a in result.get("applications", [])}
        return {}

    def create_application(self, project_id: str, cfg: Dict, runtime: Optional[str]) -> Optional[str]:
        print(f"   📝 Creating application: {cfg['name']}")
        data = {
            "name": cfg["name"],
            "subdomain": cfg.get("subdomain", "agent-ui"),
            "description": cfg.get("description", ""),
            "script": cfg["script"],
            "cpu": cfg.get("cpu", 2),
            "memory": cfg.get("memory", 4),
        }
        if runtime:
            data["runtime_identifier"] = runtime

        # Inject optional workflow env vars if supplied
        env_vars = {}
        if os.environ.get("WORKFLOW_BACKEND_URL"):
            env_vars["WORKFLOW_BACKEND_URL"] = os.environ["WORKFLOW_BACKEND_URL"]
        if os.environ.get("WORKFLOW_API_KEY"):
            env_vars["WORKFLOW_API_KEY"] = os.environ["WORKFLOW_API_KEY"]
        if env_vars:
            data["environment"] = env_vars

        result = self._request("POST", f"projects/{project_id}/applications", data=data)
        if result:
            aid = result["id"]
            print(f"      ✅ {aid}")
            return aid
        return None

    def update_application(self, project_id: str, app_id: str, cfg: Dict) -> bool:
        print(f"   🔄 Updating application: {cfg['name']}")
        data = {
            "name": cfg["name"],
            "script": cfg["script"],
            "cpu": cfg.get("cpu", 2),
            "memory": cfg.get("memory", 4),
        }
        env_vars = {}
        if os.environ.get("WORKFLOW_BACKEND_URL"):
            env_vars["WORKFLOW_BACKEND_URL"] = os.environ["WORKFLOW_BACKEND_URL"]
        if os.environ.get("WORKFLOW_API_KEY"):
            env_vars["WORKFLOW_API_KEY"] = os.environ["WORKFLOW_API_KEY"]
        if env_vars:
            data["environment"] = env_vars

        result = self._request("PATCH", f"projects/{project_id}/applications/{app_id}", data=data)
        if result is not None:
            print("      ✅ updated")
            return True
        return False

    def create_or_update_application(self, project_id: str, config: Dict) -> Optional[str]:
        print("\n🖥️  Application")
        print("-" * 60)
        runtime = self.get_runtime()
        app_cfg = config.get("application")
        if not app_cfg:
            print("   No application config — skipping")
            return None

        existing = self.list_applications(project_id)
        name = app_cfg["name"]
        if name in existing:
            app_id = existing[name]
            self.update_application(project_id, app_id, app_cfg)
            return app_id
        else:
            return self.create_application(project_id, app_cfg, runtime)

    # ── Main ─────────────────────────────────────────────────────────────────

    def run(self, project_id: str) -> bool:
        print("=" * 70)
        print("🚀 Create/Update CML Jobs & Application — Agent Workflow UI")
        print("=" * 70)

        config = self.load_config()
        job_ids = self.create_or_update_jobs(project_id, config)
        app_id = self.create_or_update_application(project_id, config)

        print("\n" + "=" * 70)
        print("✅ Done")
        print(f"   Project:     {project_id}")
        print(f"   Jobs:        {len(job_ids)}")
        for k, v in job_ids.items():
            print(f"     {k}: {v}")
        if app_id:
            print(f"   Application: {app_id}")

        # Write app_id for trigger_jobs.py
        with open("/tmp/app_id.txt", "w") as f:
            f.write(app_id or "")

        return bool(job_ids)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--project-id", required=True)
    args = parser.parse_args()
    try:
        sys.exit(0 if DeploymentManager().run(args.project_id) else 1)
    except Exception as e:
        import traceback; traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
