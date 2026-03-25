async function test() {
    const queries = [
        "topic:agents OR topic:rag OR topic:langchain OR topic:autogen stars:>50 pushed:>2025-03-01",
        "topic:llm OR topic:generative-ai OR topic:gpt stars:10..500 created:>2025-09-01",
        "topic:machine-learning OR topic:artificial-intelligence OR topic:generative-ai stars:>50"
    ];

    for (const q of queries) {
        const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=5`;
        console.log("Testing Query:", q);
        console.log("URL:", url);
        try {
            const res = await fetch(url, { headers: { 'User-Agent': 'Node-Test' } });
            console.log("HTTP Status:", res.status);
            if (res.ok) {
                const data = await res.json();
                console.log(`Success! Found ${data.total_count} total repos.`);
                if (data.items && data.items.length > 0) {
                     console.log(`Top match: ${data.items[0].full_name} (${data.items[0].stargazers_count} stars)`);
                } else {
                     console.log("Array is empty.");
                }
            } else {
                console.log("Error response:", await res.text());
            }
        } catch (e) {
             console.error("Fetch failed:", e);
        }
        console.log("------------------------");
        // small delay to avoid rate limit
        await new Promise(r => setTimeout(r, 1500));
    }
}
test();