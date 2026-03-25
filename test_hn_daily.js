async function test() {
    const q = 'AI OR LLM OR OpenAI OR Anthropic OR "Generative AI" OR "AI Agents"';
    try {
        const res = await fetch(`https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(q)}&tags=story&numericFilters=points>10&hitsPerPage=5`);
        const data = await res.json();
        console.log(`[PASS] Found ${data.hits.length} hits.`);
        if(data.hits.length > 0) {
            console.log(data.hits[0].title);
            console.log("Points:", data.hits[0].points);
            console.log("Date:", data.hits[0].created_at);
        }
    } catch(e) {
        console.error(e);
    }
}
test();