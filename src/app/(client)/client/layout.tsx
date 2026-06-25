export default function ClientLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <section
      dir="rtl"
      className="min-h-screen bg-background text-foreground"
      data-route-guard="server-authorized"
    >
      {children}
    </section>
  );
}
