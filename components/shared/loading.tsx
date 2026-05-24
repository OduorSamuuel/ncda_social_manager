import { PenLine } from "lucide-react";

export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8">

      {/* Logo mark with pulse ring */}
      <div className="relative flex items-center justify-center w-16 h-16">
        <div className="absolute inset-[-12px] rounded-full border border-primary/40 animate-[pulse-ring_2s_ease-in-out_infinite]" />
        <div className="w-12 h-12 rounded-[14px] bg-primary flex items-center justify-center">
          <PenLine size={22} className="text-primary-foreground" />
        </div>
      </div>

      {/* Brand name + subtitle */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-lg font-semibold tracking-tight text-foreground">Postify</span>
        <span className="text-sm text-muted-foreground">Getting things ready…</span>
      </div>

      {/* Staggered bars */}
      <div className="flex flex-col gap-1.5 w-28">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[3px] rounded-full bg-border overflow-hidden">
            <div
              className="h-full w-full rounded-full bg-primary origin-left animate-[bar-grow_1.4s_ease-in-out_infinite]"
              style={{ animationDelay: `${i * 0.18}s`, opacity: 1 - i * 0.25 }}
            />
          </div>
        ))}
      </div>

    </div>
  );
}