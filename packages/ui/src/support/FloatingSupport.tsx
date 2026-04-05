"use client";

import { useState, useRef, useEffect, useCallback, type FormEvent } from "react";

type SupportMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
};

type FloatingSupportProps = {
  divisionName: string;
  accent?: string;
  apiEndpoint?: string;
  knowledge?: Array<{ question: string; answer: string }>;
  supportUrl?: string;
  supportEmail?: string;
};

const DEFAULT_KNOWLEDGE: Array<{ question: string; answer: string }> = [
  {
    question: "what is henryco",
    answer:
      "Henry & Co. is a diversified Nigerian enterprise operating across fabric care, marketplace, property, logistics, studio, jobs, and learning. We serve individuals, businesses, and communities through our integrated digital platform at henrycogroup.com.",
  },
  {
    question: "how do i contact support",
    answer:
      "You can reach our support team through the support page on your account dashboard, by emailing the relevant division directly, or by using this chat to describe your issue. If I cannot help, I will connect you with a human agent.",
  },
  {
    question: "how do i create an account",
    answer:
      'Visit account.henrycogroup.com and click "Sign up". You can register with your email address. Once registered, your account works across all HenryCo divisions.',
  },
  {
    question: "what services does henryco offer",
    answer:
      "HenryCo offers: Fabric Care (laundry and garment services), Marketplace (buy and sell products), Property (find and list properties), Logistics (delivery and dispatch), Studio (creative and design services), Jobs (find and post jobs), and Learn (courses and training).",
  },
  {
    question: "how do i track my order",
    answer:
      'If you placed an order through our Marketplace or Care service, visit the relevant section in your account dashboard. You can also use the "Track" feature on marketplace.henrycogroup.com with your order number.',
  },
  {
    question: "how does payment work",
    answer:
      "HenryCo supports multiple payment methods depending on the division. You can view your payment history and manage payment methods from your account dashboard at account.henrycogroup.com/payments.",
  },
  {
    question: "can i sell on the marketplace",
    answer:
      'Yes! Visit marketplace.henrycogroup.com and apply to become a vendor. You will need to complete verification before your products appear publicly. Go to the vendor portal via "Vendor sign-in" on the marketplace.',
  },
  {
    question: "how do i post a job",
    answer:
      "Employers can post jobs through jobs.henrycogroup.com. Sign in to the recruiter portal, verify your organization, and create job listings. Jobs go through a review process before being published.",
  },
];

function matchKnowledge(
  query: string,
  knowledge: Array<{ question: string; answer: string }>
): string | null {
  const normalizedQuery = query.toLowerCase().trim();
  const scored = knowledge.map((entry) => {
    const words = entry.question.toLowerCase().split(/\s+/);
    const matches = words.filter((word) => normalizedQuery.includes(word));
    return { entry, score: matches.length / words.length };
  });

  scored.sort((a, b) => b.score - a.score);
  if (scored[0] && scored[0].score >= 0.4) {
    return scored[0].entry.answer;
  }

  return null;
}

export function FloatingSupport({
  divisionName,
  accent = "#C9A227",
  knowledge = DEFAULT_KNOWLEDGE,
  supportUrl,
  supportEmail,
}: FloatingSupportProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing]);

  function addMessage(role: SupportMessage["role"], content: string) {
    setMessages((previous) => [
      ...previous,
      { id: crypto.randomUUID(), role, content, timestamp: Date.now() },
    ]);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const text = input.trim();
    if (!text) return;

    setInput("");
    addMessage("user", text);
    setTyping(true);

    await new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 400));

    const knowledgeAnswer = matchKnowledge(text, knowledge);

    if (knowledgeAnswer) {
      addMessage("assistant", knowledgeAnswer);
    } else {
      const escalation = supportUrl
        ? `I am not sure about that specific question. You can contact our support team here: ${supportUrl}`
        : supportEmail
          ? `I am not sure about that one. Please email ${supportEmail} and our team will help you directly.`
          : "I am not sure about that specific question. Please reach out to our support team for more detailed help.";
      addMessage("assistant", escalation);
    }

    setTyping(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Close help" : "Get help"}
        className="fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all hover:scale-105 active:scale-95"
        style={{ backgroundColor: accent }}
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M15 5L5 15M5 5l10 10" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12c0 1.82.487 3.53 1.338 5.002L2 22l4.998-1.338A9.954 9.954 0 0012 22z"
              fill="white"
              fillOpacity="0.9"
            />
            <circle cx="8" cy="12" r="1" fill={accent} />
            <circle cx="12" cy="12" r="1" fill={accent} />
            <circle cx="16" cy="12" r="1" fill={accent} />
          </svg>
        )}
      </button>

      {open && (
        <div className="fixed bottom-20 right-5 z-50 flex h-[28rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">
          <div className="flex items-center gap-3 px-4 py-3" style={{ backgroundColor: accent }}>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">
              H
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-white">{divisionName} Help</div>
              <div className="text-xs text-white/70">Ask us anything</div>
            </div>
            <button
              onClick={close}
              aria-label="Close"
              className="rounded-lg p-1 text-white/70 transition hover:bg-white/20 hover:text-white"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                <div className="text-2xl">Hi</div>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  How can we help?
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  Ask about services, orders, bookings, or account flows.
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    message.role === "user"
                      ? "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                      : "border border-zinc-100 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex justify-start">
                <div className="flex gap-1 rounded-2xl border border-zinc-100 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-300 [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-300 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-300 [animation-delay:300ms]" />
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-zinc-100 p-3 dark:border-zinc-700">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Type a message..."
                className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:focus:border-zinc-600"
              />
              <button
                type="submit"
                disabled={!input.trim() || typing}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white transition disabled:opacity-40"
                style={{ backgroundColor: accent }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            {supportUrl && (
              <a
                href={supportUrl}
                className="mt-2 block text-center text-xs text-zinc-400 transition hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                Need more help? Contact support directly
              </a>
            )}
          </form>
        </div>
      )}
    </>
  );
}
