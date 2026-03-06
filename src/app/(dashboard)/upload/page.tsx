import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/server";
import { UploadForm } from "./UploadForm";

export const dynamic = "force-dynamic";

async function getCategories() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, name, slug, icon")
    .order("name");
  return data ?? [];
}

export default async function UploadPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const categories = await getCategories();

  return (
    <div className="container space-y-6 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload asset</h1>
        <p className="text-muted-foreground">
          Add a new asset to the marketplace. Complete all three steps.
        </p>
      </div>
      <UploadForm categories={categories} />
    </div>
  );
}
