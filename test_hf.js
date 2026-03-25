async function test() {
    try {
        const res = await fetch('https://huggingface.co/api/daily_papers');
        const data = await res.json();
        console.log(`[PASS] Found ${data.length} papers today.`);
        if(data.length > 0) {
            console.log(`Top paper: ${data[0].paper.title}`);
            console.log(`Upvotes: ${data[0].paper.upvotes}`);
        }
    } catch(e) {
        console.error(e);
    }
}
test();