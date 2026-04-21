'use client';

import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { Avatar } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn, formatRelative } from '@/lib/utils';

interface Message {
  id: string;
  body: string;
  createdAt: string;
  sender: { id: string; name: string; image: string | null };
}

/**
 * ChatWindow — in-app messaging for a job.
 *
 * - Polls /api/jobs/[id]/messages every 4 seconds with ?since= for incremental updates.
 * - Optimistically appends the user's own message before the server ack
 *   lands, so the UI feels instant.
 * - Auto-scrolls to the bottom when new messages arrive.
 */
export function ChatWindow({
  jobId,
  currentUserId,
  initialMessages,
}: {
  jobId: string;
  currentUserId: string;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const latestRef = useRef<string | null>(
    initialMessages[initialMessages.length - 1]?.createdAt ?? null
  );

  // Poll for new messages
  useEffect(() => {
    let cancelled = false;
    async function tick() {
      if (cancelled) return;
      try {
        const url = latestRef.current
          ? `/api/jobs/${jobId}/messages?since=${encodeURIComponent(latestRef.current)}`
          : `/api/jobs/${jobId}/messages`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.messages.length > 0) {
            setMessages((prev) => {
              const seen = new Set(prev.map((m) => m.id));
              const newOnes = data.messages.filter((m: Message) => !seen.has(m.id));
              if (newOnes.length === 0) return prev;
              latestRef.current = newOnes[newOnes.length - 1].createdAt;
              return [...prev, ...newOnes];
            });
          }
        }
      } catch {
        /* ignore transient errors */
      }
    }
    const id = setInterval(tick, 4000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [jobId]);

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || sending) return;

    setSending(true);
    // Optimistic UI — stamp a temp id we'll swap when the server responds
    const optimisticId = `tmp-${Date.now()}`;
    const optimistic: Message = {
      id: optimisticId,
      body: trimmed,
      createdAt: new Date().toISOString(),
      sender: { id: currentUserId, name: 'You', image: null },
    };
    setMessages((prev) => [...prev, optimistic]);
    setBody('');

    try {
      const res = await fetch(`/api/jobs/${jobId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: trimmed }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticId ? data.message : m))
        );
        latestRef.current = data.message.createdAt;
      } else {
        // Rollback on failure
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-[500px] rounded-2xl border-2 border-ink-200 bg-white overflow-hidden">
      <div className="border-b border-ink-200 px-4 py-3">
        <div className="font-display text-lg font-bold">Messages</div>
        <div className="text-xs text-ink-500">
          Updates every few seconds • Be kind, be clear
        </div>
      </div>

      <div className="flex-1 overflow-y-auto nice-scroll p-4 space-y-3 bg-[color:var(--background)]">
        {messages.length === 0 && (
          <div className="text-center text-sm text-ink-500 py-8">
            No messages yet. Say hi to get the ball rolling.
          </div>
        )}
        {messages.map((m) => {
          const mine = m.sender.id === currentUserId;
          return (
            <div
              key={m.id}
              className={cn('flex gap-2 items-end', mine && 'flex-row-reverse')}
            >
              {!mine && <Avatar src={m.sender.image} name={m.sender.name} size={28} />}
              <div className={cn('max-w-[75%] flex flex-col', mine && 'items-end')}>
                <div
                  className={cn(
                    'rounded-2xl px-3.5 py-2 text-[15px] leading-snug',
                    mine
                      ? 'bg-ink-900 text-white rounded-br-sm'
                      : 'bg-white border border-ink-200 text-ink-900 rounded-bl-sm'
                  )}
                >
                  {m.body}
                </div>
                <div className="mt-0.5 text-[10px] text-ink-500 px-2">
                  {formatRelative(m.createdAt)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="border-t border-ink-200 p-3 flex gap-2 bg-white">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Type a message..."
          maxLength={2000}
          className="flex-1 h-11 rounded-full border-2 border-ink-200 bg-white px-4 text-[15px] focus:border-brand-500 focus:outline-none"
        />
        <Button type="submit" loading={sending} disabled={!body.trim()} size="md" className="shrink-0 w-11 px-0">
          <Send size={16} />
        </Button>
      </form>
    </div>
  );
}
