"use client";
import { useRef } from "react";

/** A GET form that re-submits whenever a filter changes, so filtering works without JS too (via the button). */
export function AutoSubmitForm({ children, className, action }: { children: React.ReactNode; className?: string; action: string }) {
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form ref={ref} className={className} action={action} method="get" onChange={() => ref.current?.requestSubmit()}>
      {children}
    </form>
  );
}
