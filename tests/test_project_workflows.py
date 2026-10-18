import os
import math
import unittest
from importlib import import_module
from pathlib import Path
from unittest.mock import patch

from stuntwatch.api.main import _resolve_province, health
from stuntwatch.data import pipeline
from stuntwatch.data.join_target import base_name
from stuntwatch.data.merge_hdx import to_domain
from stuntwatch.data.pull_bps import run as pull_bps
from stuntwatch.utils.config import DATASET_XLSX, ROOT


class ProjectWorkflowTests(unittest.TestCase):
    def test_project_root_is_repository_root(self):
        self.assertEqual(ROOT, Path(__file__).resolve().parents[1])
        self.assertEqual(DATASET_XLSX, ROOT / "docs" / "StuntWatch_Dataset.xlsx")

    def test_district_name_normalization(self):
        self.assertEqual(base_name("Kabupaten Aceh Besar"), "acehbesar")
        self.assertEqual(base_name("Kota Banda Aceh"), "bandaaceh")

    def test_hdx_code_normalization(self):
        self.assertEqual(to_domain("ID1101"), 1101)
        self.assertTrue(math.isnan(to_domain("unknown")))

    def test_missing_pipeline_sources_are_reported(self):
        missing_file = Path("missing-pipeline-source.csv")
        with patch.object(pipeline, "REQUIRED_INPUTS", (missing_file,)):
            with self.assertRaisesRegex(FileNotFoundError, str(missing_file)):
                pipeline.validate_inputs()

    def test_pipeline_requires_bps_key(self):
        with patch.object(pipeline, "REQUIRED_INPUTS", ()):
            with patch.dict(os.environ, {}, clear=True):
                with self.assertRaisesRegex(RuntimeError, "BPS_API_KEY"):
                    pipeline.validate_inputs()

    def test_unsupported_bps_year_fails_before_network_access(self):
        with self.assertRaisesRegex(ValueError, "not supported"):
            pull_bps(1999, ROOT / "unused.csv")

    def test_api_health_and_province_resolution(self):
        self.assertEqual(health()["status"], "ok")
        self.assertEqual(health()["regions"], 514)
        self.assertEqual(_resolve_province("aceh"), "Aceh")

    def test_llm_reasoner_is_importable_from_package(self):
        reasoner = import_module("stuntwatch.llm.reasoner")
        self.assertTrue(callable(reasoner.generate_narrative))


if __name__ == "__main__":
    unittest.main()
