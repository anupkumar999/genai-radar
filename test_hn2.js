async function test() {
    const queries = [
        "LLM OR OpenAI OR Anthropic OR Agents OR Generative OR AI",
        "(LLM OR OpenAI OR Anthropic OR Agents)",
        "AI OR LLM",
        "LLM OR OpenAI OR Anthropic OR AI",
        "LLM, OpenAI, Anthropic, AI Agents"
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