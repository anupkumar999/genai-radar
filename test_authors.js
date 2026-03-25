async function test() {
    const queries = [
        "user:karpathy OR user:hwchase17 OR user:simonw stars:>10",
        "org:openai OR org:anthropic OR org:google-deepmind stars:>50"
    ];

    for (const q of queries) {
        const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=1`;
        try {
            const res = await fetch(url, { headers: { 'User-Agent': 'Node-Test' } });
            if (res.ok) {
                const data = await res.json();
                console.log(`[PASS] Found ${data.total_count} -> Query: ${q}`);
            } else {
                console.log(`[FAIL] Error: ${(await res.json()).errors?.[0]?.message} -> Query: ${q}`);
            }
        } catch (e) {
             console.error("Fetch failed:", e);
        }
        await new Promise(r => setTimeout(r, 1000));
    }
}
test();