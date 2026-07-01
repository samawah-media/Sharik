import { ProductShell } from "@/ui/layout/product-shell";

export default function ManagementLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ProductShell>
      <section
        dir="rtl"
        data-security-scope="management-entry"
        data-route-guard="server-authorized"
      >
        {children}
      </section>
    </ProductShell>
  );
}
