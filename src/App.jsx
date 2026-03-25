import { useState, useEffect } from 'react';
import { Terminal, Star, GitFork, Clock, BookOpen, Code2, Search, Calendar, TrendingUp, Sparkles, AlertCircle, Copy, Check, Users, Library, FileText, Newspaper, ExternalLink, Globe } from 'lucide-react';
import { formatDistanceToNow, subMonths, subYears, format } from 'date-fns';

function App() {
  const [mainView, setMainView] = useState('repos'); // 'repos' or 'research'
  
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
  const [researchTab, setResearchTab] = useState('papers'); // 'papers' or 'news'
  const [researchSortBy, setResearchSortBy] = useState('date'); // 'date' or 'points'
  const [papers, setPapers] = useState([]);
  const [news, setNews] = useState([]);
  const [loadingResearch, setLoadingResearch] = useState(true);

  // --- REPOS CONSTANTS ---
  const topics = [
    { id: 'all-ai', name: '🌍 All AI & ML', query: '"machine learning" OR "artificial intelligence" OR "generative ai"' },
    { id: 'gen-ai', name: '✨ GenAI & LLMs', query: 'llm OR "generative ai" OR gpt' },
    { id: 'agents', name: '🤖 Agents & RAG', query: 'agents OR rag OR langchain OR autogen' },
    { id: 'skills', name: '🛠️ Engineering', query: 'mlops OR "prompt engineering" OR "fine-tuning"' }
  ];

  const authors = [
    { id: 'all', name: 'All Developers (Global)' },
    { id: 'org:openai', name: '🏢 OpenAI' },
    { id: 'org:anthropic', name: '🏢 Anthropic' },
    { id: 'org:google-deepmind', name: '🏢 Google DeepMind' },
    { id: 'org:meta-llama', name: '🏢 Meta Llama' },
    { id: 'org:huggingface', name: '🏢 Hugging Face' },
    { id: 'org:mistralai', name: '🏢 Mistral AI' },
    { id: 'user:karpathy', name: '🧠 Andrej Karpathy' },
    { id: 'user:hwchase17', name: '🧠 Harrison Chase' },
    { id: 'user:ggerganov', name: '🧠 Georgi Gerganov' },
    { id: 'user:simonw', name: '🧠 Simon Willison' },
    { id: 'user:jph00', name: '🧠 Jeremy Howard' }
  ];

  const timeRanges = [
    { id: '1-month', name: 'Updated Past Month', getDate: () => format(subMonths(new Date(), 1), 'yyyy-MM-dd') },
    { id: '6-months', name: 'Updated Past 6 Months', getDate: () => format(subMonths(new Date(), 6), 'yyyy-MM-dd') },
    { id: '1-year', name: 'Updated Past Year', getDate: () => format(subYears(new Date(), 1), 'yyyy-MM-dd') },
    { id: 'all-time', name: 'All Time', getDate: () => null }
  ];

  const sortOptions = [
    { id: 'stars', name: 'Highest Rated (Famous)', val: 'stars' },
    { id: 'updated', name: 'Recently Active', val: 'updated' },
    { id: 'rising', name: 'Rising Gems (New)', val: 'updated' } 
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

  // Reset research data when sort changes
  useEffect(() => {
    setPapers([]);
    setNews([]);
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-blue-100 selection:text-blue-900 pb-20">
      
      {/* Global Header */}
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

          {/* Top Level Navigation */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button 
              onClick={() => setMainView('repos')}
              className={`flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-lg transition-all ${
                mainView === 'repos' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Code2 size={16} /> Code & Tools
            </button>
            <button 
              onClick={() => setMainView('research')}
              className={`flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-lg transition-all ${
                mainView === 'research' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Library size={16} /> Papers & Reading
            </button>
          </div>

          <div className="hidden md:flex relative w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder={`Search ${mainView}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 border border-slate-200 rounded-full py-2 pl-10 pr-4 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-500"
              disabled={mainView === 'research'} // Disable global search for research tab for now
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
        
        {/* ========================================= */}
        {/* VIEW 1: REPOSITORY EXPLORER               */}
        {/* ========================================= */}
        {mainView === 'repos' && (
          <div className="animate-in fade-in duration-500">
            <div className="mb-8">
              <h2 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
                <Code2 className="text-blue-600" size={28}/> Repository Explorer
              </h2>
              <p className="text-slate-500 font-medium mt-2 text-lg">Discover the industry giants, top AI labs, and hidden Agent gems.</p>
            </div>

            {apiError && (
              <div className="mb-6 bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-xl flex items-start gap-3">
                <AlertCircle className="shrink-0 mt-0.5 text-orange-600" size={20}/>
                <div>
                  <h4 className="font-bold">GitHub API Rate Limit Exceeded</h4>
                  <p className="text-sm font-medium opacity-90">GitHub limits anonymous searches to 10 per minute. Please wait 60 seconds before changing filters again.</p>
                </div>
              </div>
            )}

            <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-8 shadow-sm flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
              <div className={`flex flex-wrap gap-2 ${author !== 'all' ? 'opacity-50 pointer-events-none' : ''}`}>
                {topics.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTopic(t.id)}
                    disabled={author !== 'all'}
                    className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${
                      topic === t.id && author === 'all'
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-3 w-full xl:w-auto border-t xl:border-t-0 border-slate-100 pt-4 xl:pt-0">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus-within:ring-2 ring-blue-500/20">
                  <Users size={16} className="text-slate-400" />
                  <select 
                    value={author} 
                    onChange={(e) => setAuthor(e.target.value)}
                    className={`bg-transparent text-sm font-bold focus:outline-none cursor-pointer w-full ${author !== 'all' ? 'text-blue-700' : 'text-slate-700'}`}
                  >
                    {authors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus-within:ring-2 ring-blue-500/20">
                  <Code2 size={16} className="text-slate-400" />
                  <select 
                    value={language} 
                    onChange={(e) => setLanguage(e.target.value)}
                    className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none cursor-pointer w-full"
                  >
                    {languages.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus-within:ring-2 ring-blue-500/20">
                  <Calendar size={16} className="text-slate-400" />
                  <select 
                    value={timeRange} 
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none cursor-pointer w-full"
                  >
                    {timeRanges.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus-within:ring-2 ring-blue-500/20">
                  {sortBy === 'rising' ? <Sparkles size={16} className="text-amber-500" /> : <TrendingUp size={16} className="text-slate-400" />}
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    className={`bg-transparent text-sm font-bold focus:outline-none cursor-pointer w-full ${sortBy === 'rising' ? 'text-amber-600' : 'text-slate-700'}`}
                  >
                    {sortOptions.map(s => <option key={s.id} value={s.val}>{s.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {loadingRepos ? (
              <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {repos.length > 0 ? repos.map((repo) => (
                  <a key={repo.id} href={repo.html_url} target="_blank" rel="noreferrer" 
                    className={`group bg-white border ${sortBy === 'rising' ? 'border-amber-200 hover:border-amber-400' : 'border-slate-200 hover:border-blue-400'} rounded-2xl p-6 transition-all flex flex-col h-full relative overflow-hidden shadow-sm hover:shadow-xl`}>
                    
                    {sortBy === 'rising' && (
                      <div className="absolute top-0 right-0 bg-amber-100 text-amber-700 text-[10px] font-black px-3 py-1 rounded-bl-xl border-b border-l border-amber-200 uppercase tracking-widest z-10">
                        Hidden Gem
                      </div>
                    )}

                    <div className={`flex items-start justify-between mb-3 ${sortBy === 'rising' ? 'mt-3' : ''}`}>
                      <div className="flex items-center gap-3 overflow-hidden">
                        {author !== 'all' ? (
                           <img src={repo.owner.avatar_url} alt={repo.owner.login} className="w-10 h-10 rounded-lg border border-slate-200 shadow-sm shrink-0" />
                        ) : (
                          <div className={`p-2 rounded-lg border transition-colors ${sortBy === 'rising' ? 'bg-amber-50 border-amber-100 group-hover:bg-amber-100 group-hover:border-amber-300' : 'bg-slate-50 border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-200'}`}>
                            <BookOpen size={20} className={`${sortBy === 'rising' ? 'text-amber-600' : 'text-blue-600'} shrink-0`} />
                          </div>
                        )}
                        <h3 className={`text-lg font-bold truncate transition-colors ${sortBy === 'rising' ? 'text-slate-900 group-hover:text-amber-600' : 'text-slate-900 group-hover:text-blue-600'}`} title={repo.full_name}>
                          {author !== 'all' ? repo.name : repo.full_name.split('/')[1]}
                        </h3>
                      </div>
                      
                      <button 
                        onClick={(e) => handleCopyClone(e, repo)}
                        className="shrink-0 p-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg text-slate-400 hover:text-blue-600 transition-all shadow-sm z-20"
                        title="Copy Git Clone Command"
                      >
                        {copiedId === repo.id ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                      </button>
                    </div>
                    
                    <p className="text-slate-600 line-clamp-2 mb-5 flex-grow font-medium leading-relaxed">{repo.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-5">
                      {repo.language && (
                         <span className="px-2.5 py-1 border border-indigo-200 bg-indigo-50 text-indigo-600 rounded-md text-[10px] font-extrabold uppercase tracking-wider">
                           {repo.language}
                         </span>
                      )}
                      {repo.topics && repo.topics.slice(0, 3).map(topic => (
                        <span key={topic} className={`px-2.5 py-1 border rounded-md text-[10px] font-extrabold uppercase tracking-wider ${sortBy === 'rising' ? 'bg-amber-50/50 border-amber-100 text-amber-600' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
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
                  !apiError && (
                    <div className="col-span-full text-center py-20">
                      <div className="bg-white border border-slate-200 rounded-2xl p-10 inline-block">
                        <Search size={40} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No Repositories Found</h3>
                        <p className="text-slate-500 font-medium">Try adjusting your filters or search term.</p>
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
          <div className="animate-in fade-in duration-500">
            <div className="mb-8">
              <h2 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
                <Library className="text-blue-600" size={28}/> Daily Reading
              </h2>
              <p className="text-slate-500 font-medium mt-2 text-lg">The absolute must-read AI research papers and engineering blogs updated daily.</p>
            </div>

            {/* Research Tabs and Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 mb-8 gap-4">
              <div className="flex">
                <button 
                  onClick={() => setResearchTab('papers')}
                  className={`pb-4 px-6 text-sm font-bold tracking-wide uppercase transition-all border-b-[3px] flex items-center gap-2 ${
                    researchTab === 'papers' ? 'border-blue-600 text-blue-700 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <FileText size={18} /> Hugging Face Daily Papers
                </button>
                <button 
                  onClick={() => setResearchTab('news')}
                  className={`pb-4 px-6 text-sm font-bold tracking-wide uppercase transition-all border-b-[3px] flex items-center gap-2 ${
                    researchTab === 'news' ? 'border-blue-600 text-blue-700 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Newspaper size={18} /> Top Tech News & Blogs
                </button>
              </div>
              
              {/* Research Sort Dropdown */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus-within:ring-2 ring-blue-500/20 mb-4 sm:mb-2">
                <TrendingUp size={16} className="text-slate-400" />
                <select 
                  value={researchSortBy} 
                  onChange={(e) => setResearchSortBy(e.target.value)}
                  className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none cursor-pointer w-full"
                >
                  {researchSortOptions.map(s => <option key={s.id} value={s.val}>{s.name}</option>)}
                </select>
              </div>
            </div>

            {loadingResearch ? (
              <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
            ) : (
              <>
                {/* PAPERS LIST */}
                {researchTab === 'papers' && (
                  <div className="space-y-6 max-w-4xl mx-auto">
                    {papers.map((paper, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-blue-400 transition-all flex flex-col gap-4">
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="text-xl font-bold text-slate-900 leading-tight">
                            {paper.title}
                          </h3>
                          <span className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1 rounded-full text-xs font-black shrink-0 shadow-sm">
                            <Star size={14} className="fill-amber-500 text-amber-500" /> {paper.upvotes}
                          </span>
                        </div>
                        
                        <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">
                          By: <span className="text-slate-700">{paper.authors}</span>
                        </p>
                        
                        <p className="text-slate-600 font-medium leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 line-clamp-3">
                          {paper.summary}
                        </p>
                        
                        <div className="flex items-center gap-4 mt-2">
                          <a href={paper.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-bold bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-blue-600 transition-colors shadow-sm">
                            <FileText size={16} /> View on Hugging Face <ExternalLink size={14} />
                          </a>
                          <a href={paper.arxivUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-bold bg-white text-slate-700 border border-slate-300 px-5 py-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                            Read PDF on ArXiv
                          </a>
                          <span className="ml-auto text-xs font-bold text-slate-400 flex items-center gap-1">
                            <Clock size={14} /> {formatDistanceToNow(new Date(paper.date))} ago
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* NEWS & BLOGS LIST */}
                {researchTab === 'news' && (
                  <div className="space-y-4 max-w-4xl mx-auto">
                    {news.map((item, idx) => (
                      <a key={idx} href={item.url} target="_blank" rel="noreferrer" className="group block bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-blue-400 transition-all">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-slate-100 border border-slate-200 text-slate-600 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                            <Globe size={12} /> {item.domain}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-3 leading-tight flex items-start gap-2">
                          {item.title} <ExternalLink size={16} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity mt-1 shrink-0" />
                        </h3>
                        <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                          <span className="flex items-center gap-1"><Star size={14} className="text-amber-500 fill-amber-500" /> {item.points} Points</span>
                          <span className="flex items-center gap-1"><Users size={14} className="text-blue-500" /> {item.comments} Comments</span>
                          <span className="flex items-center gap-1"><Clock size={14} /> {formatDistanceToNow(new Date(item.date))} ago</span>
                        </div>
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
