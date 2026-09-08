# UI1 attributable review diff

Baseline: dirty checkout captured before UI1, HEAD 115fb9af5a43b7cbd2a8855c568f89bb86f9fa21. Not a clean-HEAD diff. Refreshed after independent review corrections, 2026-09-08.

## src/app/globals.css

```diff
--- pre-UI1/src/app/globals.css
+++ current/src/app/globals.css
 @import "tailwindcss";

 :root {
+  --background: #f7f8fc;
+  --foreground: #242136;
+  --muted: #635f72;
+  --border: #e6e3ee;
-  --background: #fbfafc;
-  --foreground: #1c1a22;
-  --muted: #6f6877;
-  --border: #e7e1eb;
   --surface: #ffffff;
+  --accent: #6340df;
+  --accent-soft: #eee9ff;
-  --accent: #6d4aff;
-  --accent-soft: #ece7ff;
   --success: #1a7f64;
   --warning: #a86600;
   --danger: #b42318;
+  --focus: #6340df;
+  --shell: #ffffff;
+  --shell-foreground: #242136;
+  --shell-muted: #635f72;
+  --shell-border: #e6e3ee;
-  --focus: #5b35d5;
-  --shell: #24212f;
-  --shell-foreground: #ffffff;
-  --shell-muted: #bdb6c8;
-  --shell-border: #3b3547;
 }

 @theme inline {
   --color-background: var(--background);
   --color-foreground: var(--foreground);
   --color-muted: var(--muted);
   --color-border: var(--border);
   --color-surface: var(--surface);
   --color-card: var(--surface);
   --color-accent: var(--accent);
   --color-accent-soft: var(--accent-soft);
   --color-primary: var(--accent);
   --color-primary-foreground: #ffffff;
   --color-success: var(--success);
   --color-warning: var(--warning);
   --color-danger: var(--danger);
   --color-focus: var(--focus);
   --color-shell: var(--shell);
   --color-shell-foreground: var(--shell-foreground);
   --color-shell-muted: var(--shell-muted);
   --color-shell-border: var(--shell-border);
   --font-sans: "Segoe UI", Tahoma, Arial, ui-sans-serif, system-ui, sans-serif;
   --font-mono: "Cascadia Mono", Consolas, ui-monospace, monospace;
 }

 * {
   box-sizing: border-box;
 }

 html {
   background: var(--background);
   color: var(--foreground);
 }

 body {
   min-height: 100vh;
   margin: 0;
   background: var(--background);
   color: var(--foreground);
   text-align: right;
 }

 a {
   color: inherit;
   text-decoration: none;
 }

+/* Keep sidebar colors above the unlayered anchor reset without changing content links. */
+[data-product-shell] > div > aside nav a {
+  color: var(--shell-muted);
+}
+
+[data-product-shell] > div > aside nav a:hover {
+  color: var(--shell-foreground);
+}
+
+[data-product-shell] > div > aside nav a[aria-current="page"] {
+  color: var(--accent);
+}
+
+[data-product-shell] > div > aside a:focus-visible {
+  outline-color: var(--focus);
+}
+
+[data-product-shell] > div > aside nav a:focus-visible {
+  outline-offset: -3px;
+}
+
 :focus-visible {
   outline: 3px solid color-mix(in srgb, var(--focus) 70%, white);
   outline-offset: 3px;
 }

 @media (prefers-reduced-motion: reduce) {
   *,
   *::before,
   *::after {
     scroll-behavior: auto !important;
     transition-duration: 0.01ms !important;
     animation-duration: 0.01ms !important;
   }
 }

```

## src/ui/layout/product-shell.tsx

