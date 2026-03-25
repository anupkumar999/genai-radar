async function test() {
    const queries = [
        "LLM",
        "OpenAI",
        "AI Agents",
        "(LLM OR OpenAI)",
        "LLM OR OpenAI OR Anthropic",
        '"LLM" OR "OpenAI" OR "Anthropic"'
    ];

    for (const q of queries) {
        const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(q)}&tags=story&hitsPerPage=1`;
        try {
            const res = await fetch(url);
            const data = await res.json();
            console.log(`Found ${data.nbHits} hits for: ${q}`);
        } catch(e) {
            console.error(e);
        }
        await new Promise(r => setTimeout(r, 500));
    }
}
test();