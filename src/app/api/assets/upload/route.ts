import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import type { Engine, LicenseType } from "@/types";

const ASSETS_BUCKET = "assets";
const PREVIEWS_BUCKET = "previews";
const ZIP_MAX_BYTES = 500 * 1024 * 1024; // 500 MB
const PREVIEW_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const PREVIEW_MAX_COUNT = 5;
const ZIP_EXT = ".zip";
const PREVIEW_EXTS = [".jpg", ".jpeg", ".png", ".webp"];

const engineSchema = z.enum(["Unity", "Unreal", "Godot", "Other"]);
const licenseTypeSchema = z.enum(["personal", "commercial"]);

const bodySchema = z.object({
  title: z.string().min(10, "Title 10–100 characters").max(100),
  description: z.string().min(50, "Description at least 50 characters"),
  price: z.number().min(0).max(999),
  category_id: z.string().uuid(),
  engine: engineSchema,
  license_type: licenseTypeSchema,
  tags: z.array(z.string().min(1)).max(20).default([]),
});

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "asset";
}

function getExtension(name: string): string {
  const i = name.lastIndexOf(".");
  return i === -1 ? "" : name.slice(i).toLowerCase();
}

function parseTags(formData: FormData): string[] {
  const raw = formData.get("tags") ?? formData.get("tags[]");
  if (raw != null && typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter((t): t is string => typeof t === "string");
      }
    } catch {
      return raw.trim() ? [raw.trim()] : [];
    }
  }
  const multiple = formData.getAll("tags").concat(formData.getAll("tags[]"));
  return multiple
    .filter((v): v is string => typeof v === "string")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Collect all form entries for a key (e.g. preview_images[] or preview_images). */
function getAllFiles(formData: FormData, key: string): File[] {
  const files: File[] = [];
  for (const [k, v] of formData.entries()) {
    if (v instanceof File && (k === key || k === `${key}[]`)) {
      files.push(v);
    }
  }
  return files;
}

/** Rollback: remove uploaded files from storage. */
async function rollbackUploads(
  supabase: Awaited<ReturnType<typeof createClient>>,
  bucket: string,
  paths: string[]
): Promise<void> {
  if (paths.length === 0) return;
  await supabase.storage.from(bucket).remove(paths);
}

