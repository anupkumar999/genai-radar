import asyncio
import json
import os
import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

try:
    from browser_use import Agent
    from langchain_google_genai import ChatGoogleGenerativeAI
except ImportError:
    print("Missing requirements. Please run: pip install fastapi uvicorn browser-use langchain-google-genai pydantic")
    exit(1)

from unittest.mock import MagicMock
from pydantic import ConfigDict

# --- PATCH FOR BROWSER USE WITH GEMINI ---
# browser-use dynamically monkeys patches the LLM instance with new methods 
# like 'ainvoke' and 'provider'. Pydantic v2 prevents adding new attributes
# to predefined models by default. We must allow extra fields.
class BrowserUseGoogleGenAI(ChatGoogleGenerativeAI):
    model_config = ConfigDict(extra='allow')
# ---------------------------------------

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows React frontend to connect
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AgentRequest(BaseModel):
    api_key: str

@app.post("/api/run-agent")
async def run_agent(req: AgentRequest):
    if not req.api_key:
        raise HTTPException(status_code=400, detail="Gemini API Key is required")
        
    print("🤖 Firing up Browser Use with Gemini...")
    
    try:
        # Initialize Gemini
        llm = BrowserUseGoogleGenAI(
            model="gemini-2.5-flash", 
            google_api_key=req.api_key
        )
        llm.provider = "google" # Patch for browser-use telemetry
        llm.model_name = llm.model # Patch for browser-use eventbus crash
        
        task = """
        1. Go to https://news.ycombinator.com/
        2. Look at the top 3 news headlines on the page.
        3. For each of those 3 headlines, extract the title, the source domain (e.g. github.com), and the link URL.
        4. Write a 1-sentence summary based on the title.
        
        You MUST return ONLY a raw JSON array of objects. Do not wrap it in markdown. Example format:
        [
          {"title": "...", "source": "...", "summary": "...", "link": "..."}
        ]
        """
        
        agent = Agent(task=task, llm=llm)
        result = await agent.run()
        
        final_text = result.final_result()
        
        if final_text is None:
            raise ValueError("Agent failed to return any text.")
        if final_text.startswith("```json"):
            final_text = final_text.strip("```json").strip("```")
        elif final_text.startswith("```"):
            final_text = final_text.strip("```")
            
        final_text = final_text.strip()
        json_data = json.loads(final_text)
        
        # Save to public folder so React can keep reading it later too
        output_path = os.path.join("public", "daily_ai_news.json")
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, "w") as f:
            json.dump(json_data, f, indent=2)
            
        return {"success": True, "news": json_data}
        
    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    print("🚀 Starting local Agent API on http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
