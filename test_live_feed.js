async function test() {
    const terms = ['LLM', 'OpenAI', 'Anthropic', 'AI Agents'];
    console.log("Testing Live Feed API Queries...");
    for (const term of terms) {
        const url = `https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(term)}&tags=story&hitsPerPage=3`;
        try {
            const res = await fetch(url);
            const data = await res.json();
            console.log(`\n--- Term: ${term} ---`);
            console.log(`Found ${data.hits.length} hits.`);
            if (data.hits.length > 0) {
                console.log(`Newest: "${data.hits[0].title}"`);
                console.log(`Date: ${data.hits[0].created_at}`);
            }
        } catch (e) {
            console.error(`Failed for ${term}:`, e);
        }
        await new Promise(r => setTimeout(r, 500)); // small delay
    }
}
test();