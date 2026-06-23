import { ShieldCheck } from "lucide-react";

const foundationItems = [
  "بيئة تطوير معزولة",
  "TypeScript صارم",
  "اختبارات أساسية",
  "واجهة عربية RTL",
];

export default function HomePage() {
  return (
    <main className="min-h-screen px-5 py-8 sm:px-8">
      <section className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="flex items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <p className="text-sm font-medium text-accent">F-001A</p>
            <h1 className="mt-2 text-3xl font-semibold text-foreground sm:text-4xl">
              منصة سماوة
            </h1>
          </div>
          <div
            aria-hidden="true"
            className="grid size-12 place-items-center rounded-md bg-accent-soft text-accent"
          >
            <ShieldCheck className="size-6" />
          </div>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {foundationItems.map((item) => (
            <div
              key={item}
              className="rounded-md border border-border bg-surface p-4 text-sm font-medium text-foreground"
            >
              {item}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
