import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { chatAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="text-xs px-2 py-1 rounded transition-all"
      style={{ background: 'rgba(255,255,255,0.1)', color: '#ccc', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
};

const CodeBlock = ({ language, children }) => {
  const code = String(children).replace(/\n$/, '');
  return (
    <div className="relative rounded-xl overflow-hidden my-3" style={{ border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between px-4 py-2"
        style={{ background: '#1e1e2e', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <span className="text-xs font-mono" style={{ color: '#888' }}>{language || 'code'}</span>
        <CopyButton text={code} />
      </div>
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={language}
        PreTag="div"
        customStyle={{ margin: 0, borderRadius: 0, background: '#1a1a2e', fontSize: '13px', padding: '16px' }}>
        {code}
      </SyntaxHighlighter>
    </div>
  );
};

export default function MessageBubble({ message, conversationId, isStreaming = false, streamContent = '' }) {
  const [rating, setRating] = useState(message?.rating || null);
  const [showRating, setShowRating] = useState(false);

  const isUser = message?.role === 'user';
  const content = isStreaming ? streamContent : (message?.content || '');
  const time = message?.createdAt ? formatDistanceToNow(new Date(message.createdAt), { addSuffix: true }) : '';

  const handleRate = async (r) => {
    if (!conversationId || !message?._id) return;
    try {
      await chatAPI.rateMessage(conversationId, message._id, { rating: r });
      setRating(r);
      toast.success('Thanks for your feedback!');
    } catch { toast.error('Failed to save rating'); }
  };

  const copyMessage = () => {
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard');
  };

  if (isUser) {
    return (
      <div className="flex justify-end mb-4 animate-slide-up">
        <div className="max-w-[75%] lg:max-w-[60%]">
          <div className="px-4 py-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed"
            style={{ background: 'var(--user-bubble)', color: 'white', wordBreak: 'break-word' }}>
            {content}
          </div>
          {time && (
            <p className="text-right mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>{time}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 mb-4 animate-slide-up group">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 mt-0.5"
        style={{ background: 'var(--accent)', color: 'white', boxShadow: 'var(--shadow-accent)' }}>
        ✦
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold" style={{ color: 'var(--accent-light)' }}>Nova AI</span>
          {time && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{time}</span>}
          {message?.metadata?.model && (
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)', fontSize: '10px' }}>
              {message.metadata.model.split('-').slice(0, 2).join('-')}
            </span>
          )}
        </div>

        <div className="prose-chat">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <CodeBlock language={match[1]}>{children}</CodeBlock>
                ) : (
                  <code className={className} {...props}>{children}</code>
                );
              },
              pre({ children }) { return <>{children}</>; },
            }}>
            {content}
          </ReactMarkdown>
          {isStreaming && (
            <span className="inline-block w-2 h-4 ml-0.5 animate-pulse rounded-sm"
              style={{ background: 'var(--accent-light)', verticalAlign: 'middle' }} />
          )}
        </div>

        {/* Actions – only show when not streaming */}
        {!isStreaming && message?._id && (
          <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={copyMessage} className="btn-ghost text-xs py-1 px-2 flex items-center gap-1"
              title="Copy">
              📋 Copy
            </button>

            {/* Rating */}
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRate(star)}
                  className="text-sm transition-transform hover:scale-110"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: star <= (rating || 0) ? '#f59e0b' : 'var(--border)' }}
                  title={`Rate ${star}/5`}>
                  ★
                </button>
              ))}
            </div>

            {message?.metadata?.processingTime && (
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {(message.metadata.processingTime / 1000).toFixed(1)}s
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function TypingIndicator({ botName = 'Nova AI' }) {
  return (
    <div className="flex gap-3 mb-4 animate-fade-in">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
        style={{ background: 'var(--accent)', color: 'white' }}>✦</div>
      <div>
        <span className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--accent-light)' }}>{botName}</span>
        <div className="px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1"
          style={{ background: 'var(--ai-bubble)', border: '1px solid var(--border-subtle)', display: 'inline-flex' }}>
          <div className="typing-dots flex items-center gap-1">
            <span /><span /><span />
          </div>
        </div>
      </div>
    </div>
  );
}
