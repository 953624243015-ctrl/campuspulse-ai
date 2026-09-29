import React, { useState, useRef, useEffect } from 'react';
import { useMutation } from 'react-query';
import { Send, Bot, User, Loader2, Globe } from 'lucide-react';
import { aiAPI } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import { useAuth } from '../../context/AuthContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const quickQuestions = [
  'What is my attendance?',
  'When is my next class?',
  'Where is CSE Lab 2?',
  'Who is my mentor?',
  'What events are happening?',
  'How do I submit a complaint?',
  'Where is the library?',
  'What are the cafeteria timings?',
];

const CampusAssistant: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: `Hello ${user?.firstName}! 👋 I'm your CampusPulse AI Assistant. I can help you with attendance, timetable, events, complaints, campus locations, and more.\n\nYou can ask me in English or Tamil. What would you like to know?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState<'en' | 'ta'>('en');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const mutation = useMutation(
    ({ message, lang }: { message: string; lang: string }) =>
      aiAPI.askAssistant(message, lang),
    {
      onSuccess: (res, { message }) => {
        const reply = res.data.data?.message;
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: reply || "I'm sorry, I couldn't process that. Please try again.",
            timestamp: new Date(),
          },
        ]);
      },
      onError: () => {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: "I'm having trouble connecting right now. Please try again in a moment.",
            timestamp: new Date(),
          },
        ]);
      },
    }
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (text?: string) => {
    const msg = text || input.trim();
    if (!msg) return;

    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: 'user', content: msg, timestamp: new Date() },
    ]);
    setInput('');
    mutation.mutate({ message: msg, lang: language });
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col animate-fade-in">
      <PageHeader
        title="Campus AI Assistant"
        subtitle="Ask anything about campus, attendance, events, and more"
        actions={
          <div className="flex items-center gap-2">
            <Globe size={14} className="text-gray-400" />
            <select
              className="input w-auto text-xs py-1"
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'en' | 'ta')}
            >
              <option value="en">English</option>
              <option value="ta">Tamil</option>
            </select>
          </div>
        }
      />

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto card p-4 space-y-4 min-h-0">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              msg.role === 'assistant'
                ? 'bg-primary-100 dark:bg-primary-900/30'
                : 'bg-gray-100 dark:bg-gray-800'
            }`}>
              {msg.role === 'assistant'
                ? <Bot size={16} className="text-primary-600 dark:text-primary-400" />
                : <User size={16} className="text-gray-600" />
              }
            </div>
            <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
              msg.role === 'assistant'
                ? 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-200'
                : 'bg-primary-600 text-white'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {mutation.isLoading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
              <Bot size={16} className="text-primary-600" />
            </div>
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-2.5 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-gray-400" />
              <span className="text-xs text-gray-400">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      <div className="py-2 flex gap-2 overflow-x-auto scrollbar-hide">
        {quickQuestions.map((q) => (
          <button
            key={q}
            onClick={() => handleSend(q)}
            className="flex-shrink-0 px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="card p-3 flex items-center gap-2">
        <input
          type="text"
          placeholder={language === 'ta' ? 'உங்கள் கேள்வியை தமிழில் அல்லது ஆங்கிலத்தில் கேளுங்கள்...' : 'Ask me anything about campus...'}
          className="flex-1 bg-transparent outline-none text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          disabled={mutation.isLoading}
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || mutation.isLoading}
          className="p-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};

export default CampusAssistant;
