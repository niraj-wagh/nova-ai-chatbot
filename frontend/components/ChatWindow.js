import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { chatAPI } from '../utils/api';
import { getSocket, sendSocketMessage } from '../services/socket';
import useAuthStore from '../utils/authStore';
import MessageBubble, { TypingIndicator } from './MessageBubble';

const WELCOME_PROMPTS = [
  "✨ What can you help me with today?",
  "🧠 Explain quantum computing simply",
  "💻 Write a React component for me",
  "📝 Help me improve my writing",
  "🎨 Give me some creative ideas",
  "🔢 Solve a math problem step by step",
];

export default function ChatWindow({ conversationId, onConversationCreated }) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [convTitle, setConvTitle] = useState('');
  const [currentConvId, setCurrentConvId] = useState(conversationId);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const socketRef = useRef(null);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' });
  }, []);

  // Load conversation history
  useEffect(() => {
    setCurrentConvId(conversationId);
    if (conversationId) {
      loadConversation(conversationId);
    } else {
      setMessages([]);
      setConvTitle('');
    }
  }, [conversationId]);

  // Setup socket listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socketRef.current = socket;

    const handleConvCreated = ({ conversationId: newId }) => {
      setCurrentConvId(newId);
      onConversationCreated?.(newId);
    };

    const handleMsgReceived = ({ message }) => {
      setMessages((prev) => {
        if (prev.find((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });
    };

    const handleThinking = () => {
      setIsThinking(true);
      setIsStreaming(false);
      setStreamingContent('');
    };

    const handleChunk = ({ chunk }) => {
      setIsThinking(false);
      setIsStreaming(true);
      setStreamingContent((prev) => prev + chunk);
    };

    const handleDone = ({ message, title }) => {
      setIsStreaming(false);
      setIsThinking(false);
      setStreamingContent('');
      setIsLoading(false);
      if (title) setConvTitle(title);
      setMessages((prev) => {
        if (prev.find((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });
    };

    const handleError = ({ message: errMsg }) => {
      setIsStreaming(false);
      setIsThinking(false);
      setIsLoading(false);
      setStreamingContent('');
      toast.error(errMsg || 'Something went wrong');
    };

    socket.on('conversation_created', handleConvCreated);
    socket.on('message_received', handleMsgReceived);
    socket.on('ai_thinking', handleThinking);
    socket.on('ai_stream_chunk', handleChunk);
    socket.on('ai_stream_done', handleDone);
    socket.on('error', handleError);

    return () => {
      socket.off('conversation_created', handleConvCreated);
      socket.off('message_received', handleMsgReceived);
      socket.off('ai_thinking', handleThinking);
      socket.off('ai_stream_chunk', handleChunk);
      socket.off('ai_stream_done', handleDone);
      socket.off('error', handleError);
    };
  }, [onConversationCreated]);

  // Scroll on new messages / streaming
  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking, streamingContent]);

  const loadConversation = async (id) => {
    setLoadingHistory(true);
    try {
      const data = await chatAPI.getConversation(id);
      setMessages(data.conversation.messages || []);
      setConvTitle(data.conversation.title || '');
      setTimeout(() => scrollToBottom(false), 100);
    } catch { toast.error('Failed to load conversation'); }
    finally { setLoadingHistory(false); }
  };

  const sendMessage = async () => {
    const content = input.trim();
    if (!content || isLoading) return;

    setInput('');
    setIsLoading(true);
    textareaRef.current?.style && (textareaRef.current.style.height = 'auto');

    const socket = getSocket();
    if (socket?.connected) {
      sendSocketMessage(currentConvId, content);
    } else {
      // HTTP fallback
      try {
        let convId = currentConvId;
        if (!convId) {
          const convData = await chatAPI.createConversation();
          convId = convData.conversation._id;
          setCurrentConvId(convId);
          onConversationCreated?.(convId);
        }
        const data = await chatAPI.sendMessage(convId, { content });
        setMessages((prev) => [...prev, data.userMessage, data.aiMessage]);
        setIsLoading(false);
      } catch (err) {
        toast.error(err.message);
        setIsLoading(false);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTextareaChange = (e) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
  };

  const handlePromptClick = (prompt) => {
    const text = prompt.replace(/^[\w\s]*?(?=[A-Z])/, '').trim() || prompt;
    setInput(prompt.replace(/^[^\w]*/, ''));
    textareaRef.current?.focus();
  };

  const isEmpty = messages.length === 0 && !isLoading;
  const botName = user?.preferences?.chatbotName || 'Nova AI';

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      {convTitle && (
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold"
              style={{ background: 'var(--accent)', color: 'white' }}>✦</div>
            <div>
              <h2 className="text-sm font-semibold truncate max-w-xs" style={{ color: 'var(--text-primary)' }}>{convTitle}</h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{messages.length} messages</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--success)' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Live</span>
          </div>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {loadingHistory ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl animate-pulse"
                style={{ background: 'var(--accent)', color: 'white' }}>✦</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading messages...</p>
            </div>
          </div>
        ) : isEmpty ? (
          /* Welcome screen */
          <div className="flex flex-col items-center justify-center h-full px-6 text-center">
            <div className="mb-8">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4"
                style={{ background: 'var(--accent)', color: 'white', boxShadow: 'var(--shadow-accent)' }}>✦</div>
              <h1 className="text-3xl font-light mb-2" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                Hello, I'm {botName}
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
                Your intelligent AI assistant. Ask me anything.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 w-full max-w-lg">
              {WELCOME_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(prompt.replace(/^[🧠💻📝🎨🔢✨]\s*/, '')); textareaRef.current?.focus(); }}
                  className="text-left px-4 py-3 rounded-xl text-sm transition-all duration-150 hover:scale-[1.02]"
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}>
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto w-full px-4 py-6">
            {messages.map((msg) => (
              <MessageBubble
                key={msg._id}
                message={msg}
                conversationId={currentConvId}
              />
            ))}

            {/* Streaming message */}
            {(isThinking || isStreaming) && !streamingContent && (
              <TypingIndicator botName={botName} />
            )}

            {isStreaming && streamingContent && (
              <MessageBubble
                message={{ role: 'assistant' }}
                isStreaming={true}
                streamContent={streamingContent}
              />
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="px-4 py-4" style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}>
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-end gap-3 p-3 rounded-2xl"
            style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${botName}... (Enter to send, Shift+Enter for newline)`}
              rows={1}
              disabled={isLoading}
              className="flex-1 bg-transparent outline-none resize-none text-sm leading-relaxed py-1"
              style={{
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)',
                maxHeight: '200px',
                caretColor: 'var(--accent)',
              }}
            />

            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-150 shrink-0"
              style={{
                background: input.trim() && !isLoading ? 'var(--accent)' : 'var(--bg-hover)',
                color: input.trim() && !isLoading ? 'white' : 'var(--text-muted)',
                border: 'none',
                cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                transform: input.trim() && !isLoading ? 'none' : 'none',
              }}>
              {isLoading ? (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : '↑'}
            </button>
          </div>

          <p className="text-center mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            {botName} can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </div>
  );
}
