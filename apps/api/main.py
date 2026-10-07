from pathlib import Path
from typing import Literal, Optional
import json
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, ConfigDict, Field

class Model(BaseModel):
    model_config = ConfigDict(extra='forbid')
class Image(Model):
    src: str
    alt: str
    fit: Optional[Literal['cover', 'contain']] = None
class CaseStudy(Model):
    problem: str
    role: str
    approach: str
    architecture: Optional[str] = None
    outcome: Optional[str] = None
class Diagram(Model):
    src: str
    alt: str
    caption: Optional[str] = None
class Links(Model):
    repository: Optional[str] = None
    demo: Optional[str] = None
class Project(Model):
    id: str
    slug: str
    title: str
    summary: str
    stack: list[str]
    image: Optional[Image] = None
    caseStudy: CaseStudy
    diagram: Optional[Diagram] = None
    links: Links
class Owner(Model):
    name: str
    headline: str
    bio: str
class Experience(Model):
    id: str
    role: str
    organization: str
    location: Optional[str] = None
    period: str
    highlights: list[str]
class Education(Model):
    id: str
    school: str
    credential: str
    location: Optional[str] = None
    period: Optional[str] = None
    details: list[str] = []
class SkillGroup(Model):
    level: str
    items: list[str]
class Shot(Image):
    thumb: str
class Clip(Model):
    src: str
    poster: str
    alt: str
    wide: Optional[bool] = None
class Spec(Model):
    label: str
    value: str
class Jump(Model):
    label: str
    href: str
class Chapter(Model):
    id: str
    title: str
    body: list[str]
    diagram: Optional[Diagram] = None
    image: Optional[Shot] = None
class Story(Model):
    kicker: str
    headline: str
    lede: str
    cover: Optional[Shot] = None
    specs: list[Spec] = []
    links: list[Jump] = []
    chapters: list[Chapter]
class Interest(Model):
    id: str
    slug: Optional[str] = None
    kicker: Optional[str] = None
    title: str
    description: str
    image: Optional[Image] = None
    gallery: list[Shot] = []
    reel: list[Clip] = []
    story: Optional[Story] = None
class Contact(Model):
    email: Optional[str] = None
    github: Optional[str] = None
    linkedin: Optional[str] = None
    resume: Optional[str] = None
class Portfolio(Model):
    schemaVersion: Literal[1]
    owner: Owner
    projects: list[Project]
    experience: list[Experience] = []
    education: list[Education] = []
    certifications: list[str] = []
    skills: list[SkillGroup] = []
    interests: list[Interest]
    contact: Contact
class Health(Model):
    status: Literal['ok'] = 'ok'

def load_content(path=Path(__file__).resolve().parents[2] / 'content' / 'portfolio.json'):
    return Portfolio.model_validate(json.loads(path.read_text()))
content = load_content()
app = FastAPI(title='Parth Shrestha Portfolio', docs_url=None, redoc_url=None)
@app.get('/api/v1/health', response_model=Health)
def health():
    return Health()
@app.get('/api/v1/portfolio', response_model=Portfolio, response_model_exclude_none=True)
def portfolio():
    return content
@app.get('/api/v1/projects/{slug}', response_model=Project, response_model_exclude_none=True)
def project(slug: str):
    match = next((p for p in content.projects if p.slug == slug), None)
    if match is None:
        raise HTTPException(404, 'Project not found')
    return match
