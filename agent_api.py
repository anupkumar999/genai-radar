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
            
            print("Going to Hacker News...")
            await page.goto("https://news.ycombinator.com/")
            await page.wait_for_selector(".athing")
            
            # Extract top 10 articles from Hacker News using DOM evaluation
            articles = await page.evaluate("""() => {
                const rows = Array.from(document.querySelectorAll('.athing')).slice(0, 10);
                
                return rows.map(row => {
                    const titleEl = row.querySelector('.titleline > a');
                    const siteEl = row.querySelector('.sitebit');
                    
                    return {
                        title: titleEl ? titleEl.innerText : "Unknown Title",
                        link: titleEl ? titleEl.href : "",
                        source: siteEl ? siteEl.innerText.replace('(', '').replace(')', '').trim() : "news.ycombinator.com",
                        summary: "Automated daily web extraction for trending topics."
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
