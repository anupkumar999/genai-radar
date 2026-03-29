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
            
            # Use Hacker News Search for pure AI news specifically
            print("Going to TechCrunch AI...")
            await page.goto("https://techcrunch.com/category/artificial-intelligence/", wait_until="domcontentloaded")
            
            # Wait for headlines to load
            await page.wait_for_selector("h2, h3", timeout=10000)
            
            # Extract the top 10 AI-specific articles from TechCrunch
            articles = await page.evaluate("""() => {
                const links = Array.from(document.querySelectorAll('a'))
                    .filter(a => {
                        const h2 = a.querySelector('h2');
                        const h3 = a.querySelector('h3');
                        return h2 || h3;
                    });
                
                const uniqueArticles = [];
                const seenTitles = new Set();
                
                for (const a of links) {
                    const h2 = a.querySelector('h2');
                    const h3 = a.querySelector('h3');
                    const title = (h2 ? h2.innerText : h3.innerText).trim();
                    
                    if (title.length > 15 && !seenTitles.has(title)) {
                        seenTitles.add(title);
                        uniqueArticles.push({
                            title: title,
                            link: a.href,
                            source: "techcrunch.com",
                            summary: "Latest AI breaking news."
                        });
                    }
                    if (uniqueArticles.length >= 10) break;
                }
                
                return uniqueArticles;
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
