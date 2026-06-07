import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Send, Sparkles, Bot, User, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../utils/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content: "Hi! I'm **Aria**, your AI onboarding assistant 👋\n\nI'm here to help you navigate your first 90 days. Ask me anything — about your tasks, timeline, company processes, or just what to focus on today!",
  timestamp: new Date(),
};

const QUICK_PROMPTS = [
  "What should I focus on today?",
  "Explain my 30-60-90 day plan",
  "How do I request system access?",
  "Tips for my first 1:1 with my manager",
];

function formatMessage(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand to-gold flex items-center justify-center shrink-0">
        <Bot size={14} className="text-white" />
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-navy-card border border-navy-border">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-brand-light typing-dot" />
          <span className="w-2 h-2 rounded-full bg-brand-light typing-dot" />
          <span className="w-2 h-2 rounded-full bg-brand-light typing-dot" />
        </div>
      </div>
    </div>
  );
}

export default function AIChatbot({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    setError('');
    setInput('');

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    const history = messages
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const data = await api.chat.message(trimmed, history, user) as { reply?: string } | string;
      const reply = typeof data === 'string' ? data : (data as { reply?: string }).reply || data as string;

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setError('Connection error. Please try again.');
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "Sorry, I'm having trouble connecting right now. Please try again in a moment! 🔄",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([WELCOME_MESSAGE]);
    setError('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
            onClick={onClose}
          />

          {/* Chat widget */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 24, stiffness: 300 }}
            className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-24px)] chat-widget rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, #141B2D 0%, #0E1528 100%)',
              border: '1px solid rgba(36,48,74,0.8)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b border-navy-border/60"
              style={{ background: 'linear-gradient(90deg, rgba(37,99,235,0.1) 0%, rgba(201,168,76,0.05) 100%)' }}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand to-gold flex items-center justify-center">
                    <Sparkles size={16} className="text-white" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-navy-card" />
                </div>
                <div>
                  <p className="text-sm font-semibold font-display text-foreground">Aria</p>
                  <p className="text-xs text-muted-foreground">AI Onboarding Assistant · Online</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={clearChat}
                  title="Clear chat"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                >
                  <RefreshCw size={14} />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex flex-col gap-4 p-4 h-[380px] overflow-y-auto scrollbar-hide">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`flex items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  {/* Avatar */}
                  <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center ${
                    msg.role === 'assistant'
                      ? 'bg-gradient-to-br from-brand to-gold'
                      : 'bg-gradient-to-br from-purple-500 to-brand'
                  }`}>
                    {msg.role === 'assistant'
                      ? <Bot size={14} className="text-white" />
                      : <User size={14} className="text-white" />
                    }
                  </div>

                  {/* Bubble */}
                  <div
                    className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'rounded-br-sm bg-brand text-white'
                        : 'rounded-bl-sm bg-navy-card border border-navy-border text-foreground'
                    }`}
                    dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                  />
                </motion.div>
              ))}

              {isTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick prompts — only show if 1 message (welcome only) */}
            {messages.length === 1 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => sendMessage(prompt)}
                    className="px-3 py-1 rounded-full text-xs border border-brand/30 text-brand-light hover:bg-brand/10 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="px-4 pb-1 text-xs text-destructive">{error}</p>
            )}

            {/* Input */}
            <div className="px-4 py-3 border-t border-navy-border/60">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Aria anything..."
                  rows={1}
                  className="flex-1 resize-none bg-navy-card border border-navy-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-brand/50 focus:ring-1 focus:ring-brand/20 transition-all max-h-24 scrollbar-hide"
                  style={{ lineHeight: '1.5' }}
                  disabled={isTyping}
                />
                <button
                  type="button"
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isTyping}
                  className="p-2.5 rounded-xl bg-brand hover:bg-brand/90 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all hover:shadow-blue-glow active:scale-95 shrink-0"
                >
                  <Send size={16} />
                </button>
              </div>
              <p className="text-xs text-muted-foreground/50 mt-1.5 text-center">
                Powered by Gemini AI · Press Enter to send
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
