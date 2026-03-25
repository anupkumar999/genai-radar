async function test() {
    try {
        const res = await fetch('https://huggingface.co/api/daily_papers');
        const data = await res.json();
        const p = data[0].paper;
        console.log("Keys:", Object.keys(p));
        console.log("Title:", p.title);
        console.log("Authors:", p.authors.slice(0, 3).map(a => a.name));
        console.log("PublishedAt:", p.publishedAt);
        console.log("Upvotes:", p.upvotes);
        console.log("Summary:", p.summary.substring(0, 100));
        console.log("ID:", p.id);
    } catch(e) {
        console.error(e);
    }
}
test();