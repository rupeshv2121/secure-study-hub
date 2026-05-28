import apiFetch from "@/api/client";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";

type Props = {
  onSuccess?: () => void;
  closeAfterMs?: number;
};

type ChatMessage = { from: "bot" | "user"; text: string };

const FeedbackForm = ({ onSuccess, closeAfterMs = 1200 }: Props) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");

  const [messages, setMessages] = useState<ChatMessage[]>([
    { from: "bot", text: "Hi! Tell us about your experience — your feedback helps improve the platform." },
  ]);
  const [showSuccess, setShowSuccess] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, showSuccess]);

  const submit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!message.trim()) {
      setStatus("error");
      return;
    }

    setStatus("loading");

    // optimistic UI: show user message immediately
    setMessages((m) => [...m, { from: "user", text: message }]);

    try {
      const res = await apiFetch("/feedbacks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, rating, message }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = json?.message || "Submit failed";
        throw new Error(msg);
      }

      // clear form inputs
      setName("");
      setEmail("");
      setRating(5);
      setMessage("");
      setStatus("sent");

      // show bot confirmation bubble
      setMessages((m) => [...m, { from: "bot", text: "Thanks — your feedback was submitted. We appreciate it!" }]);
      setShowSuccess(true);

      // auto-close after a short delay (so user sees success)
      setTimeout(() => {
        setShowSuccess(false);
        if (onSuccess) onSuccess();
      }, closeAfterMs);
    } catch (err) {
      console.error(err);
      setStatus("error");
      setMessages((m) => [...m, { from: "bot", text: "Sorry, we couldn't send that — please try again later." }]);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-auto p-4 space-y-3 rounded-lg">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] ${
              m.from === "bot"
                ? "bg-white/90 self-start text-sm text-muted-foreground rounded-tr-xl rounded-bl-xl px-4 py-3"
                : "bg-emerald-600 text-white self-end rounded-tl-xl rounded-br-xl px-4 py-3"
            }`}
          >
            {m.text}
          </div>
        ))}
      </div>

      <form onSubmit={submit} className="p-3 border-t bg-transparent">
        <div className="flex gap-2 items-start">
          <div className="flex-1">
            <textarea
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-md border px-3 py-2 h-24 resize-none"
            />
            <div className="mt-2 flex items-center gap-2">
              <input
                placeholder="Your name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-md border px-2 py-1 text-sm"
              />
              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="rounded-md border px-2 py-1 text-sm"
              >
                {[5, 4, 3, 2, 1].map((r) => (
                  <option key={r} value={r}>
                    {r}★
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col items-center justify-end">
            <Button type="button" onClick={() => submit()} className="px-4 py-2 mb-2" disabled={status === "loading"}>
              {status === "loading" ? "Sending..." : "Send"}
            </Button>
          </div>
        </div>
        {showSuccess && (
          <div className="mt-3 flex items-center gap-3 text-green-600">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center animate-pulse">✓</div>
            <div className="text-sm">Feedback sent — closing...</div>
          </div>
        )}
        {status === "error" && <div className="mt-2 text-sm text-red-600">Failed to send feedback. Try again.</div>}
      </form>
    </div>
  );
};

export default FeedbackForm;
