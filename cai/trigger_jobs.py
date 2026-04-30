#!/usr/bin/env python3
"""
Trigger and monitor individual CML jobs, or restart the Application.

Usage modes (called separately from GitHub Actions):
  python trigger_jobs.py --project-id <id> --jobs-config cai/jobs_config.yaml --job-key git_sync
  python trigger_jobs.py --project-id <id> --jobs-config cai/jobs_config.yaml --job-key setup_environment
  python trigger_jobs.py --project-id <id> --jobs-config cai/jobs_config.yaml --restart-app
"""

import argparse
import json
import os
import sys
import time
import yaml
import requests
from pathlib import Path
from typing import Dict, Optional


class DeploymentTrigger:

    def __init__(self):
        self.cml_host = os.environ.get("CML_HOST")
        self.api_key = os.environ.get("CML_API_KEY")
        self.force_rebuild = os.environ.get("FORCE_REBUILD", "").lower() == "true"

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

    # ── Job lookups ───────────────────────────────────────────────────────────

    def get_job_id(self, project_id: str, job_name: str) -> Optional[str]:
        result = self._request("GET", f"projects/{project_id}/jobs")
        if result:
            for j in result.get("jobs", []):
                if j.get("name") == job_name:
                    return j["id"]
        return None

    def job_succeeded(self, project_id: str, job_id: str) -> bool:
        result = self._request("GET", f"projects/{project_id}/jobs/{job_id}/runs", params={"page_size": 5})
        if result:
            runs = result.get("runs", [])
            if runs and runs[0].get("status", "").lower() in ("succeeded", "success"):
                return True
        return False

    # ── Trigger + wait ────────────────────────────────────────────────────────

    def trigger_job(self, project_id: str, job_id: str) -> Optional[str]:
        result = self._request("POST", f"projects/{project_id}/jobs/{job_id}/runs")
        return result.get("id") if result else None

    def wait_for_run(self, project_id: str, job_id: str, run_id: str, timeout: int) -> bool:
        print(f"   ⏳ Waiting for completion (timeout: {timeout}s)…")
        start = time.time()
        last_status = None
        while time.time() - start < timeout:
            result = self._request("GET", f"projects/{project_id}/jobs/{job_id}/runs/{run_id}")
            if result:
                status = result.get("status", "unknown").lower()
                if status != last_status:
                    print(f"      [{int(time.time()-start)}s] {status}")
                    last_status = status
                if status in ("succeeded", "success", "engine_succeeded"):
                    print("   ✅ Succeeded\n")
                    return True
                if status in ("failed", "error", "engine_failed", "killed", "stopped", "timedout"):
                    print(f"   ❌ Failed: {status}\n")
                    return False
            time.sleep(15)
        print(f"   ❌ Timeout ({int(time.time()-start)}s)\n")
        return False

    # ── Run a single named job ────────────────────────────────────────────────

    def run_job(self, project_id: str, job_key: str, job_config: Dict) -> bool:
        job_name = job_config["name"]
        timeout = job_config.get("timeout", 3600)

        print("=" * 70)
        print(f"🔷 {job_name}")
        print("=" * 70)

        job_id = self.get_job_id(project_id, job_name)
        if not job_id:
            print(f"❌ Job '{job_name}' not found in project — run create_jobs.py first")
            return False

        if not self.force_rebuild and self.job_succeeded(project_id, job_id):
            print("   ✅ Already succeeded — skipping (use force_rebuild to rerun)\n")
            return True

        run_id = self.trigger_job(project_id, job_id)
        if not run_id:
            print(f"   ❌ Failed to trigger job")
            return False
        print(f"   ✅ Triggered run: {run_id}")

        return self.wait_for_run(project_id, job_id, run_id, timeout)

    # ── Application restart ───────────────────────────────────────────────────

    def get_application_id(self, project_id: str, name: str) -> Optional[str]:
        result = self._request("GET", f"projects/{project_id}/applications")
        if result:
            for app in result.get("applications", []):
                if app.get("name") == name:
                    return app["id"]
        return None

    def restart_application(self, project_id: str, app_cfg: Dict) -> bool:
        app_name = app_cfg["name"]
        print("=" * 70)
        print(f"🖥️  Restart Application: {app_name}")
        print("=" * 70)

        app_id = self.get_application_id(project_id, app_name)
        if not app_id:
            print("   ❌ Application not found — run create_jobs.py first")
            return False

        result = self._request("POST", f"projects/{project_id}/applications/{app_id}/restart")
        if result is not None:
            print("   ✅ Restart triggered")
            return True

        # Fallback for CML versions that use PATCH
        result = self._request(
            "PATCH", f"projects/{project_id}/applications/{app_id}",
            data={"status": "running"}
        )
        if result is not None:
            print("   ✅ Status set to running")
            return True

        print("   ⚠️  Could not restart via API — restart manually in CML UI")
        return False


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--project-id", required=True)
    parser.add_argument("--jobs-config", default="cai/jobs_config.yaml")

    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--job-key", help="Key of the job to trigger (from jobs_config.yaml)")
    group.add_argument("--restart-app", action="store_true", help="Restart the CML Application")

    args = parser.parse_args()

    try:
        with open(args.jobs_config) as f:
            config = yaml.safe_load(f)

        trigger = DeploymentTrigger()

        if args.restart_app:
            app_cfg = config.get("application")
            if not app_cfg:
                print("❌ No application config in jobs_config.yaml")
                sys.exit(1)
            sys.exit(0 if trigger.restart_application(args.project_id, app_cfg) else 1)
        else:
            job_config = config.get("jobs", {}).get(args.job_key)
            if not job_config:
                print(f"❌ Job key '{args.job_key}' not found in jobs_config.yaml")
                sys.exit(1)
            sys.exit(0 if trigger.run_job(args.project_id, args.job_key, job_config) else 1)

    except Exception as e:
        import traceback; traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
