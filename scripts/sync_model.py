"""Package the pinned INTEGRATES model for the browser.

Read-only with respect to vendor/integrates: model files are taken with
`git archive` from the pinned submodule commit (never the working tree), and
Python packages are the unmodified PyPI wheels at the versions pinned in
integrates' environment.yml, verified against PyPI's sha256 digests.

Outputs (all in public/py/):
  integrates.zip   src/integrates_hackathon/** and data/** at the pinned commit
  wheels/*.whl     pure-Python packages that Pyodide does not bundle
  manifest.json    commit, wheel list + hashes, Pyodide version

Run: npm run model
"""
from __future__ import annotations

import hashlib
import json
import re
import subprocess
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
UPSTREAM = ROOT / "vendor" / "integrates"
OUT = ROOT / "public" / "py"
CACHE = ROOT / ".cache" / "wheels"
PYODIDE_VERSION = json.loads((ROOT / "package.json").read_text())["devDependencies"]["pyodide"].lstrip("^~")

# Pure-Python packages missing from Pyodide's own distribution. Versions come
# from environment.yml where it pins them; et-xmlfile is openpyxl's only dep.
NEEDED = ["pybuildingenergy", "pvlib", "holidays", "openpyxl", "tqdm", "et-xmlfile"]
FALLBACK_PINS = {"et-xmlfile": "2.0.0"}


def git(*args: str) -> bytes:
    return subprocess.run(["git", "-C", str(UPSTREAM), *args], check=True, capture_output=True).stdout


def pinned_versions() -> dict[str, str]:
    env = (UPSTREAM / "environment.yml").read_text()
    pins = dict(re.findall(r"^\s*-\s*([A-Za-z0-9_.\-]+)==([^\s#]+)", env, re.M))
    pins = {k.lower(): v for k, v in pins.items()}
    return {name: pins.get(name, FALLBACK_PINS.get(name)) for name in NEEDED}


def fetch_wheel(name: str, version: str) -> Path:
    meta = json.load(urllib.request.urlopen(f"https://pypi.org/pypi/{name}/{version}/json"))
    wheels = [u for u in meta["urls"] if u["filename"].endswith("-py3-none-any.whl") or u["filename"].endswith("-py2.py3-none-any.whl")]
    if not wheels:
        sys.exit(f"{name}=={version}: no pure-Python wheel on PyPI")
    info = wheels[0]
    CACHE.mkdir(parents=True, exist_ok=True)
    path = CACHE / info["filename"]
    if not path.exists() or hashlib.sha256(path.read_bytes()).hexdigest() != info["digests"]["sha256"]:
        print(f"  downloading {info['filename']} ({info['size'] // 1024} KiB)")
        data = urllib.request.urlopen(info["url"]).read()
        if hashlib.sha256(data).hexdigest() != info["digests"]["sha256"]:
            sys.exit(f"{info['filename']}: sha256 mismatch")
        path.write_bytes(data)
    return path


def main() -> None:
    if not (UPSTREAM / ".git").exists():
        sys.exit("vendor/integrates missing. Run: git submodule update --init")
    commit = git("rev-parse", "HEAD").decode().strip()
    dirty = git("status", "--porcelain", "--", "src", "data").decode().strip()
    if dirty:
        print("note: vendor/integrates has local edits in src/ or data/; they are ignored (using committed files)")

    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "integrates.zip").write_bytes(
        git("archive", "--format=zip", commit, "src/integrates_hackathon", "data")
    )

    wheel_dir = OUT / "wheels"
    wheel_dir.mkdir(exist_ok=True)
    for stale in wheel_dir.glob("*.whl"):
        stale.unlink()
    wheels = []
    for name, version in pinned_versions().items():
        src = fetch_wheel(name, version)
        (wheel_dir / src.name).write_bytes(src.read_bytes())
        wheels.append({"name": name, "version": version, "file": src.name,
                       "sha256": hashlib.sha256(src.read_bytes()).hexdigest()})

    manifest = {
        "integrates_commit": commit,
        "pyodide_version": PYODIDE_VERSION,
        # Pyodide-bundled packages the model imports (versions fixed by Pyodide)
        "pyodide_packages": ["numpy", "pandas", "scipy", "h5py", "pytz", "python-dateutil",
                             "requests", "tzdata", "six", "micropip"],
        "wheels": wheels,
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=1) + "\n")
    print(f"packaged integrates@{commit[:7]} + {len(wheels)} wheels -> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
