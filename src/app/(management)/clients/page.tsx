import { ClientEmptyState } from "@/ui/management/client-form";

export default function ClientsPage() {
  return (
    <main className="grid gap-6">
      <h1 className="text-2xl font-semibold">العملاء</h1>
      <ClientEmptyState />
      <a
        className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        href="/clients/new"
      >
        إضافة عميل
      </a>
    </main>
  );
}
