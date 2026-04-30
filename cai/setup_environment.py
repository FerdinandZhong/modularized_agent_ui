"""
One-time setup job for CML. Run this as a CML Job before starting the Application.

Steps:
  1. Install Node.js 20 into ~/.local/node/
  2. npm ci (install all deps including devDependencies needed for build)
  3. npm run build (produces .next/standalone/)
  4. Copy static assets into standalone dir
  5. Download and compile nginx into ~/.local/bin/nginx (no root required)
"""
import os
import sys
import subprocess
import shutil
import tarfile
import urllib.request

HOME = os.path.expanduser("~")
LOCAL = os.path.join(HOME, ".local")
NODE_DIR = os.path.join(LOCAL, "node")
BIN_DIR = os.path.join(LOCAL, "bin")
# CML sets CWD to the project root when running a job script
REPO_DIR = os.getcwd()

NODE_VERSION = os.environ.get("NODE_VERSION", "20")
NODE_DIST_BASE = f"https://nodejs.org/dist/latest-v{NODE_VERSION}.x"

os.makedirs(BIN_DIR, exist_ok=True)
os.makedirs(NODE_DIR, exist_ok=True)

# ── helpers ───────────────────────────────────────────────────────────────────

def run(cmd, **kwargs):
    print(f"+ {cmd}", flush=True)
    subprocess.run(cmd, shell=True, check=True, **kwargs)


def node_bin():
    return os.path.join(NODE_DIR, "bin")


def env_with_node():
    e = os.environ.copy()
    e["PATH"] = f"{node_bin()}:{BIN_DIR}:{e['PATH']}"
    return e


# ── 1. Install Node.js ────────────────────────────────────────────────────────

def install_node():
    node_exec = os.path.join(node_bin(), "node")
    if os.path.exists(node_exec):
        print(f"Node.js already installed at {node_exec}", flush=True)
        return

    # Determine latest patch for this major
    import html.parser, re

    class LinkParser(html.parser.HTMLParser):
        def __init__(self):
            super().__init__()
            self.links = []
        def handle_starttag(self, tag, attrs):
            if tag == "a":
                for k, v in attrs:
                    if k == "href" and v:
                        self.links.append(v)

    print(f"Fetching Node.js {NODE_VERSION} release list…", flush=True)
    with urllib.request.urlopen(NODE_DIST_BASE + "/") as resp:
        content = resp.read().decode()

    parser = LinkParser()
    parser.feed(content)
    arch = "linux-x64"
    tarball_path = next(
        (l for l in parser.links if l.endswith(f"{arch}.tar.xz") and "headers" not in l),
        None,
    )
    if not tarball_path:
        sys.exit(f"Could not find Node.js tarball for {arch}")

    # Links may be absolute paths (/dist/latest-v20.x/node-v20.x.y-linux-x64.tar.xz)
    # — use only the filename to avoid doubling the base URL.
    tarball_name = tarball_path.split("/")[-1]
    url = f"{NODE_DIST_BASE}/{tarball_name}"
    dest = f"/tmp/{tarball_name}"
    print(f"Downloading {url}", flush=True)
    urllib.request.urlretrieve(url, dest)

    print("Extracting…", flush=True)
    with tarfile.open(dest, "r:xz") as tf:
        tf.extractall("/tmp")

    extracted = dest.replace(".tar.xz", "")
    if os.path.exists(NODE_DIR):
        shutil.rmtree(NODE_DIR)
    shutil.move(extracted, NODE_DIR)
    print(f"Node.js installed at {NODE_DIR}", flush=True)


# ── 2. Build Next.js ──────────────────────────────────────────────────────────

def build_nextjs():
    e = env_with_node()
    e["NEXT_TELEMETRY_DISABLED"] = "1"

    print("Installing npm dependencies…", flush=True)
    run("npm ci", cwd=REPO_DIR, env=e)

    print("Building Next.js (standalone)…", flush=True)
    run("npm run build", cwd=REPO_DIR, env=e)

    # Copy static assets into standalone dir so it's self-contained
    standalone = os.path.join(REPO_DIR, ".next", "standalone")
    static_src = os.path.join(REPO_DIR, ".next", "static")
    static_dst = os.path.join(standalone, ".next", "static")
    public_src = os.path.join(REPO_DIR, "public")
    public_dst = os.path.join(standalone, "public")

    if os.path.exists(static_src):
        if os.path.exists(static_dst):
            shutil.rmtree(static_dst)
        shutil.copytree(static_src, static_dst)

    if os.path.exists(public_src):
        if os.path.exists(public_dst):
            shutil.rmtree(public_dst)
        shutil.copytree(public_src, public_dst)

    print("Standalone build ready.", flush=True)


# ── 3. Install nginx ──────────────────────────────────────────────────────────

NGINX_VERSION = "1.26.1"
NGINX_URL = f"https://nginx.org/download/nginx-{NGINX_VERSION}.tar.gz"
PCRE2_VERSION = "10.43"
PCRE2_URL = f"https://github.com/PCRE2Project/pcre2/releases/download/pcre2-{PCRE2_VERSION}/pcre2-{PCRE2_VERSION}.tar.gz"
ZLIB_VERSION = "1.3.1"
ZLIB_URL = f"https://zlib.net/zlib-{ZLIB_VERSION}.tar.gz"


def fetch_and_extract(url, dest_dir="/tmp"):
    fname = url.split("/")[-1]
    local = os.path.join(dest_dir, fname)
    if not os.path.exists(local):
        print(f"Downloading {url}", flush=True)
        urllib.request.urlretrieve(url, local)
    folder = local.replace(".tar.gz", "")
    if not os.path.exists(folder):
        print(f"Extracting {fname}", flush=True)
        with tarfile.open(local, "r:gz") as tf:
            tf.extractall(dest_dir)
    return folder


def install_nginx():
    nginx_bin = os.path.join(BIN_DIR, "nginx")
    if os.path.exists(nginx_bin):
        print(f"nginx already installed at {nginx_bin}", flush=True)
        return

    pcre2_src = fetch_and_extract(PCRE2_URL)
    zlib_src = fetch_and_extract(ZLIB_URL)
    nginx_src = fetch_and_extract(NGINX_URL)

    conf_dir = os.path.join(LOCAL, "conf")
    os.makedirs(conf_dir, exist_ok=True)

    configure_cmd = (
        f"./configure "
        f"--prefix={LOCAL} "
        f"--sbin-path={nginx_bin} "
        f"--conf-path={conf_dir}/nginx.conf "
        f"--pid-path={HOME}/nginx.pid "
        f"--error-log-path={HOME}/nginx_error.log "
        f"--http-log-path={HOME}/nginx_access.log "
        f"--with-pcre={pcre2_src} "
        f"--with-zlib={zlib_src} "
        f"--with-http_gzip_static_module "
        f"--without-http_rewrite_module"
    )

    run(configure_cmd, cwd=nginx_src)
    run(f"make -j$(nproc)", cwd=nginx_src)
    run(f"make install", cwd=nginx_src)
    print(f"nginx installed at {nginx_bin}", flush=True)


# ── main ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    install_node()
    build_nextjs()
    install_nginx()
    print("\nSetup complete. You can now start the CML Application.", flush=True)
