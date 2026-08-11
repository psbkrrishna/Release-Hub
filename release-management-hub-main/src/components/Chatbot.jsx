import { useEffect, useRef, useState } from "react";
import { PiPaperPlaneRight } from "react-icons/pi";
import { useFeatureStore } from "@/components/FeatureStore";

const SUGGESTIONS = ["Which features need my CSM?", "What is a feature flag?", "How does deferment work?"];

const Chatbot = () => {
  const { visibleFeatures } = useFeatureStore();
  const [messages, setMessages] = useState([
    { from: "assistant", text: "Hi — I can explain anything in this release: enablement status, feature flags, deferment rules or utilization." },
  ]);
  const [draft, setDraft] = useState("");
  const bodyRef = useRef(null);

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const answer = (question) => {
    const t = question.toLowerCase();
    if (t.includes("csm") || t.includes("contact")) {
      const needsCsm = visibleFeatures.filter((f) => f.status === "Contact CSM");
      return `${needsCsm.length} feature${needsCsm.length === 1 ? "" : "s"} need CSM support to enable: ${
        needsCsm.map((f) => f.title).join(", ") || "none"
      }. Your CSM turns these on for you.`;
    }
    if (t.includes("gate") || t.includes("flag")) {
      return "A feature flag is the internal switch that controls a feature. It is required when creating a feature so the platform knows what to turn on.";
    }
    if (t.includes("defer")) {
      return "Deferrable features can be postponed until the Deferrable Till Date — automatically 90 days after the production enablement date. Non Deferrable features cannot be postponed.";
    }
    if (t.includes("utilization") || t.includes("adoption")) {
      const enabled = visibleFeatures.filter((f) => f.isEnabled).length;
      const pct = visibleFeatures.length ? Math.round((100 * enabled) / visibleFeatures.length) : 0;
      return `Platform utilization is enabled features over total: ${enabled} of ${visibleFeatures.length} (${pct}%).`;
    }
    return "I can help with enablement status, feature flags, deferment rules and utilization. Try one of the suggestions above.";
  };

  const send = (text) => {
    const question = (text ?? draft).trim();
    if (!question) return;
    setMessages((m) => [...m, { from: "user", text: question }]);
    setDraft("");
    window.setTimeout(() => {
      setMessages((m) => [...m, { from: "assistant", text: answer(question) }]);
    }, 260);
  };

  return (
    <>
      <div ref={bodyRef} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[88%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
              m.from === "user"
                ? "self-end rounded-br-sm bg-blue-600 text-white"
                : "self-start rounded-bl-sm bg-gray-100 text-grey-500"
            }`}
          >
            {m.text}
          </div>
        ))}
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-grey-400 hover:border-blue-300 hover:bg-[#E7EEF6] hover:text-[#07315A]"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-end gap-2 border-t border-gray-200 p-3">
        <input
          value={draft}
          placeholder="Ask a question…"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          className="h-10 flex-1 rounded-lg border border-gray-300 px-3 text-sm text-grey-500 outline-none focus:border-blue-500"
        />
        <button
          onClick={() => send()}
          aria-label="Send"
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          <PiPaperPlaneRight size={18} />
        </button>
      </div>
    </>
  );
};

export default Chatbot;