```diff
--- pre-UI1/src/ui/layout/product-shell.tsx
+++ current/src/ui/layout/product-shell.tsx
 "use client";

 import {
   BriefcaseBusiness,
   ChevronLeft,
   FileText,
   LayoutDashboard,
   Users,
   UserRoundPlus,
 } from "lucide-react";
 import Link from "next/link";
 import { usePathname } from "next/navigation";
 import type { ReactNode } from "react";
 import { cn } from "@/ui/core/utils";
 import { SignOutButton } from "@/ui/auth/sign-out-button";
 import {
   NotificationBell,
   type NotificationBellData,
 } from "@/ui/notifications/notification-bell";

 const emptyNotifications: NotificationBellData = { unreadCount: 0, recent: [] };

 const shellIcons = {
   briefcase: BriefcaseBusiness,
   dashboard: LayoutDashboard,
   file: FileText,
   invite: UserRoundPlus,
   users: Users,
 } as const;

 export type ProductShellNavigationItem = {
   href: string;
   label: string;
   icon?: keyof typeof shellIcons;
 };

 const defaultNavigationItems = [
   { href: "/portfolio", label: "لوحة الإدارة", icon: "dashboard" },
   { href: "/clients", label: "العملاء", icon: "briefcase" },
   { href: "/members", label: "الفريق", icon: "users" },
   { href: "/invitations/internal", label: "الدعوات", icon: "invite" },
 ] satisfies ProductShellNavigationItem[];

 const segmentLabels: Record<string, string> = {
   clients: "العملاء",
   contracts: "العقد والباقة",
   packages: "الباقة",
   deliverables: "المخرجات",
   board: "لوحة العمل",
   commercial: "المتابعة / SLA",
   new: "إضافة",
   edit: "تعديل",
   members: "الفريق",
   invitations: "الدعوات",
   internal: "دعوة داخلية",
   notifications: "الإشعارات",
   onboard: "إضافة عميل جديد",
   portfolio: "لوحة الإدارة",
   work: "مهامي",
   readiness: "الجاهزية",
   r007: "R-007",
 };

 const uuidLikePattern =
   /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

 function isActive(pathname: string, href: string) {
   if (href === "/clients") {
     return pathname === href || pathname.startsWith("/clients/");
   }

   return pathname === href || pathname.startsWith(`${href}/`);
 }

 function breadcrumbLabel(segment: string, previousSegment?: string) {
   if (segmentLabels[segment]) {
     return segmentLabels[segment];
   }

   if (uuidLikePattern.test(segment)) {
     if (previousSegment === "clients") {
       return "العميل";
     }

     if (previousSegment === "contracts") {
       return "العقد";
     }

     return "التفاصيل";
   }

   if (segment.startsWith("client_")) {
     return "العميل";
   }

   if (segment.startsWith("contract_")) {
     return "العقد";
   }

   return segment;
 }

 function Breadcrumbs({
   pathname,
   rootHref,
   rootLabel,
 }: {
   pathname: string;
   rootHref: string;
   rootLabel: string;
 }) {
   const segments = pathname.split("/").filter(Boolean);

   if (segments.length === 0) {
     return null;
   }

   const rootSegment = rootHref.split("/").filter(Boolean).at(-1);
   const crumbs = segments.map((segment, index) => ({
     href: `/${segments.slice(0, index + 1).join("/")}`,
     label:
       segment === rootSegment
         ? rootLabel
         : breadcrumbLabel(segment, segments[index - 1]),
   }));

   return (
     <nav
       aria-label="مسار الصفحة"
       className="min-w-0 max-w-full overflow-x-auto p-0.5 text-xs text-muted lg:overflow-visible lg:p-0"
     >
       <ol className="flex w-max min-w-full items-center gap-1 lg:w-auto lg:min-w-0 lg:flex-wrap">
         <li>
           <Link
             className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-3 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
             href={rootHref}
           >
             {rootLabel}
           </Link>
         </li>
         {crumbs.map((crumb, index) => {
           const isLast = index === crumbs.length - 1;

           return (
             <li
               className="flex min-w-0 shrink-0 items-center gap-1 lg:shrink"
               key={crumb.href}
             >
               <ChevronLeft aria-hidden="true" size={14} />
               {isLast ? (
                 <span className="truncate font-medium text-foreground">
                   {crumb.label}
                 </span>
               ) : (
                 <Link
                   className="inline-flex min-h-11 min-w-11 max-w-full items-center justify-center truncate rounded-md px-3 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                   href={crumb.href}
                 >
                   {crumb.label}
                 </Link>
               )}
             </li>
           );
         })}
       </ol>
     </nav>
   );
 }

 export function ProductShell({
   breadcrumbRootHref = "/clients",
   breadcrumbRootLabel = "الإدارة",
   children,
   homeHref = "/clients",
   navigationItems = defaultNavigationItems,
   navigationLabel = "تنقل الإدارة",
   notifications = emptyNotifications,
 }: {
   breadcrumbRootHref?: string;
   breadcrumbRootLabel?: string;
   children: ReactNode;
   homeHref?: string;
   navigationItems?: ProductShellNavigationItem[];
   navigationLabel?: string;
   notifications?: NotificationBellData;
 }) {
   const pathname = usePathname() ?? "/clients";

   return (
     <section
       className="min-h-screen bg-background text-foreground"
       data-product-shell="management"
       data-testid="product-shell"
       dir="rtl"
     >
+      <div className="grid min-h-screen grid-rows-[auto_minmax(0,1fr)] lg:grid-cols-[15.5rem_minmax(0,1fr)] lg:grid-rows-1">
-      <div className="grid min-h-screen lg:grid-cols-[15.5rem_minmax(0,1fr)]">
         <aside className="min-w-0 border-b border-shell-border bg-shell px-3 py-1 text-shell-foreground lg:border-b-0 lg:border-l lg:px-3 lg:py-4">
           <div className="mx-auto grid gap-0 lg:sticky lg:top-4 lg:gap-4">
             <Link
+              className="flex min-h-11 items-center gap-3 rounded-xl px-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent lg:py-2"
-              className="flex min-h-11 items-center gap-3 rounded-xl px-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white lg:py-2"
               href={homeHref}
             >
               <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-sm font-bold text-white shadow-sm shadow-black/20">
                 ش
               </span>
               <span className="grid">
                 <span className="text-sm font-semibold text-shell-foreground">
                   شريك
                 </span>
                 <span className="text-xs text-shell-muted">تشغيل سماوة</span>
               </span>
             </Link>
             {navigationItems.length > 0 ? (
               <nav
                 aria-label={navigationLabel}
                 className="flex snap-x gap-2 overflow-x-auto pb-1 lg:grid lg:overflow-visible lg:pb-0"
               >
                 {navigationItems.map((item) => {
                   const Icon = shellIcons[item.icon ?? "briefcase"];
                   const active = isActive(pathname, item.href);

                   return (
                     <Link
                       className={cn(
                         "flex min-h-11 min-w-fit snap-start items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors",
+                        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
-                        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
                         active
+                          ? "border-accent bg-accent-soft text-accent"
+                          : "border-transparent text-shell-muted hover:bg-accent-soft/50 hover:text-shell-foreground",
-                          ? "border-white/10 bg-accent text-white shadow-sm shadow-black/20"
-                          : "border-transparent text-shell-muted hover:bg-white/10 hover:text-white",
                       )}
                       href={item.href}
                       key={`${item.href}-${item.label}`}
                       aria-current={active ? "page" : undefined}
                     >
                       <Icon aria-hidden="true" size={18} />
                       <span>{item.label}</span>
                     </Link>
                   );
                 })}
               </nav>
             ) : null}
+            <div className="hidden rounded-xl border border-shell-border bg-background p-3 text-shell-foreground lg:grid lg:gap-2 [&_button]:border-shell-border [&_button]:hover:bg-accent-soft">
-            <div className="hidden rounded-xl border border-shell-border bg-white/5 p-3 text-shell-foreground lg:grid lg:gap-2 [&_button]:border-white/15 [&_button]:hover:bg-white/10">
               <p className="text-xs font-semibold text-shell-muted">
                 الحساب الحالي
               </p>
               <SignOutButton />
             </div>
           </div>
         </aside>
         <div className="min-w-0">
           <header className="sticky top-0 z-20 border-b border-border bg-background/92 px-4 py-0.5 backdrop-blur sm:px-5 lg:py-2.5">
             <div className="mx-auto flex max-w-[90rem] flex-col gap-0 sm:flex-row sm:items-center sm:justify-between lg:gap-1.5">
               <Breadcrumbs
                 pathname={pathname}
                 rootHref={breadcrumbRootHref}
                 rootLabel={breadcrumbRootLabel}
               />
               <div className="flex min-h-11 items-center gap-2 text-xs text-muted">
                 <NotificationBell data={notifications} />
                 <span>حساب الفريق</span>
                 <span className="lg:hidden">
                   <SignOutButton />
                 </span>
               </div>
             </div>
           </header>
           <div className="mx-auto w-full max-w-[90rem] px-4 py-5 sm:px-5 lg:px-6">
             {children}
           </div>
         </div>
       </div>
     </section>
   );
 }

```

