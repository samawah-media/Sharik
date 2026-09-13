import Link from "next/link";
import type { ComponentProps, HTMLAttributes, ReactNode } from "react";
import { cn } from "./utils";

const cardStyles =
  "rounded-lg border border-border bg-surface p-3 shadow-xs sm:p-4";

export const cardPrimaryLinkOverlay =
  "after:absolute after:inset-0 after:rounded-lg after:content-[''] focus-visible:outline-none focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-accent";

export function Card({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <article className={cn(cardStyles, className)} {...props} />;
}

export function CardLink({ className, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      className={cn(
        cardStyles,
        "block transition-colors hover:border-accent/50 hover:bg-accent-soft/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1", className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn(
        "text-sm font-semibold leading-6 text-foreground sm:text-base",
        className,
      )}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm leading-6 text-muted", className)} {...props} />
  );
}

export function CardContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-3", className)} {...props} />;
}

export function SectionPanel({
  children,
  className,
  label,
}: {
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <section
      aria-label={label}
      className={cn(cardStyles, className)}
    >
      {children}
    </section>
  );
}
