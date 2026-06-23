export default function ManagementLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <section className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-5 py-6">{children}</div>
    </section>
  );
}
