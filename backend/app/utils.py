# backend/app/utils.py
import hashlib
from pathlib import Path

def file_fingerprint(path: str) -> str:
    try:
        st = Path(path).stat()
        s = f"{path}|{st.st_mtime_ns}|{st.st_size}"
        return hashlib.md5(s.encode()).hexdigest()
    except Exception:
        return hashlib.md5(Path(path).read_bytes()[:4096]).hexdigest()
