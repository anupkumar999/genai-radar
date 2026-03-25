import { useState, useEffect } from 'react';
import { Terminal, Star, GitFork, Clock, BookOpen, Newspaper, TrendingUp, ExternalLink, MessageSquare, Code2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

function App() {
  const [activeTab, setActiveTab] = useState('repos'); // 'repos' or 'news'
  
  // Repo State
  const [repos, setRepos] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [filter, setFilter] = useState('llm'); 
  
  // News State
  const [news, setNews] = useState([]);
  const [loadingNews, setLoadingNews] = useState(true);

  // Fetch Repos
  useEffect(() => {
    const fetchRepos = async () => {
      setLoadingRepos(true);
      try {
        const query = `topic:${filter} stars:>100`;
        const response = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=updated&order=desc&per_page=30`);
        const data = await response.json();
        setRepos(data.items || []);
      } catch (error) {
        console.error("Failed to fetch repos", error);
      } finally {
        setLoadingRepos(false);
      }
    };
    if (activeTab === 'repos') fetchRepos();
  }, [filter, activeTab]);

  // Fetch News
  useEffect(() => {
    const fetchNewsFeed = async () => {
      if (news.length > 0) return; // Don't refetch if we already have it
      setLoadingNews(true);
      try {
        // 1. Hacker News (Top AI/LLM News & Google Updates)
        const hnRes = await fetch('https://hn.algolia.com/api/v1/search?query="LLM" OR "Generative AI" OR "OpenAI" OR "Google AI"&tags=story&hitsPerPage=15');
        const hnData = await hnRes.json();
        const hnItems = hnData.hits.map(item => ({
          id: item.objectID,
          title: item.title,
          url: item.url || `https://news.ycombinator.com/item?id=${item.objectID}`,
          source: 'Hacker News',
          points: item.points,
          date: item.created_at,
          icon: <TrendingUp size={16} className="text-orange-500" />
        }));

        // 2. Dev.to (Trending AI Engineering posts)
        const devRes = await fetch('https://dev.to/api/articles?tag=ai&top=1&per_page=10');
        const devData = await devRes.json();
        const devItems = devData.map(item => ({
          id: item.id.toString(),
          title: item.title,
          url: item.url,
          source: 'DEV Community',
          points: item.public_reactions_count,
          date: item.published_at,
          icon: <MessageSquare size={16} className="text-zinc-300" />
        }));

        // Combine and sort by newest
        const combined = [...hnItems, ...devItems].sort((a, b) => new Date(b.date) - new Date(a.date));
        setNews(combined);
      } catch (error) {
        console.error("Failed to fetch news", error);
      } finally {
        setLoadingNews(false);
      }
    };
    if (activeTab === 'news') fetchNewsFeed();
  }, [activeTab, news.length]);

  const categories = [
    { id: 'llm', name: 'LLM & Foundation Models' },
    { id: 'rag', name: 'RAG & Vector DBs' },
    { id: 'ai-agents', name: 'Agentic Frameworks' },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-mono selection:bg-indigo-500/30">
      
      {/* Header & Navigation */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-500/20 p-2 rounded-xl border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                <Terminal size={22} className="text-indigo-400" />
              </div>
              <h1 className="text-2xl font-black text-white tracking-tighter">GenAI<span className="text-indigo-500">_Radar</span></h1>
            </div>
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest hidden sm:block px-3 py-1 bg-zinc-900 rounded-full border border-zinc-800">
              Live Engineer Feed
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-6 -mb-[1px]">
            <button 
              onClick={() => setActiveTab('repos')}
              className={`pb-3 text-sm font-bold tracking-wide uppercase transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === 'repos' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Code2 size={16} /> Code & Repos
            </button>
            <button 
              onClick={() => setActiveTab('news')}
              className={`pb-3 text-sm font-bold tracking-wide uppercase transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === 'news' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Newspaper size={16} /> News & Social Trends
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        
        {/* TAB 1: GITHUB REPOS */}
        {activeTab === 'repos' && (
          <div className="animate-in fade-in duration-500">
            <div className="flex flex-wrap gap-2 mb-8 bg-zinc-900/50 p-2 rounded-xl border border-zinc-800/50 w-fit">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setFilter(cat.id)}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                    filter === cat.id
                      ? 'bg-indigo-500/20 text-indigo-300 shadow-sm'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {loadingRepos ? (
              <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {repos.map((repo) => (
                  <a key={repo.id} href={repo.html_url} target="_blank" rel="noreferrer" 
                    className="group bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-indigo-500/50 hover:bg-zinc-800/80 transition-all flex flex-col h-full relative overflow-hidden shadow-lg">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <BookOpen size={18} className="text-indigo-400 shrink-0" />
                        <h3 className="text-lg font-bold text-zinc-100 truncate">{repo.name}</h3>
                      </div>
                    </div>
                    <p className="text-sm text-zinc-400 line-clamp-3 mb-6 flex-grow">{repo.description}</p>
                    <div className="flex items-center justify-between text-xs text-zinc-500 border-t border-zinc-800/50 pt-4">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1 font-medium text-amber-400/80"><Star size={14} /> {repo.stargazers_count}</span>
                        <span className="flex items-center gap-1"><GitFork size={14} /> {repo.forks_count}</span>
                      </div>
                      <span className="flex items-center gap-1"><Clock size={14} /> {formatDistanceToNow(new Date(repo.updated_at))} ago</span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: NEWS & TRENDS */}
        {activeTab === 'news' && (
          <div className="animate-in fade-in duration-500 max-w-4xl">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              Trending Discussions <span className="text-sm font-normal text-zinc-500 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">Auto-updates daily</span>
            </h2>
            
            {loadingNews ? (
              <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div></div>
            ) : (
              <div className="space-y-4">
                {news.map((item, idx) => (
                  <a key={idx} href={item.url} target="_blank" rel="noreferrer"
                    className="group block bg-zinc-900/50 border border-zinc-800/50 hover:border-indigo-500/30 rounded-2xl p-5 transition-all hover:bg-zinc-800/50"
                  >
                    <div className="flex items-start gap-4">
                      <div className="mt-1 bg-zinc-950 p-2 rounded-lg border border-zinc-800 group-hover:border-indigo-500/30 transition-colors">
                        {item.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-zinc-100 mb-2 group-hover:text-indigo-300 transition-colors flex items-center gap-2">
                          {item.title}
                          <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </h3>
                        <div className="flex items-center gap-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                          <span className={item.source === 'Hacker News' ? 'text-orange-500/80' : 'text-blue-400/80'}>
                            {item.source}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Star size={12} /> {item.points} interactions
                          </span>
                          <span>•</span>
                          <span>{formatDistanceToNow(new Date(item.date))} ago</span>
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}

export default App;