## src/ui/client/client-shell.tsx

```diff
--- pre-UI1/src/ui/client/client-shell.tsx
+++ current/src/ui/client/client-shell.tsx
 "use client";

 import {
   BriefcaseBusiness,
   FileText,
   FolderOpen,
   LayoutDashboard,
   PackageCheck,
   UserRound,
 } from "lucide-react";
 import Link from "next/link";
 import { usePathname } from "next/navigation";
 import { SignOutButton } from "@/ui/auth/sign-out-button";
 import { cn } from "@/ui/core/utils";
 import {
   NotificationBell,
   type NotificationBellData,
 } from "@/ui/notifications/notification-bell";

 const emptyNotifications: NotificationBellData = { unreadCount: 0, recent: [] };

 const items = [
   { href: "/client", label: "الرئيسية", icon: LayoutDashboard },
   { href: "/client/work", label: "أعمالي", icon: BriefcaseBusiness },
   { href: "/client/pending", label: "بانتظار موافقتي", icon: PackageCheck },
   { href: "/client/files", label: "الملفات", icon: FolderOpen },
   { href: "/client/commercial", label: "العقد والمتابعة", icon: FileText },
 ];

 export function ClientShell({
   canApprove = true,
   children,
   notifications = emptyNotifications,
 }: {
   canApprove?: boolean;
   children: React.ReactNode;
   notifications?: NotificationBellData;
 }) {
   const pathname = usePathname() ?? "/client";
   const pendingLabel = canApprove ? "بانتظار موافقتي" : "قيد المراجعة";

   return (
     <section
       className="min-h-screen bg-background text-foreground"
       dir="rtl"
       data-product-shell="client"
     >
+      <div className="grid min-h-screen grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)] lg:grid-cols-[15.5rem_minmax(0,1fr)] lg:grid-rows-1">
-      <div className="grid min-h-screen grid-cols-[minmax(0,1fr)] lg:grid-cols-[15.5rem_minmax(0,1fr)]">
         <aside className="min-w-0 border-b border-shell-border bg-shell px-3 py-1 text-shell-foreground lg:border-b-0 lg:border-l lg:py-4">
           <Link
+            className="flex min-h-11 items-center gap-3 rounded-lg px-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent lg:py-2"
-            className="flex min-h-11 items-center gap-3 rounded-lg px-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white lg:py-2"
             href="/client"
           >
             <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white shadow-sm shadow-black/20">
               ش
             </span>
             <span>
               <strong className="block text-sm">مساحة العميل</strong>
               <span className="text-xs text-shell-muted">تشغيل سماوة</span>
             </span>
           </Link>
           <nav
             aria-label="تنقل بوابة العميل"
             className="mt-1 flex min-w-0 max-w-full gap-2 overflow-x-auto lg:mt-5 lg:grid"
           >
             {items.map(({ href, label, icon: Icon }) => {
               const active =
                 pathname === href ||
                 (href !== "/client" && pathname.startsWith(`${href}/`));
               const resolvedLabel =
                 href === "/client/pending" ? pendingLabel : label;
               return (
                 <Link
                   key={href}
                   href={href}
                   onFocus={(event) =>
                     event.currentTarget.scrollIntoView({
                       block: "nearest",
                       inline: "nearest",
                     })
                   }
                   aria-current={active ? "page" : undefined}
                   className={cn(
+                    "flex min-h-11 min-w-fit items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
-                    "flex min-h-11 min-w-fit items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
                     active
+                      ? "border-accent bg-accent-soft text-accent"
+                      : "border-transparent text-shell-muted hover:bg-accent-soft/50 hover:text-shell-foreground",
-                      ? "border-white/10 bg-accent text-white shadow-sm shadow-black/20"
-                      : "border-transparent text-shell-muted hover:bg-white/10 hover:text-white",
                   )}
                 >
                   <Icon size={17} aria-hidden="true" />
                   {resolvedLabel}
                 </Link>
               );
             })}
           </nav>
+          <div className="mt-5 hidden rounded-lg border border-shell-border bg-background p-3 lg:block [&_button]:border-shell-border [&_button]:hover:bg-accent-soft">
-          <div className="mt-5 hidden rounded-lg border border-shell-border bg-white/5 p-3 lg:block [&_button]:border-white/15 [&_button]:hover:bg-white/10">
             <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
               <UserRound size={16} aria-hidden="true" />
               حسابي
             </div>
             <SignOutButton />
           </div>
         </aside>
         <div className="min-w-0">
           <header className="sticky top-0 z-20 border-b border-border bg-background/92 px-4 py-1 backdrop-blur sm:px-5 lg:py-2.5">
             <div className="mx-auto flex max-w-[90rem] flex-wrap items-center justify-end gap-2">
               <div className="flex min-w-0 flex-1 items-center gap-2 lg:hidden">
                 <span className="flex shrink-0 items-center gap-2 text-sm font-semibold">
                   <UserRound size={16} aria-hidden="true" />
                   حسابي
                 </span>
                 <SignOutButton />
               </div>
               <NotificationBell data={notifications} />
             </div>
           </header>
           {children}
         </div>
       </div>
     </section>
   );
 }

```

