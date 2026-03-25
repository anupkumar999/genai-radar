import { useState, useEffect } from 'react';
import { Terminal, Star, GitFork, Clock, BookOpen, Code2, Search, Filter, Calendar, TrendingUp } from 'lucide-react';
import { formatDistanceToNow, subMonths, subYears, format } from 'date-fns';

function App() {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // --- FILTERS ---
  const [topic, setTopic] = useState('all-ai');
  const [timeRange, setTimeRange] = useState('1-month');
  const [sortBy, setSortBy] = useState('stars');

  const topics = [
    { id: 'all-ai', name: '🌍 All AI & ML', query: 'topic:machine-learning OR topic:artificial-intelligence OR topic:generative-ai' },
    { id: 'gen-ai', name: '✨ Generative AI & LLMs', query: 'topic:llm OR topic:generative-ai OR topic:gpt' },
    { id: 'agents', name: '🤖 Agents & RAG', query: 'topic:ai-agents OR topic:rag OR topic:langchain OR topic:autgpt' },
    { id: 'skills', name: '🛠️ Engineering & MLOps', query: 'topic:mlops OR topic:prompt-engineering OR topic:fine-tuning' }
  ];

  const timeRanges = [
    { id: '1-month', name: 'Past 1 Month', getDate: () => format(subMonths(new Date(), 1), 'yyyy-MM-dd') },
    { id: '2-months', name: 'Past 2 Months', getDate: () => format(subMonths(new Date(), 2), 'yyyy-MM-dd') },
    { id: '1-year', name: 'Past 1 Year', getDate: () => format(subYears(new Date(), 1), 'yyyy-MM-dd') },
    { id: '2-years', name: 'Past 2 Years', getDate: () => format(subYears(new Date(), 2), 'yyyy-MM-dd') },
    { id: 'all-time', name: 'All Time', getDate: () => null }
  ];

  const sortOptions = [
    { id: 'stars', name: 'Highest Rated (Stars)', val: 'stars' },
    { id: 'updated', name: 'Recently Updated', val: 'updated' }
  ];

  // --- FETCH LOGIC ---
  useEffect(() => {
    const fetchRepos = async () => {
      setLoading(true);
      
      // 1. Build Topic Query
      const activeTopic = topics.find(t => t.id === topic);
      let q = `${activeTopic.query} stars:>50`;

      // 2. Build Time Query
      const activeTime = timeRanges.find(t => t.id === timeRange);
      const dateStr = activeTime.getDate();
      if (dateStr) {
        q += ` pushed:>${dateStr}`;
      }

      // 3. Build Search Query (if user typed something)
      if (searchQuery.trim().length > 0) {
        q += ` ${searchQuery} in:name,description`;
      }

      try {
        const response = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=${sortBy}&order=desc&per_page=30`);
        if (response.ok) {
          const data = await response.json();
          setRepos(data.items || []);
        } else {
          console.error("API Rate limit hit or error");
        }
      } catch (error) {
        console.error("Failed to fetch repos", error);
      } finally {
        setLoading(false);
      }
    };

    // Debounce fetch slightly to avoid spamming API while typing
    const delayDebounceFn = setTimeout(() => {
      fetchRepos();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [topic, timeRange, sortBy, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-blue-100 selection:text-blue-900 pb-20">
      
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[72px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl shadow-sm">
              <Terminal size={22} className="text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              GenAI<span className="text-blue-600">_Radar</span>
            </h1>
          </div>

          <div className="hidden md:flex relative w-[400px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search AI repositories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 border border-slate-200 rounded-full py-2 pl-10 pr-4 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-500"
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
        
        {/* Title */}
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            <Code2 className="text-blue-600" size={28}/> Repository Explorer
          </h2>
          <p className="text-slate-500 font-medium mt-2 text-lg">The world's top open-source AI tools, categorized and strictly filtered.</p>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-8 shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          
          {/* Topic Pills */}
          <div className="flex flex-wrap gap-2">
            {topics.map(t => (
              <button
                key={t.id}
                onClick={() => setTopic(t.id)}
                className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${
                  topic === t.id 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>

          {/* Sort & Time Dropdowns */}
          <div className="flex flex-wrap gap-4 w-full lg:w-auto border-t lg:border-t-0 border-slate-100 pt-4 lg:pt-0">
            {/* Time Range */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus-within:ring-2 ring-blue-500/20">
              <Calendar size={16} className="text-slate-400" />
              <select 
                value={timeRange} 
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                {timeRanges.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus-within:ring-2 ring-blue-500/20">
              <TrendingUp size={16} className="text-slate-400" />
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                {sortOptions.map(s => (
                  <option key={s.id} value={s.val}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search AI repositories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm"
          />
        </div>

        {/* Repository Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {repos.length > 0 ? repos.map((repo) => (
              <a key={repo.id} href={repo.html_url} target="_blank" rel="noreferrer" 
                className="group bg-white border border-slate-200 rounded-2xl p-6 hover:border-blue-400 transition-all flex flex-col h-full relative overflow-hidden shadow-sm hover:shadow-xl">
                
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-200 transition-colors">
                      <BookOpen size={20} className="text-blue-600 shrink-0" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">{repo.name}</h3>
                  </div>
                </div>
                
                <p className="text-slate-600 line-clamp-2 mb-5 flex-grow font-medium leading-relaxed">{repo.description}</p>
                
                <div className="flex flex-wrap gap-2 mb-5">
                  {repo.topics && repo.topics.slice(0, 4).map(topic => (
                    <span key={topic} className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                      {topic}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs font-bold text-slate-500 border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-slate-800 bg-slate-100 px-2 py-1 rounded-md">
                      <Star size={14} className="text-amber-500 fill-amber-500" /> 
                      {repo.stargazers_count > 999 ? (repo.stargazers_count/1000).toFixed(1)+'k' : repo.stargazers_count}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <GitFork size={14} /> {repo.forks_count}
                    </span>
                  </div>
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} /> {formatDistanceToNow(new Date(repo.updated_at))} ago
                  </span>
                </div>
              </a>
            )) : (
              <div className="col-span-full text-center py-20">
                <div className="bg-white border border-slate-200 rounded-2xl p-10 inline-block">
                  <Search size={40} className="mx-auto text-slate-300 mb-4" />
                  <h3 className="text-xl font-bold text-slate-900 mb-2">No Repositories Found</h3>
                  <p className="text-slate-500 font-medium">Try adjusting your filters or search term.</p>
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
