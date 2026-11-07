import { useEffect, useRef, useState } from 'react';
import { useApp } from '../state/AppState';
import { answer } from '../lib/assistant';
import { cleanText } from '../lib/sanitize';
import { SCHOLARSHIPS } from '../data/scholarships';
import { Button, PageHead } from '../components/ui';
import { SendIcon, SparkIcon } from '../components/icons';
import type { ChatMessage } from '../types';

const SUGGESTIONS = [
  'What am I eligible for?',
  'What is the next deadline?',
  'Which documents am I missing?',
  'Help me write my statement of purpose',
  'Tell me about Reliance Foundation',
  'Tips to improve my chances',
];

let nextId = 1;

export default function Assistant({ onDetails }: { onDetails: (id: number) => void }) {
  const { state } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 0,
      role: 'assistant',
      text: `Hi ${state.profile.name.split(' ')[0] ?? 'there'} — I’m Grant, your on-device funding assistant. I analyse your matches, deadlines, and documents locally: nothing you type ever leaves this browser.`,
    },
  ]);
  const [draft, setDraft] = useState('');
  const [thinking, setThinking] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const copyText = (id: number, text: string) => {
    void navigator.clipboard?.writeText(text);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId((curr) => (curr === id ? null : curr)), 2000);
  };

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking]);

  const ask = (question: string) => {
    const cleaned = cleanText(question, 300);
    if (cleaned.trim() === '' || thinking) return;
    setMessages((m) => [...m, { id: nextId++, role: 'user', text: cleaned }]);
    setDraft('');
    setThinking(true);
    window.setTimeout(() => {
      const reply = answer(cleaned, state);
      setMessages((m) => [...m, { id: nextId++, role: 'assistant', text: reply.text, ...(reply.related !== undefined ? { related: reply.related } : {}) }]);
      setThinking(false);
    }, 450 + Math.random() * 350);
  };

  return (
    <>
      <PageHead eyebrow="On-device intelligence" title="Meet Grant, your funding assistant." actions={
        <span className="ai-badge">
          <SparkIcon /> Private by design
        </span>
      }>
        Ask about scholarships, deadlines, and documents — answers are computed locally from your profile.
      </PageHead>

      <div className="chat-shell">
        <div className="chat-log" role="log" aria-live="polite" aria-label="Conversation with the assistant" ref={logRef}>
          {messages.map((m) => (
            <div key={m.id} className={`bubble-row ${m.role}`}>
              {m.role === 'assistant' && (
                <span className="bubble-avatar" aria-hidden="true">
                  <SparkIcon />
                </span>
              )}
              <div className={`bubble ${m.role}`}>
                {m.text.split('\n').map((line, i) => (
                  <p key={i}>{line === '' ? ' ' : line}</p>
                ))}
                {m.related !== undefined && m.related.length > 0 && (
                  <div className="bubble-chips">
                    {m.related.map((id) => {
                      const s = SCHOLARSHIPS.find((x) => x.id === id);
                      return s === undefined ? null : (
                        <button key={id} type="button" className="chip" onClick={() => onDetails(id)}>
                          {s.name}
                        </button>
                      );
                    })}
                  </div>
                )}
                {m.role === 'assistant' && (
                  <div className="bubble-footer">
                    <button
                      type="button"
                      className="copy-btn"
                      onClick={() => copyText(m.id, m.text)}
                      aria-label="Copy response text"
                    >
                      {copiedId === m.id ? 'Copied ✓' : 'Copy response'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {thinking && (
            <div className="bubble-row assistant">
              <span className="bubble-avatar" aria-hidden="true">
                <SparkIcon />
              </span>
              <div className="bubble assistant typing" aria-label="Assistant is typing">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}
        </div>

        <div className="chat-suggest" aria-label="Suggested questions">
          {SUGGESTIONS.map((s) => (
            <button key={s} type="button" className="chip" onClick={() => ask(s)}>
              {s}
            </button>
          ))}
        </div>

        <form
          className="chat-input"
          onSubmit={(e) => {
            e.preventDefault();
            ask(draft);
          }}
        >
          <label htmlFor="chat-field" className="visually-hidden">
            Ask the assistant a question
          </label>
          <input
            id="chat-field"
            value={draft}
            maxLength={300}
            placeholder="Ask about eligibility, deadlines, documents…"
            onChange={(e) => setDraft(e.target.value)}
          />
          <Button variant="primary" type="submit" aria-label="Send message" disabled={draft.trim() === '' || thinking}>
            <SendIcon />
          </Button>
        </form>
      </div>
    </>
  );
}
