"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Category } from "@/types";
import type { BasicInfoFormValues } from "@/components/upload/StepBasicInfo";
import type { StepFilesValues } from "@/components/upload/StepFiles";
import { StepBasicInfo } from "@/components/upload/StepBasicInfo";
import { StepFiles } from "@/components/upload/StepFiles";
import { StepPreview } from "@/components/upload/StepPreview";
import { ToastAction } from "@/components/ui/toast";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const DRAFT_KEY = "upload-asset-draft";
const DRAFT_INTERVAL_MS = 30_000;
const STEPS = [
  { id: 1, label: "Basic Info" },
  { id: 2, label: "Files & Previews" },
  { id: 3, label: "Preview & Submit" },
] as const;

export interface UploadFormProps {
  categories: Category[];
}

interface DraftData {
  step: number;
  basicInfo: BasicInfoFormValues;
}

function loadDraft(): DraftData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as DraftData;
    if (
      typeof data?.step !== "number" ||
      data.step < 1 ||
      data.step > 3 ||
      !data.basicInfo ||
      typeof data.basicInfo !== "object"
    ) {
      return null;
    }
    return {
      step: Math.min(data.step, 3),
      basicInfo: data.basicInfo as BasicInfoFormValues,
    };
  } catch {
    return null;
  }
}

function saveDraft(step: number, basicInfo: BasicInfoFormValues | null) {
  if (typeof window === "undefined" || !basicInfo) return;
  try {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ step, basicInfo } satisfies DraftData)
    );
  } catch {
    // ignore
  }
}

function isFormFilled(
  step: number,
  basicInfo: BasicInfoFormValues | null,
  files: StepFilesValues
): boolean {
  if (step > 1) return true;
  if (basicInfo) {
    const t = String(basicInfo.title ?? "").trim();
    const d = String(basicInfo.description ?? "").trim();
    if (t !== "" || d !== "") return true;
  }
  if (files.zipFile != null || files.previewImages.length > 0) return true;
  return false;
}

export function UploadForm({ categories }: UploadFormProps) {
  const [step, setStep] = useState(1);
  const [basicInfo, setBasicInfo] = useState<BasicInfoFormValues | null>(null);
  const [files, setFiles] = useState<StepFilesValues>({
    zipFile: null,
    previewImages: [],
  });
  const draftRestoredRef = useRef(false);

  const hasUnsavedData = isFormFilled(step, basicInfo, files);

  const discardDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
    setStep(1);
    setBasicInfo(null);
    setFiles({ zipFile: null, previewImages: [] });
  }, []);

  useEffect(() => {
    const draft = loadDraft();
    if (draft && !draftRestoredRef.current) {
      draftRestoredRef.current = true;
      setBasicInfo(draft.basicInfo);
      setStep(draft.step);
      toast({
        title: "Draft restored",
        description: "Your previous draft has been restored.",
        action: (
          <ToastAction altText="Discard draft" onClick={discardDraft}>
            Discard
          </ToastAction>
        ),
      });
    }
  }, [discardDraft]);

  useEffect(() => {
    const id = setInterval(() => {
      if (basicInfo) {
        saveDraft(step, basicInfo);
      }
    }, DRAFT_INTERVAL_MS);
    return () => clearInterval(id);
  }, [step, basicInfo]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasUnsavedData) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedData]);

  const handleBasicInfoSubmit = useCallback((values: BasicInfoFormValues) => {
    setBasicInfo(values);
    setStep(2);
  }, []);

  const handleFilesBack = useCallback(() => setStep(1), []);
  const handleFilesSubmit = useCallback((values: StepFilesValues) => {
    setFiles(values);
    setStep(3);
  }, []);

  const handlePreviewBack = useCallback(() => setStep(2), []);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div
          className="flex justify-between gap-2 text-sm text-muted-foreground"
          role="status"
          aria-label={`Step ${step} of 3`}
        >
          {STEPS.map((s, index) => (
            <span
              key={s.id}
              className={cn(
                "transition-colors",
                step >= s.id ? "text-foreground font-medium" : ""
              )}
            >
              {s.label}
            </span>
          ))}
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      {step === 1 && (
        <StepBasicInfo
          categories={categories}
          defaultValues={basicInfo ?? undefined}
          onSubmit={handleBasicInfoSubmit}
        />
      )}

      {step === 2 && (
        <StepFiles
          defaultValues={files}
          onBack={handleFilesBack}
          onSubmit={handleFilesSubmit}
        />
      )}

      {step === 3 && basicInfo && (
        <StepPreview
          basicInfo={basicInfo}
          files={files}
          categories={categories}
          onBack={handlePreviewBack}
        />
      )}
    </div>
  );
}
