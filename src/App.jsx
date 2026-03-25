import { useState, useEffect } from 'react';
import { Terminal, Star, GitFork, Clock, BookOpen, Search, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

function App() {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('llm'); // llm, rag, agent

  useEffect(() => {
    fetchRepos(filter);
  }, [filter]);

  const fetchRepos = async (topic) => {
    setLoading(true);
    try {
      // Query GitHub API for repos related to the specific topic that are highly starred and recently updated
      const query = `topic:${topic} stars:>100`;
      const response = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=updated&order=desc&per_page=30`);
      const data = await response.json();
      setRepos(data.items || []);
    } catch (error) {
      console.error("Failed to fetch repos", error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'llm', name: 'LLM & Foundation Models' },
    { id: 'rag', name: 'RAG & Vector DBs' },
    { id: 'ai-agents', name: 'Agentic Frameworks' },
    { id: 'generative-ai', name: 'Generative AI' },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-mono">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500/20 p-2 rounded-lg border border-indigo-500/30">
              <Terminal size={20} className="text-indigo-400" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">GenAI<span className="text-indigo-500">_Radar</span></h1>
          </div>
          <div className="text-xs text-zinc-500 hidden sm:block">
            LIVE FEED: AI Engineer Resources
          </div>
        </div>
      </header>

      {/* Main Dashboard */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row gap-8 items-start justify-between mb-12">
          <div>
            <h2 className="text-3xl font-extrabold text-white mb-2">Daily Discovery</h2>
            <p className="text-zinc-500 max-w-xl">
              Real-time aggregation of the most active, high-value repositories for AI/ML engineers building agentic systems and RAG pipelines.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilter(cat.id)}
                className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-all flex items-center gap-2 ${
                  filter === cat.id
                    ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
            <p className="text-zinc-500 text-sm animate-pulse">Scanning GitHub for {filter} repos...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Repository Cards */}
            {repos.map((repo) => (
              <a
                key={repo.id}
                href={repo.html_url}
                target="_blank"
                rel="noreferrer"
                className="group bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-indigo-500/50 hover:bg-zinc-800/80 transition-all flex flex-col h-full cursor-pointer relative overflow-hidden"
              >
                {/* Glow Effect */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-colors"></div>

                <div className="flex items-start justify-between mb-4 z-10">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <BookOpen size={18} className="text-zinc-500 shrink-0" />
                    <h3 className="text-lg font-bold text-zinc-100 truncate group-hover:text-indigo-400 transition-colors">
                      {repo.name}
                    </h3>
                  </div>
                </div>

                <p className="text-sm text-zinc-400 line-clamp-3 mb-6 flex-grow z-10">
                  {repo.description || "No description provided."}
                </p>

                <div className="flex flex-wrap gap-2 mb-6 z-10">
                  {repo.topics.slice(0, 3).map(topic => (
                    <span key={topic} className="px-2 py-1 bg-zinc-950 border border-zinc-800 rounded-md text-[10px] text-zinc-300 uppercase tracking-wider">
                      {topic}
                    </span>
                  ))}
                  {repo.topics.length > 3 && (
                    <span className="px-2 py-1 bg-zinc-950 border border-zinc-800 rounded-md text-[10px] text-zinc-500 uppercase tracking-wider">
                      +{repo.topics.length - 3}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-zinc-500 border-t border-zinc-800/50 pt-4 z-10">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1 font-medium text-amber-400/80">
                      <Star size={14} /> {repo.stargazers_count > 999 ? (repo.stargazers_count/1000).toFixed(1) + 'k' : repo.stargazers_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <GitFork size={14} /> {repo.forks_count}
                    </span>
                  </div>
                  <span className="flex items-center gap-1">
                    <Clock size={14} /> {formatDistanceToNow(new Date(repo.updated_at))} ago
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
