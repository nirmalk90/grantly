import { useEffect, useRef, useState } from 'react';
import { useAppActions, useAppState } from '../state/AppState';
import { answer } from '../lib/assistant';
import { cleanText } from '../lib/sanitize';
import { useCatalog } from '../state/CatalogContext';
import { Button, PageHead } from '../components/ui';
import { SendIcon, SparkIcon } from '../components/icons';
import type { ChatMessage } from '../types';

const SUGGESTIONS = [
  'What am I eligible for?',
  'What is the next deadline?',
  'Which documents am I missing?',
  'Help me write my statement of purpose',
  'Tell me about AICTE Pragati',
  'Tips to improve my chances',
];

export default function Assistant({ onDetails }: { onDetails: (id: number) => void }) {
  const state = useAppState();
  const { notify } = useAppActions(); const { scholarships } = useCatalog();
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 0,
      role: 'assistant',
      text: `Hi ${state.profile.name.split(' ')[0] ?? 'there'} — I’m Grant, your on-device planning guide. I use a deterministic intent engine, not a generative AI service. Nothing you type leaves this browser.`,
    },
  ]);
  const [draft, setDraft] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const copyTimer = useRef<number | null>(null);
  const nextId = useRef(1);

  useEffect(() => () => {
    if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
  }, []);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: reduce ? 'auto' : 'smooth' });
  }, [messages]);

  const copyText = async (id: number, text: string): Promise<void> => {
    try {
      if (navigator.clipboard === undefined) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => {
        setCopiedId((curr) => (curr === id ? null : curr));
        copyTimer.current = null;
      }, 2000);
    } catch {
      setCopiedId(null);
      notify('Copy failed — select the response text and copy manually');
    }
  };

  const ask = (question: string): void => {
    const cleaned = cleanText(question, 300);
    if (cleaned.trim() === '') return;
    const reply = answer(cleaned, state, scholarships);
    const userId = nextId.current++;
    const assistantId = nextId.current++;
    setMessages((m) => [
      ...m,
      { id: userId, role: 'user', text: cleaned },
      {
        id: assistantId,
        role: 'assistant',
        text: reply.text,
        ...(reply.related !== undefined ? { related: reply.related } : {}),
      },
    ]);
    setDraft('');
  };

  return (
    <>
      <PageHead
        eyebrow="On-device intelligence"
        title="Meet Grant, your planning assistant."
        actions={<span className="ai-badge"><SparkIcon /> Private by design</span>}
      >
        Ask about scholarships, deadlines, and documents — answers are computed locally from your profile.
      </PageHead>

      <div className="chat-shell">
        <div className="chat-log" role="log" aria-live="polite" aria-label="Conversation with the assistant" ref={logRef}>
          {messages.map((m) => (
            <div key={m.id} className={`bubble-row ${m.role}`}>
              {m.role === 'assistant' && (
                <span className="bubble-avatar" aria-hidden="true"><SparkIcon /></span>
              )}
              <div className={`bubble ${m.role}`}>
                {m.text.split('\n').map((line, i) => (
                  <p key={i}>{line === '' ? ' ' : line}</p>
                ))}
                {m.related !== undefined && m.related.length > 0 && (
                  <div className="bubble-chips">
                    {m.related.map((id) => {
                      const s = scholarships.find((x) => x.id === id);
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
                      onClick={() => { void copyText(m.id, m.text); }}
                      aria-label={copiedId === m.id ? 'Response copied' : 'Copy response text'}
                    >
                      {copiedId === m.id ? 'Copied ✓' : 'Copy response'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="chat-suggest" role="group" aria-label="Suggested questions">
          {SUGGESTIONS.map((s) => (
            <button key={s} type="button" className="chip" onClick={() => ask(s)}>{s}</button>
          ))}
        </div>

        <form
          className="chat-input"
          onSubmit={(e) => {
            e.preventDefault();
            ask(draft);
          }}
        >
          <label htmlFor="chat-field" className="visually-hidden">Ask the assistant a question</label>
          <input
            id="chat-field"
            value={draft}
            maxLength={300}
            placeholder="Ask about eligibility, deadlines, documents…"
            onChange={(e) => setDraft(e.target.value)}
          />
          <Button variant="primary" type="submit" aria-label="Send message" disabled={draft.trim() === ''}>
            <SendIcon />
          </Button>
        </form>
      </div>
    </>
  );
}
