async function test() {
    const domains = [
        "openai.com/research",
        "anthropic.com/research",
        "lilianweng.github.io",
        "bair.berkeley.edu",
        "eugeneyan.com"
    ];
    let query = domains.map(d => `"${d}"`).join(" OR ");
    console.log("Query:", query);
    try {
        const res = await fetch(`https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=10`);
        const data = await res.json();
        console.log(`[PASS] Found ${data.hits.length} hits.`);
        if(data.hits.length > 0) {
            console.log(data.hits[0].title);
        }
    } catch(e) {
        console.error(e);
    }
}
test();