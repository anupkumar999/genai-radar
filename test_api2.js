async function test() {
    const queries = [
        "ai in:name,description topic:agents OR topic:rag",
        "topic:agents", // without OR, just one qualifier, no text
        "llm topic:rag OR topic:langchain",
        "topic:machine-learning topic:artificial-intelligence", // AND logic
        "ai topic:machine-learning OR topic:artificial-intelligence stars:>50",
    ];

    for (const q of queries) {
        const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=1`;
        try {
            const res = await fetch(url, { headers: { 'User-Agent': 'Node-Test' } });
            if (res.ok) {
                const data = await res.json();
                console.log(`[PASS] ${q} -> Found ${data.total_count}`);
            } else {
                console.log(`[FAIL] ${q} -> ${(await res.json()).errors[0].message}`);
            }
        } catch (e) {
             console.error("Fetch failed:", e);
        }
        await new Promise(r => setTimeout(r, 1000));
    }
}
test();