from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import pipeline

app = FastAPI(title="Resume NER Parser")

class ParseRequest(BaseModel):
    text: str

# Load pipeline at startup
ner = None

@app.on_event("startup")
async def load_model():
    global ner
    print("Loading resume-ner-bert-v2 model...")
    ner = pipeline(
        "token-classification",
        model="yashpwr/resume-ner-bert-v2",
        aggregation_strategy="simple"
    )
    print("Model loaded successfully!")

@app.get("/")
def health():
    return {"status": "ready", "model": "yashpwr/resume-ner-bert-v2"}

@app.post("/parse")
async def parse_resume(request: ParseRequest):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Empty text")

    try:
        results = ner(request.text)

        # Group by entity_group
        parsed = {}
        for entity in results:
            group = entity["entity_group"]
            word = entity["word"].strip()
            score = round(entity["score"], 3)

            if group in ["Name", "Email Address", "Phone", "Location", "Degree", "Graduation Year", "Years of Experience"]:
                parsed[group] = word
            else:
                if group not in parsed:
                    parsed[group] = []
                parsed[group].append(word)

        return {"parsed": parsed, "raw": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))