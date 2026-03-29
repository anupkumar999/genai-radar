import puppeteer from 'puppeteer-core';

export const handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    console.log("Starting serverless Netlify scraper...");

    // Netlify Functions run in a constrained environment (AWS Lambda). 
    // For a real production app using Puppeteer on Netlify, you typically use '@sparticuz/chromium'
    // but Netlify recently made simple fetching easier. 
    // Actually, since we just want top 10 articles from TechCrunch, we don't even *need* a browser 
    // on the backend anymore! We can just fetch the HTML directly, making it 1000x faster and Netlify-compatible!
    
    const response = await fetch("https://techcrunch.com/category/artificial-intelligence/");
    const html = await response.text();

    // Very simple Regex/HTML extraction for serverless speed without heavy browser dependencies
    const articles = [];
    const seenTitles = new Set();
    
    // TechCrunch wraps headlines in h2/h3 and links. 
    // This is a naive but fast regex extraction suitable for a lightweight Netlify function
    const titleRegex = /<a[^>]*href="([^"]+)"[^>]*>.*?<h[23][^>]*>(.*?)<\/h[23]>.*?<\/a>/gs;
    
    let match;
    while ((match = titleRegex.exec(html)) !== null && articles.length < 10) {
      const link = match[1];
      let title = match[2]
        .replace(/<[^>]*>?/gm, '') // Remove nested tags if any
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#8217;/g, "'")
        .replace(/&#8220;/g, '"')
        .replace(/&#8221;/g, '"')
        .trim();
        
      if (title.length > 15 && !seenTitles.has(title)) {
        seenTitles.add(title);
        articles.push({
          title: title,
          link: link,
          source: "techcrunch.com",
          summary: "Latest AI breaking news."
        });
      }
    }
    
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ success: true, news: articles })
    };

  } catch (error) {
    console.error("Scraper Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, detail: error.toString() })
    };
  }
};
