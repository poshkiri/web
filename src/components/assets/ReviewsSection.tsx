"use client";

import * as React from "react";
import { ReviewsList } from "@/components/assets/ReviewsList";
import { ReviewForm } from "@/components/assets/ReviewForm";

export interface ReviewsSectionProps {
  assetId: string;
  currentUserId: string | null;
  isAdmin?: boolean;
  /** Show review form only when user has purchased and has not yet left a review */
  canReview: boolean;
}

export function ReviewsSection({
  assetId,
  currentUserId,
  isAdmin = false,
  canReview,
}: ReviewsSectionProps) {
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold">Reviews</h2>
      <ReviewForm
        assetId={assetId}
        canReview={canReview}
        onSubmitSuccess={() => setRefreshTrigger((t) => t + 1)}
      />
      <ReviewsList
        assetId={assetId}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
        refreshTrigger={refreshTrigger}
      />
    </section>
  );
}
