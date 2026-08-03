from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

root = Path(__file__).resolve().parent
output = root / "CS0502-peer-drop-starter.zip"
with ZipFile(output, "w", ZIP_DEFLATED) as archive:
    for relative in ("README.md", "STUDENT_TASKS.md", "LAN_SETUP.md", "app.py", "web/index.html"):
        archive.write(root / relative, f"CS0502-peer-drop-starter/{relative}")
print(output)