export async function POST(request: NextRequest) {
  let uploadedAssetPaths: string[] = [];
  let uploadedPreviewPaths: string[] = [];

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "seller") {
      return NextResponse.json(
        { error: "Seller role required" },
        { status: 403 }
      );
    }

    const formData = await request.formData();

    const title = formData.get("title");
    const description = formData.get("description");
    const priceRaw = formData.get("price");
    const category_id = formData.get("category_id");
    const engine = formData.get("engine");
    const license_type = formData.get("license_type");
    const tags = parseTags(formData);

    const price =
      typeof priceRaw === "string" && priceRaw !== ""
        ? Number(priceRaw)
        : NaN;
    if (Number.isNaN(price)) {
      return NextResponse.json(
        { error: "Invalid price" },
        { status: 400 }
      );
    }

    const parsed = bodySchema.safeParse({
      title: typeof title === "string" ? title.trim() : "",
      description: typeof description === "string" ? description.trim() : "",
      price: Math.round(price),
      category_id: typeof category_id === "string" ? category_id : "",
      engine: typeof engine === "string" ? engine : undefined,
      license_type:
        typeof license_type === "string" ? license_type : undefined,
      tags,
    });

    if (!parsed.success) {
      const msg =
        parsed.error.flatten().fieldErrors.title?.[0] ||
        parsed.error.flatten().fieldErrors.description?.[0] ||
        parsed.error.flatten().fieldErrors.price?.[0] ||
        parsed.error.flatten().fieldErrors.category_id?.[0] ||
        parsed.error.flatten().fieldErrors.engine?.[0] ||
        parsed.error.flatten().fieldErrors.license_type?.[0] ||
        parsed.error.message;
      return NextResponse.json(
        { error: msg ?? "Validation failed" },
        { status: 400 }
      );
    }

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { error: "Missing or empty file (zip required)" },
        { status: 400 }
      );
    }
    const fileExt = getExtension(file.name);
    if (fileExt !== ZIP_EXT) {
      return NextResponse.json(
        { error: "Only .zip archives are allowed" },
        { status: 400 }
      );
    }
    if (file.size > ZIP_MAX_BYTES) {
      return NextResponse.json(
        { error: "Zip file must be at most 500 MB" },
        { status: 400 }
      );
    }

    const previewFiles = getAllFiles(formData, "preview_images");
    if (previewFiles.length > PREVIEW_MAX_COUNT) {
      return NextResponse.json(
        { error: `At most ${PREVIEW_MAX_COUNT} preview images` },
        { status: 400 }
      );
    }
    for (const f of previewFiles) {
      const ext = getExtension(f.name);
      if (!PREVIEW_EXTS.includes(ext)) {
        return NextResponse.json(
          { error: "Preview images: only .jpg, .png, .webp allowed" },
          { status: 400 }
        );
      }
      if (f.size > PREVIEW_MAX_BYTES) {
        return NextResponse.json(
          { error: "Each preview image must be at most 5 MB" },
          { status: 400 }
        );
      }
    }

    const supabase = await createClient();
    const assetId = crypto.randomUUID();
    const slugSuffix = nanoid(6);
    const slug = `${slugify(parsed.data.title)}-${slugSuffix}`;
    const prefix = `${user.id}/${assetId}`;

    const zipPath = `${prefix}/${file.name}`;
    const { error: zipError } = await supabase.storage
      .from(ASSETS_BUCKET)
      .upload(zipPath, file, {
        contentType: "application/zip",
        upsert: false,
      });

    if (zipError) {
      console.error("[assets/upload] zip upload:", zipError);
      return NextResponse.json(
        { error: "Failed to upload archive" },
        { status: 500 }
      );
    }
    uploadedAssetPaths.push(zipPath);

    const previewUrls: string[] = [];
    for (let i = 0; i < previewFiles.length; i++) {
      const f = previewFiles[i];
      const ext = getExtension(f.name);
      const previewPath = `${prefix}/preview_${i}${ext}`;
      const { error: previewError } = await supabase.storage
        .from(PREVIEWS_BUCKET)
        .upload(previewPath, f, {
          contentType: f.type || "image/jpeg",
          upsert: false,
        });
      if (previewError) {
        console.error("[assets/upload] preview upload:", previewError);
        await rollbackUploads(supabase, ASSETS_BUCKET, uploadedAssetPaths);
        await rollbackUploads(supabase, PREVIEWS_BUCKET, uploadedPreviewPaths);
        return NextResponse.json(
          { error: "Failed to upload preview image" },
          { status: 500 }
        );
      }
      uploadedPreviewPaths.push(previewPath);
      const {
        data: { publicUrl },
      } = supabase.storage.from(PREVIEWS_BUCKET).getPublicUrl(previewPath);
      previewUrls.push(publicUrl);
    }

    const {
      data: { publicUrl: filePublicUrl },
    } = supabase.storage.from(ASSETS_BUCKET).getPublicUrl(zipPath);

    const { error: insertError } = await supabase.from("assets").insert({
      id: assetId,
      title: parsed.data.title,
      slug,
      description: parsed.data.description,
      price: parsed.data.price,
      category_id: parsed.data.category_id,
      file_url: filePublicUrl,
      preview_images: previewUrls,
      tags: parsed.data.tags,
      engine: parsed.data.engine as Engine,
      license_type: parsed.data.license_type as LicenseType,
      is_approved: false,
      downloads_count: 0,
      rating_avg: null,
      author_id: user.id,
    });

    if (insertError) {
      console.error("[assets/upload] insert:", insertError);
      await rollbackUploads(supabase, ASSETS_BUCKET, uploadedAssetPaths);
      await rollbackUploads(supabase, PREVIEWS_BUCKET, uploadedPreviewPaths);
      return NextResponse.json(
        { error: "Failed to create asset record" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { assetId, slug },
      { status: 201 }
    );
  } catch (err) {
    console.error("[assets/upload]", err);
    const supabase = await createClient();
    await rollbackUploads(supabase, ASSETS_BUCKET, uploadedAssetPaths);
    await rollbackUploads(supabase, PREVIEWS_BUCKET, uploadedPreviewPaths);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
