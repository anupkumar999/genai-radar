# 📡 GenAI Radar

The ultimate homepage for AI Engineers. A beautiful, unified dashboard to cut through the noise and track the bleeding edge of Artificial Intelligence, Large Language Models (LLMs), and Machine Learning.

![GenAI Radar](https://img.shields.io/badge/Status-Active-success) ![React](https://img.shields.io/badge/React-19-blue) ![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC)

## ✨ Features

*   🌅 **The Morning Briefing**: Serverless, automated daily extraction of the top AI engineering news from TechCrunch directly to your dashboard.
*   🧠 **AI Repo Summarizer**: Enter your API Key (Gemini, OpenAI, or Anthropic) and instantly summarize complex 10-page GitHub READMEs into 3 actionable bullet points.
*   📄 **Daily Research Papers**: Automatically pulls the top daily trending AI papers straight from Hugging Face.
*   🔥 **Live Trending Alerts**: Hooks into Algolia's Hacker News API to alert you the second an AI topic crosses 50+ upvotes.
*   🔭 **High-Signal Filtering**: Built-in filters for top AI organizations (OpenAI, Anthropic, Meta, DeepMind) and topics (RAG, Agents, MLOps, LLMs).
*   💾 **Smart Caching**: Saves your Morning Briefings and AI Summaries to Local Storage so you don't waste API credits or network requests on page reloads.
*   🔖 **Reading List (Bookmarks)**: Save repositories, papers, and news articles to your local Reading List for later.
*   🌗 **Gorgeous UI**: Dark/Light mode support, built with Tailwind CSS and Lucide React icons for a premium SaaS feel.

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+)
*   npm or yarn

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/genai-radar.git
   cd genai-radar
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:5173` in your browser!

### Cloud Automation (Morning Briefing)
The Morning Briefing tab uses Netlify Serverless Functions to scrape news without needing a heavy backend. 
To test this locally, you can use the Netlify CLI:
```bash
npm install -g netlify-cli
netlify dev
```

## 🛠️ Tech Stack
*   **Frontend**: React (Vite), Tailwind CSS, Lucide Icons, Date-Fns.
*   **Backend/API**: Netlify Serverless Functions, GitHub API, Hugging Face API, Algolia Search API.
*   **AI Integrations**: Google Gemini, OpenAI GPT, Anthropic Claude (Bring Your Own Key).

## 🤝 Contributing
Pull requests are welcome! If you'd like to add new research sources (like Arxiv), new organizations to track, or UI improvements, feel free to open an issue.

## 📄 License
MIT License
