import { useEffect, useRef, useState } from 'react';
import { useFeatureStore } from '@/components/FeatureStore';

const SUGGESTIONS = [
  'Which features need my CSM?',
  'What is a feature flag?',
  'How does deferment work?',
];

interface Bubble {
  from: 'assistant' | 'user';
  text: string;
}

const Chatbot = () => {
  const { visibleFeatures } = useFeatureStore();
  const [messages, setMessages] = useState<Bubble[]>([
    {
      from: 'assistant',
      text: 'Hi — I can explain anything in this release: enablement status, feature flags, deferment rules or utilization.',
    },
  ]);
  const [draft, setDraft] = useState('');
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const answer = (question: string) => {
    const t = question.toLowerCase();
    if (t.includes('csm') || t.includes('contact')) {
      const needsCsm = visibleFeatures.filter((f) => f.status === 'Contact CSM');
      return `${needsCsm.length} feature${needsCsm.length === 1 ? '' : 's'} need CSM support to enable: ${
        needsCsm.map((f) => f.title).join(', ') || 'none'
      }. Your CSM turns these on for you.`;
    }
    if (t.includes('gate') || t.includes('flag')) {
      return 'A feature flag is the internal switch that controls a feature. It is required when creating a feature so the platform knows what to turn on.';
    }
    if (t.includes('defer')) {
      return 'Deferrable features can be postponed until the Deferrable Till Date — automatically 90 days after the production enablement date. Non Deferrable features cannot be postponed.';
    }
    if (t.includes('utilization') || t.includes('adoption')) {
      const enabled = visibleFeatures.filter((f) => f.isEnabled).length;
      const pct = visibleFeatures.length ? Math.round((100 * enabled) / visibleFeatures.length) : 0;
      return `Platform utilization is enabled features over total: ${enabled} of ${visibleFeatures.length} (${pct}%).`;
    }
    return 'I can help with enablement status, feature flags, deferment rules and utilization. Try one of the suggestions above.';
  };

  const send = (text?: string) => {
    const question = (text ?? draft).trim();
    if (!question) return;
    setMessages((m) => [...m, { from: 'user', text: question }]);
    setDraft('');
    window.setTimeout(() => {
      setMessages((m) => [...m, { from: 'assistant', text: answer(question) }]);
    }, 260);
  };

  return (
    <>
      <div className="kb-body" ref={bodyRef}>
        {messages.map((m, i) => (
          <div key={i} className={`bub ${m.from === 'user' ? 'u' : 'a'}`}>
            {m.text}
          </div>
        ))}
        {messages.length === 1 && (
          <div className="kb-sugg">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)}>{s}</button>
            ))}
          </div>
        )}
      </div>
      <div className="kb-foot">
        <input
          value={draft}
          placeholder="Ask a question…"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
        />
        <button className="kb-send" onClick={() => send()} aria-label="Send">
          <i className="ph ph-paper-plane-right" />
        </button>
      </div>
    </>
  );
};

export default Chatbot;
