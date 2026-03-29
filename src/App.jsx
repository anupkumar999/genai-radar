import { useState, useEffect } from 'react';
import { Terminal, Star, GitFork, Clock, BookOpen, Code2, Search, Calendar, TrendingUp, Sparkles, AlertCircle, Copy, Check, Users, Library, FileText, Newspaper, ExternalLink, Globe, Sun, Moon, X, Activity, Settings } from 'lucide-react';
import { formatDistanceToNow, subMonths, subYears, format } from 'date-fns';

function App() {
  const [mainView, setMainView] = useState('repos'); 
  
  // --- THEME STATE ---
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // --- AI SUMMARY STATE ---
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [summaries, setSummaries] = useState({});
  const [summarizing, setSummarizing] = useState(null);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // --- REPOS STATE ---
  const [repos, setRepos] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [apiError, setApiError] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const [topic, setTopic] = useState('agents');
  const [timeRange, setTimeRange] = useState('1-year');
  const [sortBy, setSortBy] = useState('stars');
  const [language, setLanguage] = useState('all');
  const [author, setAuthor] = useState('all');

  // --- RESEARCH STATE ---
  const [researchTab, setResearchTab] = useState('papers'); 
  const [researchSortBy, setResearchSortBy] = useState('date'); 
  const [papers, setPapers] = useState([]);
  const [news, setNews] = useState([]);
  const [liveNews, setLiveNews] = useState([]);
  const [agentNews, setAgentNews] = useState([]);
  const [loadingResearch, setLoadingResearch] = useState(true);
  const [isAgentRunning, setIsAgentRunning] = useState(false);

  // --- TRENDING ALERT STATE ---
  const [trendingAlert, setTrendingAlert] = useState(null);
  const [showAlert, setShowAlert] = useState(true);

  useEffect(() => {
    const fetchTrendingAlert = async () => {
      try {
        const query = '"LLM" OR "OpenAI" OR "Anthropic" OR "AI Agents"';
        const res = await fetch(`https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&numericFilters=points>50&hitsPerPage=1`);
        if (res.ok) {
          const data = await res.json();
          if (data.hits && data.hits.length > 0) {
            setTrendingAlert(data.hits[0]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch trending alert", error);
      }
    };
    fetchTrendingAlert();
  }, []);

  // --- CONSTANTS ---
  const topics = [
    { id: 'all-ai', name: 'All AI & ML', query: '"machine learning" OR "artificial intelligence" OR "generative ai"' },
    { id: 'gen-ai', name: 'GenAI & LLMs', query: 'llm OR "generative ai" OR gpt' },
    { id: 'agents', name: 'Agents & RAG', query: 'agents OR rag OR langchain OR autogen' },
    { id: 'skills', name: 'Engineering', query: 'mlops OR "prompt engineering" OR "fine-tuning"' }
  ];

  const authors = [
    { id: 'all', name: 'Global Network' },
    { id: 'org:openai', name: 'OpenAI' },
    { id: 'org:anthropic', name: 'Anthropic' },
    { id: 'org:google-deepmind', name: 'Google DeepMind' },
    { id: 'org:meta-llama', name: 'Meta Llama' },
    { id: 'org:huggingface', name: 'Hugging Face' },
    { id: 'org:mistralai', name: 'Mistral AI' },
    { id: 'user:karpathy', name: 'Andrej Karpathy' },
    { id: 'user:hwchase17', name: 'Harrison Chase' },
    { id: 'user:ggerganov', name: 'Georgi Gerganov' },
    { id: 'user:simonw', name: 'Simon Willison' },
    { id: 'user:jph00', name: 'Jeremy Howard' }
  ];

  const timeRanges = [
    { id: '1-month', name: 'Past Month', getDate: () => format(subMonths(new Date(), 1), 'yyyy-MM-dd') },
    { id: '6-months', name: 'Past 6 Months', getDate: () => format(subMonths(new Date(), 6), 'yyyy-MM-dd') },
    { id: '1-year', name: 'Past Year', getDate: () => format(subYears(new Date(), 1), 'yyyy-MM-dd') },
    { id: 'all-time', name: 'All Time', getDate: () => null }
  ];

  const sortOptions = [
    { id: 'stars', name: 'Highest Rated', val: 'stars' },
    { id: 'updated', name: 'Recently Active', val: 'updated' },
    { id: 'rising', name: 'Rising Gems', val: 'updated' } 
  ];

  const researchSortOptions = [
    { id: 'date', name: 'Newest First', val: 'date' },
    { id: 'points', name: 'Highest Rated', val: 'points' }
  ];

  const languages = [
    { id: 'all', name: 'Any Language' },
    { id: 'python', name: 'Python' },
    { id: 'typescript', name: 'TypeScript' },
    { id: 'go', name: 'Go' },
    { id: 'rust', name: 'Rust' },
    { id: 'cpp', name: 'C++' },
    { id: 'jupyter-notebook', name: 'Jupyter' }
  ];

  // --- FETCH REPOS ---
  useEffect(() => {
    if (mainView !== 'repos') return;
    const fetchRepos = async () => {
      setLoadingRepos(true);
      setApiError(false);
      let q = '';

      if (author !== 'all') {
        q += `${author} `;
      } else {
        const activeTopic = topics.find(t => t.id === topic);
        q += `${activeTopic.query} `;
      }
      
      let starQuery = sortBy === 'rising' ? 'stars:10..500' : 'stars:>50';
      if (author !== 'all' && sortBy !== 'rising') starQuery = 'stars:>10';
      q += `${starQuery}`;

      const activeTime = timeRanges.find(t => t.id === timeRange);
      const dateStr = activeTime.getDate();
      if (dateStr) {
        const dateType = sortBy === 'rising' ? 'created' : 'pushed';
        q += ` ${dateType}:>${dateStr}`;
      }

      if (language !== 'all') q += ` language:${language}`;
      if (searchQuery.trim().length > 0) q += ` ${searchQuery} in:name,description`;

      try {
        const response = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=${sortBy === 'rising' ? 'stars' : sortBy}&order=desc&per_page=30`);
        if (response.status === 403 || response.status === 422) {
          setApiError(true);
          setRepos([]);
        } else if (response.ok) {
          const data = await response.json();
          setRepos(data.items || []);
        } else {
           setRepos([]);
        }
      } catch (error) {
        console.error("Failed to fetch repos", error);
        setRepos([]);
      } finally {
        setLoadingRepos(false);
      }
    };

    const delayDebounceFn = setTimeout(() => fetchRepos(), 500);
    return () => clearTimeout(delayDebounceFn);
  }, [topic, timeRange, sortBy, language, author, searchQuery, mainView]);

  useEffect(() => {
    setPapers([]);
    setNews([]);
    setLiveNews([]);
    setAgentNews([]);
  }, [researchSortBy, researchTab]);

  // --- FETCH RESEARCH ---
  useEffect(() => {
    if (mainView !== 'research') return;
    const fetchResearch = async () => {
      setLoadingResearch(true);
      try {
        if (researchTab === 'papers' && papers.length === 0) {
          const hfRes = await fetch('https://huggingface.co/api/daily_papers');
          if (hfRes.ok) {
            const hfData = await hfRes.json();
            let mappedPapers = hfData.map(item => ({
              id: item.paper.id,
              title: item.paper.title,
              summary: item.paper.summary,
              url: `https://huggingface.co/papers/${item.paper.id}`,
              arxivUrl: `https://arxiv.org/abs/${item.paper.id}`,
              authors: item.paper.authors.slice(0, 4).map(a => a.name).join(', ') + (item.paper.authors.length > 4 ? ' et al.' : ''),
              upvotes: item.paper.upvotes,
              date: item.paper.publishedAt
            }));

            if (researchSortBy === 'date') {
              mappedPapers.sort((a, b) => new Date(b.date) - new Date(a.date));
            } else {
              mappedPapers.sort((a, b) => b.upvotes - a.upvotes);
            }
            
            setPapers(mappedPapers);
          }
        }
        
        if (researchTab === 'news' && news.length === 0) {
          const terms = ['LLM', 'OpenAI', 'Anthropic', 'AI Agents'];
          const endpoint = researchSortBy === 'date' ? 'search_by_date' : 'search';
          
          const promises = terms.map(term => 
            fetch(`https://hn.algolia.com/api/v1/${endpoint}?query=${encodeURIComponent(term)}&tags=story&numericFilters=points>10&hitsPerPage=15`).then(res => res.json())
          );
          
          const results = await Promise.all(promises);
          
          const allHits = [];
          const seenIds = new Set();
          
          results.forEach(data => {
            if (data && data.hits) {
              data.hits.forEach(item => {
                if (!seenIds.has(item.objectID)) {
                  seenIds.add(item.objectID);
                  allHits.push(item);
                }
              });
            }
          });
          
          if (researchSortBy === 'date') {
            allHits.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          } else {
            allHits.sort((a, b) => b.points - a.points);
          }
          
          const mappedNews = allHits.slice(0, 30).map(item => ({
            id: item.objectID,
            title: item.title,
            url: item.url || `https://news.ycombinator.com/item?id=${item.objectID}`,
            points: item.points,
            comments: item.num_comments,
            date: item.created_at,
            domain: item.url ? new URL(item.url).hostname.replace('www.', '') : 'news.ycombinator.com'
          }));
          
          setNews(mappedNews);
        }

        if (researchTab === 'live' && liveNews.length === 0) {
          const terms = ['LLM', 'OpenAI', 'Anthropic', 'AI Agents'];
          const promises = terms.map(term => 
            fetch(`https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(term)}&tags=story&hitsPerPage=10`).then(res => res.json())
          );
          
          const results = await Promise.all(promises);
          const allHits = [];
          const seenIds = new Set();
          
          results.forEach(data => {
            if (data && data.hits) {
              data.hits.forEach(item => {
                if (!seenIds.has(item.objectID)) {
                  seenIds.add(item.objectID);
                  allHits.push(item);
                }
              });
            }
          });
          
          allHits.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          
          const mappedLive = allHits.slice(0, 30).map(item => ({
            id: item.objectID,
            title: item.title,
            url: item.url || `https://news.ycombinator.com/item?id=${item.objectID}`,
            points: item.points,
            comments: item.num_comments,
            date: item.created_at,
            domain: item.url ? new URL(item.url).hostname.replace('www.', '') : 'news.ycombinator.com'
          }));
          
          setLiveNews(mappedLive);
        }

        if (researchTab === 'agent' && agentNews.length === 0) {
          try {
            const res = await fetch('/daily_ai_news.json');
            if (res.ok) {
              const data = await res.json();
              setAgentNews(data);
            }
          } catch (e) {
            console.error("Failed to fetch agent news:", e);
          }
        }
      } catch (error) {
        console.error("Failed to fetch research", error);
      } finally {
        setLoadingResearch(false);
      }
    };
    fetchResearch();
  }, [mainView, researchTab, researchSortBy, papers.length, news.length]);

  const handleCopyClone = (e, repo) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(`git clone ${repo.clone_url}`);
    setCopiedId(repo.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAISummary = async (e, repo) => {
    e.preventDefault();
    e.stopPropagation();

    if (!geminiKey) {
      setShowKeyModal(true);
      return;
    }

    setSummarizing(repo.id);
    
    try {
      // 1. Fetch raw README
      let readmeText = '';
      const readmeRes = await fetch(`https://raw.githubusercontent.com/${repo.full_name}/${repo.default_branch || 'main'}/README.md`);
      if (readmeRes.ok) {
        readmeText = await readmeRes.text();
      } else {
        const fallbackRes = await fetch(`https://raw.githubusercontent.com/${repo.full_name}/master/README.md`);
        if (fallbackRes.ok) {
          readmeText = await fallbackRes.text();
        }
      }

      if (!readmeText) {
        setSummaries(prev => ({ ...prev, [repo.id]: "Could not locate a README.md file for this repository." }));
        setSummarizing(null);
        return;
      }

      // Truncate to save tokens (first ~12000 chars is usually enough context for deep dives)
      const truncatedReadme = readmeText.substring(0, 12000);

      // 2. Call Gemini 2.5 Flash API
      const prompt = `You are a Senior AI Architect analyzing a GitHub repository. Read the following README and provide a comprehensive, deeply technical, and structured breakdown of the project.

Your response MUST be formatted EXACTLY like this (do not use markdown headers or bolding, just plain text with these exact section prefixes):

TLDR: (1-2 sentences explaining exactly what this tool is)

HOW IT WORKS: (Explain the core architecture, the tech stack it uses under the hood, and how the data flows)

KEY FEATURES: (List 3-4 of the most impressive or unique technical capabilities of this repo)

WHY IT MATTERS: (Explain why a Senior AI Developer would choose this specific tool over alternatives or building it from scratch)

README CONTENT:
${truncatedReadme}`;
      
      const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey.trim()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (!geminiRes.ok) {
        const errData = await geminiRes.json();
        throw new Error(errData.error?.message || `HTTP ${geminiRes.status}`);
      }

      const geminiData = await geminiRes.json();
      const summary = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (summary) {
        setSummaries(prev => ({ ...prev, [repo.id]: summary }));
      } else {
        setSummaries(prev => ({ ...prev, [repo.id]: "Failed to generate a summary. The model returned an empty response." }));
      }

    } catch (error) {
      console.error("AI Summary Error:", error);
      setSummaries(prev => ({ ...prev, [repo.id]: `API Error: ${error.message}` }));
    } finally {
      setSummarizing(null);
    }
  };

  const saveGeminiKey = () => {
    localStorage.setItem('gemini_api_key', geminiKey.trim());
    setShowKeyModal(false);
  };

  const triggerAgent = async () => {
    setIsAgentRunning(true);
    try {
      const res = await fetch('http://localhost:8000/api/run-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}) // No API key required anymore!
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.news) {
          setAgentNews(data.news);
        }
      } else {
        const errData = await res.json();
        console.error("Agent failed:", errData.detail);
        alert(`Failed to run agent: ${errData.detail}`);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to connect to the local Agent Server. Ensure 'python agent_api.py' is running on port 8000.");
    } finally {
      setIsAgentRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] text-slate-800 dark:text-zinc-300 font-sans selection:bg-blue-200 dark:selection:bg-indigo-500/30 selection:text-blue-900 dark:selection:text-indigo-200 pb-20 transition-colors duration-300">
      
      {/* Global Header */}
      <header className="border-b border-slate-200 dark:border-white/5 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[72px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 dark:bg-indigo-500/10 border border-transparent dark:border-indigo-500/20 p-2 rounded-xl shadow-sm dark:shadow-[0_0_15px_rgba(99,102,241,0.1)]">
              <Terminal size={22} className="text-white dark:text-indigo-400" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
              AI<span className="text-blue-600 dark:text-indigo-500 font-light">_Nexus</span>
            </h1>
          </div>

          {/* Top Level Navigation */}
          <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/5 backdrop-blur-md">
            <button 
              onClick={() => setMainView('repos')}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2 text-sm font-medium rounded-lg transition-all ${
                mainView === 'repos' ? 'bg-white dark:bg-white/10 text-blue-700 dark:text-white shadow-sm' : 'text-slate-500 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-300'
              }`}
            >
              <Code2 size={16} /> <span className="hidden sm:inline">Code & Tools</span>
            </button>
            <button 
              onClick={() => setMainView('research')}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2 text-sm font-medium rounded-lg transition-all ${
                mainView === 'research' ? 'bg-white dark:bg-white/10 text-blue-700 dark:text-white shadow-sm' : 'text-slate-500 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-300'
              }`}
            >
              <Library size={16} /> <span className="hidden sm:inline">Research</span>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex relative w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" size={16} />
              <input 
                type="text" 
                placeholder={`Search ${mainView}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full py-2 pl-10 pr-4 text-sm font-medium text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-blue-500/50 dark:focus:border-indigo-500/50 focus:ring-1 focus:ring-blue-500/50 dark:focus:ring-indigo-500/50 transition-all placeholder:text-slate-500 dark:placeholder:text-zinc-600 disabled:opacity-50"
                disabled={mainView === 'research'} 
              />
            </div>
            
            {/* Theme Toggle */}
            <button
              onClick={() => setShowKeyModal(true)}
              className="p-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full text-slate-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              title="Configure API Keys"
            >
              <Settings size={18} />
            </button>
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full text-slate-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-indigo-400 transition-colors"
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-zinc-100 mb-2 flex items-center gap-2">
              <Sparkles className="text-indigo-500" /> AI Summaries
            </h3>
            <p className="text-slate-600 dark:text-zinc-400 mb-6 text-sm leading-relaxed">
              To instantly summarize repositories, please enter a free Google Gemini API Key. You can get one instantly at <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline font-semibold">aistudio.google.com</a>.
            </p>
            <input 
              type="password" 
              placeholder="AIzaSy..."
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-sm font-medium text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 mb-6 transition-all"
            />
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowKeyModal(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={saveGeminiKey}
                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-colors"
              >
                Save & Enable
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trending Alert Banner */}
      {showAlert && trendingAlert && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 animate-in slide-in-from-top-4 duration-500">
          <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-4 flex items-start sm:items-center justify-between gap-4 relative overflow-hidden backdrop-blur-md shadow-sm dark:shadow-none">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500"></div>
            <div className="flex items-center gap-4">
              <div className="bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 p-2 rounded-xl shrink-0 shadow-sm dark:shadow-none hidden sm:block">
                <Sparkles size={18} className="text-indigo-500 dark:text-indigo-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded-md">Trending Now</span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-zinc-500 flex items-center gap-1"><Star size={10} className="text-amber-500"/> {trendingAlert.points} upvotes</span>
                </div>
                <a href={trendingAlert.url || `https://news.ycombinator.com/item?id=${trendingAlert.objectID}`} target="_blank" rel="noreferrer" className="text-sm sm:text-base font-bold text-slate-900 dark:text-zinc-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors line-clamp-1 sm:line-clamp-none">
                  {trendingAlert.title}
                </a>
              </div>
            </div>
            <button 
              onClick={() => setShowAlert(false)} 
              className="shrink-0 p-1.5 bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-white/10 border border-slate-200/50 dark:border-white/5 rounded-lg text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white transition-all shadow-sm dark:shadow-none"
              title="Dismiss Alert"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
        
        {/* ========================================= */}
        {/* VIEW 1: REPOSITORY EXPLORER               */}
        {/* ========================================= */}
        {mainView === 'repos' && (
          <div className="animate-in fade-in duration-700">
            <div className="mb-10">
              <h2 className="text-3xl font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-3 tracking-tight">
                Repository Explorer
              </h2>
              <p className="text-slate-600 dark:text-zinc-500 font-normal mt-2 text-base max-w-2xl leading-relaxed">High-signal engineering tools, foundational models, and agentic frameworks.</p>
            </div>

            {apiError && (
              <div className="mb-8 bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 p-4 rounded-2xl flex items-start gap-3 backdrop-blur-sm">
                <AlertCircle className="shrink-0 mt-0.5" size={18}/>
                <div>
                  <h4 className="font-semibold">GitHub API Rate Limit</h4>
                  <p className="text-sm opacity-80 mt-1">Please wait 60 seconds before changing filters to avoid anonymous rate limits.</p>
                </div>
              </div>
            )}

            {/* Filter Bar */}
            <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl p-4 mb-10 backdrop-blur-sm flex flex-col xl:flex-row gap-6 justify-between items-start xl:items-center shadow-sm dark:shadow-none">
              
              <div className={`flex flex-wrap gap-2 ${author !== 'all' ? 'opacity-30 pointer-events-none grayscale' : ''} transition-all`}>
                {topics.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTopic(t.id)}
                    disabled={author !== 'all'}
                    className={`px-5 py-2 text-xs font-semibold rounded-xl transition-all ${
                      topic === t.id && author === 'all'
                        ? 'bg-blue-600 dark:bg-indigo-500 text-white shadow-md dark:shadow-[0_0_15px_rgba(99,102,241,0.4)]' 
                        : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-3 w-full xl:w-auto border-t xl:border-t-0 border-slate-100 dark:border-white/5 pt-5 xl:pt-0">
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 hover:border-slate-300 dark:hover:border-white/20 transition-colors focus-within:border-blue-500/50 dark:focus-within:border-indigo-500/50">
                  <Users size={14} className="text-slate-400 dark:text-zinc-500" />
                  <select 
                    value={author} 
                    onChange={(e) => setAuthor(e.target.value)}
                    className={`bg-transparent text-xs font-medium focus:outline-none cursor-pointer w-full appearance-none pr-4 ${author !== 'all' ? 'text-blue-600 dark:text-indigo-400' : 'text-slate-600 dark:text-zinc-400'}`}
                  >
                    {authors.map(a => <option key={a.id} value={a.id} className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200">{a.name}</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-2 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 hover:border-slate-300 dark:hover:border-white/20 transition-colors focus-within:border-blue-500/50 dark:focus-within:border-indigo-500/50">
                  <Code2 size={14} className="text-slate-400 dark:text-zinc-500" />
                  <select 
                    value={language} 
                    onChange={(e) => setLanguage(e.target.value)}
                    className="bg-transparent text-xs font-medium text-slate-600 dark:text-zinc-400 focus:outline-none cursor-pointer w-full appearance-none pr-4"
                  >
                    {languages.map(l => <option key={l.id} value={l.id} className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200">{l.name}</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-2 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 hover:border-slate-300 dark:hover:border-white/20 transition-colors focus-within:border-blue-500/50 dark:focus-within:border-indigo-500/50">
                  <Calendar size={14} className="text-slate-400 dark:text-zinc-500" />
                  <select 
                    value={timeRange} 
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="bg-transparent text-xs font-medium text-slate-600 dark:text-zinc-400 focus:outline-none cursor-pointer w-full appearance-none pr-4"
                  >
                    {timeRanges.map(t => <option key={t.id} value={t.id} className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200">{t.name}</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-2 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 hover:border-slate-300 dark:hover:border-white/20 transition-colors focus-within:border-blue-500/50 dark:focus-within:border-indigo-500/50">
                  {sortBy === 'rising' ? <Sparkles size={14} className="text-amber-500 dark:text-amber-400" /> : <TrendingUp size={14} className="text-slate-400 dark:text-zinc-500" />}
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    className={`bg-transparent text-xs font-medium focus:outline-none cursor-pointer w-full appearance-none pr-4 ${sortBy === 'rising' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-zinc-400'}`}
                  >
                    {sortOptions.map(s => <option key={s.id} value={s.val} className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200">{s.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Mobile Search */}
            <div className="lg:hidden relative mb-8">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" size={16} />
              <input 
                type="text" 
                placeholder="Search AI repositories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-3 pl-11 pr-4 text-sm font-medium text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-blue-500/50 dark:focus:border-indigo-500/50 focus:ring-1 focus:ring-blue-500/50 dark:focus:ring-indigo-500/50"
              />
            </div>

            {loadingRepos ? (
              <div className="flex justify-center py-32">
                <div className="w-8 h-8 border-2 border-slate-200 dark:border-white/10 border-t-blue-600 dark:border-t-indigo-500 rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {repos.length > 0 ? repos.map((repo) => (
                  <div key={repo.id} 
                    onClick={() => window.open(repo.html_url, '_blank')}
                    className={`cursor-pointer group bg-white dark:bg-[#121212] border ${sortBy === 'rising' ? 'border-amber-300 dark:border-amber-500/30 hover:border-amber-500 dark:hover:border-amber-500/60 shadow-md dark:shadow-[0_0_15px_rgba(245,158,11,0.05)]' : 'border-slate-200 dark:border-white/5 hover:border-blue-300 dark:hover:border-white/20 shadow-sm hover:shadow-md'} rounded-3xl p-7 transition-all duration-300 flex flex-col h-full relative`}>
                    
                    {sortBy === 'rising' && (
                      <div className="absolute top-0 right-0 bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-500 text-[9px] font-bold px-3 py-1.5 rounded-bl-2xl border-b border-l border-amber-200 dark:border-amber-500/20 uppercase tracking-widest backdrop-blur-md z-10">
                        Hidden Gem
                      </div>
                    )}

                    <div className={`flex items-start justify-between mb-5 ${sortBy === 'rising' ? 'mt-2' : ''}`}>
                      <div className="flex items-center gap-4 overflow-hidden">
                        {author !== 'all' ? (
                           <img src={repo.owner.avatar_url} alt={repo.owner.login} className="w-12 h-12 rounded-2xl border border-slate-200 dark:border-white/10 object-cover shrink-0" />
                        ) : (
                          <div className={`w-12 h-12 flex items-center justify-center rounded-2xl border transition-colors ${sortBy === 'rising' ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-500' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-zinc-400 group-hover:bg-blue-50 dark:group-hover:bg-indigo-500/10 group-hover:border-blue-200 dark:group-hover:border-indigo-500/20 group-hover:text-blue-600 dark:group-hover:text-indigo-400'}`}>
                            <BookOpen size={20} className="shrink-0" />
                          </div>
                        )}
                        <h3 className={`text-lg font-semibold truncate transition-colors tracking-tight ${sortBy === 'rising' ? 'text-slate-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400' : 'text-slate-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-indigo-400'}`} title={repo.full_name}>
                          {author !== 'all' ? repo.name : repo.full_name.split('/')[1]}
                        </h3>
                      </div>
                      
                      <div className="flex items-center gap-2 z-20">
                        <button 
                          onClick={(e) => handleAISummary(e, repo)}
                          className="shrink-0 px-3 py-2.5 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/20 rounded-xl text-indigo-600 dark:text-indigo-400 transition-all backdrop-blur-sm flex items-center gap-1.5 text-xs font-bold"
                          title="Generate AI Summary"
                        >
                          <Sparkles size={14} /> <span className="hidden sm:inline">AI Summary</span>
                        </button>
                        <button 
                          onClick={(e) => handleCopyClone(e, repo)}
                          className="shrink-0 p-2.5 bg-slate-50 dark:bg-black/20 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20 rounded-xl text-slate-400 dark:text-zinc-500 hover:text-blue-600 dark:hover:text-white transition-all backdrop-blur-sm"
                          title="Copy Git Clone Command"
                        >
                          {copiedId === repo.id ? <Check size={16} className="text-emerald-500 dark:text-emerald-400" /> : <Copy size={16} />}
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-slate-600 dark:text-zinc-400 text-sm line-clamp-3 mb-6 flex-grow font-normal leading-relaxed">{repo.description || "No description provided."}</p>
                    
                    {summarizing === repo.id ? (
                      <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl p-5 mb-6">
                        <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
                          <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                          Analyzing Architecture & Features...
                        </div>
                      </div>
                    ) : summaries[repo.id] ? (
                      <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl p-6 mb-6 text-sm text-slate-700 dark:text-zinc-300 font-medium leading-relaxed relative" onClick={(e) => e.stopPropagation()}>
                        <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-4 border-b border-indigo-100 dark:border-indigo-500/20 pb-3">
                          <Sparkles size={14} /> AI Architectural Breakdown
                        </span>
                        <div className="space-y-4 whitespace-pre-wrap">
                          {summaries[repo.id].split('\n\n').map((paragraph, i) => {
                            if (paragraph.startsWith('TLDR:')) {
                              return <p key={i}><strong>{paragraph.replace('TLDR:', 'TLDR:')}</strong></p>;
                            } else if (paragraph.startsWith('HOW IT WORKS:')) {
                              return <p key={i}><strong>{paragraph.replace('HOW IT WORKS:', 'HOW IT WORKS:')}</strong></p>;
                            } else if (paragraph.startsWith('KEY FEATURES:')) {
                              return <p key={i}><strong>{paragraph.replace('KEY FEATURES:', 'KEY FEATURES:')}</strong></p>;
                            } else if (paragraph.startsWith('WHY IT MATTERS:')) {
                              return <p key={i}><strong>{paragraph.replace('WHY IT MATTERS:', 'WHY IT MATTERS:')}</strong></p>;
                            } else {
                              return <p key={i}>{paragraph}</p>;
                            }
                          })}
                        </div>
                      </div>
                    ) : null}
                    
                    <div className="flex flex-wrap gap-2 mb-6">
                      {repo.language && (
                         <span className="px-3 py-1 border border-blue-200 dark:border-indigo-500/20 bg-blue-50 dark:bg-indigo-500/10 text-blue-700 dark:text-indigo-300 rounded-lg text-[10px] font-semibold uppercase tracking-wider">
                           {repo.language}
                         </span>
                      )}
                      {repo.topics && repo.topics.slice(0, 3).map(topic => (
                        <span key={topic} className={`px-3 py-1 border rounded-lg text-[10px] font-semibold uppercase tracking-wider ${sortBy === 'rising' ? 'bg-amber-100 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-zinc-500'}`}>
                          {topic}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-zinc-500 border-t border-slate-100 dark:border-white/5 pt-5 mt-auto">
                      <div className="flex items-center gap-5">
                        <span className="flex items-center gap-1.5 text-slate-700 dark:text-zinc-300">
                          <Star size={14} className="text-slate-400 dark:text-zinc-500" /> 
                          {repo.stargazers_count > 999 ? (repo.stargazers_count/1000).toFixed(1)+'k' : repo.stargazers_count}
                        </span>
                        <span className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400">
                          <GitFork size={14} /> {repo.forks_count}
                        </span>
                      </div>
                      <span className="flex items-center gap-1.5 opacity-80 dark:opacity-60">
                        {formatDistanceToNow(new Date(repo.updated_at))} ago
                      </span>
                    </div>
                  </div>
                )) : (
                  !apiError && (
                    <div className="col-span-full text-center py-32">
                      <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/5 rounded-3xl p-12 inline-flex flex-col items-center shadow-sm dark:shadow-none">
                        <Search size={32} className="text-slate-400 dark:text-zinc-600 mb-6" />
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-zinc-200 mb-2 tracking-tight">No Repositories Found</h3>
                        <p className="text-slate-500 dark:text-zinc-500 text-sm">Try adjusting your filters or search criteria.</p>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================= */}
        {/* VIEW 2: RESEARCH & PAPERS                 */}
        {/* ========================================= */}
        {mainView === 'research' && (
          <div className="animate-in fade-in duration-700">
            <div className="mb-10">
              <h2 className="text-3xl font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-3 tracking-tight">
                Research & News
              </h2>
              <p className="text-slate-600 dark:text-zinc-500 font-normal mt-2 text-base max-w-2xl leading-relaxed">Daily curated papers from Hugging Face and high-signal engineering discussions.</p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-white/5 mb-10 gap-6">
              <div className="flex gap-2 flex-wrap">
                <button 
                  onClick={() => setResearchTab('papers')}
                  className={`pb-4 px-4 text-xs font-semibold tracking-wider uppercase transition-all border-b-2 flex items-center gap-2 ${
                    researchTab === 'papers' ? 'border-blue-600 dark:border-indigo-500 text-blue-700 dark:text-zinc-100' : 'border-transparent text-slate-500 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-300'
                  }`}
                >
                  <FileText size={16} /> Daily Papers
                </button>
                <button 
                  onClick={() => setResearchTab('news')}
                  className={`pb-4 px-4 text-xs font-semibold tracking-wider uppercase transition-all border-b-2 flex items-center gap-2 ${
                    researchTab === 'news' ? 'border-blue-600 dark:border-indigo-500 text-blue-700 dark:text-zinc-100' : 'border-transparent text-slate-500 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-300'
                  }`}
                >
                  <Newspaper size={16} /> Tech Discussions
                </button>
                <button 
                  onClick={() => setResearchTab('live')}
                  className={`pb-4 px-4 text-xs font-semibold tracking-wider uppercase transition-all border-b-2 flex items-center gap-2 ${
                    researchTab === 'live' ? 'border-blue-600 dark:border-indigo-500 text-blue-700 dark:text-zinc-100' : 'border-transparent text-slate-500 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-300'
                  }`}
                >
                  <Activity size={16} className={researchTab === 'live' ? 'animate-pulse text-red-500' : ''} /> Live Feed
                </button>
                <button 
                  onClick={() => setResearchTab('agent')}
                  className={`pb-4 px-4 text-xs font-semibold tracking-wider uppercase transition-all border-b-2 flex items-center gap-2 ${
                    researchTab === 'agent' ? 'border-blue-600 dark:border-indigo-500 text-blue-700 dark:text-zinc-100' : 'border-transparent text-slate-500 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-300'
                  }`}
                >
                  <Sparkles size={16} className={researchTab === 'agent' ? 'text-amber-500 animate-pulse' : ''} /> Agent News
                </button>
              </div>
              
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 mb-4 sm:mb-2 focus-within:border-blue-500/50 dark:focus-within:border-indigo-500/50 transition-colors">
                <TrendingUp size={14} className="text-slate-400 dark:text-zinc-500" />
                <select 
                  value={researchSortBy} 
                  onChange={(e) => setResearchSortBy(e.target.value)}
                  className="bg-transparent text-xs font-medium text-slate-700 dark:text-zinc-300 focus:outline-none cursor-pointer w-full appearance-none pr-4"
                >
                  {researchSortOptions.map(s => <option key={s.id} value={s.val} className="bg-white dark:bg-zinc-900">{s.name}</option>)}
                </select>
              </div>
            </div>

            {loadingResearch ? (
              <div className="flex justify-center py-32">
                <div className="w-8 h-8 border-2 border-slate-200 dark:border-white/10 border-t-blue-600 dark:border-t-indigo-500 rounded-full animate-spin"></div>
              </div>
            ) : (
              <>
                {/* PAPERS */}
                {researchTab === 'papers' && (
                  <div className="space-y-4 max-w-4xl mx-auto">
                    {papers.map((paper, idx) => (
                      <div key={idx} className="group bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/5 rounded-3xl p-8 shadow-sm dark:shadow-none hover:border-blue-300 dark:hover:border-white/10 transition-all flex flex-col gap-5 relative overflow-hidden">
                        
                        <div className="flex items-start justify-between gap-6">
                          <h3 className="text-xl font-semibold text-slate-900 dark:text-zinc-100 leading-snug tracking-tight">
                            {paper.title}
                          </h3>
                          <span className="flex items-center gap-1.5 bg-amber-50 dark:bg-white/5 border border-amber-200 dark:border-white/10 text-amber-700 dark:text-zinc-300 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0">
                            <Star size={12} className="text-amber-500 dark:text-amber-400" /> {paper.upvotes}
                          </span>
                        </div>
                        
                        <p className="text-xs font-medium text-slate-500 dark:text-zinc-500 tracking-wide">
                          <span className="text-slate-700 dark:text-zinc-400">{paper.authors}</span>
                        </p>
                        
                        <p className="text-slate-600 dark:text-zinc-400 text-sm leading-relaxed line-clamp-3">
                          {paper.summary}
                        </p>
                        
                        <div className="flex items-center gap-4 mt-2 pt-5 border-t border-slate-100 dark:border-white/5">
                          <a href={paper.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-black px-5 py-2.5 rounded-xl hover:bg-slate-700 dark:hover:bg-zinc-200 transition-colors shadow-sm">
                            <FileText size={14} /> Hugging Face
                          </a>
                          <a href={paper.arxivUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs font-semibold bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-white/10 px-5 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                            ArXiv PDF
                          </a>
                          <span className="ml-auto text-xs font-medium text-slate-500 dark:text-zinc-600 flex items-center gap-1.5 opacity-90 dark:opacity-80">
                            <Clock size={12} /> {formatDistanceToNow(new Date(paper.date))} ago
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* NEWS */}
                {researchTab === 'news' && (
                  <div className="space-y-4 max-w-4xl mx-auto">
                    {news.map((item, idx) => (
                      <a key={idx} href={item.url} target="_blank" rel="noreferrer" className="group block bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/5 rounded-3xl p-7 shadow-sm dark:shadow-none hover:border-blue-300 dark:hover:border-white/10 transition-all relative overflow-hidden">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-zinc-400 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                            <Globe size={10} /> {item.domain}
                          </span>
                          <span className="text-xs font-medium text-slate-500 dark:text-zinc-600 flex items-center gap-1.5">
                            <Clock size={12} /> {formatDistanceToNow(new Date(item.date))} ago
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-indigo-400 transition-colors mb-5 leading-snug tracking-tight pr-8">
                          {item.title}
                          <ExternalLink size={16} className="absolute right-7 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </h3>
                        <div className="flex items-center gap-6 text-xs font-medium text-slate-600 dark:text-zinc-500 border-t border-slate-100 dark:border-white/5 pt-4">
                          <span className="flex items-center gap-2"><Star size={14} className="text-amber-500/80" /> {item.points} Points</span>
                          <span className="flex items-center gap-2"><Users size={14} className="text-slate-500 dark:text-zinc-400" /> {item.comments} Comments</span>
                        </div>
                      </a>
                    ))}
                  </div>
                )}

                {/* LIVE FEED */}
                {researchTab === 'live' && (
                  <div className="space-y-4 max-w-4xl mx-auto">
                    {liveNews.map((item, idx) => (
                      <a key={idx} href={item.url} target="_blank" rel="noreferrer" className="group block bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/5 rounded-3xl p-7 shadow-sm dark:shadow-none hover:border-blue-300 dark:hover:border-white/10 transition-all relative overflow-hidden">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                            <Activity size={10} className="animate-pulse" /> Just In
                          </span>
                          <span className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-zinc-400 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                            <Globe size={10} /> {item.domain}
                          </span>
                          <span className="text-xs font-medium text-slate-500 dark:text-zinc-600 flex items-center gap-1.5">
                            <Clock size={12} /> {formatDistanceToNow(new Date(item.date))} ago
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-indigo-400 transition-colors mb-5 leading-snug tracking-tight pr-8">
                          {item.title}
                          <ExternalLink size={16} className="absolute right-7 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </h3>
                      </a>
                    ))}
                  </div>
                )}

                {/* AGENT NEWS */}
                {researchTab === 'agent' && (
                  <div className="space-y-4 max-w-4xl mx-auto">
                    
                    <div className="flex justify-between items-center bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/30 p-4 rounded-2xl mb-6">
                      <div className="flex items-center gap-3">
                        <div className="bg-amber-100 dark:bg-amber-800/30 p-2 rounded-xl text-amber-600 dark:text-amber-400">
                          <Sparkles size={20} className={isAgentRunning ? "animate-spin" : ""} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800 dark:text-zinc-200 text-sm">Automated Browser Automation</h4>
                          <p className="text-xs text-slate-500 dark:text-zinc-400">Uses local Playwright to visibly scrape the web for you (No API Key needed).</p>
                        </div>
                      </div>
                      <button 
                        onClick={triggerAgent}
                        disabled={isAgentRunning}
                        className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-semibold tracking-wide transition-all shadow-sm flex items-center gap-2"
                      >
                        {isAgentRunning ? 'Browsing the web...' : 'Run Browser Agent'}
                      </button>
                    </div>

                    {isAgentRunning && agentNews.length === 0 ? (
                      <div className="text-center text-amber-600/70 dark:text-amber-400/70 py-10 border border-dashed border-amber-200 dark:border-amber-900/30 rounded-2xl animate-pulse">
                         <Globe size={32} className="mx-auto mb-4 animate-spin opacity-50" />
                         <p className="font-medium">Opening browser and searching for news...</p>
                         <p className="text-sm mt-1">This takes about 30-60 seconds.</p>
                      </div>
                    ) : agentNews.length === 0 ? (
                       <div className="text-center text-slate-500 dark:text-zinc-500 py-10 border border-dashed border-slate-300 dark:border-white/10 rounded-2xl">
                         <Sparkles size={32} className="mx-auto mb-4 text-amber-500/50" />
                         <p className="font-medium text-slate-700 dark:text-zinc-300">No daily agent news yet.</p>
                         <p className="text-sm mt-1">Click the button above to launch the browser agent!</p>
                       </div>
                    ) : agentNews.map((item, idx) => (
                      <a key={idx} href={item.link} target="_blank" rel="noreferrer" className="group block bg-amber-50/30 dark:bg-[#151310] border border-amber-200/50 dark:border-amber-900/30 rounded-3xl p-7 shadow-sm dark:shadow-none hover:border-amber-400 dark:hover:border-amber-700/50 transition-all relative overflow-hidden">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="bg-amber-100/50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                            <Sparkles size={10} className="animate-pulse" /> Daily AI Pick
                          </span>
                          <span className="bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-zinc-400 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                            <Globe size={10} /> {item.source}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors mb-3 leading-snug tracking-tight pr-8">
                          {item.title}
                          <ExternalLink size={16} className="absolute right-7 top-1/2 -translate-y-1/2 text-amber-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                          {item.summary}
                        </p>
                      </a>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

      </main>
    </div>
  );
}

export default App;
