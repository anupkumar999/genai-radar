import asyncio
import json
import os
import sys

# Ensure user has browser-use installed
try:
    from browser_use import Agent
    from langchain_openai import ChatOpenAI
except ImportError:
    print("❌ Missing required libraries.")
    print("Please install them using:")
    print("pip install browser-use langchain-openai python-dotenv")
    sys.exit(1)

# Ensure API Key is available
if not os.environ.get("OPENAI_API_KEY"):
    print("❌ OPENAI_API_KEY environment variable is not set.")
    print("Please set it before running this script.")
    print("Example: export OPENAI_API_KEY='sk-your-key'")
    sys.exit(1)

async def main():
    task = """
    Go to Hacker News (news.ycombinator.com) and TechCrunch AI (techcrunch.com/category/artificial-intelligence/). 
    Find the top 3 most interesting recent news articles related to AI, LLMs, or Machine Learning today.
    Return the result strictly as a valid JSON array of objects, where each object has:
    - "title": Title of the article
    - "source": The website name or author
    - "summary": A brief 1-2 sentence summary of what the article is about
    - "link": URL to the full article
    
    Ensure you output ONLY the valid JSON array and nothing else.
    """
    
    # Using gpt-4o as it has vision capabilities which are great for browser-use
    llm = ChatOpenAI(model="gpt-4o")
    agent = Agent(
        task=task,
        llm=llm
    )
    
    print("🤖 Agent is firing up a browser to fetch daily AI news...")
    try:
        result = await agent.run()
        final_text = result.final_result()
        
        # Clean up output in case the LLM returned markdown code blocks
        if final_text.startswith("```json"):
            final_text = final_text.strip("```json").strip("```")
        elif final_text.startswith("```"):
            final_text = final_text.strip("```")
            
        final_text = final_text.strip()
        
        # Verify it's valid JSON
        json_data = json.loads(final_text)
        
        # Determine the path relative to this script
        script_dir = os.path.dirname(os.path.abspath(__file__))
        output_path = os.path.join(script_dir, "public", "daily_ai_news.json")
        
        # Ensure public directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        with open(output_path, "w") as f:
            json.dump(json_data, f, indent=2)
             
        print(f"✅ Daily AI news successfully saved to {output_path}!")
        print("🎉 You can now check the 'Agent News' tab in your GenAI Radar!")
        
    except json.JSONDecodeError as e:
        print("❌ Error: The agent did not return valid JSON.")
        print(f"Raw output was:\n{final_text}")
    except Exception as e:
        print(f"❌ An error occurred during agent execution: {e}")

if __name__ == "__main__":
    asyncio.run(main())