// X010-B-5 file experience helpers.
//
// Pure presentation utilities for organizing file_assets into Drive-like
// groupings and translating raw metadata into clear Arabic labels. No
// authorization, RLS, or workflow logic lives here — every caller still reads
// files through the existing tenant/client-scoped repositories. These helpers
// only decide how an already-authorized file list is displayed.

export type FileVisibility =
  | "internal_only"
  | "client_visible"
  | "client_uploaded"
  | "final_delivery"
  | "contract_file"
  | "report_file"
  | "brand_asset";

export type ClientFileGroupKey = "final" | "review" | "uploaded" | "contract";

export type TeamFileGroupKey =
  | "internal"
  | "sent"
  | "clientUploaded"
  | "final";

export type GroupedFile = {
  id: string;
  name: string;
  fileType: string;
  fileSize: number;
  visibility: FileVisibility;
  versionNumber: number;
  isFinal: boolean;
  createdAt: string;
  deliverableName?: string;
};

export type FileGroup<Key extends string> = {
  key: Key;
  title: string;
  description: string;
  files: GroupedFile[];
};

const reviewVisibilities: ReadonlySet<FileVisibility> = new Set([
  "client_visible",
]);
const contractVisibilities: ReadonlySet<FileVisibility> = new Set([
  "contract_file",
  "report_file",
  "brand_asset",
]);

export const clientFileGroupOrder: ClientFileGroupKey[] = [
  "final",
  "review",
  "uploaded",
  "contract",
];

export const clientFileGroupTitles: Record<ClientFileGroupKey, string> = {
  final: "التسليمات النهائية",
  review: "ملفات للمراجعة",
  uploaded: "ملفات رفعتها",
  contract: "العقد والهوية",
};

export const clientFileGroupDescriptions: Record<ClientFileGroupKey, string> = {
  final: "الملفات النهائية المعتمدة لتسليمك.",
  review: "ملفات أرسلها فريق سماوة لاطلاعك.",
  uploaded: "الملفات التي شاركتها مع فريق سماوة.",
  contract: "وثيقة العقد وأصول الهوية المرتبطة بحسابك.",
};

const resolveClientGroup = (file: GroupedFile): ClientFileGroupKey | null => {
  if (file.visibility === "final_delivery") return "final";
  if (file.visibility === "client_uploaded") return "uploaded";
  if (reviewVisibilities.has(file.visibility)) return "review";
  if (contractVisibilities.has(file.visibility)) return "contract";
  return null;
};

export const groupClientFiles = (
  files: GroupedFile[],
): FileGroup<ClientFileGroupKey>[] => {
  const buckets = new Map<ClientFileGroupKey, GroupedFile[]>(
    clientFileGroupOrder.map((key) => [key, []]),
  );
  for (const file of files) {
    const key = resolveClientGroup(file);
    if (key) buckets.get(key)!.push(file);
  }
  return clientFileGroupOrder
    .map((key) => ({
      key,
      title: clientFileGroupTitles[key],
      description: clientFileGroupDescriptions[key],
      files: sortNewestFirst(buckets.get(key)!),
    }))
    .filter((group) => group.files.length > 0);
};

export const teamFileGroupOrder: TeamFileGroupKey[] = [
  "final",
  "sent",
  "clientUploaded",
  "internal",
];

export const teamFileGroupTitles: Record<TeamFileGroupKey, string> = {
  internal: "داخلي لفريق سماوة",
  sent: "مرسل للعميل",
  clientUploaded: "رفعه العميل",
  final: "تسليم نهائي",
};

export const teamFileGroupDescriptions: Record<TeamFileGroupKey, string> = {
  internal: "ملفات عمل داخلية لا يراها العميل.",
  sent: "ملفات معتمدة داخليًا ومتاحة للعميل للمراجعة.",
  clientUploaded: "ملفات رفعها العميل ضمن مساحة العمل.",
  final: "الملفات النهائية المُسلَّمة للعميل.",
};

const resolveTeamGroup = (file: GroupedFile): TeamFileGroupKey | null => {
  if (file.visibility === "final_delivery") return "final";
  if (file.visibility === "client_uploaded") return "clientUploaded";
  if (reviewVisibilities.has(file.visibility)) return "sent";
  if (
    file.visibility === "internal_only" ||
    contractVisibilities.has(file.visibility)
  ) {
    return "internal";
  }
  return null;
};

export const groupTeamFiles = (
  files: GroupedFile[],
): FileGroup<TeamFileGroupKey>[] => {
  const buckets = new Map<TeamFileGroupKey, GroupedFile[]>(
    teamFileGroupOrder.map((key) => [key, []]),
  );
  for (const file of files) {
    const key = resolveTeamGroup(file);
    if (key) buckets.get(key)!.push(file);
  }
  return teamFileGroupOrder
    .map((key) => ({
      key,
      title: teamFileGroupTitles[key],
      description: teamFileGroupDescriptions[key],
      files: sortNewestFirst(buckets.get(key)!),
    }))
    .filter((group) => group.files.length > 0);
};

const sortNewestFirst = (files: GroupedFile[]): GroupedFile[] =>
  [...files].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

export const isPreviewableImage = (fileType: string): boolean =>
  typeof fileType === "string" && fileType.startsWith("image/");

export const isPreviewableVideo = (fileType: string): boolean =>
  typeof fileType === "string" && fileType.startsWith("video/");

export const isPreviewablePdf = (fileType: string): boolean =>
  typeof fileType === "string" && fileType.toLowerCase() === "application/pdf";

export const canPreviewInline = (fileType: string): boolean =>
  isPreviewableImage(fileType) ||
  isPreviewableVideo(fileType) ||
  isPreviewablePdf(fileType);

export const fileTypeLabel = (fileType: string): string => {
  if (!fileType) return "ملف";
  if (isPreviewableImage(fileType)) return "صورة";
  if (isPreviewableVideo(fileType)) return "فيديو";
  if (isPreviewablePdf(fileType)) return "PDF";
  if (fileType.startsWith("text/")) return "مستند نصي";
  if (
    fileType === "application/zip" ||
    fileType === "application/x-zip-compressed"
  ) {
    return "ملف مضغوط";
  }
  return "ملف";
};

export const formatFileSize = (bytes: number): string => {
  const size = Number(bytes);
  if (!Number.isFinite(size) || size < 0) return "—";
  if (size < 1024) return `${size} بايت`;
  if (size < 1_048_576) return `${(size / 1024).toFixed(1)} كيلوبايت`;
  if (size < 1_073_741_824) return `${(size / 1_048_576).toFixed(1)} ميجابايت`;
  return `${(size / 1_073_741_824).toFixed(1)} جيجابايت`;
};

const clientFacingVisibilityLabels: Partial<Record<FileVisibility, string>> = {
  final_delivery: "تسليم نهائي",
  client_uploaded: "ملف رفعته",
  contract_file: "العقد",
  report_file: "تقرير",
  brand_asset: "أصل هوية",
};

// Client-facing surfaces must never surface raw visibility enums. For the
// review group we omit the label entirely (the group heading already explains
// the context); otherwise we return a calm Arabic label or null.
export const clientFileStatus = (file: GroupedFile): string | null => {
  if (file.visibility === "client_visible") return null;
  return clientFacingVisibilityLabels[file.visibility] ?? null;
};

export const formatDateArabic = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ar", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};
