import Link, { type LinkProps } from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";
import { cn } from "./utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "icon";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border border-accent bg-accent text-white shadow-sm hover:bg-accent/90",
  secondary:
    "border border-border bg-surface text-foreground shadow-sm hover:bg-accent-soft/60",
  ghost:
    "border border-transparent text-muted hover:bg-accent-soft/60 hover:text-foreground",
  danger: "border border-danger/30 bg-danger/10 text-danger hover:bg-danger/15",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3 py-1.5 text-xs",
  md: "min-h-10 px-4 py-2 text-sm",
  icon: "size-10 p-0",
};

export function buttonStyles({
  variant = "secondary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
    "disabled:pointer-events-none disabled:opacity-60",
    sizeClasses[size],
    variantClasses[variant],
    className,
  );
}

export function Button({
  className,
  variant = "secondary",
  size = "md",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <button
      className={buttonStyles({ variant, size, className })}
      type={type}
      {...props}
    />
  );
}

export function ButtonLink({
  children,
  className,
  variant = "secondary",
  size = "md",
  href,
  ...props
}: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> &
  Pick<LinkProps, "href"> & {
    children: ReactNode;
    variant?: ButtonVariant;
    size?: ButtonSize;
  }) {
  return (
    <Link
      className={buttonStyles({ variant, size, className })}
      href={href}
      {...props}
    >
      {children}
    </Link>
  );
}
