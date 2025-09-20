# backend/app/services/extractor.py
from pathlib import Path
from PIL import Image, ImageEnhance
import pytesseract
from PyPDF2 import PdfReader
from app.utils import file_fingerprint

class Extractor:
    def __init__(self, cache_dir: Path):
        self.cache_dir = cache_dir
        self.cache_dir.mkdir(exist_ok=True, parents=True)

    def _cache_path(self, fid: str) -> Path:
        return self.cache_dir / f"extract_{fid}.txt"

    def from_pdf(self, pdf_path: str) -> str:
        fid = file_fingerprint(pdf_path)
        cpath = self._cache_path(fid)
        if cpath.exists():
            return cpath.read_text(encoding="utf-8")
        with open(pdf_path, "rb") as f:
            reader = PdfReader(f)
            parts = []
            for i, page in enumerate(reader.pages, 1):
                txt = (page.extract_text() or "").strip()
                if txt:
                    parts.append(f"\n--- Page {i} ---\n{txt}")
            text = "\n".join(parts).strip() or ""
        if not text:
            text = "No readable text found."
        cpath.write_text(text, encoding="utf-8")
        return text

    def from_image(self, image_path: str, lang: str = "eng") -> str:
        fid = file_fingerprint(image_path)
        cpath = self._cache_path(fid)
        if cpath.exists():
            return cpath.read_text(encoding="utf-8")
        with Image.open(image_path) as im:
            if im.mode != "L":
                im = im.convert("L")
            im = ImageEnhance.Contrast(im).enhance(1.6)
            im = ImageEnhance.Sharpness(im).enhance(1.8)
            text = pytesseract.image_to_string(im, config="--oem 3 --psm 6", lang=lang)
        text = text or "No readable text found."
        cpath.write_text(text, encoding="utf-8")
        return text
