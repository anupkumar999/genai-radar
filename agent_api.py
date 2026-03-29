import asyncio
import json
import os
import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from playwright.async_api import async_playwright
import datetime

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows React frontend to connect
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/run-agent")
async def run_agent():
    print("🤖 Firing up automated Playwright Scraper...")
    
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=False) # Keep it visible for the "Agent" feel
            page = await browser.new_page()
            
            # Use Hacker News Algolia Search for pure AI news specifically
            print("Going to Hacker News Search for AI topics...")
            # We construct a URL that searches for AI/LLM explicitly and sorts by date
            search_url = "https://hn.algolia.com/?dateRange=pastWeek&page=0&prefix=false&query=AI%20OR%20LLM%20OR%20OpenAI%20OR%20Anthropic&sort=byDate&type=story"
            await page.goto(search_url, wait_until="networkidle")
            
            # Extract the top 10 AI-specific articles
            articles = await page.evaluate("""() => {
                const rows = Array.from(document.querySelectorAll('.Story')).slice(0, 10);
                
                return rows.map(row => {
                    const titleEl = row.querySelector('.Story_title > a');
                    const siteEl = row.querySelector('.Story_link'); // This contains the hostname in Algolia UI
                    
                    let domain = "news.ycombinator.com";
                    if (siteEl) {
                        domain = siteEl.innerText.replace('(', '').replace(')', '').trim();
                    }
                    
                    return {
                        title: titleEl ? titleEl.innerText : "Unknown Title",
                        link: titleEl ? titleEl.href : "",
                        source: domain,
                        summary: "Recent trending AI news."
                    };
                });
            }""")
            
            await browser.close()
            
            # Save to public folder so React can keep reading it later too
            output_path = os.path.join("public", "daily_ai_news.json")
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            with open(output_path, "w") as f:
                json.dump(articles, f, indent=2)
                
            print(f"✅ Extracted {len(articles)} articles and saved to {output_path}")
            return {"success": True, "news": articles}
            
    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    print("🚀 Starting local Agent API on http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
