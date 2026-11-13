import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowSquareOut, ArrowUp, BookOpenText, CalendarPlus, CaretDown, CaretRight, Check, CheckCircle, ChartLineUp, ClockCounterClockwise,
  Copy, Flag, Image as ImageIcon, Info, MagnifyingGlass, NotePencil, Paperclip, Rocket, Stop, ThumbsDown, ThumbsUp, Ticket,
  ToggleRight, Trash, UsersThree, Warning, X, type Icon as PhIcon,
} from '@phosphor-icons/react';
import Hoverable from '@/components/primitives/Hoverable';
import Tooltip from '@/components/primitives/Tooltip';
import { useShell } from '@/components/shell/ShellContext';
import { useZeva } from '@/components/shell/ZevaStore';
import { useTickets } from '@/components/TicketStore';
import * as E from '@/lib/zevaEngine';

/* ---------------------------------------------------------------------------
   Zēva, the helpdesk assistant, as the Release Hub V2 design's "Zeva Drawer":

   - a 440px drawer under the top bar over a 40% scrim, sliding in from the
     right; Esc closes the topmost layer first (feedback, confirm, ticket
     panel, menu, then the drawer);
   - a welcome screen with four suggestions and a nudge for a ticket still
     waiting on support; a conversation with thinking steps, steps lists,
     related topics, articles, thumbs feedback and an escalation;
   - ticket creation inside the conversation: Zēva asks what went wrong, tries
     to help first ("Did this resolve your issue?"), and otherwise drafts a
     ticket that opens in a 400px review panel; the confirmation card says
     "Submitted";
   - conversation history with selection and delete.

   Responses come from the design's own deterministic engine, unchanged.
   --------------------------------------------------------------------------- */

const SUGG_RH: Array<[PhIcon, string]> = [
  [Rocket, 'What changed in the latest release?'],
  [ToggleRight, 'Is there a feature I should turn on?'],
  [BookOpenText, 'Where are the guides for my module?'],
  [Ticket, 'I need to raise a support ticket'],
];
const SUGG_GENERIC: Array<[PhIcon, string]> = [
  [ChartLineUp, 'How do I view hiring statistics?'],
  [UsersThree, 'Where can I find candidate profiles?'],
  [CalendarPlus, 'How do I schedule an interview?'],
  [Ticket, 'I need to raise a support ticket'],
];
const TAGS = ['Not helpful', 'Incorrect information', 'Not relevant to my query', 'Could be more detailed', 'Hard to follow'];
const split = (t?: string) => (t ? String(t).split('\n\n').filter(Boolean) : []);
const FONT = "'Source Sans 3', -apple-system, sans-serif";
const THINKING_MS = 1200;

/* ---- Types (the engine is untyped JS; messages stay loose) -------------- */
/* eslint-disable @typescript-eslint/no-explicit-any */
type Msg = any;
type TkFile = { name: string; size: string };
type Tk = { mode: 'create' | 'review'; draftId?: string; title: string; desc: string; files: TkFile[] } | null;

const uid = (p: string) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
const cleanR = (r: Record<string, any>) => {
  const o: Record<string, any> = {};
  Object.keys(r).forEach((k) => {
    const v = r[k];
    o[k] = typeof v === 'string' ? E.clean(v)
      : Array.isArray(v) ? v.map((x) => (typeof x === 'string' ? E.clean(x) : x && x.label ? { ...x, label: E.clean(x.label) } : x))
      : v;
  });
  return o;
};
const plain = (text: string, steps?: string[]): Msg => ({ id: uid('assistant'), type: 'assistant', content: '', thinkingSteps: steps || [], response: { understanding: text } });
const draftMsg = (title: string, description: string): Msg => ({ id: uid('draft-ticket'), type: 'assistant', isDraftTicket: true, draft: { title, description } });
const confirmMsg = (attachments: TkFile[], title: string, desc: string): Msg => ({
  id: uid('ticket-confirm'),
  type: 'assistant',
  isTicketConfirmation: true,
  ticket: {
    title: title || '',
    desc: String(desc || '').replace(/^Issue reported by user:\s*/i, '').replace(/\n+\s*Note:[\s\S]*$/, '').replace(/\n{2,}/g, '\n').trim(),
    ticketId: String(100000 + Math.floor(Math.random() * 900000)),
    timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
    attachments: attachments || [],
  },
});
const fmtFile = (f: File): TkFile => ({
  name: f.name.length > 28 ? `${f.name.slice(0, 25)}...` : f.name,
  size: f.size >= 1048576 ? `${(f.size / 1048576).toFixed(2)} MB` : `${Math.max(1, Math.round(f.size / 1024))} KB`,
});

/* ---- Small parts -------------------------------------------------------- */

const SQ = 32;
const iconBtn: CSSProperties = { width: SQ, height: SQ, padding: 0, borderRadius: 8, border: '1px solid var(--bd2)', background: 'var(--card)', color: 'var(--tx2)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' };

const Btn = ({ variant = 'secondary', h = 36, onClick, children, disabled, tip, style, ...rest }: {
  variant?: 'primary' | 'secondary' | 'brand' | 'ghost' | 'danger-ghost' | 'danger'; h?: number; onClick?: () => void; children: ReactNode; disabled?: boolean; tip?: string; style?: CSSProperties; 'aria-label'?: string;
}) => {
  const v = {
    primary: { rest: { background: 'var(--brand-solid)', color: '#fff', border: '1px solid transparent' }, hover: { background: 'var(--brand-solidHover)' } },
    secondary: { rest: { background: 'var(--card)', color: 'var(--tx2)', border: '1px solid var(--bd2)' }, hover: { background: 'var(--su2)' } },
    brand: { rest: { background: 'var(--card)', color: 'var(--brand)', border: '1px solid var(--brand-border)' }, hover: { background: 'var(--brand-soft)' } },
    ghost: { rest: { background: 'transparent', color: 'var(--tx2)', border: '1px solid transparent' }, hover: { background: 'var(--su2)' } },
    'danger-ghost': { rest: { background: 'transparent', color: 'var(--dang-text)', border: '1px solid transparent' }, hover: { background: 'var(--dang-soft)' } },
    danger: { rest: { background: 'var(--dang-solid)', color: '#fff', border: '1px solid transparent' }, hover: { background: 'var(--dang-text)' } },
  }[variant];
  const el = (
    <Hoverable
      as="button"
      type="button"
      onClick={disabled ? undefined : onClick}
      aria-disabled={disabled}
      style={{ height: h, padding: h === 32 ? '0 12px' : '0 20px', borderRadius: 8, fontFamily: 'inherit', fontSize: h === 32 ? 13 : 14, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.42 : 1, display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', ...v.rest, ...style }}
      hoverStyle={disabled ? undefined : v.hover}
      {...rest}
    >
      {children}
    </Hoverable>
  );
  return tip ? <Tooltip label={tip} inert={disabled}>{el}</Tooltip> : el;
};

const Field = ({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) => (
  <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx2)', display: 'inline-flex', gap: 2 }}>{label}{required && <span aria-hidden style={{ color: 'var(--dang)' }}>*</span>}</span>
    {children}
  </label>
);

const inputBox = (focus: boolean): CSSProperties => ({ boxSizing: 'border-box', padding: '0 12px', borderRadius: 8, border: `1px solid ${focus ? 'var(--brand)' : 'var(--bd2)'}`, boxShadow: focus ? '0 0 0 3px var(--ring)' : 'none', background: 'var(--card)', fontFamily: 'inherit', fontSize: 14, color: 'var(--tx)', outline: 'none' });

const FocusInput = (p: React.InputHTMLAttributes<HTMLInputElement> & { inputRef?: React.Ref<HTMLInputElement> }) => {
  const [f, setF] = useState(false);
  const { inputRef, ...rest } = p;
  return <input ref={inputRef} {...rest} onFocus={() => setF(true)} onBlur={() => setF(false)} style={{ ...inputBox(f), height: 36, ...p.style }} />;
};
const FocusArea = (p: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => {
  const [f, setF] = useState(false);
  return <textarea {...p} onFocus={() => setF(true)} onBlur={() => setF(false)} style={{ ...inputBox(f), padding: '8px 12px', lineHeight: 1.5, resize: 'vertical', ...p.style }} />;
};

const Dots = () => (
  <span aria-hidden style={{ display: 'inline-flex', alignItems: 'center', gap: 3, width: 24, height: 16, justifyContent: 'center', flex: 'none' }}>
    {['#E88BC4', '#C95AED', '#4763FA'].map((c, i) => (
      <span key={c} style={{ width: 6, height: 6, borderRadius: '50%', background: c, transformOrigin: '50% 100%', animation: `zdot 1.1s cubic-bezier(.45,0,.35,1) ${i * 0.14}s infinite both` }} />
    ))}
  </span>
);

const Card = ({ children }: { children: ReactNode }) => (
  <div style={{ background: 'var(--card)', border: '1px solid var(--bd2)', borderRadius: 8, overflow: 'hidden', animation: 'riseIn 200ms ease' }}>{children}</div>
);
const CardHead = ({ children, right }: { children: ReactNode; right?: ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderBottom: '1px solid var(--bd)' }}>
    <Ticket size={16} color="var(--tx3)" style={{ flex: 'none' }} />
    <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: 'var(--tx)' }}>{children}</span>
    {right}
  </div>
);

