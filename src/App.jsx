import { useState, useEffect, useMemo } from 'react';
import { Terminal, Star, GitFork, Clock, BookOpen, Newspaper, ExternalLink, MessageSquare, Code2, Search, Sparkles, Brain, Cpu, Globe2, BookMarked, Wrench, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

function App() {
  const [activeTab, setActiveTab] = useState('repos'); 
  const [searchQuery, setSearchQuery] = useState('');
  
  const [repos, setRepos] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(true);
  
  const [news, setNews] = useState([]);
  const [loadingNews, setLoadingNews] = useState(true);

  const categories = [
    { id: 'global', icon: <Globe2 size={16} />, label: '🌍 Global AI Trends', ghQuery: 'topic:machine-learning stars:>500', hnQuery: '"Artificial Intelligence" OR "Machine Learning" OR AGI OR "GenAI"' },
    { id: 'openai', icon: <Sparkles size={16} />, label: '⚡ ChatGPT & OpenAI', ghQuery: 'topic:openai OR topic:chatgpt stars:>50', hnQuery: '"OpenAI" OR "ChatGPT" OR "GPT-4" OR "Sora"' },
    { id: 'anthropic', icon: <Brain size={16} />, label: '🧠 Claude & Anthropic', ghQuery: 'claude OR anthropic in:name,description,topics stars:>10', hnQuery: '"Claude" OR "Anthropic" OR "Claude 3"' },
    { id: 'opensource', icon: <Cpu size={16} />, label: '🔓 Open Source LLMs', ghQuery: 'topic:llm OR topic:llama OR topic:mistral stars:>50', hnQuery: '"Llama" OR "Mistral" OR "Hugging Face" OR "Open Source LLM"' },
    { id: 'agents', icon: <Terminal size={16} />, label: '🤖 Agents & RAG', ghQuery: 'topic:agents OR topic:rag OR topic:langchain stars:>50', hnQuery: '"AI Agents" OR "RAG" OR "LangChain" OR "AutoGPT" OR "Vector DB"' },
    { id: 'skills', icon: <Wrench size={16} />, label: '🛠️ Engineer Skills', ghQuery: 'topic:prompt-engineering OR topic:fine-tuning OR topic:mlops stars:>20', hnQuery: '"Prompt Engineering" OR "Fine-tuning" OR "AI Tutorial" OR "MLOps"' },
  ];

  const [activeCategory, setActiveCategory] = useState(categories[0]);

  // People Data
  const peopleGroups = [
    {
      title: "🧠 Core AI Researchers",
      description: "Pushing the boundaries of AI itself. Follow them for where AI is going next.",
      people: [
        { name: "Andrej Karpathy", role: "AI Researcher & Educator", url: "https://twitter.com/karpathy" },
        { name: "Yann LeCun", role: "Chief AI Scientist at Meta", url: "https://twitter.com/ylecun" },
        { name: "Geoffrey Hinton", role: "Godfather of AI", url: "https://twitter.com/geoffreyhinton" },
        { name: "Demis Hassabis", role: "CEO of Google DeepMind", url: "https://twitter.com/demishassabis" },
        { name: "Ilya Sutskever", role: "Co-founder OpenAI / SSI", url: "https://twitter.com/ilyasut" },
        { name: "Fei-Fei Li", role: "Stanford AI Lab", url: "https://twitter.com/drfeifei" },
        { name: "Dario Amodei", role: "CEO of Anthropic", url: "https://twitter.com/DarioAmodei" },
        { name: "Aidan Gomez", role: "CEO of Cohere", url: "https://twitter.com/aidangomez" },
        { name: "Noam Shazeer", role: "Co-author of Attention Is All You Need", url: "https://twitter.com/NoamShazeer" }
      ]
    },
    {
      title: "🛠️ Builders & Engineers",
      description: "Practical, code-first thinkers. Follow them for how to actually build AI systems.",
      people: [
        { name: "Jeremy Howard", role: "Founder fast.ai", url: "https://twitter.com/jeremyphoward" },
        { name: "Sebastian Raschka", role: "AI Educator & Engineer", url: "https://twitter.com/rasbt" },
        { name: "Harrison Chase", role: "Creator of LangChain", url: "https://twitter.com/hwchase17" },
        { name: "Chip Huyen", role: "MLOps Expert", url: "https://twitter.com/chipro" },
        { name: "Eugene Yan", role: "Applied Scientist @ Amazon", url: "https://twitter.com/eugeneyan" },
        { name: "Shreya Shankar", role: "ML Engineer", url: "https://twitter.com/shreya_rofl" }
      ]
    },
    {
      title: "🚀 Founders & Product Thinkers",
      description: "Turning AI into real-world impact. Follow them for what’s being built & shipped.",
      people: [
        { name: "Sam Altman", role: "CEO of OpenAI", url: "https://twitter.com/sama" },
        { name: "Elon Musk", role: "xAI / Tesla", url: "https://twitter.com/elonmusk" },
        { name: "Satya Nadella", role: "CEO of Microsoft", url: "https://twitter.com/satyanadella" },
        { name: "Sundar Pichai", role: "CEO of Google", url: "https://twitter.com/sundarpichai" },
        { name: "Aravind Srinivas", role: "CEO of Perplexity", url: "https://twitter.com/AravSrinivas" },
        { name: "Emad Mostaque", role: "Founder Stability AI", url: "https://twitter.com/EMostaque" }
      ]
    },
    {
      title: "🧩 AI Educators",
      description: "Best for understanding concepts clearly without confusion.",
      people: [
        { name: "Grant Sanderson", role: "3Blue1Brown", url: "https://twitter.com/3blue1brown" },
        { name: "Yannic Kilcher", role: "AI Paper Breakdown", url: "https://twitter.com/ykilcher" },
        { name: "Krish Naik", role: "Data Science Educator", url: "https://twitter.com/krishnaik06" },
        { name: "Harrison Kinsley", role: "Sentdex", url: "https://twitter.com/Sentdex" },
        { name: "Andrew Ng", role: "DeepLearning.AI", url: "https://twitter.com/AndrewYNg" }
      ]
    },
    {
      title: "⚡ Indie Hackers & Creators",
      description: "Underrated but super valuable. Follow for shipping fast with AI.",
      people: [
        { name: "Pieter Levels", role: "Indie Maker", url: "https://twitter.com/levelsio" },
        { name: "Marc Lou", role: "Shipper", url: "https://twitter.com/marc_louvion" },
        { name: "Sahil Lavingia", role: "Gumroad Founder", url: "https://twitter.com/shl" },
        { name: "Logan Kilpatrick", role: "Google AI / ex-OpenAI", url: "https://twitter.com/OfficialLoganK" },
        { name: "Nikita Bier", role: "Consumer App Expert", url: "https://twitter.com/nikitabier" }
      ]
    }
  ];

  useEffect(() => {
    const fetchRepos = async () => {
      setLoadingRepos(true);
      setRepos([]); 
      try {
        const response = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(activeCategory.ghQuery)}&sort=updated&order=desc&per_page=30`);
        const data = await response.json();
        setRepos(data.items || []);
      } catch (error) {
        console.error("Failed to fetch repos", error);
      } finally {
        setLoadingRepos(false);
      }
    };
    if (activeTab === 'repos') fetchRepos();
  }, [activeCategory, activeTab]);

  useEffect(() => {
    const fetchNewsFeed = async () => {
      setLoadingNews(true);
      setNews([]); 
      try {
        const hnRes = await fetch(`https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(activeCategory.hnQuery)}&tags=story&hitsPerPage=20`);
        const hnData = await hnRes.json();
        const hnItems = hnData.hits.map(item => ({
          id: item.objectID,
          title: item.title,
          url: item.url || `https://news.ycombinator.com/item?id=${item.objectID}`,
          source: 'Hacker News',
          points: item.points,
          date: item.created_at,
          icon: <Newspaper size={16} className="text-orange-500" />
        }));

        let devItems = [];
        if (activeCategory.id === 'skills' || activeCategory.id === 'global') {
          const devRes = await fetch('https://dev.to/api/articles?tag=ai&top=1&per_page=10');
          const devData = await devRes.json();
          devItems = devData.map(item => ({
            id: item.id.toString(),
            title: item.title,
            url: item.url,
            source: 'DEV Community',
            points: item.public_reactions_count,
            date: item.published_at,
            icon: <MessageSquare size={16} className="text-blue-500" />
          }));
        }

        const combined = [...hnItems, ...devItems].sort((a, b) => new Date(b.date) - new Date(a.date));
        setNews(combined);
      } catch (error) {
        console.error("Failed to fetch news", error);
      } finally {
        setLoadingNews(false);
      }
    };
    if (activeTab === 'news') fetchNewsFeed();
  }, [activeCategory, activeTab]);

  const filteredRepos = useMemo(() => {
    if (!searchQuery) return repos;
    return repos.filter(repo => 
      repo.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (repo.description && repo.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (repo.topics && repo.topics.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())))
    );
  }, [repos, searchQuery]);

  const filteredNews = useMemo(() => {
    if (!searchQuery) return news;
    return news.filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [news, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-blue-100 selection:text-blue-900 pb-20">
      
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[72px] flex items-center justify-between">
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
              placeholder="Search feed..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 border-none rounded-full py-2 pl-10 pr-4 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-500"
            />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-8 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('repos')}
            className={`pb-4 text-sm font-bold tracking-wide uppercase transition-all border-b-[3px] flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'repos' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code2 size={18} /> Code & Repos
          </button>
          <button 
            onClick={() => setActiveTab('news')}
            className={`pb-4 text-sm font-bold tracking-wide uppercase transition-all border-b-[3px] flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'news' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Newspaper size={18} /> News & Intelligence
          </button>
          <button 
            onClick={() => setActiveTab('people')}
            className={`pb-4 text-sm font-bold tracking-wide uppercase transition-all border-b-[3px] flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'people' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users size={18} /> Top 30 People
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
        
        <div className="md:hidden relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm"
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Hide sidebar if we are on the 'People' tab since it's a global list */}
          {activeTab !== 'people' && (
            <aside className="w-full lg:w-64 shrink-0 overflow-x-auto no-scrollbar pb-4 lg:pb-0 lg:sticky lg:top-32">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-2 hidden lg:block">Intelligence Radar</h3>
              <div className="flex lg:flex-col gap-2 min-w-max lg:min-w-0">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-3 text-sm font-semibold rounded-xl transition-all flex items-center gap-3 w-full text-left ${
                      activeCategory.id === cat.id
                        ? 'bg-blue-50 text-blue-700 shadow-[inset_0_0_0_1px_rgba(37,99,235,0.2)]'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 shadow-sm hover:shadow'
                    }`}
                  >
                    <span className={activeCategory.id === cat.id ? 'text-blue-600' : 'text-slate-500'}>
                      {cat.label}
                    </span>
                  </button>
                ))}
              </div>
            </aside>
          )}

          <div className="flex-1 w-full min-w-0">
            {activeTab !== 'people' && (
              <div className="mb-6">
                <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                  {activeCategory.label.replace(/[\u1000-\uFFFF]+/g, '').trim()} Feed
                </h2>
                <p className="text-slate-500 font-medium">Real-time pulse of {activeTab === 'repos' ? 'repositories' : 'discussions'} updated today.</p>
              </div>
            )}

            {(loadingRepos && activeTab === 'repos') || (loadingNews && activeTab === 'news') ? (
              <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
            ) : (
              <>
                {/* TAB 1: REPOS */}
                {activeTab === 'repos' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredRepos.length > 0 ? filteredRepos.map((repo) => (
                      <a key={repo.id} href={repo.html_url} target="_blank" rel="noreferrer" 
                        className="group bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-400 transition-all flex flex-col h-full relative overflow-hidden shadow-sm hover:shadow-md">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <BookMarked size={18} className="text-blue-500 shrink-0" />
                            <h3 className="text-lg font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">{repo.name}</h3>
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-2 mb-4 flex-grow">{repo.description}</p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {repo.topics && repo.topics.slice(0, 3).map(topic => (
                            <span key={topic} className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              {topic}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 border-t border-slate-100 pt-3">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1 text-slate-700"><Star size={14} className="text-amber-500 fill-amber-500" /> {repo.stargazers_count > 999 ? (repo.stargazers_count/1000).toFixed(1)+'k' : repo.stargazers_count}</span>
                            <span className="flex items-center gap-1"><GitFork size={14} /> {repo.forks_count}</span>
                          </div>
                          <span className="flex items-center gap-1"><Clock size={14} /> {formatDistanceToNow(new Date(repo.updated_at))} ago</span>
                        </div>
                      </a>
                    )) : (
                      <div className="col-span-2 text-center py-12 text-slate-500 font-medium">No repositories found.</div>
                    )}
                  </div>
                )}

                {/* TAB 2: NEWS */}
                {activeTab === 'news' && (
                  <div className="space-y-3">
                    {filteredNews.length > 0 ? filteredNews.map((item, idx) => (
                      <a key={idx} href={item.url} target="_blank" rel="noreferrer"
                        className="group block bg-white border border-slate-200 hover:border-blue-400 rounded-2xl p-5 transition-all hover:shadow-md shadow-sm"
                      >
                        <div className="flex items-start gap-4">
                          <div className="mt-1 bg-slate-50 p-2 rounded-lg border border-slate-200 group-hover:bg-blue-50 group-hover:border-blue-200 transition-colors">
                            {item.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-bold text-slate-900 mb-1.5 group-hover:text-blue-600 transition-colors flex items-center gap-2">
                              <span className="truncate">{item.title}</span>
                              <ExternalLink size={14} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                            </h3>
                            <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                              <span className={item.source === 'Hacker News' ? 'text-orange-600' : 'text-blue-600'}>
                                {item.source}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Star size={12} className={item.points > 100 ? 'text-amber-500' : ''} /> {item.points} upvotes
                              </span>
                              <span>•</span>
                              <span>{formatDistanceToNow(new Date(item.date))} ago</span>
                            </div>
                          </div>
                        </div>
                      </a>
                    )) : (
                      <div className="text-center py-12 text-slate-500 font-medium">No news found.</div>
                    )}
                  </div>
                )}

                {/* TAB 3: TOP 30 PEOPLE */}
                {activeTab === 'people' && (
                  <div className="max-w-4xl mx-auto">
                    <div className="mb-10 text-center">
                      <h2 className="text-3xl font-extrabold text-slate-900 mb-4">The Top 30 High-Signal AI Leaders</h2>
                      <p className="text-slate-600 text-lg max-w-2xl mx-auto">
                        Don't follow the hype. Follow the signal. Here are the 30 researchers, builders, and founders actively shaping the AI world.
                      </p>
                    </div>

                    <div className="space-y-12">
                      {peopleGroups.map((group, gIdx) => (
                        <div key={gIdx} className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                          <h3 className="text-2xl font-bold text-slate-900 mb-2">{group.title}</h3>
                          <p className="text-slate-500 mb-8 font-medium">{group.description}</p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {group.people.map((person, pIdx) => (
                              <a 
                                key={pIdx} 
                                href={person.url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="group p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 hover:-translate-y-1 transition-all"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{person.name}</h4>
                                  <ExternalLink size={14} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{person.role}</p>
                              </a>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-12 bg-blue-50 border border-blue-200 rounded-3xl p-8 text-center max-w-2xl mx-auto">
                      <h4 className="text-lg font-bold text-blue-900 mb-2">💡 Quick Follow Strategy</h4>
                      <p className="text-blue-800/80 font-medium text-sm leading-relaxed">
                        Pick 5 researchers for future direction, 5 builders for practical skills, 3 founders for product sense, and 3 creators for inspiration. If you follow even 10 people from this list, you'll be ahead of 95% of learners.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;