## tests/visual/shell-light-theme.test.tsx

```diff
--- pre-UI1/tests/visual/shell-light-theme.test.tsx
+++ current/tests/visual/shell-light-theme.test.tsx
+import { readFile } from "node:fs/promises";
+import { createRequire } from "node:module";
+import { resolve } from "node:path";
+import { cleanup, render } from "@testing-library/react";
+import type { Browser, Locator } from "playwright";
+import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
+import { ClientShell } from "@/ui/client/client-shell";
+import { ProductShell } from "@/ui/layout/product-shell";

+const require = createRequire(import.meta.url);
+const postcss: typeof import("postcss").default = require("postcss");
+const tailwind: typeof import("@tailwindcss/postcss") = require("@tailwindcss/postcss");
+const { chromium }: typeof import("playwright") = require("playwright");
+const { pathnameState } = vi.hoisted(() => ({ pathnameState: { value: "/clients" } }));
+
+// Only Next's router boundary is mocked; the exported HTML is not hydrated.
+vi.mock("next/navigation", () => ({
+  usePathname: () => pathnameState.value,
+  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
+}));
+
+let browser: Browser;
+let compiledCss: string;
+
+beforeAll(async () => {
+  const cssPath = resolve("src/app/globals.css");
+  const compiled = await postcss([tailwind({ base: process.cwd(), optimize: false })])
+    .process(await readFile(cssPath, "utf8"), { from: cssPath });
+  compiledCss = compiled.css;
+  browser = await chromium.launch({ headless: true });
+}, 60_000);
+
+afterEach(cleanup);
+afterAll(async () => { await browser?.close(); });
+
+async function appearance(link: Locator) {
+  return link.evaluate((element) => {
+    const style = getComputedStyle(element);
+    const canvas = document.createElement("canvas");
+    canvas.width = canvas.height = 1;
+    const context = canvas.getContext("2d")!;
+    const pixels = (colors: string[]) => {
+      context.clearRect(0, 0, 1, 1);
+      for (const color of colors) {
+        context.fillStyle = color;
+        context.fillRect(0, 0, 1, 1);
+      }
+      return Array.from(context.getImageData(0, 0, 1, 1).data).slice(0, 3);
+    };
+    const backgrounds: string[] = [];
+    for (let parent: Element | null = element; parent; parent = parent.parentElement) {
+      backgrounds.unshift(getComputedStyle(parent).backgroundColor);
+    }
+    const surface = pixels(["white", ...backgrounds]);
+    const outside = pixels(["white", ...backgrounds.slice(0, -1)]);
+    const luminance = (rgb: number[]) => rgb.map((channel) => {
+      const normalized = channel / 255;
+      return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
+    }).reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
+    const contrast = (first: number[], second: number[]) => {
+      const a = luminance(first);
+      const b = luminance(second);
+      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
+    };
+    const rect = element.getBoundingClientRect();
+    const nav = element.closest("nav")!;
+    const navRect = nav.getBoundingClientRect();
+    const outline = parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset);
+    return {
+      color: pixels([style.color]), surface,
+      textContrast: contrast(pixels([style.color]), surface),
+      focusContrast: contrast(pixels([style.outlineColor]), parseFloat(style.outlineOffset) < 0 ? surface : outside),
+      focusVisible: element.matches(":focus-visible"),
+      outlineWidth: parseFloat(style.outlineWidth),
+      height: rect.height, width: rect.width,
+      focusBounds: { top: rect.top, bottom: rect.bottom, navTop: navRect.top, navBottom: navRect.bottom, outline, outlineWidth: style.outlineWidth, outlineOffset: style.outlineOffset },
+      clippedVertically: getComputedStyle(nav).overflowY !== "visible" &&
+        (rect.top - outline < navRect.top - 1 || rect.bottom + outline > navRect.bottom + 1),
+    };
+  });
+}
+
+describe("isolated rendered shell visual contract (not app hydration)", () => {
+  it.each([
+    ["management", 1440], ["management", 375],
+    ["client", 1440], ["client", 375],
+  ] as const)("%s at %ipx has a light rail and readable keyboard navigation", async (role, width) => {
+    pathnameState.value = role === "client" ? "/client/pending" : "/clients";
+    const Shell = role === "client" ? ClientShell : ProductShell;
+    const { container } = render(<Shell><main>المحتوى</main></Shell>);
+    const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: "reduce" });
+    try {
+      await page.route("**/*", (route) => route.abort());
+      await page.setContent(`<!doctype html><html lang="ar" dir="rtl"><head><style>${compiledCss}</style></head><body>${container.innerHTML}</body></html>`);
+      const rail = page.locator("aside");
+      if (width === 375) {
+        const headerBottom = await page.locator("header").evaluate((element) => element.getBoundingClientRect().bottom);
+        expect.soft(headerBottom, "Mobile shell chrome must leave room for short content").toBeLessThanOrEqual(200);
+      }
+      expect.soft(await rail.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe("rgb(255, 255, 255)");
+      const links = rail.locator("nav a");
+      expect(await links.count()).toBe(role === "client" ? 5 : 4);
+      const current = rail.locator('nav a[aria-current="page"]');
+      expect(await current.count()).toBe(1);
+      expect(await current.getAttribute("href")).toBe(pathnameState.value);
+      await page.keyboard.press("Tab"); // Brand link precedes navigation.
+      for (const link of await links.all()) {
+        await page.keyboard.press("Tab");
+        await page.evaluate(() => new Promise<void>((done) => requestAnimationFrame(() => requestAnimationFrame(() => done()))));
+        const normal = await appearance(link);
+        expect.soft(normal.focusVisible).toBe(true);
+        expect.soft(normal.height).toBeGreaterThanOrEqual(44);
+        expect.soft(normal.width).toBeGreaterThanOrEqual(44);
+        expect.soft(normal.textContrast).toBeGreaterThanOrEqual(4.5);
+        expect.soft(normal.focusContrast).toBeGreaterThanOrEqual(3);
+        expect.soft(normal.outlineWidth).toBeGreaterThanOrEqual(2);
+        expect.soft(normal.clippedVertically, JSON.stringify(normal.focusBounds)).toBe(false);
+        const active = await link.getAttribute("aria-current") === "page";
+        expect.soft(normal.color).toEqual(active ? [99, 64, 223] : [99, 95, 114]);
+        if (active) expect.soft(normal.surface).toEqual([238, 233, 255]);
+        await link.hover();
+        expect.soft((await appearance(link)).textContrast).toBeGreaterThanOrEqual(4.5);
+        await page.mouse.move(width - 1, 999);
+      }
+      if (process.env.UI1_CAPTURE_GREEN === "1") {
+        await page.screenshot({
+          path: resolve(`specs/015-persistent-mvp-pilot-completion/evidence/ui1-visual/${role}-${width}.png`),
+          fullPage: true,
+        });
+      }
+    } finally {
+      await page.close();
+    }
+  }, 60_000);
+});
+
```

