import { ClientForm } from "@/ui/management/client-form";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;

  return (
    <main className="grid max-w-2xl gap-6">
      <h1 className="text-2xl font-semibold">تعديل العميل</h1>
      <ClientForm
        mode="update"
        client={{
          id: clientId,
          tenantId: "tenant-placeholder",
          name: "",
          slug: "",
          status: "active",
          createdBy: "system",
          createdAt: "",
          updatedAt: "",
          revision: 1,
        }}
      />
    </main>
  );
}
