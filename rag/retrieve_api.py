import os
from dotenv import load_dotenv
from fastapi import FastAPI
from pydantic import BaseModel
from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue
from sentence_transformers import SentenceTransformer
from typing import List, Optional

load_dotenv()
COL = "interview_kb_v1"
client = QdrantClient(url=os.environ["QDRANT_URL"], api_key=os.environ["QDRANT_API_KEY"], timeout=30)
model = SentenceTransformer("BAAI/bge-small-en-v1.5")
app = FastAPI()

DROP = ("embed_text", "drafting_notes", "source", "review_status", "version")

def flt(**kw):
    return Filter(must=[FieldCondition(key=k, match=MatchValue(value=v)) for k, v in kw.items() if v])

def slim(p):
    return {k: v for k, v in p.items() if k not in DROP}

def fetch_all(**kw):
    pts, _ = client.scroll(COL, scroll_filter=flt(**kw), limit=100, with_payload=True)
    return [slim(p.payload) for p in pts]

def semantic(query, limit, min_score=0.45, **kw):
    vec = model.encode(query, normalize_embeddings=True).tolist()
    res = client.query_points(COL, query=vec, query_filter=flt(**kw), limit=limit).points
    return [slim(r.payload) for r in res if r.score >= min_score]

class Req(BaseModel):
    family: str
    role: Optional[str] = None 
    seniority: str
    skills: List[str] = []

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/retrieve")
def retrieve(r: Req):
    print(f"retrieving for {r.family} / {r.role} / {r.seniority} / {len(r.skills)} skills")
    q = " ".join(r.skills) or r.family
    exemplars = semantic(q, 6, family=r.family, entry_type="question_exemplar", seniority=r.seniority)
    if not exemplars:
        exemplars = semantic(q, 6, family=r.family, entry_type="question_exemplar")
    return {
        "guidelines": fetch_all(family="All", entry_type="guideline"),
        "competencies": semantic(q, 4, family="All", entry_type="competency"),
        "framework": fetch_all(family=r.family, entry_type="family_framework"),
        "ladder": fetch_all(entry_type="seniority_ladder", seniority=r.seniority),
        "skills": semantic(q, 5, family=r.family, entry_type="skill_definition"),
        "exemplars": exemplars,
        "coverage_gap": len(exemplars) == 0,
    }