## tests/visual/vitest.config.ts

```diff
--- pre-UI1/tests/visual/vitest.config.ts
+++ current/tests/visual/vitest.config.ts
+import { fileURLToPath } from "node:url";
+import { defineConfig } from "vitest/config";

+const root = fileURLToPath(new URL("../../", import.meta.url));
+
+export default defineConfig({
+  root,
+  resolve: {
+    alias: {
+      "@": fileURLToPath(new URL("../../src", import.meta.url)),
+      "server-only": fileURLToPath(new URL("../setup/server-only.ts", import.meta.url)),
+    },
+  },
+  test: {
+    environment: "jsdom",
+    setupFiles: ["tests/setup/vitest.ts"],
+    include: ["tests/visual/shell-light-theme.test.tsx"],
+    maxWorkers: 1,
+  },
+});
+
```

## tests/e2e/management/shell-light-theme.spec.ts

```diff
--- pre-UI1/tests/e2e/management/shell-light-theme.spec.ts
+++ current/tests/e2e/management/shell-light-theme.spec.ts
+import { expect, test, type Locator } from "@playwright/test";

+// UI1: catches white-on-light navigation/focus regressions when adopting the
+// approved light rail. Real rendered styles, not Tailwind source-string checks.
+async function contrast(locator: Locator, property: "color" | "outlineColor") {
+  return locator.evaluate((element, property) => {
+    const canvas = document.createElement("canvas");
+    canvas.width = canvas.height = 1;
+    const context = canvas.getContext("2d")!;
+    const rgba = (value: string) => {
+      context.clearRect(0, 0, 1, 1);
+      context.fillStyle = value;
+      context.fillRect(0, 0, 1, 1);
+      return Array.from(context.getImageData(0, 0, 1, 1).data);
+    };
+    const ancestors: Element[] = [];
+    for (let node: Element | null = element; node; node = node.parentElement)
+      ancestors.unshift(node);
+    let background = [255, 255, 255];
+    for (const node of ancestors) {
+      const [r, g, b, a] = rgba(getComputedStyle(node).backgroundColor);
+      background = [r, g, b].map(
+        (value, index) => value * (a / 255) + background[index] * (1 - a / 255),
+      );
+    }
+    const luminance = (rgb: number[]) =>
+      rgb
+        .map((v) => v / 255)
+        .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
+        .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
+    const foreground = rgba(getComputedStyle(element)[property]);
+    const a = luminance(foreground.slice(0, 3));
+    const b = luminance(background);
+    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
+  }, property);
+}
+
+async function expectUnclippedOutline(locator: Locator) {
+  await expect
+    .poll(
+      () =>
+        locator.evaluate((element) => {
+          const style = getComputedStyle(element);
+          const outlineWidth = parseFloat(style.outlineWidth);
+          const extent = Math.max(
+            0,
+            outlineWidth + parseFloat(style.outlineOffset),
+          );
+          const rect = element.getBoundingClientRect();
+          let left = 0;
+          let right = window.innerWidth;
+          let top = 0;
+          let bottom = window.innerHeight;
+          for (
+            let parent = element.parentElement;
+            parent;
+            parent = parent.parentElement
+          ) {
+            const parentStyle = getComputedStyle(parent);
+            const box = parent.getBoundingClientRect();
+            // Overflow clips at the scrollport, excluding borders/scrollbars.
+            const clipLeft = box.left + parent.clientLeft;
+            const clipTop = box.top + parent.clientTop;
+            if (/(auto|scroll|hidden|clip)/.test(parentStyle.overflowX)) {
+              left = Math.max(left, clipLeft);
+              right = Math.min(right, clipLeft + parent.clientWidth);
+            }
+            if (/(auto|scroll|hidden|clip)/.test(parentStyle.overflowY)) {
+              top = Math.max(top, clipTop);
+              bottom = Math.min(bottom, clipTop + parent.clientHeight);
+            }
+          }
+          return {
+            visibleOutline:
+              outlineWidth >= 2 &&
+              style.outlineStyle !== "none" &&
+              style.outlineStyle !== "hidden",
+            unclipped:
+              rect.left - extent >= left - 1 &&
+              rect.right + extent <= right + 1 &&
+              rect.top - extent >= top - 1 &&
+              rect.bottom + extent <= bottom + 1,
+          };
+        }),
+      {
+        timeout: 2_000,
+        message: "Keyboard outline must be visible and fit every clipping ancestor and viewport",
+      },
+    )
+    .toEqual({ visibleOutline: true, unclipped: true });
+}
+
+for (const surface of [
+  { kind: "management", url: "/work?as=assigned_internal_a" },
+  { kind: "client", url: "/client/pending?as=client_approver_a" },
+]) {
+  for (const width of [375, 1440]) {
+    test(`${surface.kind} light shell ${width}px preserves readable navigation`, async ({
+      page,
+    }, testInfo) => {
+      await page.setViewportSize({ width, height: 1000 });
+      await page.goto(surface.url, { waitUntil: "domcontentloaded" });
+      const shell = page.locator(`[data-product-shell="${surface.kind}"]`);
+      await expect(shell).toBeVisible();
+      await page.evaluate(() => document.fonts.ready);
+      const rail = shell.locator("aside");
+      await expect(rail).toHaveCSS("background-color", "rgb(255, 255, 255)");
+      // Fixture management intentionally omits sidebar nav; its role routes
+      // remain covered by product-shell component tests, not invented here.
+      const links = rail.getByRole("link");
+      for (const link of await links.all()) {
+        expect(await contrast(link, "color")).toBeGreaterThanOrEqual(4.5);
+        expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
+      }
+      if (surface.kind === "client") {
+        const active = rail.locator('a[aria-current="page"]');
+        await expect(active).toHaveAttribute("href", "/client/pending");
+        await active.hover();
+        expect(await contrast(active, "color")).toBeGreaterThanOrEqual(4.5);
+      }
+      for (const link of await links.all()) {
+        await page.keyboard.press("Tab");
+        await expect(link).toBeFocused();
+        expect(
+          await link.evaluate((node) => node.matches(":focus-visible")),
+        ).toBe(true);
+        await expectUnclippedOutline(link);
+        expect(await contrast(link, "outlineColor")).toBeGreaterThanOrEqual(3);
+      }
+      expect(
+        await page.evaluate(() => document.documentElement.scrollWidth),
+      ).toBeLessThanOrEqual(width + 1);
+      await page.screenshot({
+        path: testInfo.outputPath("light-shell.png"),
+        fullPage: false,
+      });
+    });
+  }
+}
+
```
