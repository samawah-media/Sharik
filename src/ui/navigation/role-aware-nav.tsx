import type { NavigationItem } from "@/modules/navigation/navigation-resolver";

export function RoleAwareNavigation({
  items,
  label,
}: {
  items: NavigationItem[];
  label: string;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label={label}
      className="flex flex-wrap gap-2 border-b border-border px-4 py-3 text-sm"
    >
      {items.map((item) => (
        <a
          className="rounded-md px-3 py-2 font-medium outline-offset-4 hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          href={item.href}
          key={item.id}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}
