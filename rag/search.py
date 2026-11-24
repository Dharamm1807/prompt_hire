import os
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue
from sentence_transformers import SentenceTransformer

load_dotenv()
COLLECTION = "interview_kb_v1"
client = QdrantClient(url=os.environ["QDRANT_URL"],
                      api_key=os.environ["QDRANT_API_KEY"], timeout=30)
model = SentenceTransformer("BAAI/bge-small-en-v1.5")

def search(query, family=None, seniority=None, entry_type=None,
           limit=5, min_score=0.5):
    must = []
    for key, val in [("family", family), ("seniority", seniority),
                     ("entry_type", entry_type)]:
        if val:
            must.append(FieldCondition(key=key, match=MatchValue(value=val)))
    vec = model.encode(query, normalize_embeddings=True).tolist()
    res = client.query_points(COLLECTION, query=vec,
                              query_filter=Filter(must=must) if must else None,
                              limit=limit).points
    return [{"score": r.score, "payload": r.payload}
            for r in res if r.score >= min_score]

if __name__ == "__main__":
    for r in search("negotiation", family="Sales", seniority="senior"):
        print(round(r["score"], 3), r["payload"].get("id"))