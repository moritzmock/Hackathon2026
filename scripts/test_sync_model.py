"""Packaging must not remove working browser files when a download fails."""
import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("sync_model", Path(__file__).with_name("sync_model.py"))
sync = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sync)


class ModelPackagingTests(unittest.TestCase):
    def test_failed_download_preserves_existing_model_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            upstream = root / "vendor"
            upstream.mkdir()
            (upstream / ".git").touch()
            out = root / "public" / "py"
            wheels = out / "wheels"
            wheels.mkdir(parents=True)
            original = {
                "manifest.json": b"previous manifest",
                "integrates.zip": b"previous archive",
                "wheels/working.whl": b"previous wheel",
            }
            for name, content in original.items():
                (out / name).write_bytes(content)

            def git(*args):
                if args[0] == "rev-parse":
                    return b"705bc1198668cc812b6ae73691fb2561ed09bfa3"
                if args[0] == "status":
                    return b""
                if args[0] == "archive":
                    return b"new archive"
                self.fail(f"Unexpected Git operation: {args}")

            with patch.object(sync, "ROOT", root), patch.object(sync, "UPSTREAM", upstream), \
                    patch.object(sync, "OUT", out), patch.object(sync, "git", git), \
                    patch.object(sync, "pinned_versions", return_value={"model": "1.0"}), \
                    patch.object(sync, "fetch_wheel", side_effect=OSError("download failed")):
                with self.assertRaisesRegex(OSError, "download failed"):
                    sync.main()

            for name, content in original.items():
                self.assertTrue((out / name).exists(), f"Packaging removed {name}")
                self.assertEqual((out / name).read_bytes(), content, f"Packaging changed {name}")


if __name__ == "__main__":
    unittest.main()
