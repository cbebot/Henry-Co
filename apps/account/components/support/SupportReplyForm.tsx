"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2 } from "lucide-react";

export default function SupportReplyForm({ threadId }: { threadId: string }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);

    try {
      await fetch("/api/support/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thread_id: threadId, body: message }),
      });
      setMessage("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="acct-input flex-1"
        placeholder="Type your reply..."
        required
      />
      <button
        type="submit"
        disabled={loading || !message.trim()}
        className="acct-button-primary rounded-xl px-4"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
      </button>
    </form>
  );
}
