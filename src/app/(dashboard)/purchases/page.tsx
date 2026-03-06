import { redirect } from "next/navigation";
import Link from "next/link";
import { Library, ShoppingBag } from "lucide-react";
import { getCurrentUser } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { getPurchasesForUser } from "@/lib/assets-server";
import { Button } from "@/components/ui/button";
import { PurchasesSection } from "@/components/assets/PurchasesSection";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ search?: string; category?: string }>;

async function getCategories() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("name");
  return data ?? [];
}

export default async function PurchasesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const search = typeof params.search === "string" ? params.search : "";
  const category = typeof params.category === "string" ? params.category : "";

  const [purchases, categories] = await Promise.all([
    getPurchasesForUser(user.id, { search, category }),
    getCategories(),
  ]);

  return (
    <div className="container space-y-6 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Library</h1>
        <p className="text-muted-foreground">
          Your purchased assets. Download or leave a review.
        </p>
      </div>

      {purchases.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-4 py-16 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <Library className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="mb-2 text-xl font-semibold">No purchases yet</h2>
          <p className="mb-6 max-w-sm text-sm text-muted-foreground">
            You haven&apos;t bought any assets. Browse the marketplace to find
            something you like.
          </p>
          <Button asChild size="lg">
            <Link href="/assets">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Browse Assets
            </Link>
          </Button>
        </div>
      ) : (
        <PurchasesSection
          purchases={purchases}
          categories={categories}
          initialSearch={search}
          initialCategory={category}
        />
      )}
    </div>
  );
}
