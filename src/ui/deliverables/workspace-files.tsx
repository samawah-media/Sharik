"use client";

import Uppy from "@uppy/core";
import Tus from "@uppy/tus";
import Dashboard from "@uppy/react/dashboard";
import "@uppy/core/css/style.min.css";
import "@uppy/dashboard/css/style.min.css";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DeliverableSafeSummary } from "@/modules/deliverables/deliverable-repository";
import type { DeliverableFileWorkspace } from "@/modules/deliverables/deliverable-workspace";
import type { DeliverableUploadAttemptWorkspace } from "@/modules/deliverables/deliverable-workspace";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  createWorkspaceFileDownload,
  createWorkspaceFilePreview,
  beginWorkspaceFileUpload,
  cancelWorkspaceFileUpload,
  failWorkspaceFileUpload,
  listWorkspaceFileUploadAttempts,
  registerWorkspaceFile,
  retryWorkspaceFileUpload,
  stageWorkspaceFileForClientReview,
  updateWorkspaceFileUploadProgress,
} from "@/server/actions/deliverable-workspace-actions";
import { Button } from "@/ui/core/button";

const allowedTypes = [
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "video/mp4", "video/webm", "application/pdf", "text/plain",
] as const;
const noUploadAttempts: DeliverableUploadAttemptWorkspace[] = [];

const arabicUppyLocale = {
  pluralize: (count: number) => {
    if (count === 0) return 0;
    if (count === 1) return 1;
    if (count === 2) return 2;
    const mod100 = count % 100;
    if (mod100 >= 3 && mod100 <= 10) return 3;
    if (mod100 >= 11 && mod100 <= 99) return 4;
    return 5;
  },
  strings: {
    addMoreFiles: "إضافة المزيد من الملفات",
    addingMoreFiles: "جارٍ إضافة الملفات",
    allowAccessDescription: "السماح بالوصول إلى الكاميرا لالتقاط الصور",
    allowAccessTitle: "السماح بالوصول إلى الكاميرا",
    authenticateWith: "المصادقة عبر %{pluginName}",
    authenticateWithTitle: "الرجاء المصادقة مع %{pluginName} لاختيار الملفات",
    back: "رجوع",
    browse: "استعراض الملفات",
    browseFiles: "استعراض الملفات",
    cancel: "إلغاء",
    caption: "تعليق",
    chooseFile: "اختر ملفًا",
    compressingImages: "جارٍ ضغط الصور…",
    confirmModalTitleV2: "تأكيد",
    copyLink: "نسخ الرابط",
    copyLinkToClipboard: "تم نسخ الرابط إلى الحافظة",
    dashboardTitleV2: "رفع الملفات",
    dashboardWindowTitle: "نافذة رفع الملفات",
    dataUploadedOnDuration: "تم رفع %{size} خلال %{duration}",
    discard: "تجاهل",
    done: "تم",
    dropHereOr: "أفلِت الملفات هنا أو %{browse}",
    dropHint: "أفلِت ملفاتك هنا للرفع",
    editing: "جارٍ التعديل",
    emptyFolderAdded: "لا توجد ملفات صالحة في المجلد المضاف",
    encoding: "جارٍ الترميز…",
    enterTextToSaveIt: "أدخل النص لحفظه",
    enterDescription: "أدخل وصفًا",
    error: "خطأ",
    exceedSize: "حجم الملف يتجاوز الحد المسموح",
    failedToFetch: "فشل جلب البيانات من الخادم",
    filesXOfY: "%{complete} من %{total}",
    filter: "تصفية",
    finishEditing: "إنهاء التعديل",
    folderAdded: "تمت إضافة %{smart_count} ملف من المجلد",
    generatingThumbnails: "جارٍ إنشاء المعينات…",
    importFrom: "استيراد من %{name}",
    link: "رابط",
    loading: "جارٍ التحميل…",
    logOut: "تسجيل الخروج",
    micNotAllowed: "لا يمكن الوصول إلى الميكروفون",
    missingRequiredMetaField: "بيانات غير مكتملة",
    missingRequiredMetaFieldOnMacro: "بيانات غير مكتملة",
    myDevice: "جهازي",
    noCameraDescription: "لا توجد كاميرا متاحة",
    noFilesFound: "لا توجد ملفات",
    noInternetConnection: "لا يوجد اتصال بالإنترنت",
    pause: "إيقاف مؤقت",
    pauseUpload: "إيقاف الرفع مؤقتًا",
    paused: "متوقف مؤقتًا",
    poweredBy: "مدعوم بواسطة",
    processingXFiles: "جارٍ معالجة %{smart_count} ملف",
    record: "تسجيل",
    recording: "جارٍ التسجيل",
    recordingLength: "مدة التسجيل %{video_duration}",
    resume: "استئناف",
    resumeUpload: "استئناف الرفع",
    retry: "إعادة المحاولة",
    retryUpload: "إعادة محاولة الرفع",
    save: "حفظ",
    saveChanges: "حفظ التغييرات",
    selectAll: "تحديد الكل",
    selectX: "تحديد %{count}",
    signInWithGoogle: "تسجيل الدخول عبر Google",
    skip: "تخطٍ",
    smile: "ابتسامة",
    startCapturing: "بدء التقاط الشاشة",
    startRecording: "بدء التسجيل",
    stopCapturing: "إيقاف الالتقاط",
    stopRecording: "إيقاف التسجيل",
    streamActive: "البث نشط",
    submitCapturedFiles: "إرسال الملفات الملتقطة",
    takePicture: "التقاط صورة",
    timeLeft: "متبقٍ %{time}",
    timedOut: "انتهت المهلة",
    unselectFile: "إلغاء تحديد الملف",
    upload: "رفع",
    uploadComplete: "اكتمل الرفع",
    uploadFailed: "فشل الرفع",
    uploadPaused: "الرفع متوقف مؤقتًا",
    uploadXFiles: "رفع %{smart_count} ملف",
    uploadXNewFiles: "رفع +%{smart_count}",
    uploading: "جارٍ الرفع…",
    uploadingXFiles: "جارٍ رفع %{smart_count} ملف",
    xFilesSelected: "تم تحديد %{smart_count} ملفات",
    xMoreFilesSelected: "تم تحديد +%{smart_count} إضافي",
    xTimeLeft: "متبقٍ %{time}",
    youCanOnlyUploadFileTypes: "يسمح فقط برفع: %{types}",
    youCanOnlyUploadX: "يسمح فقط برفع %{count} ملف",
    youHaveToAtLeastSelectX: "يجب تحديد ملف واحد على الأقل",
  },
};

