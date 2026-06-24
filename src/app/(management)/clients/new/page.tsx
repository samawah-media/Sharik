import { ClientForm } from "@/ui/management/client-form";

export default function NewClientPage() {
  return (
    <main className="grid max-w-2xl gap-6">
      <h1 className="text-2xl font-semibold">إضافة عميل</h1>
      <ClientForm />
    </main>
  );
}
