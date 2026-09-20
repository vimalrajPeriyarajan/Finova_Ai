import React, { useState, useEffect, useRef } from 'react';
import {
  GraduationCap,
  Sparkles,
  Send,
  BookOpen,
  Search,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Lightbulb,
  Clock,
  MessageSquare,
} from 'lucide-react';
import { api } from '../services/apiClient';
import { EducationArticle } from '../types/education';
import { useLanguage } from '../context/LanguageContext';

interface ChatMessage {
  id: string;
  sender: 'USER' | 'AI';
  text: string;
  timestamp: string;
}

const SMART_PROMPTS = [
  'How does the 50/30/20 budget rule work for a beginner?',
  'What is an emergency fund and how many months should it cover?',
  'Explain the difference between Term Insurance and Endowment plans',
  'How can I spot UPI refund scams and fake QR codes?',
  'How does compounding interest work in index funds with ₹500/month?',
];

export const EducationAiView: React.FC = () => {
  const { t } = useLanguage();

  const [articles, setArticles] = useState<EducationArticle[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedArticleId, setExpandedArticleId] = useState<string | null>(null);
  const [isLoadingArticles, setIsLoadingArticles] = useState<boolean>(true);

  // AI Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'AI',
      text: 'Hello! I am your Finova AI Money Coach. Ask me anything about budgeting, investments, loan interest, insurance, or spotting financial fraud in India.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const fetchArticles = async () => {
    setIsLoadingArticles(true);
    try {
      const res = await api.education.getAll({
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
        search: searchQuery || undefined,
      });
      if (res.success && res.data) {
        setArticles(res.data);
      }
    } catch (err) {
      console.error('Failed to load education modules', err);
    } finally {
      setIsLoadingArticles(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiThinking]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isAiThinking) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'USER',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsAiThinking(true);

    try {
      const res = await api.ai.chat(text);
      const aiReply =
        res.success && res.data?.reply
          ? res.data.reply
          : 'I encountered an issue processing that query. Please try asking again.';

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'AI',
        text: aiReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('AI Chat error', err);
      const errorMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'AI',
        text: 'Unable to connect to Finova AI right now. Please verify your internet connection or try again in a few moments.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsAiThinking(false);
    }
  };

  const categories = [
    'ALL',
    'Budgeting',
    'Banking',
    'Investing',
    'Debt & Credit',
    'Protection',
    'Taxes',
    'Scams & Safety',
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Financial Education & AI Coach
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Consult your 24/7 AI financial mentor and master 14 practical money modules.
        </p>
      </div>

      {/* SECTION 1: Finova AI Chat Interface */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden flex flex-col h-[520px]">
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50/40">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h3 className="text-xs font-bold text-slate-900">Finova AI Money Coach</h3>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>
              <p className="text-[10px] text-slate-500">
                Grounded in Indian financial regulations, SEBI/RBI practices & budgeting
              </p>
            </div>
          </div>

          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full border border-emerald-200">
            Powered by Gemini
          </span>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/40">
          {messages.map((m) => {
            const isAi = m.sender === 'AI';
            return (
              <div
                key={m.id}
                className={`flex items-start space-x-2.5 ${
                  isAi ? 'justify-start' : 'justify-end'
                }`}
              >
                {isAi && (
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-xs mt-0.5">
                    F
                  </div>
                )}

                <div
                  className={`max-w-xl p-3.5 rounded-2xl text-xs leading-relaxed ${
                    isAi
                      ? 'bg-white text-slate-800 border border-slate-200 shadow-xs'
                      : 'bg-emerald-600 text-white shadow-xs rounded-tr-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  <div
                    className={`mt-1.5 text-[10px] text-right ${
                      isAi ? 'text-slate-400' : 'text-emerald-100'
                    }`}
                  >
                    {m.timestamp}
                  </div>
                </div>
              </div>
            );
          })}

          {isAiThinking && (
            <div className="flex items-start space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-xs">
                F
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-xs text-xs text-slate-500 flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
                <span>Analyzing financial context...</span>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Smart Quick Prompts */}
        <div className="px-4 py-2 border-t border-slate-100 bg-white flex items-center space-x-1.5 overflow-x-auto scrollbar-none">
          {SMART_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(prompt)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-[11px] text-slate-600 whitespace-nowrap transition-colors border border-slate-200/70"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-100 bg-white flex items-center space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            placeholder="Ask Finova AI about savings, loans, tax deductions, or investments..."
            className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            id="ai-chat-input"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isAiThinking}
            className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors disabled:opacity-50"
            id="ai-send-btn"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SECTION 2: 14 Financial Education Modules */}
      <div className="space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">
              Curated Financial Literacy Modules
            </h2>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search concepts or rules..."
              className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === c
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Articles List */}
        {isLoadingArticles ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading modules...</div>
        ) : articles.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-xs text-xs text-slate-500">
            No education modules found matching your query.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {articles.map((art) => {
              const isExpanded = expandedArticleId === art.id;

              return (
                <div
                  key={art.id}
                  className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase">
                        {art.category}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{art.readTimeMinutes} min read</span>
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 mt-2">{art.title}</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{art.summary}</p>

                    {/* Expandable Deep Dive */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 animate-in fade-in">
                        {/* Key Points */}
                        <div>
                          <span className="text-[11px] font-bold text-slate-900 block mb-1.5">
                            Key Rules & Takeaways:
                          </span>
                          <div className="space-y-1">
                            {art.keyPoints?.map((pt: string, idx: number) => (
                              <div
                                key={idx}
                                className="flex items-start space-x-2 text-xs text-slate-700"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                                <span>{pt}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Real-World Scenario */}
                        {art.example && (
                          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs">
                            <div className="flex items-center space-x-1.5 font-bold text-amber-900 mb-0.5">
                              <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                              <span>Real-World Case Example</span>
                            </div>
                            <p className="text-amber-800 leading-relaxed">{art.example}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() =>
                        handleSendMessage(
                          `Can you give me a personalized walkthrough and practical tips about "${art.title}"?`
                        )
                      }
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Ask AI about this</span>
                    </button>

                    <button
                      onClick={() => setExpandedArticleId(isExpanded ? null : art.id)}
                      className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center space-x-1"
                    >
                      <span>{isExpanded ? 'Less' : 'Read Guide'}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
