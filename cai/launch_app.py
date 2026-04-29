"""CML Application entry point — delegates to the shell launcher."""
import os
import subprocess
import sys

script = os.path.join(os.path.dirname(__file__), "launch_app.sh")
os.chmod(script, 0o755)
result = subprocess.run(["/bin/bash", script], check=False)
sys.exit(result.returncode)
