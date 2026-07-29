"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOryx } from "@/lib/store";
import { USER_TYPES } from "@/lib/mock-data";
import { signOut } from "next-auth/react";
import { ChevronDown, LogOut, Check, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

export default function UserSwitcher() {
  const { userName, currentType, userTypes, setCurrentType } = useOryx();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const initials =
    (userName ?? "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "U";

  const currentMeta = USER_TYPES.find((u) => u.id === currentType) ?? USER_TYPES[0];
  // Restrict switch options to user's owned types only.
  const switchable = USER_TYPES.filter((u) => userTypes.includes(u.id));

  const switchType = async (id: typeof currentType) => {
    setCurrentType(id);
    setOpen(false);
    try {
      const res = await fetch("/api/user/type", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error("Switch failed", { description: data.error ?? "Try again" });
        return;
      }
      const meta = USER_TYPES.find((u) => u.id === id);
      toast.success(`Switched to ${meta?.label ?? id}`, {
        description: meta?.description,
      });
    } catch {
      toast.error("Network error switching type");
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="glass-strong flex items-center gap-2 rounded-2xl border border-border/60 py-1.5 pl-1.5 pr-2 shadow-xl shadow-black/40 transition hover:border-border"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-xs font-black text-emerald-950">
          {initials}
        </div>
        <div className="hidden flex-col items-start leading-none sm:flex">
          <span className="text-[10px] font-medium text-muted-foreground">
            {userName ?? "Guest"}
          </span>
          <span className="flex items-center gap-1 text-[11px] font-bold text-foreground">
            <span>{currentMeta.emoji}</span>
            {currentMeta.label}
          </span>
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 text-muted-foreground transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            className="glass-strong absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-border/60 shadow-2xl shadow-black/60"
            role="menu"
          >
            {/* User header */}
            <div className="border-b border-border/40 p-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-sm font-black text-emerald-950">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-foreground">
                    {userName ?? "Guest user"}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <UserIcon className="h-2.5 w-2.5" />
                    {currentMeta.emoji} {currentMeta.label}
                  </div>
                </div>
              </div>
            </div>

            {/* Type switcher */}
            <div className="p-1.5">
              <div className="px-1.5 pb-1 pt-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                Switch user type
              </div>
              {switchable.length === 0 ? (
                <div className="px-2 py-1.5 text-[11px] text-muted-foreground">
                  No roles available.
                </div>
              ) : (
                switchable.map((u) => {
                  const active = u.id === currentType;
                  return (
                    <button
                      key={u.id}
                      onClick={() => switchType(u.id)}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition ${
                        active ? "bg-foreground/[0.06]" : "hover:bg-foreground/[0.04]"
                      }`}
                      role="menuitemradio"
                      aria-checked={active}
                    >
                      <span className="text-base">{u.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-foreground">{u.label}</div>
                        <div className="text-[10px] text-muted-foreground">{u.description}</div>
                      </div>
                      {active && (
                        <Check className="h-3.5 w-3.5 text-emerald-400" strokeWidth={3} />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Logout */}
            <button
              onClick={() => {
                setOpen(false);
                signOut({ callbackUrl: "/" });
              }}
              className="flex w-full items-center gap-2 border-t border-border/40 px-3 py-2.5 text-xs font-bold text-rose-400 transition hover:bg-rose-500/10"
              role="menuitem"
            >
              <LogOut className="h-3.5 w-3.5" /> Log out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