const OptionRow = ({ label, onClick, radio = false }: { label: string; onClick: () => void; radio?: boolean }) => (
  <Hoverable
    as="button"
    type="button"
    onClick={onClick}
    style={{ minHeight: 40, padding: radio ? '8px 12px' : '8px 10px 8px 12px', borderRadius: 8, border: '1px solid var(--bd2)', background: 'var(--card)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10 }}
    hoverStyle={{ borderColor: 'var(--brand-border)', background: 'var(--brand-soft)' }}
  >
    {radio && <span style={{ width: 18, height: 18, boxSizing: 'border-box', flex: 'none', borderRadius: 999, border: '1.5px solid var(--brand-border)', background: 'var(--card)' }} />}
    <span style={{ flex: 1, fontSize: 14, fontWeight: 500, lineHeight: 1.4, color: 'var(--tx2)' }}>{label}</span>
    {!radio && <CaretRight size={12} weight="bold" color="var(--brand)" />}
  </Hoverable>
);

/* ---- The drawer --------------------------------------------------------- */

const ZevaDrawer = () => {
  const { open, command, closeZeva } = useZeva();
  const { firstName } = useShell();
  const { tickets, addFromZeva } = useTickets();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [generating, setGenerating] = useState(false);
  const [view, setView] = useState<'chat' | 'history'>('chat');
  const [ctxOff, setCtxOff] = useState(false);
  const [menu, setMenu] = useState(false);
  const [sumOpen, setSumOpen] = useState<Record<string, boolean>>({});
  const [fb, setFb] = useState<Record<string, { rating?: 'up' | 'down' | null; thanks?: boolean }>>({});
  const [fbModal, setFbModal] = useState<{ id: string; tags: string[]; text: string } | null>(null);
  const [hist, setHist] = useState(() => E.MOCK_HISTORY.slice());
  const [hq, setHq] = useState('');
  const [sel, setSel] = useState<string[]>([]);
  const [confirm, setConfirm] = useState<{ kind: 'convo' | 'hist'; n?: number } | null>(null);
  const [tk, setTk] = useState<Tk>(null);
  const [focus, setFocus] = useState(false);
  const [dzOver, setDzOver] = useState(false);

  const timers = useRef<number[]>([]);
  const flow = useRef<string | null>(null);
  const problem = useRef('');
  const thanksT = useRef<Record<string, number>>({});
  const messagesRef = useRef<Msg[]>([]);
  messagesRef.current = messages;
  const inputEl = useRef<HTMLInputElement>(null);
  const fileEl = useRef<HTMLInputElement>(null);
  const tkTitleEl = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const lastCmd = useRef<number>();
  const pinTop = useRef<number | null>(null);
  const usersCount = useRef(0);

  const ctx = `Release Hub: ${
    pathname.includes('/tickets') ? 'Requests' : pathname.includes('/knowledge') ? 'Documentation' : pathname.includes('/features/') ? 'Feature details' : 'Get help'
  }`;
  const area = ctx.split(':')[0].trim() || 'this page';
  const hr = new Date().getHours();
  const greet = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';

  const later = (ms: number, fn: () => void) => { timers.current.push(window.setTimeout(fn, ms)); };
  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  /* ---- Conversation ---- */
  const send = useCallback((text: string) => {
    const q = (text || '').trim();
    if (!q) return;
    clearTimers();
    const f = flow.current;
    const history = messagesRef.current.filter((m) => !m.isThinking);
    const th = E.thinkingFor(q);
    const tid = uid('thinking');
    setMessages(history.concat([{ id: uid('user'), type: 'user', content: q }, { id: tid, type: 'assistant', isThinking: true, label: th.s1 }]));
    setInput(''); setGenerating(true); setMenu(false);
    later(THINKING_MS, () => setMessages((s) => s.map((m) => (m.id === tid ? { ...m, label: th.s2 } : m))));
    later(THINKING_MS * 2, () => {
      const resp = cleanR(E.generateResponse(q, history));
      const steps = [th.d1, th.d2];
      let add: Msg[];
      if (f === 'awaiting_description') {
        problem.current = q;
        if (resp.steps && resp.steps.length) {
          flow.current = 'solution_offered';
          add = [{ id: uid('assistant'), type: 'assistant', content: q, thinkingSteps: steps, isSolutionOffer: true, response: { ...resp, understanding: `Before creating a ticket, let me see if I can help with this directly.\n\n${resp.understanding}`, escalation: false } }];
        } else {
          flow.current = null;
          add = [
            plain('I couldn’t find a direct solution for this in my knowledge base. Let me draft a support ticket for you instead.', steps),
            draftMsg(E.generateTicketTitle(q), `Issue reported by user:\n\n${q}\n\nNote: Zēva was unable to find a matching solution in the knowledge base. Escalating to the support team for manual review.`),
          ];
        }
      } else {
        add = [{ id: uid('assistant'), type: 'assistant', content: q, thinkingSteps: steps, response: resp }];
        if (E.isTicketIntent(q)) flow.current = 'awaiting_description';
      }
      setMessages((s) => s.filter((m) => !m.isThinking).concat(add));
      setGenerating(false);
    });
  }, []);

  const stop = () => { clearTimers(); setMessages((s) => s.filter((m) => !m.isThinking)); setGenerating(false); };
  const newChat = () => { clearTimers(); flow.current = null; problem.current = ''; setMessages([]); setInput(''); setGenerating(false); setView('chat'); setMenu(false); setSumOpen({}); setFb({}); };
  const stripOffer = (extra: Msg[]) => { flow.current = null; setMessages((s) => s.map((m) => (m.isSolutionOffer ? { ...m, isSolutionOffer: false } : m)).concat(extra)); };
  const onYes = () => stripOffer([plain('Glad to hear that resolved your issue. Let me know if you need anything else.')]);
  const onNo = () => {
    const p = problem.current;
    stripOffer([
      plain('No worries, let me draft a support ticket for you with all the details pre-filled.'),
      draftMsg(E.generateTicketTitle(p), `Issue reported by user:\n\n${p}\n\nNote: Zēva suggested a solution but it did not resolve the issue. Escalating to the support team for further investigation.`),
    ]);
  };
  const replaceMsg = (id: string, withMsgs: Msg[]) => setMessages((s) => { const i = s.findIndex((m) => m.id === id); if (i < 0) return s; const a = s.slice(); a.splice(i, 1); return a.concat(withMsgs); });
  const fileTicket = (id: string, title: string, detail: string) => addFromZeva({ id, title: title || 'Support request', detail });
  const cancelDraft = (id: string) => replaceMsg(id, [plain('No problem, the ticket draft has been discarded. Let me know if there’s anything else I can help with.')]);

  const openTk = (seed: string) => { setTk({ mode: 'create', title: seed || '', desc: '', files: [] }); setMenu(false); window.setTimeout(() => tkTitleEl.current?.focus(), 220); };
  const submitTk = () => {
    if (!tk || !tk.title.trim() || !tk.desc.trim()) return;
    const c = confirmMsg(tk.files, tk.title.trim(), tk.desc.trim());
    if (tk.mode === 'review') {
      setTk(null);
      replaceMsg(tk.draftId as string, [c]);
      fileTicket(c.ticket.ticketId, tk.title.trim(), c.ticket.desc);
      return;
    }
    setTk(null);
    setMessages((s) => s.concat([c]));
    fileTicket(c.ticket.ticketId, tk.title.trim(), c.ticket.desc);
    toast(`Support ticket #${c.ticket.ticketId} created`);
  };

  /* ---- Feedback ---- */
  const patchFb = (id: string, v: { rating?: 'up' | 'down' | null; thanks?: boolean }) => setFb((s) => ({ ...s, [id]: { ...s[id], ...v } }));
  const flashThanks = (id: string) => {
    clearTimeout(thanksT.current[id]);
    patchFb(id, { thanks: true });
    thanksT.current[id] = window.setTimeout(() => patchFb(id, { thanks: false }), 2400);
  };
  const onUp = (id: string) => { const f = fb[id] || {}; if (f.rating === 'up') { clearTimeout(thanksT.current[id]); patchFb(id, { rating: null, thanks: false }); } else { patchFb(id, { rating: 'up' }); flashThanks(id); } };
  const onDown = (id: string) => { const f = fb[id] || {}; clearTimeout(thanksT.current[id]); if (f.rating === 'down') patchFb(id, { rating: null, thanks: false }); else { patchFb(id, { rating: 'down', thanks: false }); setFbModal({ id, tags: [], text: '' }); } };
  const dismissFb = () => { if (!fbModal) return; patchFb(fbModal.id, { rating: null, thanks: false }); setFbModal(null); };

  /* ---- Effects: commands, focus, Esc, scroll lock, auto scroll ---- */
  useEffect(() => {
    if (!command || command.nonce === lastCmd.current) return;
    lastCmd.current = command.nonce;
    const t = window.setTimeout(() => {
      setView('chat');
      if (command.kind === 'ticket') { send('I need to raise a support ticket'); if (command.text) setInput(command.text); }
      else if (command.text) send(command.text);
    }, 240);
    return () => clearTimeout(t);
  }, [command, send]);

  useEffect(() => {
    if (!open) return;
    setCtxOff(false);
    const t = window.setTimeout(() => inputEl.current?.focus(), 220);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { clearTimeout(t); document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !open) return;
      if (fbModal) return dismissFb();
      if (confirm) return setConfirm(null);
      if (tk) return setTk(null);
      if (menu) return setMenu(false);
      closeZeva();
    };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  });

  useEffect(() => () => { clearTimers(); Object.values(thanksT.current).forEach(clearTimeout); }, []);

  /* Pin a sent message near the top and let the answer fill in beneath it. */
  useLayoutEffect(() => {
    const users = messages.filter((m) => m.type === 'user').length;
    const sent = users > usersCount.current;
    usersCount.current = users;
    if (!users) pinTop.current = null;
    const el = listRef.current;
    const inner = el?.querySelector<HTMLElement>('[data-zlist]');
    if (!el || !inner) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const behavior: ScrollBehavior = reduce ? 'auto' : 'smooth';
    const base = el.getBoundingClientRect().top - el.scrollTop;
    const topOf = (n: Element) => n.getBoundingClientRect().top - base;
    if (sent) {
      const u = Array.from(inner.querySelectorAll('[data-zuser]')).pop();
      if (!u) return;
      const t = topOf(u) - 12;
      pinTop.current = t;
      inner.style.minHeight = `${t + el.clientHeight}px`;
      el.scrollTo({ top: t, behavior });
    } else {
      const last = inner.lastElementChild as HTMLElement | null;
      if (!last) return;
      const lt = topOf(last), lb = lt + last.offsetHeight;
      const cap = users ? (pinTop.current ?? Infinity) : Infinity;
      const top = Math.min(cap, lt - 12, lb - el.clientHeight + 16);
      if (lb > el.scrollTop + el.clientHeight && top > el.scrollTop) el.scrollTo({ top, behavior });
    }
  }, [messages]);

  /* ---- Derived ---- */
  const hasMessages = messages.length > 0;
  const isHistory = view === 'history';
  const sugg = /release hub/i.test(ctx) ? SUGG_RH : SUGG_GENERIC;
  const nudge = tickets.find((t) => t.raw === 'Open' && !t.fresh);
  const firstUser = messages[0]?.type === 'user' ? messages[0].content : 'New conversation';
  const ql = hq.trim().toLowerCase();
  const filtered = hist.filter((h: any) => h.title.toLowerCase().includes(ql));
  const selSet = new Set(sel);
  const allSel = filtered.length > 0 && filtered.every((h: any) => selSet.has(h.id));
  const inputOk = !!input.trim();
  const tkOk = !!(tk && tk.title.trim() && tk.desc.trim());
  const fbOk = !!(fbModal && (fbModal.tags.length || fbModal.text.trim()));
  const topicsHeading = (r: any) => (r.isFrustrated ? 'Try one of these instead' : r.isActionCommand ? 'I can guide you through' : r.isOffTopic ? 'Here are some things I can help with' : 'You might be looking for');

  const openTicket = (id: string) => { closeZeva(); navigate(`/product-hub/tickets?id=${id}`); };

  const renderAssistant = (m: Msg) => {
    const r = m.response || {};
    const ts: string[] = m.thinkingSteps || [];
    const so = !!sumOpen[m.id];
    const f = fb[m.id] || {};
    const up = f.rating === 'up', down = f.rating === 'down';
    return (
      <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 12, animation: 'riseIn 200ms ease' }}>
        {ts.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
            <Hoverable
              as="button"
              type="button"
              aria-expanded={so}
              aria-label="Toggle thinking details"
              onClick={() => setSumOpen((s) => ({ ...s, [m.id]: !s[m.id] }))}
              style={{ height: 24, padding: '0 6px 0 0', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--tx3)', borderRadius: 6 }}
              hoverStyle={{ color: 'var(--tx)' }}
            >
              <CheckCircle size={14} weight="fill" color="var(--tx4)" />
              {ts[ts.length - 1].replace(/\.$/, '')}
              <CaretDown size={12} style={{ transition: 'transform 160ms ease', transform: so ? 'rotate(180deg)' : 'none' }} />
            </Hoverable>
            {so && (
              <div style={{ display: 'flex', flexDirection: 'column', padding: '8px 12px', background: 'var(--su2)', borderRadius: 8, animation: 'riseIn 160ms ease' }}>
                {ts.map((t, i) => (
                  <div key={i}>
                    {i > 0 && <span style={{ display: 'block', width: 1, height: 8, background: 'var(--bd3)', marginLeft: 3 }} />}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--tx3)' }}>
                      <span style={{ width: 7, height: 7, borderRadius: 999, background: 'var(--bd3)', flex: 'none' }} />{t.replace(/\.$/, '')}
                    </div>
                  </div>
                ))}
                <span style={{ display: 'block', width: 1, height: 8, background: 'var(--bd3)', marginLeft: 3 }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--tx2)', marginLeft: -3 }}>
                  <CheckCircle size={14} weight="fill" color="var(--succ)" />Done
                </div>
              </div>
            )}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {split(r.understanding).concat(split(r.explanation)).map((p, i) => (
            <p key={i} style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: 'var(--tx)', textWrap: 'pretty' as never }}>{p}</p>
          ))}
        </div>
        {r.steps?.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx)' }}>Here’s how:</div>
            <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {r.steps.map((t: string, i: number) => (
                <li key={i} style={{ display: 'flex', gap: 8, fontSize: 14, lineHeight: 1.5, color: 'var(--tx)' }}>
                  <span style={{ fontWeight: 700, color: 'var(--brand)', minWidth: 16 }}>{i + 1}.</span><span>{t}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
        {r.isAmbiguous && r.disambiguations?.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {r.disambiguations.map((o: any) => <OptionRow key={o.label} radio label={o.label} onClick={() => send(o.query)} />)}
          </div>
        )}
        {r.isFallback && r.clarifications?.length > 0 && (
          <ul style={{ margin: 0, padding: '0 0 0 20px', display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14, lineHeight: 1.5, color: 'var(--tx)' }}>
            {r.clarifications.map((b: string) => <li key={b}>{b}</li>)}
          </ul>
        )}
        {r.relatedTopics?.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx)' }}>{topicsHeading(r)}</div>
            {r.relatedTopics.map((o: any) => <OptionRow key={o.label} label={o.label} onClick={() => send(o.query)} />)}
          </div>
        )}
        {r.links?.length > 0 && (
          <div style={{ background: 'var(--card)', border: '1px solid var(--bd2)', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ padding: '6px 12px', background: 'var(--su1)', borderBottom: '1px solid var(--bd)', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--tx4)' }}>Relevant articles</div>
            {r.links.map((l: any, i: number) => (
              <Hoverable
                as="a"
                href="#"
                key={l.title}
                aria-label={`${l.title} (opens in new tab)`}
                onClick={(e: React.MouseEvent) => { e.preventDefault(); toast(`Opening “${l.title}” in a new tab`); }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderTop: i ? '1px solid var(--bd)' : 'none', fontSize: 14, fontWeight: 600, color: 'var(--brand)' }}
                hoverStyle={{ background: 'var(--brand-soft)' }}
              >
                <BookOpenText size={16} color="var(--tx3)" /><span style={{ flex: 1 }}>{l.title}</span><ArrowSquareOut size={14} />
              </Hoverable>
            ))}
          </div>
        )}
        {r.escalation && (
          <div style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--tx2)' }}>
            {r.isFrustrated ? 'Or if you’d prefer personalized help,' : 'Still didn’t get what you’re looking for?'}{' '}
            <button type="button" onClick={() => openTk(m.content)} style={{ padding: 0, border: 'none', background: 'none', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: 'var(--brand)', cursor: 'pointer' }}>Create ticket</button>
          </div>
        )}
        {m.isSolutionOffer && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12, background: 'var(--card)', border: '1px solid var(--bd2)', borderRadius: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx)' }}>Did this resolve your issue?</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <Btn h={32} onClick={onYes}><Check size={14} weight="bold" color="var(--succ)" />Yes, this helped</Btn>
              <Btn h={32} variant="brand" onClick={onNo}><Ticket size={14} />No, create a ticket</Btn>
            </div>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: -6 }}>
          {[
            { key: 'up', on: up, Icon: ThumbsUp, color: 'var(--brand)', tip: up ? 'Remove rating' : 'Good response', aria: up ? 'Remove good rating' : 'Rate as good response', go: () => onUp(m.id) },
            { key: 'down', on: down, Icon: ThumbsDown, color: 'var(--dang)', tip: down ? 'Remove rating' : 'Bad response', aria: down ? 'Remove bad rating' : 'Rate as bad response', go: () => onDown(m.id) },
          ].map((b) => (
            <Tooltip key={b.key} label={b.tip}>
              <Hoverable as="button" type="button" aria-label={b.aria} aria-pressed={b.on} onClick={b.go} style={{ width: 28, height: 28, padding: 0, borderRadius: 8, border: 'none', background: 'transparent', color: b.on ? b.color : 'var(--tx2)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} hoverStyle={{ background: 'var(--su2)' }}>
                <b.Icon size={16} weight={b.on ? 'fill' : 'regular'} />
              </Hoverable>
            </Tooltip>
          ))}
          {f.thanks && <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--tx3)', marginLeft: 4, animation: 'riseIn 160ms ease' }}>Thanks for the feedback</span>}
        </div>
      </div>
    );
  };

  const renderDraft = (m: Msg) => {
    const d = m.draft;
    const sum = String(d.description || '').replace(/^Issue reported by user:\s*/i, '').replace(/\n+\s*Note:[\s\S]*$/, '').replace(/\s*\n+\s*/g, ' ').trim();
    const review = () => { (document.activeElement as HTMLElement | null)?.blur?.(); setTk({ mode: 'review', draftId: m.id, title: d.title, desc: d.description, files: (d.files || []).slice() }); };
    const field = (label: string, body: ReactNode) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx3)' }}>{label}</span>
        <Tooltip label="Review to edit">
          <Hoverable as="button" type="button" onClick={review} style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: 8, background: 'var(--su1)', border: '1px solid var(--bd)', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 8 }} hoverStyle={{ background: 'var(--su2)', borderColor: 'var(--bd2)' }}>
            {body}
          </Hoverable>
        </Tooltip>
      </div>
    );
    return (
      <Card key={m.id}>
        <CardHead>Draft support ticket</CardHead>
        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {field('Issue title', <span style={{ flex: 1, minWidth: 0, fontSize: 14, lineHeight: '20px', fontWeight: 600, color: 'var(--tx)' }}>{d.title}</span>)}
          {field('Description', <span style={{ flex: 1, minWidth: 0, fontSize: 13, lineHeight: '18px', color: 'var(--tx2)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{sum}</span>)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, padding: 8, borderTop: '1px solid var(--bd)' }}>
          <Btn variant="danger-ghost" style={{ padding: '0 16px' }} onClick={() => cancelDraft(m.id)}>Discard</Btn>
          <Btn variant="primary" onClick={review}>Review</Btn>
        </div>
      </Card>
    );
  };

  const renderConfirm = (m: Msg) => {
    const t = m.ticket;
    const n = (s: string) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const d = n(t.desc), ti = n(t.title);
    const hasDesc = !!d && d !== ti && !ti.startsWith(d) && !d.startsWith(ti);
    const attN = t.attachments.length;
    const row = (label: string, body: ReactNode) => (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <span style={{ width: 84, flex: 'none', fontSize: 12, lineHeight: '20px', fontWeight: 600, color: 'var(--tx3)' }}>{label}</span>
        {body}
      </div>
    );
    return (
      <Card key={m.id}>
        <CardHead right={<span style={{ flex: 'none', height: 20, padding: '0 8px', boxSizing: 'border-box', borderRadius: 999, background: 'var(--succ-soft)', border: '1px solid var(--succ-border)', color: 'var(--succ-text)', fontSize: 12, fontWeight: 500, display: 'inline-flex', alignItems: 'center' }}>Submitted</span>}>Ticket #{t.ticketId}</CardHead>
        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {row('Issue title', <span style={{ flex: 1, minWidth: 0, fontSize: 14, lineHeight: '20px', color: 'var(--tx)' }}>{t.title}</span>)}
          {hasDesc && row('Description', <span style={{ flex: 1, minWidth: 0, fontSize: 13, lineHeight: '20px', color: 'var(--tx2)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{t.desc}</span>)}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: 12, lineHeight: '16px', color: 'var(--tx4)', marginTop: 2 }}>
            <span>Submitted {t.timestamp} · We’ll email you updates</span>
            {attN > 0 && (<><span aria-hidden>·</span><span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Paperclip size={12} />{attN} file{attN === 1 ? '' : 's'} attached</span></>)}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, padding: 8, borderTop: '1px solid var(--bd)' }}>
          <Btn variant="ghost" style={{ padding: '0 12px' }} onClick={() => { try { navigator.clipboard?.writeText(`#${t.ticketId}`); } catch { /* clipboard blocked */ } toast('Ticket ID copied'); }}><Copy size={14} />Copy ID</Btn>
          <Btn variant="brand" style={{ padding: '0 16px' }} onClick={() => openTicket(t.ticketId)}>View ticket</Btn>
        </div>
      </Card>
    );
  };

  const toggleSel = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.concat(id)));

  /* ---- Render ---- */
  return (
    <div style={{ fontFamily: FONT, color: 'var(--tx)', fontVariantNumeric: 'tabular-nums' }}>
      <div onClick={closeZeva} aria-hidden style={{ position: 'fixed', top: 56, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 197, opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none', transition: 'opacity 200ms ease' }} />
      <aside
        role="complementary"
        aria-label="Zēva helpdesk assistant"
        aria-hidden={open ? undefined : true}
        style={{
          position: 'fixed', top: 56, right: 0, bottom: 0, width: 440, maxWidth: '100vw', zIndex: 198, background: 'var(--bg)', borderLeft: '1px solid var(--bd2)',
          boxShadow: 'var(--elev3)', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxSizing: 'border-box',
          transform: open ? 'translateX(0)' : 'translateX(100%)', visibility: open ? 'visible' : 'hidden',
          transition: open ? 'transform 200ms ease, visibility 0s' : 'transform 200ms ease, visibility 0s linear 200ms',
        }}
      >
        <div role="navigation" aria-label="Zēva assistant navigation" style={{ height: 52, flex: 'none', boxSizing: 'border-box', padding: '0 12px 0 16px', background: 'var(--card)', borderBottom: '1px solid var(--bd2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <img src="/zeva-icon.svg" alt="" style={{ width: 24, height: 20, display: 'block', flex: 'none' }} />
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--tx)' }}>Zēva</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {hasMessages && (
              <Tooltip label="Create support ticket">
                <Hoverable as="button" type="button" aria-label="Create support ticket" onClick={() => openTk('')} style={iconBtn} hoverStyle={{ background: 'var(--su2)' }}><Ticket size={18} /></Hoverable>
              </Tooltip>
            )}
            {(hasMessages || isHistory) && (
              <Tooltip label="Start new chat">
                <Hoverable as="button" type="button" aria-label="Start new chat" onClick={newChat} style={iconBtn} hoverStyle={{ background: 'var(--su2)' }}><NotePencil size={18} /></Hoverable>
              </Tooltip>
            )}
            <Tooltip label="Conversation history">
              <Hoverable
                as="button"
                type="button"
                aria-label="Conversation history"
                aria-pressed={isHistory}
                onClick={() => { setView((v) => (v === 'history' ? 'chat' : 'history')); setMenu(false); }}
                style={{ ...iconBtn, border: `1px solid ${isHistory ? 'var(--brand-border)' : 'var(--bd2)'}`, background: isHistory ? 'var(--brand-soft)' : 'var(--card)', color: isHistory ? 'var(--brand)' : 'var(--tx2)' }}
                hoverStyle={{ background: isHistory ? 'var(--brand-softHover)' : 'var(--su2)' }}
              >
                <ClockCounterClockwise size={18} />
              </Hoverable>
            </Tooltip>
            <Tooltip label="Close Zēva assistant">
              <Hoverable as="button" type="button" aria-label="Close Zēva assistant" onClick={closeZeva} style={{ ...iconBtn, border: 'none', background: 'transparent' }} hoverStyle={{ background: 'var(--su2)' }}><X size={18} /></Hoverable>
            </Tooltip>
          </div>
        </div>

        {isHistory && (
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', animation: 'riseIn 160ms ease' }}>
            <div style={{ padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', gap: 12, flex: 'none' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx)' }}>Conversation history</div>
              <div style={{ position: 'relative' }}>
                <MagnifyingGlass size={16} color="var(--tx4)" style={{ position: 'absolute', left: 12, top: 10, pointerEvents: 'none' }} />
                <FocusInput value={hq} onChange={(e) => setHq(e.target.value)} placeholder="Search your chats" aria-label="Search conversation history" style={{ width: '100%', paddingLeft: 36 }} />
              </div>
              {sel.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, animation: 'riseIn 160ms ease' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx2)' }}>{sel.length}/{filtered.length} selected</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Btn h={32} variant="ghost" style={{ color: 'var(--brand)' }} onClick={() => setSel((s) => (allSel ? s.filter((id) => !filtered.some((h: any) => h.id === id)) : Array.from(new Set(s.concat(filtered.map((h: any) => h.id))))))}>{allSel ? 'Deselect all' : 'Select all'}</Btn>
                    <Btn h={32} onClick={() => setSel([])}>Cancel</Btn>
                    <Btn h={32} style={{ borderColor: 'var(--dang-border)', color: 'var(--dang-text)' }} onClick={() => setConfirm({ kind: 'hist', n: sel.length })}><Trash size={14} />{sel.length > 1 ? `Delete (${sel.length})` : 'Delete'}</Btn>
                  </div>
                </div>
              )}
            </div>
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 16px 16px' }}>
              {filtered.length > 0 ? (
                <div style={{ background: 'var(--card)', border: '1px solid var(--bd2)', borderRadius: 8, overflow: 'hidden' }}>
                  {filtered.map((h: any, i: number) => {
                    const on = selSet.has(h.id);
                    return (
                      <Hoverable key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 12px', background: on ? 'var(--brand-soft)' : 'var(--card)', borderTop: i ? '1px solid var(--bd)' : 'none' }} hoverStyle={{ background: on ? 'var(--brand-softHover)' : 'var(--su1)' }}>
                        <div
                          role="checkbox"
                          tabIndex={0}
                          aria-checked={on}
                          aria-label={`${on ? 'Deselect' : 'Select'} conversation: ${h.title}`}
                          onClick={() => toggleSel(h.id)}
                          onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleSel(h.id); } }}
                          style={{ width: 24, height: 24, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: 6 }}
                        >
                          <span style={{ width: 18, height: 18, boxSizing: 'border-box', borderRadius: 5, border: `1.5px solid ${on ? 'var(--brand)' : 'var(--switch-off)'}`, background: on ? 'var(--brand-solid)' : 'var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {on && <Check size={12} weight="bold" color="#fff" />}
                          </span>
                        </div>
                        <Hoverable as="button" type="button" onClick={() => { setView('chat'); setSel([]); }} style={{ flex: 1, minWidth: 0, textAlign: 'left', padding: '10px 0', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', flexDirection: 'column', gap: 2, color: 'var(--tx)' }} hoverStyle={{ color: 'var(--brand)' }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: 'inherit', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{h.title}</span>
                          <span style={{ fontSize: 12, color: 'var(--tx3)' }}>Last message {h.last}</span>
                        </Hoverable>
                      </Hoverable>
                    );
                  })}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 4, padding: '48px 16px' }}>
                  {ql ? <MagnifyingGlass size={28} color="var(--tx4)" style={{ marginBottom: 8 }} /> : <ClockCounterClockwise size={28} color="var(--tx4)" style={{ marginBottom: 8 }} />}
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx)' }}>{ql ? 'No conversations found' : 'No conversation history yet'}</div>
                  <div style={{ fontSize: 13, color: 'var(--tx3)' }}>{ql ? `No results for “${hq.trim()}”. Try a different word.` : 'Start a new chat to see it here'}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {!isHistory && (
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            {!hasMessages && (
              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', padding: '24px 16px 12px' }}>
                <div style={{ margin: 'auto 0', paddingBottom: 48, display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.25, letterSpacing: '-0.01em', color: 'var(--tx)' }}>{greet}, {firstName}</div>
                    <div style={{ fontSize: 14, lineHeight: 1.45, color: 'var(--tx2)', marginTop: 2 }}>Ask me about {area}, or anything in Zwayam.</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 8 }}>
                    {sugg.map(([Icon, text]) => (
                      <Hoverable
                        as="button"
                        type="button"
                        key={text}
                        onClick={() => send(text)}
                        onMouseEnter={() => { if (!generating) setInput(text); }}
                        onMouseLeave={() => { if (!generating) setInput(''); }}
                        style={{ minHeight: 96, padding: 12, borderRadius: 8, border: '1px solid var(--bd2)', background: 'var(--card)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}
                        hoverStyle={{ borderColor: 'var(--brand-border)', background: 'var(--brand-soft)' }}
                      >
                        <Icon size={20} color="var(--brand)" />
                        <span style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.4, color: 'var(--tx)' }}>{text}</span>
                      </Hoverable>
                    ))}
                  </div>
                </div>
                {nudge && (
                  <Hoverable
                    as="button"
                    type="button"
                    onClick={() => openTicket(nudge.id)}
                    style={{ alignSelf: 'center', height: 28, padding: '0 10px', borderRadius: 999, border: '1px solid var(--bd2)', background: 'var(--card)', cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--tx3)', maxWidth: '100%' }}
                    hoverStyle={{ background: 'var(--su2)' }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--warn)', flex: 'none' }} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>#{nudge.id} awaiting support reply</span>
                    <CaretRight size={10} weight="bold" color="var(--tx4)" style={{ flex: 'none' }} />
                  </Hoverable>
                )}
              </div>
            )}

            {hasMessages && (
              <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '12px 16px 0', flex: 'none', position: 'relative' }}>
                  <Hoverable
                    as="button"
                    type="button"
                    aria-label="Chat options"
                    aria-expanded={menu}
                    onClick={() => setMenu((v) => !v)}
                    style={{ width: '100%', height: 36, padding: '0 8px 0 12px', borderRadius: 8, border: '1px solid var(--bd2)', background: 'var(--card)', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}
                    hoverStyle={{ background: 'var(--su2)' }}
                  >
                    <span style={{ flex: 1, minWidth: 0, textAlign: 'left', fontSize: 14, fontWeight: 600, color: 'var(--tx)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{firstUser}</span>
                    <CaretDown size={14} color="var(--tx3)" style={{ transition: 'transform 160ms ease', transform: menu ? 'rotate(180deg)' : 'none' }} />
                  </Hoverable>
                  {menu && (
                    <>
                      <div onClick={() => setMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 20 }} />
                      <div role="menu" style={{ position: 'absolute', left: 16, right: 16, top: 'calc(100% + 6px)', zIndex: 21, background: 'var(--card)', border: '1px solid var(--bd)', borderRadius: 8, boxShadow: 'var(--elev3)', padding: 4, animation: 'riseIn 160ms ease' }}>
                        <Hoverable as="button" type="button" role="menuitem" onClick={() => { setMenu(false); toast('Conversation reported. Thanks for letting us know'); }} style={{ width: '100%', height: 32, padding: '0 8px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500, color: 'var(--tx2)' }} hoverStyle={{ background: 'var(--su2)' }}><Flag size={14} color="var(--tx3)" />Report conversation</Hoverable>
                        <Hoverable as="button" type="button" role="menuitem" onClick={() => { setMenu(false); setConfirm({ kind: 'convo' }); }} style={{ width: '100%', height: 32, padding: '0 8px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500, color: 'var(--dang-text)' }} hoverStyle={{ background: 'var(--dang-soft)' }}><Trash size={14} />Delete conversation</Hoverable>
                      </div>
                    </>
                  )}
                </div>
                <div ref={listRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto', position: 'relative' }}>
                  <div data-zlist="1" aria-live="polite" aria-relevant="additions" style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16 }}>
                    {messages.map((m) => {
                      if (m.type === 'user') {
                        return <div key={m.id} data-zuser="1" style={{ alignSelf: 'flex-end', maxWidth: 300, padding: '8px 12px', background: 'var(--brand-soft)', border: '1px solid var(--brand-border)', borderRadius: '8px 8px 0 8px', fontSize: 14, lineHeight: 1.5, color: 'var(--tx)', overflowWrap: 'anywhere', animation: 'riseIn 160ms ease' }}>{m.content}</div>;
                      }
                      if (m.isThinking) {
                        return (
                          <div key={m.id} role="status" aria-live="polite" aria-label="Loading response" style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 24 }}>
                            <Dots />
                            <span style={{ fontSize: 14, fontWeight: 500 }}>
                              <span key={m.label} style={{ display: 'inline-block', color: 'var(--tx3)', backgroundImage: 'linear-gradient(90deg, var(--tx3) 0%, var(--tx3) 35%, var(--ai-text) 50%, var(--tx3) 65%, var(--tx3) 100%)', backgroundSize: '300% 100%', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', animation: 'riseIn 200ms ease, zshimmer 1.6s linear infinite' }}>{m.label || 'Thinking…'}</span>
                            </span>
                          </div>
                        );
                      }
                      if (m.isDraftTicket) return renderDraft(m);
                      if (m.isTicketConfirmation) return renderConfirm(m);
                      return renderAssistant(m);
                    })}
                  </div>
                </div>
              </div>
            )}

            {!ctxOff && (
              <div style={{ padding: '0 16px 8px', flex: 'none' }}>
                <div style={{ height: 32, boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px 0 10px', borderRadius: 8, background: 'var(--brand-soft)', border: '1px solid var(--brand-border)' }}>
                  <Tooltip label="Responses are tailored to this page"><span tabIndex={0} aria-label="About page context" style={{ display: 'inline-flex', borderRadius: 4 }}><Info size={14} color="var(--brand)" /></span></Tooltip>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--brand)' }}>Context</span>
                  <span style={{ width: 1, height: 12, background: 'var(--brand-border)', flex: 'none' }} />
                  <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, color: 'var(--tx)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ctx}</span>
                  <Hoverable as="button" type="button" aria-label="Dismiss page context" onClick={() => setCtxOff(true)} style={{ width: 24, height: 24, flex: 'none', padding: 0, borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--brand)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} hoverStyle={{ background: 'var(--brand-softHover)' }}><X size={12} weight="bold" /></Hoverable>
                </div>
              </div>
            )}

            <div style={{ padding: '0 16px 12px', flex: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ height: 48, boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px 0 14px', background: 'var(--card)', border: `1px solid ${focus ? 'var(--brand)' : 'var(--bd2)'}`, boxShadow: focus ? '0 0 0 3px var(--ring)' : 'var(--elev2)', borderRadius: 8, transition: 'border-color 120ms ease, box-shadow 120ms ease' }}>
                <input
                  ref={inputEl}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && input.trim()) { e.preventDefault(); send(input); } }}
                  onFocus={() => setFocus(true)}
                  onBlur={() => setFocus(false)}
                  placeholder="Ask me anything"
                  aria-label="Message Zēva assistant"
                  style={{ flex: 1, minWidth: 0, height: '100%', border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 14, color: 'var(--tx)', padding: 0 }}
                />
                {generating ? (
                  <Tooltip label="Stop generating"><Hoverable as="button" type="button" aria-label="Stop generating" onClick={stop} style={{ ...iconBtn, flex: 'none', color: 'var(--tx)' }} hoverStyle={{ background: 'var(--su2)' }}><Stop size={14} weight="fill" /></Hoverable></Tooltip>
                ) : (
                  <Hoverable
                    as="button"
                    type="button"
                    aria-label="Send message"
                    disabled={!inputOk}
                    onClick={() => send(input)}
                    style={{ width: SQ, height: SQ, flex: 'none', padding: 0, borderRadius: 8, border: '1px solid transparent', background: 'var(--brand-solid)', color: '#fff', cursor: inputOk ? 'pointer' : 'not-allowed', opacity: inputOk ? 1 : 0.42, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                    hoverStyle={inputOk ? { background: 'var(--brand-solidHover)' } : undefined}
                  >
                    <ArrowUp size={16} weight="bold" />
                  </Hoverable>
                )}
              </div>
              <div style={{ fontSize: 12, color: 'var(--tx3)', textAlign: 'center' }}>Zēva can make mistakes. Check important info.</div>
            </div>
          </div>
        )}
      </aside>

      {/* ---- Ticket panel: create, or review a draft --------------------- */}
      {tk && (
        <>
          <div onClick={() => setTk(null)} style={{ position: 'fixed', top: 56, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 300, animation: 'scrimIn 160ms ease' }} />
          <div role="dialog" aria-modal="true" aria-label={tk.mode === 'review' ? 'Review support ticket' : 'Create support ticket'} style={{ position: 'fixed', top: 56, right: 0, bottom: 0, width: 400, maxWidth: '100vw', zIndex: 301, background: 'var(--card)', boxShadow: 'var(--elev3)', display: 'flex', flexDirection: 'column', animation: 'slideInRight 200ms ease' }}>
            <div style={{ height: 52, flex: 'none', boxSizing: 'border-box', padding: '0 12px 0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottom: '1px solid var(--bd2)' }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--tx)' }}>{tk.mode === 'review' ? 'Review support ticket' : 'Create support ticket'}</span>
              <Hoverable as="button" type="button" aria-label="Close" onClick={() => setTk(null)} style={{ width: 28, height: 28, padding: 0, borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--tx2)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} hoverStyle={{ background: 'var(--su2)' }}><X size={16} /></Hoverable>
            </div>
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field label="Issue title" required>
                <FocusInput inputRef={tkTitleEl} value={tk.title} aria-required onChange={(e) => setTk((t) => (t ? { ...t, title: e.target.value } : t))} placeholder="Brief summary of your issue" />
              </Field>
              <Field label="Description" required>
                <FocusArea value={tk.desc} aria-required rows={6} onChange={(e) => setTk((t) => (t ? { ...t, desc: e.target.value } : t))} placeholder="What happened, the steps that led to it and any error message you saw" style={{ minHeight: 132 }} />
              </Field>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx2)' }}>Attachments</span>
                <input ref={fileEl} type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={(e) => { const fs = Array.from(e.target.files || []).map(fmtFile); e.target.value = ''; setTk((t) => (t ? { ...t, files: t.files.concat(fs) } : t)); }} />
                <Hoverable
                  as="button"
                  type="button"
                  onClick={() => fileEl.current?.click()}
                  onDragOver={(e: React.DragEvent) => { e.preventDefault(); setDzOver(true); }}
                  onDragLeave={() => setDzOver(false)}
                  onDrop={(e: React.DragEvent) => { e.preventDefault(); const fs = Array.from(e.dataTransfer?.files || []).filter((f) => /^image\//.test(f.type)).map(fmtFile); setDzOver(false); setTk((t) => (t ? { ...t, files: t.files.concat(fs) } : t)); }}
                  style={{ minHeight: 64, padding: '10px 12px', boxSizing: 'border-box', borderRadius: 8, border: `1px dashed ${dzOver ? 'var(--brand)' : 'var(--bd3)'}`, background: dzOver ? 'var(--brand-soft)' : 'var(--su1)', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}
                  hoverStyle={{ borderColor: 'var(--brand-border)', background: 'var(--brand-soft)' }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: 'var(--tx2)' }}><Paperclip size={16} color="var(--brand)" />Attach screenshots</span>
                  <span style={{ fontSize: 12, lineHeight: '16px', color: 'var(--tx3)' }}>Click or drop files · PNG or JPG, up to 10 MB</span>
                </Hoverable>
                {tk.files.length > 0 && (
                  <div style={{ marginTop: 8, border: '1px solid var(--bd2)', borderRadius: 8, overflow: 'hidden' }}>
                    {tk.files.map((f, i) => (
                      <div key={`${f.name}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px 0 12px', height: 40, borderTop: i ? '1px solid var(--bd)' : 'none' }}>
                        <ImageIcon size={16} color="var(--tx4)" />
                        <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, color: 'var(--tx)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</span>
                        <span style={{ fontSize: 12, color: 'var(--tx3)' }}>{f.size}</span>
                        <Tooltip label={`Remove attachment ${f.name}`}>
                          <Hoverable as="button" type="button" aria-label={`Remove attachment ${f.name}`} onClick={() => setTk((t) => (t ? { ...t, files: t.files.filter((_, j) => j !== i) } : t))} style={{ width: 28, height: 28, padding: 0, borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--tx3)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} hoverStyle={{ background: 'var(--dang-soft)', color: 'var(--dang-text)' }}><Trash size={14} /></Hoverable>
                        </Tooltip>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div style={{ flex: 'none', padding: 8, borderTop: '1px solid var(--bd2)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Btn style={{ padding: '0 16px' }} onClick={() => setTk(null)}>Cancel</Btn>
              <Btn variant="primary" disabled={!tkOk} tip={tkOk ? undefined : 'Add a title and description to continue'} onClick={submitTk}>{tk.mode === 'review' ? 'Submit ticket' : 'Create ticket'}</Btn>
            </div>
          </div>
        </>
      )}

      {/* ---- Feedback dialog --------------------------------------------- */}
      {fbModal && (
        <div onClick={dismissFb} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'scrimIn 160ms ease' }}>
          <div role="dialog" aria-modal="true" aria-label="Provide feedback" onClick={(e) => e.stopPropagation()} style={{ width: 480, maxWidth: '100%', background: 'var(--card)', borderRadius: 12, boxShadow: 'var(--elev3)', animation: 'riseIn 180ms ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--bd2)' }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--tx)' }}>Provide additional feedback</span>
              <Hoverable as="button" type="button" aria-label="Close feedback dialog" onClick={dismissFb} style={{ width: 28, height: 28, padding: 0, borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--tx2)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} hoverStyle={{ background: 'var(--su2)' }}><X size={16} /></Hoverable>
            </div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--tx)' }}>Your feedback helps us improve Zēva’s responses.</div>
              <div role="group" aria-label="Issue tags" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx2)' }}>What was the issue? Select all that apply.</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {TAGS.map((t) => {
                    const on = fbModal.tags.includes(t);
                    return (
                      <Hoverable
                        as="button"
                        type="button"
                        key={t}
                        aria-pressed={on}
                        onClick={() => setFbModal((m) => (m ? { ...m, tags: m.tags.includes(t) ? m.tags.filter((x) => x !== t) : m.tags.concat(t) } : m))}
                        style={{ height: 28, padding: '0 12px', borderRadius: 999, border: `1px solid ${on ? 'var(--brand-border)' : 'var(--bd2)'}`, background: on ? 'var(--brand-soft)' : 'var(--card)', color: on ? 'var(--brand)' : 'var(--tx2)', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                        hoverStyle={{ background: on ? 'var(--brand-softHover)' : 'var(--su2)' }}
                      >
                        {on && <Check size={12} weight="bold" />}{t}
                      </Hoverable>
                    );
                  })}
                </div>
              </div>
              <Field label="Additional comments (optional)">
                <FocusArea value={fbModal.text} rows={3} onChange={(e) => setFbModal((m) => (m ? { ...m, text: e.target.value } : m))} placeholder="What could the response have done better?" />
              </Field>
            </div>
            <div style={{ padding: 8, borderTop: '1px solid var(--bd2)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Btn style={{ padding: '0 16px' }} onClick={dismissFb}>Cancel</Btn>
              <Btn variant="primary" disabled={!fbOk} tip={fbOk ? undefined : 'Pick an issue or add a comment first'} onClick={() => { const id = fbModal.id; setFbModal(null); flashThanks(id); }}>Submit feedback</Btn>
            </div>
          </div>
        </div>
      )}

      {/* ---- Delete confirmation ------------------------------------------ */}
      {confirm && (
        <div onClick={() => setConfirm(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'scrimIn 160ms ease' }}>
          <div role="alertdialog" aria-modal="true" aria-label={confirm.kind === 'hist' && (confirm.n ?? 0) > 1 ? `Delete ${confirm.n} conversations?` : 'Delete this conversation?'} onClick={(e) => e.stopPropagation()} style={{ width: 420, maxWidth: '100%', background: 'var(--card)', borderRadius: 12, boxShadow: 'var(--elev3)', animation: 'riseIn 180ms ease' }}>
            <div style={{ padding: '24px 24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12 }}>
              <span style={{ width: 36, height: 36, borderRadius: 999, background: 'var(--dang-soft)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Warning size={20} weight="fill" color="var(--dang)" /></span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--tx)' }}>{confirm.kind === 'hist' && (confirm.n ?? 0) > 1 ? `Delete ${confirm.n} conversations?` : 'Delete this conversation?'}</span>
                <span style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--tx)' }}>
                  {confirm.kind === 'hist' && (confirm.n ?? 0) > 1 ? `All messages and any ticket references in these ${confirm.n} conversations will be removed.` : 'All messages and any ticket references in this conversation will be removed.'}
                </span>
              </div>
            </div>
            <div style={{ padding: 8, borderTop: '1px solid var(--bd)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Btn style={{ padding: '0 16px' }} onClick={() => setConfirm(null)}>Cancel</Btn>
              <Btn
                variant="danger"
                onClick={() => {
                  if (confirm.kind === 'convo') { newChat(); setConfirm(null); toast('Conversation deleted'); return; }
                  const ids = new Set(sel);
                  setHist((h: any[]) => h.filter((x) => !ids.has(x.id)));
                  setSel([]); setConfirm(null);
                  toast(ids.size > 1 ? `${ids.size} conversations deleted` : 'Conversation deleted');
                }}
              >
                {confirm.kind === 'hist' && (confirm.n ?? 0) > 1 ? `Delete (${confirm.n})` : 'Delete'}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZevaDrawer;
