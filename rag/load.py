import os, json, uuid
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance, PointStruct
from sentence_transformers import SentenceTransformer

load_dotenv()
COLLECTION = "interview_kb_v1"
MODEL_NAME = "BAAI/bge-small-en-v1.5"   # 384 dimensions
DIM = 384

client = QdrantClient(url=os.environ["QDRANT_URL"],
                      api_key=os.environ["QDRANT_API_KEY"], timeout=30)
model = SentenceTransformer(MODEL_NAME)

# 1. create collection + filter indexes (only if missing)
if not client.collection_exists(COLLECTION):
    client.create_collection(
        COLLECTION,
        vectors_config=VectorParams(size=DIM, distance=Distance.COSINE))
    for f in ["entry_type", "family", "role", "seniority",
              "category", "locale", "skills"]:
        client.create_payload_index(COLLECTION, field_name=f,
                                    field_schema="keyword")

# 2. decide what text gets embedded, per entry type
def embed_text(e):
    t = e["entry_type"]
    if t == "question_exemplar":
        return f'{e["question_text"]} {" ".join(e["skills"])} {e["assesses"]}'
    if t == "competency":
        return f'{e["name"]} {e["definition"]}'
    if t == "skill_definition":
        return f'{e["canonical_name"]} {e["definition"]} {" ".join(e["aliases"])}'
    if t == "guideline":
        return f'{e["title"]} {e["rule"]} {e["rationale"]}'
    return f'{e.get("title", "")} {e.get("scope_description", "")}'

# 3. load, embed, upload in batches
entries = json.load(open("data/kb.json", encoding="utf-8"))
BATCH = 100
for i in range(0, len(entries), BATCH):
    chunk = entries[i:i + BATCH]
    vecs = model.encode([embed_text(e) for e in chunk],
                        normalize_embeddings=True)
    points = [PointStruct(
        id=str(uuid.uuid5(uuid.NAMESPACE_URL, e["id"])),  # stable id
        vector=v.tolist(),
        payload=e) for e, v in zip(chunk, vecs)]
    client.upsert(COLLECTION, points=points)
    print(f"uploaded {i + len(chunk)}/{len(entries)}")

print("points in collection:", client.count(COLLECTION).count)