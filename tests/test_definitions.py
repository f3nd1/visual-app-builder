import importlib.util
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "check_repository.py"
spec = importlib.util.spec_from_file_location("check_repository", SCRIPT)
module = importlib.util.module_from_spec(spec)
assert spec and spec.loader
spec.loader.exec_module(module)


class DefinitionTests(unittest.TestCase):
    def test_all_example_definitions_are_valid(self):
        example_paths = sorted((ROOT / "examples").glob("*.json"))
        self.assertGreaterEqual(len(example_paths), 3)
        errors = []
        for path in example_paths:
            errors.extend(module.validate_definition(path))
        self.assertEqual(errors, [])

    def test_required_files_exist(self):
        missing = [name for name in module.REQUIRED_FILES if not (ROOT / name).exists()]
        self.assertEqual(missing, [])


if __name__ == "__main__":
    unittest.main()
