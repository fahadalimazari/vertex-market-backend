from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn

app = FastAPI()

class ChatRequest(BaseModel):
    query: str

class RecommendationResponse(BaseModel):
    intent: str
    category: str
    budget: float | None
    brand: str | None
    keywords: list[str]

@app.post("/recommend", response_model=RecommendationResponse)
async def get_recommendation(request: ChatRequest):
    query = request.query.lower()
    
    # Simple rule-based extraction for demonstration
    intent = "recommendation"
    category = ""
    budget = None
    brand = None
    keywords = []

    if "laptop" in query or "macbook" in query:
        category = "laptops"
        if "gaming" in query:
            keywords.append("gaming")
    elif "phone" in query or "smartphone" in query or "iphone" in query:
        category = "smartphones"
    elif "shoe" in query or "sneaker" in query:
        category = "shoes"

    # Extract budget (e.g. under 1200)
    words = query.split()
    for i, word in enumerate(words):
        if word == "under" and i + 1 < len(words):
            try:
                budget = float(words[i+1].replace("$", ""))
            except ValueError:
                pass

    return {
        "intent": intent,
        "category": category,
        "budget": budget,
        "brand": brand,
        "keywords": keywords
    }

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
