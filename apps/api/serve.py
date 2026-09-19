from pathlib import Path
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from main import app
root = Path(__file__).resolve().parents[2] / 'dist'
app.mount('/assets', StaticFiles(directory=root / 'assets'), name='assets')
@app.get('/{path:path}', include_in_schema=False)
def spa(path: str):
    candidate = (root / path).resolve()
    if candidate.is_relative_to(root) and candidate.is_file():
        return FileResponse(candidate)
    if path.startswith('api/'):
        from fastapi import HTTPException
        raise HTTPException(404)
    return FileResponse(root / 'index.html')
