"use client";
import { useState, useEffect } from "react";

interface Story {
  id: number;
  title: string;
  url?: string;
  score: number;
  by: string;
  tags?: string[];
  intentTag?: string;
  summary?: string;
  keyDetails?: string[];
}

// Initial system standard tags
const INITIAL_TAGS = [
  "technical_deep_dive",
  "ai_ml",
  "new_tool_or_library",
  "security_privacy",
  "read_now",
  "try_this",
];

export default function Home() {
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Custom Tag States
  const [availableTags, setAvailableTags] = useState<string[]>(INITIAL_TAGS);
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [newTagInput, setNewTagInput] = useState("");

  const [loadingFeed, setLoadingFeed] = useState(true);

  useEffect(() => {
    async function fetchAndPreTagHN() {
      setLoadingFeed(true);
      try {
        const res = await fetch(
          "https://hacker-news.firebaseio.com/v0/topstories.json",
        );
        const ids = await res.json();

        const detailsPromises = ids
          .slice(0, 10)
          .map((id: number) =>
            fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(
              (r) => r.json(),
            ),
          );
        const rawStories = await Promise.all(detailsPromises);

        const taggedStories = await Promise.all(
          rawStories.map(async (story) => {
            try {
              const aiRes = await fetch("/api/summarize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ storyId: story.id }),
              });
              const aiData = await aiRes.json();
              return { ...story, ...aiData };
            } catch (err) {
              return story;
            }
          }),
        );

        setStories(taggedStories.filter((item) => item !== null));
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingFeed(false);
      }
    }
    fetchAndPreTagHN();
  }, []);

  // 🛠️ Handler to create a custom user tag
  const handleAddCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedTag = newTagInput.trim().toLowerCase().replace(/\s+/g, "_");

    if (formattedTag && !availableTags.includes(formattedTag)) {
      setAvailableTags([...availableTags, formattedTag]);
      setActiveTagFilter(formattedTag); // Instantly activate it
      setNewTagInput("");
    }
  };

  // 🧠 Smart Client-Side Filtering Engine
  const filteredStories = stories.filter((story) => {
    // 1. Core text search check
    const matchesSearch = story.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    // 2. Tag filter calculation
    if (!activeTagFilter) return matchesSearch;

    // Standardize text for boundary checking
    const titleText = story.title.toLowerCase();
    const summaryText = (story.summary || "").toLowerCase();
    const cleanTagName = activeTagFilter.replace(/_/g, " ").toLowerCase();

    // Check if it's an initial system tag assigned by OpenAI
    const hasSystemTag =
      story.tags?.includes(activeTagFilter) ||
      story.intentTag === activeTagFilter;

    // 🚀 THE FIX: Use a Regular Expression boundary (\b) to match whole words only.
    // This stops "malware", "against", or "maintain" from triggering an "ai" match.
    const wordRegex = new RegExp(`\\b${cleanTagName}\\b`, "i");
    const hasCustomKeyword =
      wordRegex.test(titleText) || wordRegex.test(summaryText);

    return matchesSearch && (hasSystemTag || hasCustomKeyword);
  });

  return (
    <main className="flex flex-col min-h-screen bg-gray-900 text-gray-100 p-4 md:p-6 max-w-7xl mx-auto w-full">
      {/* Control Header */}
      <div className="bg-gray-800 p-4 rounded-xl shadow-lg mb-4 space-y-4 border border-gray-700/50">
        {/* Top bar: Keyword Search + Custom Tag Creator Input */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="🔍 Search titles..."
            className="flex-1 bg-gray-700 border border-gray-650 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {/* Custom Tag Creator Form */}
          <form onSubmit={handleAddCustomTag} className="flex gap-2 shrink-0">
            <input
              type="text"
              placeholder="Add area of interest (ex: rust, react)..."
              className="bg-gray-750 border border-gray-650 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 text-gray-200 w-full sm:w-60"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
            />
            <button
              type="submit"
              className="bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs px-4 py-2 rounded-lg transition shrink-0"
            >
              + Tag
            </button>
          </form>
        </div>

        {/* Filter Selection Panel */}
        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none md:flex-wrap items-center -mx-4 px-4 md:mx-0 md:px-0">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider hidden md:inline shrink-0 mr-1">
            Active Interests:
          </span>

          {activeTagFilter && (
            <button
              onClick={() => setActiveTagFilter(null)}
              className="text-xs bg-red-950 text-red-300 border border-red-800 px-2.5 py-1 rounded-md font-bold hover:bg-red-900 shrink-0 transition"
            >
              Reset Filter
            </button>
          )}

          {availableTags.map((tag) => {
            const isCustom = !INITIAL_TAGS.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => setActiveTagFilter(tag)}
                className={`text-xs px-2.5 py-1 rounded-md font-medium border shrink-0 transition-all ${activeTagFilter === tag ? "bg-orange-500 text-white border-orange-400 shadow-md" : "bg-gray-750 text-gray-300 border-gray-650 hover:bg-gray-700"} ${isCustom ? "border-dashed border-orange-500/50" : ""}`}
              >
                #{tag.replace(/_/g, " ")} {isCustom ? "👤" : ""}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Responsive Grid Layout Container */}
      <div className="flex flex-col md:flex-row gap-4 flex-1 h-[calc(100vh-210px)] md:h-[73vh]">
        {/* LEFT COLUMN: Feed List */}
        <div
          className={`bg-gray-800 p-3 rounded-xl shadow-lg border border-gray-700/50 overflow-y-auto h-full transition-all duration-200 ${selectedStory ? "hidden md:block md:w-[40%]" : "w-full md:w-[40%]"}`}
        >
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">
            HackerNews Stream
          </h2>

          {loadingFeed ? (
            <div className="space-y-3 p-2">
              <p className="text-gray-400 text-xs animate-pulse">
                Running batch AI evaluations across HackerNews index...
              </p>
              <div className="w-full bg-gray-750 h-1.5 rounded overflow-hidden">
                <div className="bg-orange-500 h-full w-2/3 animate-pulse"></div>
              </div>
            </div>
          ) : filteredStories.length === 0 ? (
            <p className="text-gray-500 text-sm p-4 text-center">
              No articles match this custom tag perspective yet.
            </p>
          ) : (
            <div className="space-y-2">
              {filteredStories.map((story) => (
                <button
                  key={story.id}
                  onClick={() => setSelectedStory(story)}
                  className={`w-full text-left p-3.5 rounded-xl transition border block active:scale-[0.99] ${selectedStory?.id === story.id ? "border-orange-500 bg-gray-750 shadow-sm" : "border-gray-700/50 bg-gray-750/60 hover:bg-gray-750"}`}
                >
                  <h3 className="font-semibold text-sm leading-snug text-gray-100">
                    {story.title}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap text-[10px] text-gray-400">
                    <span className="font-medium text-gray-300">
                      ▲ {story.score}
                    </span>
                    <span>•</span>
                    <span className="truncate max-w-[80px]">by {story.by}</span>
                    {story.intentTag && (
                      <span className="ml-auto bg-emerald-950/80 text-emerald-300 border border-emerald-900 px-1.5 py-0.2 rounded text-[9px] font-bold">
                        {story.intentTag}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Interactive Summary Detail Pane */}
        <div
          className={`bg-gray-800 p-5 rounded-xl shadow-lg border border-gray-700/50 flex flex-col h-full transition-all duration-200 ${selectedStory ? "w-full block md:w-[60%]" : "hidden md:flex md:w-[60%]"}`}
        >
          {selectedStory ? (
            <div className="space-y-4 animate-fadeIn flex flex-col h-full">
              <button
                onClick={() => setSelectedStory(null)}
                className="md:hidden text-xs bg-gray-700 text-gray-300 border border-gray-600 px-3 py-1.5 rounded-lg mb-2 font-bold w-fit"
              >
                ← Back to Feed
              </button>

              <div className="overflow-y-auto space-y-4 flex-1 pr-1">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-orange-400">
                    Analysis metrics
                  </span>
                  <h2 className="text-base md:text-xl font-bold mt-0.5 leading-snug text-gray-50">
                    {selectedStory.title}
                  </h2>
                  {selectedStory.url && (
                    <a
                      href={selectedStory.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-400 hover:underline inline-block mt-1 font-medium"
                    >
                      Open Source Document Link ↗
                    </a>
                  )}
                </div>

                <hr className="border-gray-700/80" />

                <div className="flex gap-4">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">
                      Priority
                    </span>
                    <span className="inline-block bg-teal-950 text-teal-300 border border-teal-800/80 px-2.5 py-0.5 rounded-md text-xs font-bold mt-1">
                      🎯 {selectedStory.intentTag || "None"}
                    </span>
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">
                      Tags
                    </span>
                    <div className="flex gap-1.5 mt-1 overflow-x-auto scrollbar-none">
                      {selectedStory.tags?.map((t) => (
                        <span
                          key={t}
                          className="bg-gray-700 text-gray-250 px-2 py-0.5 rounded-md text-[10px] whitespace-nowrap"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {selectedStory.keyDetails &&
                  selectedStory.keyDetails.length > 0 && (
                    <div className="space-y-1.5">
                      <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                        Relevant Details
                      </h4>
                      <ul className="list-disc list-inside space-y-1 bg-gray-850 p-3.5 rounded-xl border border-gray-700/40 text-xs text-gray-200">
                        {selectedStory.keyDetails.map((detail, index) => (
                          <li key={index} className="leading-relaxed">
                            <span className="text-gray-300">{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                <div className="space-y-1">
                  <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    Discussion Summary
                  </h4>
                  <p className="text-gray-300 text-xs leading-relaxed bg-gray-750 p-3.5 rounded-xl border border-gray-700/60 shadow-inner">
                    {selectedStory.summary ||
                      "No automated summary context available."}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="hidden md:flex flex-col items-center justify-center h-full text-gray-500 text-sm text-center">
              <p>
                Select any pre-analyzed story card to immediately read summaries
                and metrics.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
