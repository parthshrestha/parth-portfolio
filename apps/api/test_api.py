import json
import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError
from main import app, load_content
client = TestClient(app)
def test_contract():
    assert client.get('/api/v1/health').json() == {'status':'ok'}
    r = client.get('/api/v1/portfolio')
    assert r.status_code == 200 and r.json()['schemaVersion'] == 1
    slug = r.json()['projects'][0]['slug']
    assert client.get('/api/v1/projects/'+slug).json()['slug'] == slug
    assert client.get('/api/v1/projects/unknown').status_code == 404
def test_invalid_content(tmp_path):
    p=tmp_path/'invalid.json'
    p.write_text(json.dumps({'schemaVersion':2}))
    with pytest.raises(ValidationError): load_content(p)
