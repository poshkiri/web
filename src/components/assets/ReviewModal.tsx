"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const MAX_STARS = 5;
const COMMENT_MIN = 10;
const COMMENT_MAX = 500;

export interface ReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetId: string | null;
  assetTitle?: string | null;
  onSuccess?: () => void;
}

export function ReviewModal({
  open,
  onOpenChange,
  assetId,
  assetTitle,
  onSuccess,
}: ReviewModalProps) {
  const [rating, setRating] = React.useState(0);
  const [hoverRating, setHoverRating] = React.useState(0);
  const [comment, setComment] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const displayRating = hoverRating || rating;
  const commentLen = comment.trim().length;
  const commentValid = commentLen >= COMMENT_MIN && commentLen <= COMMENT_MAX;

  const resetForm = React.useCallback(() => {
    setRating(0);
    setHoverRating(0);
    setComment("");
    setError(null);
  }, []);

  React.useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open, resetForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetId || rating < 1 || rating > MAX_STARS) {
      setError("Please select a rating (1–5 stars).");
      return;
    }
    if (!commentValid) {
      setError(`Comment must be between ${COMMENT_MIN} and ${COMMENT_MAX} characters.`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId,
          rating,
          comment: comment.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to submit review");
        return;
      }
      onSuccess?.();
      onOpenChange(false);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Leave a review</DialogTitle>
        </DialogHeader>
        {assetTitle && (
          <p className="text-sm text-muted-foreground">{assetTitle}</p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Rating</Label>
            <div className="flex gap-1" role="group" aria-label="Rating">
              {Array.from({ length: MAX_STARS }, (_, i) => {
                const value = i + 1;
                const filled = value <= displayRating;
                return (
                  <button
                    key={value}
                    type="button"
                    className={cn(
                      "rounded p-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                      filled ? "text-amber-400" : "text-muted-foreground hover:text-amber-400/80"
                    )}
                    onClick={() => setRating(value)}
                    onMouseEnter={() => setHoverRating(value)}
                    onMouseLeave={() => setHoverRating(0)}
                    aria-label={`${value} star${value === 1 ? "" : "s"}`}
                    aria-pressed={rating === value}
                  >
                    <Star
                      className={cn("h-8 w-8", filled && "fill-current")}
                      aria-hidden
                    />
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="review-comment">
              Comment <span className="text-muted-foreground">({COMMENT_MIN}–{COMMENT_MAX} characters)</span>
            </Label>
            <Textarea
              id="review-comment"
              placeholder="Share your experience with this asset..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="resize-none"
              disabled={submitting}
              minLength={COMMENT_MIN}
              maxLength={COMMENT_MAX}
            />
            <p
              className={cn(
                "text-xs",
                commentLen > 0 && !commentValid
                  ? "text-destructive"
                  : "text-muted-foreground"
              )}
            >
              {commentLen} / {COMMENT_MAX}
            </p>
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !commentValid}>
              {submitting ? "Submitting…" : "Submit review"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
