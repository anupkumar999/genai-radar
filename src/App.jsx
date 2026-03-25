import { useState, useEffect, useMemo } from 'react';
import { Terminal, Star, GitFork, Clock, BookOpen, Newspaper, ExternalLink, Code2, Search, Settings, Activity,  Globe, Key, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

function App() {
  const [activeTab, setActiveTab] = useState('alpha'); 
  const [searchQuery, setSearchQuery] = useState('');
  
  // States
  const [repos, setRepos] = useState([]);
  const [alphaEvents, setAlphaEvents] = useState([]);
  const [radarNews, setRadarNews] = useState([]);
  
  const [loading, setLoading] = useState(true);
  
  // Settings
  const [tavilyKey, setTavilyKey] = useState(localStorage.getItem('tavily_api_key') || '');
  const [showSettings, setShowSettings] = useState(false);

  // Top AI Builders to track
  const builders = ['karpathy', 'hwchase17', 'jph00', 'rasbt', 'chiphuyen', 'eugeneyan', 'ggerganov'];

  // 1. Fetch Alpha Activity (GitHub Events of Top Builders)
  useEffect(() => {
    const fetchAlphaActivity = async () => {
      if (activeTab !== 'alpha') return;
      setLoading(true);
      try {
        let allEvents = [];
        // Fetch public events for the elite builders
        for (const user of builders) {
          const res = await fetch(`https://api.github.com/users/${user}/events/public?per_page=5`);
          if (res.ok) {
            const data = await res.json();
            // Attach user avatar and filter for interesting events
            const interesting = data
              .filter(e => ['WatchEvent', 'ForkEvent', 'CreateEvent', 'PublicEvent'].includes(e.type))
              .map(e => ({ ...e, builder: user }));
            allEvents.push(...interesting);
          }
        }
        // Sort by newest
        allEvents.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setAlphaEvents(allEvents.slice(0, 30));
      } catch (error) {
        console.error("Alpha fetch failed", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAlphaActivity();
  }, [activeTab]);

  // 2. Fetch Trending AI Repos
  useEffect(() => {
    const fetchRepos = async () => {
      if (activeTab !== 'repos') return;
      setLoading(true);
      try {
        const res = await fetch(`https://api.github.com/search/repositories?q=topic:llm+OR+topic:agents+OR+topic:rag+stars:>100&sort=updated&order=desc&per_page=30`);
        const data = await res.json();
        setRepos(data.items || []);
      } catch (error) {
        console.error("Repo fetch failed", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRepos();
  }, [activeTab]);

  // 3. The "Web Radar" with Fallback Chain (Tavily -> HackerNews)
  useEffect(() => {
    const fetchWebRadar = async () => {
      if (activeTab !== 'radar') return;
      setLoading(true);
      
      const query = '"OpenAI" OR "Anthropic" OR "LLM" OR "RAG" OR "AI Agents"';

      try {
        // Attempt 1: Tavily API (If key exists)
        if (tavilyKey) {
          const tavilyRes = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              api_key: tavilyKey,
              query: "Latest news and breakthroughs in LLMs, AI Agents, and RAG today",
              search_depth: "basic",
              include_images: false,
              days: 2
            })
          });

          if (tavilyRes.ok) {
            const tavilyData = await tavilyRes.json();
            const mappedNews = tavilyData.results.map((r, i) => ({
              id: i, title: r.title, url: r.url, source: 'Tavily Search', content: r.content, date: new Date(), icon: <Globe size={16} className="text-blue-500" />
            }));
            setRadarNews(mappedNews);
            setLoading(false);
            return; // Success! Exit.
          }
        }

        // Fallback: Hacker News Algolia (100% Free, No Key required)
        console.log("Falling back to Hacker News API...");
        const hnRes = await fetch(`https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=20`);
        const hnData = await hnRes.json();
        const mappedHN = hnData.hits.map(item => ({
          id: item.objectID,
          title: item.title,
          url: item.url || `https://news.ycombinator.com/item?id=${item.objectID}`,
          source: 'Hacker News (Fallback)',
          content: `Upvotes: ${item.points} | Comments: ${item.num_comments}`,
          date: item.created_at,
          icon: <Newspaper size={16} className="text-orange-500" />
        }));
        setRadarNews(mappedHN);

      } catch (error) {
        console.error("Web Radar failed", error);
      } finally {
        setLoading(false);
      }
    };
    fetchWebRadar();
  }, [activeTab, tavilyKey]);

  // Save Settings
  const saveKey = (e) => {
    const val = e.target.value;
    setTavilyKey(val);
    localStorage.setItem('tavily_api_key', val);
  };

  // Helper for GitHub Event formatting
  const renderEventAction = (type) => {
    switch(type) {
      case 'WatchEvent': return <span className="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded text-xs">Starred</span>;
      case 'ForkEvent': return <span className="text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded text-xs">Forked</span>;
      case 'CreateEvent': return <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded text-xs">Created</span>;
      case 'PublicEvent': return <span className="text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded text-xs">Made Public</span>;
      default: return <span className="text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded text-xs">Interacted with</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-blue-100 selection:text-blue-900 pb-20">
      
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-[72px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl shadow-[0_4px_12px_rgba(37,99,235,0.3)]">
              <Terminal size={22} className="text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              GenAI<span className="text-blue-600">_Radar</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => setShowSettings(!showSettings)} className="p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors">
              <Settings size={18} />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex gap-8 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('alpha')}
            className={`pb-4 text-sm font-bold tracking-wide uppercase transition-all border-b-[3px] flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'alpha' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity size={18} /> Alpha Activity
          </button>
          <button 
            onClick={() => setActiveTab('repos')}
            className={`pb-4 text-sm font-bold tracking-wide uppercase transition-all border-b-[3px] flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'repos' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code2 size={18} /> Trending Repos
          </button>
          <button 
            onClick={() => setActiveTab('radar')}
            className={`pb-4 text-sm font-bold tracking-wide uppercase transition-all border-b-[3px] flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'radar' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Globe size={18} /> Web Radar (Search)
          </button>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-6">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 flex items-center gap-2"><Key size={16} className="text-amber-500"/> API Configurations</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-xl">Radar uses free open APIs (HackerNews, GitHub) by default. Add a free Tavily Search API key to unlock AI-optimized deep web searches.</p>
            </div>
            <div className="w-full md:w-auto flex-1 max-w-sm">
              <input 
                type="password" 
                placeholder="tvly-xxxxxxxxxxxxxxxxxxxx"
                value={tavilyKey}
                onChange={saveKey}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8">
        
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            
            {/* TAB 1: ALPHA ACTIVITY */}
            {activeTab === 'alpha' && (
              <div className="space-y-6">
                <div className="mb-8">
                  <h2 className="text-2xl font-extrabold text-slate-900">Elite Builder Activity</h2>
                  <p className="text-slate-500 font-medium mt-1">Live GitHub actions from Karpathy, Harrison Chase, Chip Huyen, and top engineers.</p>
                </div>
                
                <div className="space-y-4">
                  {alphaEvents.map((ev, idx) => (
                    <a key={idx} href={`https://github.com/${ev.repo.name}`} target="_blank" rel="noreferrer"
                      className="group flex items-start gap-4 bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-400 hover:shadow-md transition-all">
                      <img src={ev.actor.avatar_url} alt={ev.actor.login} className="w-10 h-10 rounded-full border border-slate-200" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-800 mb-1">
                          <span className="font-bold">{ev.actor.login}</span> {renderEventAction(ev.type)} 
                        </p>
                        <h3 className="text-lg font-bold text-blue-600 truncate group-hover:underline">
                          {ev.repo.name}
                        </h3>
                        <p className="text-xs text-slate-400 mt-2 font-medium flex items-center gap-1">
                          <Clock size={12}/> {formatDistanceToNow(new Date(ev.created_at))} ago
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: TRENDING REPOS */}
            {activeTab === 'repos' && (
              <div className="space-y-6">
                <div className="mb-8">
                  <h2 className="text-2xl font-extrabold text-slate-900">Trending Tools</h2>
                  <p className="text-slate-500 font-medium mt-1">The hottest open-source LLM, RAG, and Agent repositories today.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {repos.map((repo) => (
                    <a key={repo.id} href={repo.html_url} target="_blank" rel="noreferrer" 
                      className="group bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-400 transition-all flex flex-col h-full relative overflow-hidden shadow-sm hover:shadow-md">
                      <div className="flex items-center gap-2 mb-3">
                        <BookOpen size={18} className="text-blue-500 shrink-0" />
                        <h3 className="text-lg font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">{repo.name}</h3>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2 mb-4 flex-grow">{repo.description}</p>
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 border-t border-slate-100 pt-3">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1 text-slate-700"><Star size={14} className="text-amber-500 fill-amber-500" /> {repo.stargazers_count > 999 ? (repo.stargazers_count/1000).toFixed(1)+'k' : repo.stargazers_count}</span>
                          <span className="flex items-center gap-1"><GitFork size={14} /> {repo.forks_count}</span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: WEB RADAR (News & Search) */}
            {activeTab === 'radar' && (
              <div className="space-y-6">
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-900">AI Web Radar</h2>
                    <p className="text-slate-500 font-medium mt-1 flex items-center gap-2">
                      {tavilyKey ? <span className="text-emerald-500 flex items-center gap-1"><Globe size={14}/> Tavily Search Active</span> : <span className="text-orange-500 flex items-center gap-1"><AlertCircle size={14}/> Hacker News Fallback Active</span>}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {radarNews.map((item, idx) => (
                    <a key={idx} href={item.url} target="_blank" rel="noreferrer"
                      className="group block bg-white border border-slate-200 hover:border-blue-400 rounded-2xl p-6 transition-all hover:shadow-md shadow-sm"
                    >
                      <div className="flex items-start gap-4">
                        <div className="mt-1 bg-slate-50 p-2 rounded-lg border border-slate-200 group-hover:bg-blue-50 group-hover:border-blue-200 transition-colors">
                          {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors flex items-center gap-2">
                            <span className="truncate">{item.title}</span>
                            <ExternalLink size={14} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </h3>
                          <p className="text-sm text-slate-600 mb-3 line-clamp-2">{item.content}</p>
                          <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            <span className={item.source.includes('Hacker News') ? 'text-orange-600' : 'text-blue-600'}>
                              {item.source}
                            </span>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(item.date))} ago</span>
                          </div>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  );
}

export default App;
