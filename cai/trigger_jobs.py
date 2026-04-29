#!/usr/bin/env python3
"""
Trigger CML job chain and restart the Application when done.

1. Trigger git_sync (root job)
2. Wait for setup_environment to complete (CML auto-triggers via parent_job_key)
3. Restart the CML Application

Run in GitHub Actions after create_jobs.py.
"""

import argparse
import json
import os
import sys
import time
import yaml
import requests
from pathlib import Path
from typing import Dict, List, Optional


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

    # ── Jobs ─────────────────────────────────────────────────────────────────

    def get_job_ids(self, project_id: str, names: Dict[str, str]) -> Dict[str, str]:
        print("🔍 Looking up job IDs…")
        result = self._request("GET", f"projects/{project_id}/jobs")
        if not result:
            return {}
        name_to_id = {j["name"]: j["id"] for j in result.get("jobs", [])}
        ids = {}
        for key, name in names.items():
            if name in name_to_id:
                ids[key] = name_to_id[name]
                print(f"   ✅ {key}: {name_to_id[name]}")
            else:
                print(f"   ⚠️  Not found: {name}")
        return ids

    def job_succeeded(self, project_id: str, job_id: str) -> bool:
        result = self._request("GET", f"projects/{project_id}/jobs/{job_id}/runs", params={"page_size": 5})
        if result:
            runs = result.get("runs", [])
            if runs and runs[0].get("status", "").lower() in ("succeeded", "success"):
                return True
        return False

    def trigger_job(self, project_id: str, job_id: str) -> Optional[str]:
        result = self._request("POST", f"projects/{project_id}/jobs/{job_id}/runs")
        return result.get("id") if result else None

    def wait_for_run(self, project_id: str, job_id: str, run_id: str, timeout: int = 3600) -> bool:
        print(f"   ⏳ Waiting (timeout: {timeout}s)…")
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
                    print("   ✅ Job succeeded\n")
                    return True
                if status in ("failed", "error", "engine_failed", "killed", "stopped", "timedout"):
                    print(f"   ❌ Job failed: {status}\n")
                    return False
            time.sleep(15)
        print(f"   ❌ Timeout ({int(time.time()-start)}s)\n")
        return False

    def wait_for_new_run(self, project_id: str, job_id: str, name: str,
                         after_epoch: float, timeout: int) -> Optional[str]:
        print(f"   Waiting for CML to auto-trigger: {name}…")
        start = time.time()
        while time.time() - start < timeout:
            result = self._request("GET", f"projects/{project_id}/jobs/{job_id}/runs", params={"page_size": 5})
            if result:
                for run in result.get("runs", []):
                    run_id = run.get("id")
                    created_at = run.get("created_at", "")
                    if not run_id or not created_at:
                        continue
                    try:
                        from datetime import datetime, timezone
                        ts = created_at.rstrip("Z")
                        fmt = "%Y-%m-%dT%H:%M:%S.%f" if "." in ts else "%Y-%m-%dT%H:%M:%S"
                        dt = datetime.strptime(ts, fmt).replace(tzinfo=timezone.utc)
                        if dt.timestamp() > after_epoch:
                            print(f"   [{int(time.time()-start)}s] Run detected: {run_id}")
                            return run_id
                    except Exception:
                        return run_id
            time.sleep(15)
        print(f"   ❌ Timeout waiting for {name}")
        return None

    def _topo_order(self, jobs: Dict) -> List[str]:
        order: List[str] = []
        remaining = set(jobs.keys())
        while remaining:
            ready = sorted(k for k in remaining
                           if jobs[k].get("parent_job_key") is None
                           or jobs[k].get("parent_job_key") not in remaining)
            if not ready:
                order.extend(sorted(remaining))
                break
            order.extend(ready)
            remaining -= set(ready)
        return order

    # ── Application ───────────────────────────────────────────────────────────

    def get_application_id(self, project_id: str, name: str) -> Optional[str]:
        result = self._request("GET", f"projects/{project_id}/applications")
        if result:
            for app in result.get("applications", []):
                if app.get("name") == name:
                    return app["id"]
        return None

    def restart_application(self, project_id: str, app_id: str, app_name: str) -> bool:
        print(f"🖥️  Restarting application: {app_name}")
        result = self._request("POST", f"projects/{project_id}/applications/{app_id}/restart")
        if result is not None:
            print("   ✅ Application restart triggered")
            return True
        # Some CML versions use PATCH status
        result = self._request("PATCH", f"projects/{project_id}/applications/{app_id}",
                               data={"status": "running"})
        if result is not None:
            print("   ✅ Application status set to running")
            return True
        print("   ⚠️  Could not restart application via API (may need manual restart)")
        return False

    # ── Main ─────────────────────────────────────────────────────────────────

    def run(self, project_id: str, config: Dict) -> bool:
        print("=" * 70)
        print("🚀 Trigger Deployment — Agent Workflow UI")
        print("=" * 70)
        print(f"   Force rebuild: {'✅ YES' if self.force_rebuild else '❌ NO (skip succeeded jobs)'}\n")

        jobs = config.get("jobs", {})
        job_names = {k: v["name"] for k, v in jobs.items()}
        job_ids = self.get_job_ids(project_id, job_names)
        if not job_ids:
            print("❌ No jobs found")
            return False

        ordered = self._topo_order(jobs)
        root_key = ordered[0]
        root_id = job_ids.get(root_key)
        root_name = jobs[root_key]["name"]

        # ── Trigger root ──────────────────────────────────────────────────────
        print(f"\n🔷 Root job: {root_name}")
        if not self.force_rebuild and self.job_succeeded(project_id, root_id):
            print("   ✅ Already succeeded — skipping\n")
            trigger_epoch = time.time()
        else:
            run_id = self.trigger_job(project_id, root_id)
            if not run_id:
                print("   ❌ Failed to trigger root job")
                return False
            print(f"   ✅ Triggered: {run_id}\n")
            trigger_epoch = time.time()
            timeout = jobs[root_key].get("timeout", 600)
            if not self.wait_for_run(project_id, root_id, run_id, timeout):
                return False

        # ── Wait for child jobs ───────────────────────────────────────────────
        for key in ordered[1:]:
            jid = job_ids.get(key)
            if not jid:
                print(f"⚠️  No job_id for '{key}' — skipping")
                continue
            name = jobs[key]["name"]
            timeout = jobs[key].get("timeout", 3600)
            print(f"🔷 {name}")
            run_id = self.wait_for_new_run(project_id, jid, name, trigger_epoch, timeout)
            if not run_id:
                return False
            if not self.wait_for_run(project_id, jid, run_id, timeout):
                return False

        # ── Restart Application ───────────────────────────────────────────────
        app_cfg = config.get("application")
        if app_cfg:
            app_id = self.get_application_id(project_id, app_cfg["name"])
            if app_id:
                self.restart_application(project_id, app_id, app_cfg["name"])
            else:
                print("⚠️  Application not found in CML — was create_jobs.py run?")

        print("\n" + "=" * 70)
        print("✅ Deployment complete!")
        print("=" * 70)
        return True


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--project-id", required=True)
    parser.add_argument("--jobs-config", default="cai/jobs_config.yaml")
    args = parser.parse_args()

    try:
        with open(args.jobs_config) as f:
            config = yaml.safe_load(f)
        trigger = DeploymentTrigger()
        sys.exit(0 if trigger.run(args.project_id, config) else 1)
    except Exception as e:
        import traceback; traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
