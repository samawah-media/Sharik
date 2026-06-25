export default function ManagementLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <section
      className="min-h-screen bg-background"
      dir="rtl"
      data-security-scope="management-entry"
      data-route-guard="server-authorized"
    >
      <div className="mx-auto max-w-6xl px-5 py-6">{children}</div>
    </section>
  );
}
