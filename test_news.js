async function test() {
    const hnQuery = '"LLM" OR "OpenAI" OR "Anthropic" OR "AI Agents" OR "Generative AI" OR "Machine Learning"';
    const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(hnQuery)}&tags=story&hitsPerPage=30`;
    console.log("URL:", url);
    try {
        const res = await fetch(url);
        const data = await res.json();
        console.log(`Found ${data.hits.length} hits.`);
    } catch(e) {
        console.error(e);
    }
}
test();