type UploadRowStatus =
  | "queued"
  | "uploading"
  | "registering"
  | "ready"
  | "failed";

type UploadRow = {
  id: string;
  attemptId?: string;
  fileId?: string;
  storagePath?: string;
  runId?: string;
  idempotencyKey?: string;
  retryOfId?: string;
  replacesFileId?: string;
  name: string;
  type: string;
  size: number;
  progress: number;
  status: UploadRowStatus;
};

export type WorkspaceUploadSafetyState = "settled" | "uploading" | "failed";

const uploadStatusLabel: Record<UploadRowStatus, string> = {
  queued: "جاهز للرفع",
  uploading: "جارٍ الرفع",
  registering: "جارٍ ربط الملف بالنسخة",
  ready: "تم الرفع والربط",
  failed: "فشل الرفع أو الربط",
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} بايت`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} كيلوبايت`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} ميجابايت`;
};

export function WorkspaceFileUpload({
  deliverable,
  currentVersionId,
  canPublishClientFile,
  files,
  uploadAttempts,
  onMutated,
  onUploadAttemptCancelled,
  onSafetyStateChange,
}: {
  deliverable: DeliverableSafeSummary;
  currentVersionId?: string;
  canPublishClientFile: boolean;
  files?: DeliverableFileWorkspace[];
  uploadAttempts?: DeliverableUploadAttemptWorkspace[];
  onMutated?: () => void;
  onUploadAttemptCancelled?: (attemptId: string) => void;
  onSafetyStateChange?: (state: WorkspaceUploadSafetyState) => void;
}) {
  const router = useRouter();
  const [uppy, setUppy] = useState<Uppy>();
  const [feedback, setFeedback] = useState<string>();
  const [uploadRows, setUploadRows] = useState<UploadRow[]>([]);
  const [dismissedAttemptIds, setDismissedAttemptIds] = useState<string[]>([]);
  const [recoveredAttempts, setRecoveredAttempts] =
    useState<DeliverableUploadAttemptWorkspace[]>();
  const [visibility, setVisibility] = useState<"internal_only" | "client_visible" | "final_delivery">("internal_only");
  const [replacesFileId, setReplacesFileId] = useState("");
  const [retrySource, setRetrySource] =
    useState<DeliverableUploadAttemptWorkspace>();
  const visibilityRef = useRef(visibility);
  const replacesFileIdRef = useRef(replacesFileId);
  const retrySourceRef = useRef(retrySource);
  const persistedProgressRef = useRef(new Map<string, number>());
  const persistedAttemptIdsRef = useRef(new Set<string>());
  const failedAttemptIdsRef = useRef(new Set<string>());
  const failurePromisesRef = useRef(new Map<string, Promise<boolean>>());
  const effectiveUploadAttempts =
    recoveredAttempts ?? uploadAttempts ?? noUploadAttempts;
  const canUploadClientVisible = [
    "waiting_client_approval",
    "client_approved",
    "ready_for_delivery",
    "delivered",
  ].includes(deliverable.status);
  const canUploadFinal = [
    "client_approved",
    "ready_for_delivery",
    "delivered",
  ].includes(deliverable.status);

  useEffect(() => {
    visibilityRef.current = visibility;
  }, [visibility]);

  useEffect(() => {
    replacesFileIdRef.current = replacesFileId;
  }, [replacesFileId]);

  useEffect(() => {
    retrySourceRef.current = retrySource;
  }, [retrySource]);

  useEffect(() => {
    if (!currentVersionId) return;
    let active = true;
    void listWorkspaceFileUploadAttempts({
      clientId: deliverable.clientId,
      deliverableId: deliverable.id,
      versionId: currentVersionId,
    }).then((result) => {
      if (active && result.ok) {
        setRecoveredAttempts(
          result.attempts as DeliverableUploadAttemptWorkspace[],
        );
      }
    });
    return () => {
      active = false;
    };
  }, [currentVersionId, deliverable.clientId, deliverable.id]);

  const restoredUploadRows = useMemo(
    () =>
      effectiveUploadAttempts
        .filter(
          (attempt) =>
            attempt.versionId === currentVersionId &&
            ["pending", "failed"].includes(attempt.status) &&
            !dismissedAttemptIds.includes(attempt.id),
        )
        .map<UploadRow>((attempt) => ({
          id: `persistent-${attempt.id}`,
          attemptId: attempt.id,
          fileId: attempt.fileId,
          storagePath: attempt.storagePath,
          runId: attempt.runId,
          retryOfId: attempt.retryOfId,
          replacesFileId: attempt.replacesFileId,
          name: attempt.name,
          type: attempt.fileType,
          size: attempt.fileSize,
          progress: attempt.progressPercentage,
          status: attempt.status === "pending" ? "uploading" : "failed",
        })),
    [currentVersionId, dismissedAttemptIds, effectiveUploadAttempts],
  );
  const displayedUploadRows = useMemo(
    () => [
      ...restoredUploadRows,
      ...uploadRows.filter(
        (row) =>
          !row.attemptId ||
          !restoredUploadRows.some(
            (restored) => restored.attemptId === row.attemptId,
          ),
      ),
    ],
    [restoredUploadRows, uploadRows],
  );

  useEffect(() => {
    const state: WorkspaceUploadSafetyState = displayedUploadRows.some((row) =>
      ["queued", "uploading", "registering"].includes(row.status),
    )
      ? "uploading"
      : displayedUploadRows.some((row) => row.status === "failed")
        ? "failed"
        : "settled";
    onSafetyStateChange?.(state);
  }, [displayedUploadRows, onSafetyStateChange]);

  useEffect(() => {
    if (!currentVersionId) return;
    let active = true;
    let instance: Uppy | undefined;
    const supabase = createSupabaseBrowserClient();
    const setup = async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const endpoint = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      if (!token || !endpoint || !apiKey || !active) {
        setFeedback("جلسة الرفع غير متاحة. حدّث الصفحة وسجّل الدخول مجددًا.");
        return;
      }
      const created = new Uppy({
        autoProceed: false,
        locale: arabicUppyLocale,
        restrictions: { maxFileSize: 104_857_600, maxNumberOfFiles: 5, allowedFileTypes: [...allowedTypes] },
        onBeforeFileAdded: (file) => {
          const retry = retrySourceRef.current;
          if (
            retry &&
            (retry.name !== file.name ||
              retry.fileType !== file.type ||
              retry.fileSize !== file.size)
          ) {
            setFeedback(
              "اختر الملف نفسه بالاسم والنوع والحجم لإعادة المحاولة، أو ألغِ المحاولة القديمة صراحةً.",
            );
            return false;
          }
          const extension = file.name.includes(".") ? `.${file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "")}` : "";
          const objectName = `${deliverable.tenantId}/${deliverable.clientId}/${deliverable.id}/${currentVersionId}/${crypto.randomUUID()}${extension}`;
          return {
            ...file,
            meta: {
              ...file.meta,
              bucketName: "deliverable-assets",
              objectName,
              contentType: file.type,
              cacheControl: "3600",
              attemptId: crypto.randomUUID(),
              fileId: crypto.randomUUID(),
              runId: `s015-upload-run-${crypto.randomUUID()}`,
              idempotencyKey: `s015-upload-${crypto.randomUUID()}`,
              retryOfId: retry?.id ?? "",
              replacesFileId:
                retry?.replacesFileId ?? replacesFileIdRef.current,
            },
          };
        },
      }).use(Tus, {
        endpoint: `${endpoint}/storage/v1/upload/resumable`,
        headers: { authorization: `Bearer ${token}`, apikey: apiKey },
        removeFingerprintOnSuccess: true,
        retryDelays: [0, 1_000, 3_000, 5_000],
      });
      instance = created;
      const persistFailure = async (
        attemptId: string,
        failureCode: string,
        progressPercentage: number,
      ) => {
        if (
          !persistedAttemptIdsRef.current.has(attemptId) ||
          failedAttemptIdsRef.current.has(attemptId)
        ) {
          return failedAttemptIdsRef.current.has(attemptId);
        }
        const pendingFailure = failurePromisesRef.current.get(attemptId);
        if (pendingFailure) {
          return pendingFailure;
        }
        const failurePromise = failWorkspaceFileUpload({
          attemptId,
          failureCode,
          progressPercentage,
        })
          .then((failure) => {
            if (failure.ok) {
              failedAttemptIdsRef.current.add(attemptId);
            }
            return failure.ok;
          })
          .finally(() => {
            failurePromisesRef.current.delete(attemptId);
          });
        failurePromisesRef.current.set(attemptId, failurePromise);
        return failurePromise;
      };
      created.addPreProcessor(async (fileIds) => {
        for (const fileIdToUpload of fileIds) {
          const file = created.getFile(fileIdToUpload);
          const attemptId = String(file.meta.attemptId ?? "");
          const fileId = String(file.meta.fileId ?? "");
          const storagePath = String(file.meta.objectName ?? "");
          const runId = String(file.meta.runId ?? "");
          const idempotencyKey = String(file.meta.idempotencyKey ?? "");
          const retryOfId = String(file.meta.retryOfId ?? "");
          const replacementId = String(file.meta.replacesFileId ?? "");
          const persisted = retryOfId
            ? await retryWorkspaceFileUpload({
                failedAttemptId: retryOfId,
                attemptId,
                fileId,
                storagePath,
                runId,
                idempotencyKey,
              })
            : await beginWorkspaceFileUpload({
                attemptId,
                fileId,
                clientId: deliverable.clientId,
                deliverableId: deliverable.id,
                versionId: currentVersionId,
                bucketId: "deliverable-assets",
                storagePath,
                fileName: file.name,
                fileType: file.type as (typeof allowedTypes)[number],
                fileSize: file.size ?? 0,
                visibility: visibilityRef.current,
                isFinal: visibilityRef.current === "final_delivery",
                replacesFileId: replacementId || null,
                runId,
                idempotencyKey,
              });
          if (!persisted.ok) {
            onSafetyStateChange?.("failed");
            setUploadRows((rows) =>
              rows.map((row) =>
                row.id === file.id ? { ...row, status: "failed" } : row,
              ),
            );
            setFeedback(
              `تعذر تسجيل محاولة رفع ${file.name} قبل النقل؛ لم يبدأ إرسال الملف.`,
            );
            throw new Error("durable_upload_attempt_required");
          }
          if (retryOfId) {
            setDismissedAttemptIds((ids) => [...ids, retryOfId]);
          }
          persistedAttemptIdsRef.current.add(attemptId);
          setUploadRows((rows) =>
            rows.map((row) =>
              row.id === file.id
                ? {
                    ...row,
                    attemptId,
                    fileId,
                    storagePath,
                    runId,
                    idempotencyKey,
                    retryOfId: retryOfId || undefined,
                    replacesFileId: replacementId || undefined,
                    status: "uploading",
                  }
                : row,
            ),
          );
        }
        setRetrySource(undefined);
      });
      created.on("file-added", (file) => {
        setFeedback(undefined);
        setUploadRows((rows) => [
          ...rows.filter((row) => row.id !== file.id),
          {
            id: file.id,
            attemptId: String(file.meta.attemptId ?? ""),
            fileId: String(file.meta.fileId ?? ""),
            storagePath: String(file.meta.objectName ?? ""),
            runId: String(file.meta.runId ?? ""),
            idempotencyKey: String(file.meta.idempotencyKey ?? ""),
            retryOfId: String(file.meta.retryOfId ?? "") || undefined,
            replacesFileId:
              String(file.meta.replacesFileId ?? "") || undefined,
            name: file.name,
            type: file.type || "نوع غير محدد",
            size: file.size ?? 0,
            progress: 0,
            status: "queued",
          },
        ]);
      });
      created.on("file-removed", (file) => {
        const attemptId = String(file.meta.attemptId ?? "");
        if (persistedAttemptIdsRef.current.has(attemptId)) {
          void cancelWorkspaceFileUpload({
            attemptId,
            reason: "cancelled_from_upload_queue",
          }).then((cancelled) => {
            if (cancelled.ok) {
              onMutated?.();
              router.refresh();
            }
          });
          setFeedback(`أُلغيت محاولة رفع ${file.name} وسُجل الإلغاء.`);
        } else {
          setFeedback(`أزيل الملف ${file.name} قبل بدء النقل.`);
        }
        setUploadRows((rows) => rows.filter((row) => row.id !== file.id));
      });
      created.on("upload", () => {
        onSafetyStateChange?.("uploading");
        setUploadRows((rows) =>
          rows.map((row) =>
            row.status === "queued" || row.status === "failed"
              ? { ...row, status: "uploading" }
              : row,
          ),
        );
      });
      created.on("upload-progress", (file, progress) => {
        if (!file) return;
        const bytesTotal = progress.bytesTotal ?? 0;
        const percentage =
          bytesTotal > 0
            ? Math.round((progress.bytesUploaded / bytesTotal) * 100)
            : 0;
        setUploadRows((rows) =>
          rows.map((row) =>
            row.id === file.id
              ? { ...row, progress: percentage, status: "uploading" }
              : row,
          ),
        );
        const attemptId = String(file.meta.attemptId ?? "");
        const persistedProgress = Math.min(
          90,
          Math.floor(percentage / 10) * 10,
        );
        if (
          attemptId &&
          persistedProgress >
            (persistedProgressRef.current.get(attemptId) ?? -1)
        ) {
          persistedProgressRef.current.set(attemptId, persistedProgress);
          void updateWorkspaceFileUploadProgress({
            attemptId,
            progressPercentage: persistedProgress,
          });
        }
      });
      created.on("upload-success", (file) => {
        if (!file) return;
        setUploadRows((rows) =>
          rows.map((row) =>
            row.id === file.id
              ? { ...row, progress: 100, status: "registering" }
              : row,
          ),
        );
      });
      created.on("complete", async (result) => {
        let saved = 0;
        let allFailuresPersisted = true;
        for (const file of result.successful ?? []) {
          const path = String(file.meta.objectName ?? "");
          const attemptId = String(file.meta.attemptId ?? "");
          const registered = await registerWorkspaceFile({
            fileId: String(file.meta.fileId ?? ""),
            clientId: deliverable.clientId,
            deliverableId: deliverable.id,
            versionId: currentVersionId,
            bucketId: "deliverable-assets",
            storagePath: path,
            fileName: file.name,
            fileType: file.type as (typeof allowedTypes)[number],
            fileSize: file.size ?? 0,
            visibility: visibilityRef.current,
            isFinal: visibilityRef.current === "final_delivery",
            idempotencyKey: String(file.meta.idempotencyKey ?? ""),
          });
          if (registered.ok) {
            saved += 1;
            setUploadRows((rows) =>
              rows.map((row) =>
                row.id === file.id ? { ...row, status: "ready" } : row,
              ),
            );
          } else {
            await persistFailure(
              attemptId,
              "metadata_registration_failed",
              99,
            );
            setUploadRows((rows) =>
              rows.map((row) =>
                row.id === file.id ? { ...row, status: "failed" } : row,
              ),
            );
          }
        }
        for (const file of result.failed ?? []) {
          if (!file) continue;
          const failurePersisted = await persistFailure(
            String(file.meta.attemptId ?? ""),
            "storage_transfer_failed",
            Math.min(
              99,
              Math.round(file.progress.percentage ?? 0),
            ),
          );
          allFailuresPersisted = allFailuresPersisted && failurePersisted;
          setUploadRows((rows) =>
            rows.map((row) =>
              row.id === file.id ? { ...row, status: "failed" } : row,
            ),
          );
        }
        const failedFiles = (result.failed ?? []).filter(Boolean);
        if (failedFiles.length > 0) {
          onSafetyStateChange?.("failed");
          const failedFile = failedFiles[0];
          setFeedback(
            failedFile && allFailuresPersisted
              ? `فشل رفع ${failedFile.name}. لم يُربط الملف بالمخرج؛ أعد المحاولة أو ألغِه بوضوح.`
              : "تعذر تثبيت حالة الفشل؛ ما زالت المحاولة pending وتحجب الإرسال حتى إعادة المحاولة أو الإلغاء.",
          );
        } else {
          onSafetyStateChange?.(
            saved === (result.successful?.length ?? 0) ? "settled" : "failed",
          );
          setFeedback(
            saved === (result.successful?.length ?? 0)
              ? `تم حفظ ${saved} ملف بنجاح.`
              : "تعذر حفظ بعض الملفات وحُذفت الرفوعات غير المسجلة تلقائيًا.",
          );
        }
        if (saved > 0) {
          onMutated?.();
          router.refresh();
        }
      });
      created.on("upload-error", (file) => {
        onSafetyStateChange?.("failed");
        if (!file) {
          setFeedback("فشل الرفع. لم يُربط أي ملف ناقص بالمخرج.");
          return;
        }
        void persistFailure(
          String(file.meta.attemptId ?? ""),
          "storage_transfer_failed",
          Math.min(
            99,
            Math.round(file.progress.percentage ?? 0),
          ),
        ).then((failurePersisted) => {
          setFeedback(
            failurePersisted
              ? `فشل رفع ${file.name}. لم يُربط الملف بالمخرج؛ أعد المحاولة أو ألغِه بوضوح.`
              : "تعذر تثبيت حالة الفشل؛ ما زالت المحاولة pending وتحجب الإرسال حتى إعادة المحاولة أو الإلغاء.",
          );
        });
        setUploadRows((rows) =>
          rows.map((row) =>
            row.id === file.id ? { ...row, status: "failed" } : row,
          ),
        );
      });
      if (active) setUppy(created);
    };
    void setup();
    return () => {
      active = false;
      instance?.destroy();
    };
  }, [
    currentVersionId,
    deliverable.clientId,
    deliverable.id,
    deliverable.tenantId,
    onMutated,
    onSafetyStateChange,
    router,
  ]);

  const cancelAttempt = async (row: UploadRow) => {
    if (!row.attemptId) return;
    const result = await cancelWorkspaceFileUpload({
      attemptId: row.attemptId,
      reason: "explicit_user_cancel_after_upload_interruption",
    });
    if (!result.ok) {
      setFeedback("تعذر إلغاء محاولة الرفع. حدّث الصفحة وحاول مجددًا.");
      return;
    }
    setUploadRows((rows) => rows.filter((candidate) => candidate.id !== row.id));
    setDismissedAttemptIds((ids) =>
      row.attemptId ? [...ids, row.attemptId] : ids,
    );
    setFeedback(
      result.cleanup === "completed"
        ? `أُلغيت محاولة رفع ${row.name} وسُجل القرار في سجل التدقيق.`
        : `أُلغيت محاولة رفع ${row.name} وسُجل القرار، لكن تنظيف الملف المؤقت يحتاج متابعة يدوية.`,
    );
    onUploadAttemptCancelled?.(row.attemptId);
  };

  const requestRetry = (row: UploadRow) => {
    const restored = effectiveUploadAttempts.find(
      (attempt) => attempt.id === row.attemptId && attempt.status === "failed",
    );
    if (!restored) {
      setFeedback("حدّث الصفحة قبل إعادة المحاولة.");
      return;
    }
    setRetrySource(restored);
    setVisibility(
      restored.visibility === "client_uploaded"
        ? "internal_only"
        : restored.visibility,
    );
    setFeedback(
      `اختر ${restored.name} نفسه من أداة الرفع، ثم ابدأ الرفع لإكمال إعادة المحاولة المدققة.`,
    );
  };

  if (!currentVersionId) return <p className="text-sm text-muted">احفظ نسخة أولًا لرفع ملفات مرتبطة بها.</p>;
  return (
    <div className="grid gap-3 rounded-xl border border-border bg-background p-4">
      {canPublishClientFile ? (
        <label className="grid gap-1 text-sm font-semibold">
          استخدام الملف
          <select
            className="min-h-11 rounded-lg border border-border bg-surface px-3"
            onChange={(event) =>
              setVisibility(event.target.value as typeof visibility)
            }
            value={visibility}
          >
            <option value="internal_only">داخلي — الافتراضي</option>
            {canUploadClientVisible ? (
              <option value="client_visible">إضافة إلى مراجعة العميل الحالية</option>
            ) : null}
            {canUploadFinal ? (
              <option value="final_delivery">تسليم نهائي</option>
            ) : null}
          </select>
          {!canUploadClientVisible ? (
            <span className="text-xs font-normal leading-5 text-muted">
              ارفع الملف داخليًا، ثم اعتمده وجهّزه للعميل من قائمة الملفات.
            </span>
          ) : null}
        </label>
      ) : null}
      {files?.length ? (
        <label className="grid gap-1 text-sm font-semibold">
          استبدال ملف حالي (اختياري)
          <select
            className="min-h-11 rounded-lg border border-border bg-surface px-3"
            onChange={(event) => setReplacesFileId(event.target.value)}
            value={replacesFileId}
          >
            <option value="">إضافة ملف جديد دون استبدال</option>
            {files
              .filter((file) => file.versionId === currentVersionId)
              .map((file) => (
                <option key={file.id} value={file.id}>
                  {file.name}
                </option>
              ))}
          </select>
          <span className="text-xs font-normal leading-5 text-muted">
            عند نجاح البديل فقط، يُستبعد الملف القديم من تأكيد الإرسال. فشل البديل
            يبقي الإرسال محجوبًا حتى إعادة المحاولة أو الإلغاء الصريح.
          </span>
        </label>
      ) : null}
      {uppy ? <Dashboard height={300} proudlyDisplayPoweredByUppy={false} uppy={uppy} width="100%" /> : <p className="text-sm text-muted">جارٍ تجهيز الرفع الآمن…</p>}
      {displayedUploadRows.length ? (
        <ul aria-label="حالة رفع الملفات" className="grid gap-2">
          {displayedUploadRows.map((row) => (
            <li
              className="grid gap-2 rounded-lg border border-border bg-surface p-3 text-sm"
              key={row.id}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="min-w-0 break-all font-semibold" dir="auto">
                  {row.name}
                </span>
                <span className={row.status === "failed" ? "text-danger" : "text-muted"}>
                  {uploadStatusLabel[row.status]}
                </span>
              </div>
              <p className="text-xs text-muted">
                {row.type} · {formatFileSize(row.size)} · {row.progress}%
              </p>
              <div
                aria-label={`تقدم رفع ${row.name}`}
                aria-valuemax={100}
                aria-valuemin={0}
                aria-valuenow={row.progress}
                className="h-2 overflow-hidden rounded-full bg-border"
                role="progressbar"
              >
                <div
                  className={`h-full ${row.status === "failed" ? "bg-danger" : "bg-accent"}`}
                  style={{ width: `${row.progress}%` }}
                />
              </div>
              {row.attemptId &&
              (row.status === "failed" || row.status === "uploading") ? (
                <div className="flex flex-wrap gap-2">
                  {row.status === "failed" ? (
                    <Button onClick={() => requestRetry(row)} type="button" variant="secondary">
                      إعادة المحاولة
                    </Button>
                  ) : null}
                  <Button
                    onClick={() => void cancelAttempt(row)}
                    type="button"
                    variant="secondary"
                  >
                    إلغاء المحاولة وتسجيل القرار
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      {feedback ? <p aria-live="polite" className="text-sm text-muted">{feedback}</p> : null}
    </div>
  );
}

export function WorkspaceFileClientReviewControl({
  canStage,
  deliverable,
  file,
  onMutated,
  versionId,
}: {
  canStage: boolean;
  deliverable: DeliverableSafeSummary;
  file: DeliverableFileWorkspace;
  onMutated: () => void;
  versionId: string;
}) {
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<string>();
  const eligible =
    canStage &&
    deliverable.status === "internally_approved" &&
    deliverable.requiresClientApproval &&
    file.versionId === versionId &&
    file.visibility === "internal_only" &&
    file.fileSize > 0 &&
    !file.isFinal;

  if (!eligible) return null;

  const stage = async () => {
    setPending(true);
    setFeedback(undefined);
    const result = await stageWorkspaceFileForClientReview({
      clientId: deliverable.clientId,
      deliverableId: deliverable.id,
      versionId,
      fileId: file.id,
      idempotencyKey: `s015-stage-review-${deliverable.id}-${versionId}-${file.id}`,
    });
    setPending(false);
    if (!result.ok) {
      setFeedback("تعذر تجهيز الملف للعميل. راجع النسخة الحالية والصلاحية.");
      return;
    }
    setFeedback("الملف جاهز للإرسال للعميل، لكنه ما زال مخفيًا حتى تضغط «إرسال للعميل».");
    onMutated();
  };

  return (
    <div className="grid gap-1">
      <Button disabled={pending} onClick={stage} size="sm" type="button">
        {pending ? "جارٍ التجهيز…" : "تجهيز للعميل"}
      </Button>
      {feedback ? (
        <p aria-live="polite" className="text-xs leading-5 text-muted">
          {feedback}
        </p>
      ) : null}
    </div>
  );
}

export function WorkspaceFileDownload({ fileId }: { fileId: string }) {
  const [feedback, setFeedback] = useState<string>();
  const download = async () => {
    const result = await createWorkspaceFileDownload(fileId);
    if (!result.ok) {
      setFeedback("تعذر تنزيل الملف أو انتهت صلاحية الوصول.");
      return;
    }
    window.open(result.url, "_blank", "noopener,noreferrer");
  };
  return <div><Button onClick={download} size="sm" type="button">تنزيل آمن</Button>{feedback ? <p aria-live="polite" className="mt-1 text-xs text-danger">{feedback}</p> : null}</div>;
}

export function WorkspaceFilePreview({
  fileId,
  fileType,
  label,
}: {
  fileId: string;
  fileType: string;
  label: string;
}) {
  const [url, setUrl] = useState<string>();
  const [feedback, setFeedback] = useState<string>();
  const preview = async () => {
    const result = await createWorkspaceFileDownload(fileId);
    if (!result.ok) {
      setFeedback("المعاينة غير متاحة لهذا الدور أو انتهت صلاحيتها.");
      return;
    }
    setUrl(result.url);
  };
  return (
    <div className="grid gap-2">
      <Button onClick={preview} size="sm" type="button">معاينة</Button>
      {/* Signed object URLs are short-lived and cannot be safely delegated to the Next image optimizer. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {url && fileType.startsWith("image/") ? <img alt={label} className="max-h-80 w-full rounded-lg border border-border object-contain" src={url} /> : null}
      {url && fileType.startsWith("video/") ? <video aria-label={label} className="max-h-80 w-full rounded-lg border border-border" controls preload="metadata" src={url} /> : null}
      {url && fileType === "application/pdf" ? <iframe className="h-80 w-full rounded-lg border border-border" src={url} title={label} /> : null}
      {url && !fileType.startsWith("image/") && !fileType.startsWith("video/") && fileType !== "application/pdf" ? <p className="rounded-lg bg-surface p-3 text-sm text-muted">لا توجد معاينة مرئية لهذا النوع. استخدم التنزيل الآمن.</p> : null}
      {feedback ? <p aria-live="polite" className="text-xs text-danger">{feedback}</p> : null}
    </div>
  );
}

export function WorkspaceInlineMedia({
  fileId,
  fileType,
  fit = "cover",
  label,
}: {
  fileId: string;
  fileType: string;
  fit?: "cover" | "contain";
  label: string;
}) {
  const [url, setUrl] = useState<string>();
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let active = true;
    void createWorkspaceFilePreview(fileId).then((preview) => {
      if (!active) return;
      if (preview.ok) setUrl(preview.url);
      else setUnavailable(true);
    });
    return () => {
      active = false;
    };
  }, [fileId]);

  if (unavailable) {
    return (
      <p className="grid min-h-36 place-items-center p-4 text-center text-xs text-muted">
        تعذرت معاينة الأصل المرئي بأمان.
      </p>
    );
  }
  if (!url) {
    return (
      <div
        aria-label="جارٍ تحميل المعاينة"
        className="min-h-36 animate-pulse bg-border/30 motion-reduce:animate-none"
      />
    );
  }
  if (fileType.startsWith("image/")) {
    return (
      // Signed object URLs are short-lived and cannot use the image optimizer.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt={label}
        className={
          fit === "contain"
            ? "max-h-[32rem] min-h-56 w-full bg-background object-contain"
            : "h-full min-h-36 w-full object-cover"
        }
        src={url}
      />
    );
  }
  return (
    <video
      aria-label={label}
      className={
        fit === "contain"
          ? "max-h-[32rem] min-h-56 w-full bg-background object-contain"
          : "h-full min-h-36 w-full object-cover"
      }
      controls
      preload="metadata"
      src={url}
    />
  );
}
