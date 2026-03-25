import { useState, useEffect, useMemo } from 'react';
import { Terminal, Star, GitFork, Clock, BookOpen, Newspaper, ExternalLink, Code2, Search, Settings, Activity, Users, Beaker, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

function App() {
  const [activeTab, setActiveTab] = useState('alpha'); 
  const [searchQuery, setSearchQuery] = useState('');
  
  // States
  const [alphaEvents, setAlphaEvents] = useState([]);
  const [namedropNews, setNamedropNews] = useState([]);
  const [labNews, setLabNews] = useState([]);
  const [repos, setRepos] = useState([]);
  
  const [loading, setLoading] = useState(true);

  // Elite Builders (Idea 1)
  const builders = ['karpathy', 'hwchase17', 'jph00', 'rasbt', 'chiphuyen', 'simonw', 'ggerganov', 'eugeneyan'];

  // 1. Fetch Alpha Activity (GitHub Events of Top Builders)
  useEffect(() => {
    const fetchAlphaActivity = async () => {
      if (activeTab !== 'alpha') return;
      if (alphaEvents.length > 0) return; // Prevent over-fetching
      setLoading(true);
      try {
        let allEvents = [];
        for (const user of builders) {
          const res = await fetch(`https://api.github.com/users/${user}/events/public?per_page=5`);
          if (res.ok) {
            const data = await res.json();
            const interesting = data
              .filter(e => ['WatchEvent', 'ForkEvent', 'CreateEvent', 'PublicEvent'].includes(e.type))
              .map(e => ({ ...e, builder: user }));
            allEvents.push(...interesting);
          }
        }
        allEvents.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setAlphaEvents(allEvents.slice(0, 40));
      } catch (error) {
        console.error("Alpha fetch failed", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAlphaActivity();
  }, [activeTab, alphaEvents.length]);

  // 2. The "Name-Drop" News Filter (Idea 2)
  useEffect(() => {
    const fetchNameDrops = async () => {
      if (activeTab !== 'namedrop') return;
      if (namedropNews.length > 0) return;
      setLoading(true);
      try {
        // Search HN strictly for the top AI thought leaders
        const query = '"Karpathy" OR "Sutskever" OR "Hassabis" OR "LeCun" OR "Harrison Chase" OR "Chip Huyen" OR "Jeremy Howard" OR "Aravind Srinivas" OR "Dario Amodei"';
        const res = await fetch(`https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=30`);
        const data = await res.json();
        
        const mapped = data.hits.map(item => ({
          id: item.objectID,
          title: item.title,
          url: item.url || `https://news.ycombinator.com/item?id=${item.objectID}`,
          points: item.points,
          comments: item.num_comments,
          date: item.created_at,
          source: 'Hacker News (Name-Drop)'
        }));
        setNamedropNews(mapped);
      } catch (error) {
        console.error("Name-drop fetch failed", error);
      } finally {
        setLoading(false);
      }
    };
    fetchNameDrops();
  }, [activeTab, namedropNews.length]);

  // 3. The "Research Lab" Feed (Idea 3)
  useEffect(() => {
    const fetchLabs = async () => {
      if (activeTab !== 'labs') return;
      if (labNews.length > 0) return;
      setLoading(true);
      try {
        // Search HN for official lab names, but filtering for highly upvoted stories (to catch real announcements, not just passing mentions)
        const query = '"OpenAI" OR "Anthropic" OR "DeepMind" OR "Meta AI" OR "Hugging Face" OR "xAI"';
        const res = await fetch(`https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&numericFilters=points>50&hitsPerPage=30`);
        const data = await res.json();
        
        const mapped = data.hits.map(item => ({
          id: item.objectID,
          title: item.title,
          url: item.url || `https://news.ycombinator.com/item?id=${item.objectID}`,
          points: item.points,
          comments: item.num_comments,
          date: item.created_at,
          source: 'Hacker News (Labs)'
        }));
        setLabNews(mapped);
      } catch (error) {
        console.error("Lab fetch failed", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLabs();
  }, [activeTab, labNews.length]);

  // 4. Trending AI Repos
  useEffect(() => {
    const fetchRepos = async () => {
      if (activeTab !== 'repos') return;
      if (repos.length > 0) return;
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
  }, [activeTab, repos.length]);


  // Helpers
  const renderEventAction = (type) => {
    switch(type) {
      case 'WatchEvent': return <span className="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider border border-amber-200">Starred</span>;
      case 'ForkEvent': return <span className="text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider border border-blue-200">Forked</span>;
      case 'CreateEvent': return <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider border border-emerald-200">Created Repo</span>;
      case 'PublicEvent': return <span className="text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider border border-purple-200">Made Public</span>;
      default: return <span className="text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider border border-slate-200">Interacted with</span>;
    }
  };

  const activeDataList = useMemo(() => {
    if (activeTab === 'alpha') return alphaEvents;
    if (activeTab === 'namedrop') return namedropNews;
    if (activeTab === 'labs') return labNews;
    if (activeTab === 'repos') return repos;
    return [];
  }, [activeTab, alphaEvents, namedropNews, labNews, repos]);

  const filteredData = useMemo(() => {
    if (!searchQuery) return activeDataList;
    return activeDataList.filter(item => {
      const searchStr = (item.title || item.name || item.repo?.name || '').toLowerCase();
      return searchStr.includes(searchQuery.toLowerCase());
    });
  }, [activeDataList, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-blue-100 selection:text-blue-900 pb-20">
      
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-[72px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl shadow-[0_4px_12px_rgba(37,99,235,0.3)]">
              <Terminal size={22} className="text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              GenAI<span className="text-blue-600">_Radar</span>
            </h1>
          </div>

          <div className="hidden md:flex relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder={`Search ${activeTab} feed...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 border-none rounded-full py-2 pl-10 pr-4 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* High Signal Tabs */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-6 overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveTab('alpha')}
            className={`pb-4 text-[13px] font-bold tracking-widest uppercase transition-all border-b-[3px] flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'alpha' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}>
            <Activity size={16} /> 1. Alpha GitHub
          </button>
          <button onClick={() => setActiveTab('namedrop')}
            className={`pb-4 text-[13px] font-bold tracking-widest uppercase transition-all border-b-[3px] flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'namedrop' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}>
            <Users size={16} /> 2. Name-Drops
          </button>
          <button onClick={() => setActiveTab('labs')}
            className={`pb-4 text-[13px] font-bold tracking-widest uppercase transition-all border-b-[3px] flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'labs' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}>
            <Beaker size={16} /> 3. Lab Releases
          </button>
          <button onClick={() => setActiveTab('repos')}
            className={`pb-4 text-[13px] font-bold tracking-widest uppercase transition-all border-b-[3px] flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'repos' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}>
            <Code2 size={16} /> 4. Trending Tools
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">
        
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
                  <h2 className="text-2xl font-extrabold text-slate-900">Elite GitHub Tracker</h2>
                  <p className="text-slate-500 font-medium mt-1">Live actions from Karpathy, Harrison Chase, Chip Huyen, Simon Willison, and more.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredData.map((ev, idx) => (
                    <a key={idx} href={`https://github.com/${ev.repo.name}`} target="_blank" rel="noreferrer"
                      className="group flex items-start gap-4 bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-400 hover:shadow-md transition-all">
                      <img src={ev.actor.avatar_url} alt={ev.actor.login} className="w-12 h-12 rounded-full border border-slate-200 shadow-sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="font-bold text-slate-900">{ev.actor.login}</span>
                          {renderEventAction(ev.type)}
                        </div>
                        <h3 className="text-lg font-bold text-blue-600 truncate group-hover:underline">
                          {ev.repo.name}
                        </h3>
                        <p className="text-xs text-slate-400 mt-2 font-semibold flex items-center gap-1 uppercase tracking-wider">
                          <Clock size={12}/> {formatDistanceToNow(new Date(ev.created_at))} ago
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: NAME-DROP NEWS */}
            {activeTab === 'namedrop' && (
              <div className="space-y-6 max-w-4xl mx-auto">
                <div className="mb-8 border-b border-slate-200 pb-6">
                  <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2"><Users className="text-blue-500"/> "Name-Drop" Radar</h2>
                  <p className="text-slate-500 font-medium mt-2">Filtering global tech news strictly for mentions of top researchers and founders (Sutskever, Hassabis, Karpathy, LeCun, etc.).</p>
                </div>
                <div className="space-y-4">
                  {filteredData.map((item, idx) => (
                    <a key={idx} href={item.url} target="_blank" rel="noreferrer"
                      className="group block bg-white border border-slate-200 hover:border-blue-400 rounded-2xl p-6 transition-all hover:shadow-md shadow-sm">
                      <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors flex items-start gap-2">
                        <span>{item.title}</span>
                      </h3>
                      <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-4">
                        <span className="text-orange-600 bg-orange-50 px-2 py-1 rounded-md">{item.source}</span>
                        <span className="flex items-center gap-1"><Star size={12} className="text-amber-500"/> {item.points} upvotes</span>
                        <span className="flex items-center gap-1"><MessageSquare size={12} className="text-blue-500"/> {item.comments} comments</span>
                        <span>{formatDistanceToNow(new Date(item.date))} ago</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: RESEARCH LABS */}
            {activeTab === 'labs' && (
              <div className="space-y-6 max-w-4xl mx-auto">
                <div className="mb-8 border-b border-slate-200 pb-6">
                  <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2"><Beaker className="text-blue-500"/> The "Research Lab" Feed</h2>
                  <p className="text-slate-500 font-medium mt-2">Tracking major announcements, paper releases, and heavily upvoted discussions from OpenAI, Anthropic, DeepMind, and Meta FAIR.</p>
                </div>
                <div className="space-y-4">
                  {filteredData.map((item, idx) => (
                    <a key={idx} href={item.url} target="_blank" rel="noreferrer"
                      className="group block bg-white border border-slate-200 hover:border-blue-400 rounded-2xl p-6 transition-all hover:shadow-md shadow-sm">
                      <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors flex items-start gap-2">
                        <span>{item.title}</span>
                      </h3>
                      <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-4">
                        <span className="text-purple-600 bg-purple-50 px-2 py-1 rounded-md">{item.source}</span>
                        <span className="flex items-center gap-1"><Star size={12} className="text-amber-500"/> {item.points} upvotes</span>
                        <span className="flex items-center gap-1"><MessageSquare size={12} className="text-blue-500"/> {item.comments} comments</span>
                        <span>{formatDistanceToNow(new Date(item.date))} ago</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: TRENDING REPOS */}
            {activeTab === 'repos' && (
              <div className="space-y-6">
                <div className="mb-8">
                  <h2 className="text-2xl font-extrabold text-slate-900">Trending Tools</h2>
                  <p className="text-slate-500 font-medium mt-1">The hottest open-source LLM, RAG, and Agent repositories today.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredData.map((repo) => (
                    <a key={repo.id} href={repo.html_url} target="_blank" rel="noreferrer" 
                      className="group bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-400 transition-all flex flex-col h-full relative overflow-hidden shadow-sm hover:shadow-md">
                      <div className="flex items-center gap-2 mb-3">
                        <BookOpen size={18} className="text-blue-500 shrink-0" />
                        <h3 className="text-lg font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">{repo.name}</h3>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2 mb-4 flex-grow">{repo.description}</p>
                      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500 border-t border-slate-100 pt-4 mt-auto">
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

          </div>
        )}
      </main>
    </div>
  );
}

export default App;
