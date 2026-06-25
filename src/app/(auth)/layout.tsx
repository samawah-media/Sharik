export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <section
      className="min-h-screen bg-background"
      dir="rtl"
      data-security-scope="auth-entry"
    >
      {children}
    </section>
  );
}
