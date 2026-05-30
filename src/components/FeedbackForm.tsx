import apiFetch from "@/api/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckCircle2, Loader2, MessageCircle, Star } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  onSuccess?: () => void;
};

type ChatMessage = {
  id: string;
  from: "bot" | "user";
  text: string;
  tone?: "info" | "success" | "error";
};

const bubbleBase =
  "max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm transition-all duration-300 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2";

const FeedbackForm = ({ onSuccess }: Props) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      from: "bot",
      text: "Hi, leave a quick message and rating. Your feedback is saved privately until approved.",
      tone: "info",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const stars = useMemo(() => Array.from({ length: 5 }, (_, index) => index + 1), []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, status]);

  const pushBotMessage = (text: string, tone: ChatMessage["tone"] = "info") => {
    setMessages((current) => [
      ...current,
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        from: "bot",
        text,
        tone,
      },
    ]);
  };

  const submit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!message.trim()) {
      setStatus("error");
      pushBotMessage("Please type a short message before sending.", "error");
      return;
    }

    setStatus("loading");
    setMessages((current) => [
      ...current,
      {
        id: `${Date.now()}-user`,
        from: "user",
        text: message.trim(),
      },
    ]);

    try {
      const res = await apiFetch("/feedbacks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, rating, message }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.message || "Submit failed");
      }

      setName("");
      setEmail("");
      setRating(5);
      setMessage("");
      setStatus("sent");
      pushBotMessage("Feedback submitted successfully. Thanks for helping us improve!", "success");
      onSuccess?.();
    } catch (err) {
      console.error(err);
      setStatus("error");
      pushBotMessage("We couldn't send that right now. Please try again later.", "error");
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border/60 bg-background/90 shadow-xl backdrop-blur-xl">
      <div className="border-b border-border/60 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-foreground">Send Feedback</h3>
              {status === "sent" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Saved
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Website-style chat panel with an internal scroll area.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto px-4 py-4">
        <div className="space-y-3">
          {messages.map((messageItem) => {
            const isBot = messageItem.from === "bot";
            return (
              <div key={messageItem.id} className={cn("flex", isBot ? "justify-start" : "justify-end") }>
                <div
                  className={cn(
                    bubbleBase,
                    isBot
                      ? messageItem.tone === "success"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : messageItem.tone === "error"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-muted/70 text-foreground border border-border/60"
                      : "bg-gradient-to-br from-emerald-600 to-teal-600 text-white"
                  )}
                >
                  {messageItem.text}
                </div>
              </div>
            );
          })}

          {status === "loading" && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-muted/60 px-4 py-3 text-sm text-muted-foreground shadow-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending feedback...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-border/60 bg-background/95 p-4">
        <form onSubmit={submit} className="space-y-3">
          <div className="rounded-2xl border border-border/60 bg-background px-3 py-3 shadow-sm transition-all duration-200 focus-within:border-emerald-500/60 focus-within:ring-2 focus-within:ring-emerald-500/10">
            <textarea
              placeholder="Type your feedback here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-28 w-full resize-none border-0 bg-transparent p-0 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input
              placeholder="Your name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 rounded-xl border border-border/60 bg-background px-3 text-sm outline-none transition-all focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/10"
            />
            <input
              placeholder="Email (optional)"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 rounded-xl border border-border/60 bg-background px-3 text-sm outline-none transition-all focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/10"
            />
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/30 px-3 py-2">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Rating</div>
              <div className="mt-1 flex items-center gap-1">
                {stars.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    className={cn(
                      "transition-all duration-200 hover:scale-110",
                      value <= rating ? "text-amber-500" : "text-muted-foreground/40"
                    )}
                    aria-label={`Set rating to ${value} stars`}
                  >
                    <Star className={cn("h-4 w-4", value <= rating && "fill-current")} />
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              className="gap-2 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-white shadow-md transition-transform hover:scale-[1.02]"
              disabled={status === "loading"}
            >
              {status === "loading" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  Send
                  <MessageCircle className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>

          <div className="min-h-8">
            {status === "sent" && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 animate-in fade-in slide-in-from-bottom-2">
                <CheckCircle2 className="h-4 w-4" />
                Feedback sent. This panel stays open so you can review or add more.
              </div>
            )}
            {status === "error" && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 animate-in fade-in slide-in-from-bottom-2">
                Failed to send feedback. Please try again.
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackForm;
