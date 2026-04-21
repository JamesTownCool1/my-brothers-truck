'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Card, Avatar } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Input';
import { StarRating } from '@/components/ui/StarRating';
import { formatRelative } from '@/lib/utils';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewerId: string;
  reviewer: { id: string; name: string; image: string | null };
}

/**
 * ReviewSection — appears on completed jobs only. Two jobs:
 *   1. Shows existing reviews for this job (both directions)
 *   2. Prompts the current user to leave their own review if they haven't
 */
export function ReviewSection({
  jobId,
  hasReviewed,
  counterpartName,
  reviews,
}: {
  jobId: string;
  hasReviewed: boolean;
  counterpartName: string;
  reviews: Review[];
}) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) {
      toast.error('Tap a star to give a rating');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment: comment || undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? 'Failed to submit');
      }
      toast.success('Thanks for your review!');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="p-6">
      <h2 className="font-display text-xl font-bold mb-4">Reviews</h2>

      {/* Existing reviews */}
      <div className="space-y-4">
        {reviews.length === 0 && (
          <div className="text-sm text-ink-500 italic">
            No reviews yet. Be the first.
          </div>
        )}
        {reviews.map((r) => (
          <div key={r.id} className="border-b border-ink-100 last:border-0 pb-4 last:pb-0">
            <div className="flex items-center gap-3 mb-1">
              <Avatar src={r.reviewer.image} name={r.reviewer.name} size={32} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{r.reviewer.name}</div>
                <div className="text-xs text-ink-500">{formatRelative(r.createdAt)}</div>
              </div>
              <StarRating value={r.rating} size={14} readOnly />
            </div>
            {r.comment && <p className="text-sm text-ink-800 mt-2">{r.comment}</p>}
          </div>
        ))}
      </div>

      {/* Review form */}
      {!hasReviewed && (
        <form onSubmit={onSubmit} className="mt-6 pt-6 border-t-2 border-dashed border-ink-200">
          <div className="font-display text-lg font-bold mb-1">
            How was your experience with {counterpartName}?
          </div>
          <p className="text-sm text-ink-600 mb-4">
            Your rating helps build trust in the community.
          </p>

          <div className="mb-4">
            <StarRating value={rating} onChange={setRating} size={32} />
          </div>

          <Textarea
            label="Comment (optional)"
            placeholder="What went well? What could have been better?"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={1000}
          />

          <Button type="submit" className="mt-4" loading={submitting}>
            Submit review
          </Button>
        </form>
      )}
    </Card>
  );
}
