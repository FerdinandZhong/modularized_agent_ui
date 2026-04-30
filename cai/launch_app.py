"""CML Application entry point — delegates to the shell launcher."""
import os
import subprocess
import sys

# CML runs scripts with CWD set to the project root (/home/cdsw/<project>).
# __file__ is not defined in CML's execution context, so we use CWD.
PROJECT_ROOT = os.getcwd()
STANDALONE = os.path.join(PROJECT_ROOT, ".next", "standalone", "server.js")
SCRIPT = os.path.join(PROJECT_ROOT, "cai", "launch_app.sh")

if not os.path.exists(STANDALONE):
    print("ERROR: .next/standalone/server.js not found.")
    print("Run the 'Setup Environment' job first to build the Next.js app.")
    sys.exit(1)

os.chmod(SCRIPT, 0o755)
result = subprocess.run(["/bin/bash", SCRIPT], check=False)
sys.exit(result.returncode)
