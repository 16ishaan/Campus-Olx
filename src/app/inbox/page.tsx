"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Mail, MessageCircle, Phone, RefreshCw } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

type InboxMessage = Readonly<{
  id: number;
  itemId: number;
  itemTitle: string;
  message: string;
  sentAt: string | null;
  buyerName: string | null;
  buyerEmail: string | null;
  buyerPhone: string | null;
}>;

type InboxApiResponse = Readonly<{
  messages?: readonly InboxMessage[];
  error?: string;
}>;

const formatSentAt = (value: string | null): string => {
  if (!value) {
    return "Unknown time";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString([], {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  });
};

export default function InboxPage() {
  const [sellerEmail, setSellerEmail] = useState("");
  const [messages, setMessages] = useState<readonly InboxMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadedOnce, setIsLoadedOnce] = useState(false);

  const loadInbox = useCallback(async (): Promise<void> => {
    const normalizedEmail = sellerEmail.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Please enter your seller email.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/messages?sellerEmail=${encodeURIComponent(normalizedEmail)}`, {
        cache: "no-store",
      });

      const payload = (await response.json()) as InboxApiResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load inbox.");
      }

      setMessages(payload.messages ?? []);
      setIsLoadedOnce(true);
    } catch (loadError) {
      setMessages([]);
      setError(loadError instanceof Error ? loadError.message : "Failed to load inbox.");
    } finally {
      setIsLoading(false);
    }
  }, [sellerEmail]);

  const messageCountLabel = useMemo(() => {
    return `${messages.length} message${messages.length === 1 ? "" : "s"}`;
  }, [messages.length]);

  return (
    <main className="min-h-screen bg-hero-radial px-4 pb-20 pt-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-[1.6rem] border border-white/10 bg-white/7 p-4 shadow-glass backdrop-blur-2xl sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-white/40">Messages</p>
              <h1 className="mt-2 text-3xl font-black tracking-[-0.05em] text-white">Inbox</h1>
              <p className="mt-2 text-sm text-white/55">Load buyer messages sent to your listings.</p>
            </div>

            <Link href="/" className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm font-semibold text-white/78 hover:bg-white/10">
              Back to marketplace
            </Link>
          </div>

          <form
            className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              void loadInbox();
            }}
          >
            <input
              type="email"
              value={sellerEmail}
              onChange={(event) => setSellerEmail(event.target.value)}
              placeholder="Enter seller email"
              className="w-full rounded-2xl border border-white/10 bg-graphite-850/70 px-4 py-3 text-sm text-white placeholder:text-white/36 outline-none focus:border-neon-blue/40"
            />

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink px-5 py-3 text-sm font-semibold text-white shadow-glow disabled:cursor-not-allowed disabled:opacity-60"
            >
              <MessageCircle className="h-4 w-4" />
              {isLoading ? "Loading..." : "Open Inbox"}
            </button>

            <button
              type="button"
              onClick={() => void loadInbox()}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/8 px-5 py-3 text-sm font-semibold text-white/86 hover:bg-white/12 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </form>

          {error ? <p className="mt-3 text-sm text-rose-200">{error}</p> : null}

          <div className="mt-8 flex items-center justify-between">
            <p className="text-sm text-white/60">{isLoadedOnce ? messageCountLabel : "No inbox loaded yet"}</p>
          </div>

          <div className="mt-4 space-y-3">
            {messages.map((entry) => (
              <motion.article
                key={entry.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[1.35rem] border border-white/10 bg-white/6 p-4"
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-lg font-semibold tracking-[-0.03em] text-white">{entry.itemTitle}</h2>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/42">{formatSentAt(entry.sentAt)}</p>
                </div>

                <p className="mt-3 text-sm leading-7 text-white/75">{entry.message}</p>

                <div className="mt-4 grid gap-2 text-sm text-white/65 sm:grid-cols-3">
                  <p className="inline-flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-white/42" />
                    {entry.buyerName ?? "Unknown buyer"}
                  </p>
                  <p className="inline-flex items-center gap-2">
                    <Mail className="h-4 w-4 text-white/42" />
                    {entry.buyerEmail ?? "No email"}
                  </p>
                  <p className="inline-flex items-center gap-2">
                    <Phone className="h-4 w-4 text-white/42" />
                    {entry.buyerPhone ?? "No phone"}
                  </p>
                </div>
              </motion.article>
            ))}

            {isLoadedOnce && !isLoading && messages.length === 0 ? (
              <div className="rounded-[1.35rem] border border-white/10 bg-white/6 p-6 text-center text-sm text-white/58">
                No messages found for this seller email.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}