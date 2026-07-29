"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  Users,
  Puzzle,
  UserCircle,
  Wallet,
  Network,
  SlidersHorizontal,
  ShieldCheck,
  Terminal,
  ChevronRight,
} from "lucide-react";
import { OptimizationProfiles } from "@/components/oryx/optimization-profiles";
import JourneyComposer from "@/components/oryx/journey-composer";
import { AgentMarketplace, ExtensionStore } from "@/components/oryx/agent-marketplace";
import { MobilityTeam } from "@/components/kernel/mobility-team";
import { FleetPlugins } from "@/components/oryx/fleet-plugins";
import { SavingsPanel } from "@/components/oryx/savings-panel";
import { IntelligenceNetwork } from "@/components/oryx/intelligence-network";
import { IntelligenceDashboard } from "@/components/kernel/intelligence-dashboard";
import { DriverIntelligence } from "@/components/oryx/driver-intelligence";
import { DeveloperConsole } from "@/components/kernel/developer-console";
import { useOryx } from "@/lib/store";
import { USER_TYPES } from "@/lib/mock-data";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { LogOut, Check } from "lucide-react";

type SectionId =
  | "journey"
  | "agents"
  | "extensions"
  | "profile"
  | "savings"
  | "network"
  | "preferences"
  | "privacy"
  | "developer";

interface Section {
  id: SectionId;
  label: string;
  icon: typeof Compass;
  color: string;
  bg: string;
  desc: string;
}

const SECTIONS: Section[] = [
  { id: "journey", label: "Journey", icon: Compass, color: "text-emerald-400", bg: "bg-emerald-500/15", desc: "Optimization profiles + composer" },
  { id: "agents", label: "Agents", icon: Users, color: "text-emerald-400", bg: "bg-emerald-500/15", desc: "Agent marketplace" },
  { id: "extensions", label: "Extensions", icon: Puzzle, color: "text-violet-400", bg: "bg-violet-500/15", desc: "Extension store + fleet plugins" },
  { id: "profile", label: "Profile", icon: UserCircle, color: "text-cyan-400", bg: "bg-cyan-500/15", desc: "User type switching" },
  { id: "savings", label: "Savings", icon: Wallet, color: "text-emerald-400", bg: "bg-emerald-500/15", desc: "Savings + leaderboard" },
  { id: "network", label: "Network", icon: Network, color: "text-cyan-400", bg: "bg-cyan-500/15", desc: "Intelligence network" },
  { id: "preferences", label: "Preferences", icon: SlidersHorizontal, color: "text-amber-400", bg: "bg-amber-500/15", desc: "Theme, language, notifications" },
  { id: "privacy", label: "Privacy", icon: ShieldCheck, color: "text-rose-400", bg: "bg-rose-500/15", desc: "Data controls" },
  { id: "developer", label: "Developer Console", icon: Terminal, color: "text-emerald-400", bg: "bg-emerald-500/15", desc: "Build & ship extensions" },
];

export function SettingsHub() {
  const [section, setSection] = useState<SectionId | null>(null);

  return (
    <div className="px-4 pb-8 pt-3">
      {/* Header */}
      <div className="mb-3 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-cyan-400">
          <SlidersHorizontal className="h-3 w-3" /> Settings
        </div>
        <h2 className="mt-3 text-xl font-black tracking-tight text-foreground text-balance">
          Everything Oryx · in one place
        </h2>
        <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
          Switch user type, recruit agents, install extensions, tune preferences,
          or open the Developer Console.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {section === null ? (
          <motion.div
            key="rail"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="space-y-1.5"
          >
            {SECTIONS.map((s, i) => {
              const SIcon = s.icon;
              return (
                <motion.button
                  key={s.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => setSection(s.id)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-border/50 bg-card/40 p-3 text-left transition hover:bg-foreground/[0.04]"
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${s.bg}`}>
                    <SIcon className={`h-4 w-4 ${s.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-foreground">{s.label}</div>
                    <div className="text-[11px] text-muted-foreground">{s.desc}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </motion.button>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            key={section}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
          >
            {/* Back button */}
            <button
              onClick={() => setSection(null)}
              className="mb-3 flex items-center gap-1.5 rounded-full border border-border/60 bg-card/40 px-3 py-1.5 text-[11px] font-bold text-muted-foreground transition hover:bg-foreground/[0.04]"
            >
              <ChevronRight className="h-3 w-3 rotate-180" /> All settings
            </button>

            {section === "journey" && (
              <div className="pt-1">
                <OptimizationProfiles />
                <JourneyComposer />
              </div>
            )}
            {section === "agents" && (
              <div>
                <MobilityTeam />
                <AgentMarketplace />
              </div>
            )}
            {section === "extensions" && (
              <div>
                <ExtensionStore />
                <FleetPlugins />
              </div>
            )}
            {section === "profile" && <ProfileSection />}
            {section === "savings" && <SavingsPanel />}
            {section === "network" && (
              <div>
                <IntelligenceDashboard />
                <IntelligenceNetwork />
                <DriverIntelligence />
              </div>
            )}
            {section === "preferences" && <PreferencesSection />}
            {section === "privacy" && <PrivacySection />}
            {section === "developer" && <DeveloperConsole />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---- Sections --------------------------------------------------------------

function ProfileSection() {
  const { userName, currentType, userTypes, setCurrentType } = useOryx();
  const switchable = USER_TYPES.filter((u) => userTypes.includes(u.id));

  const switchType = async (id: typeof currentType) => {
    setCurrentType(id);
    try {
      const res = await fetch("/api/user/type", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: id }),
      });
      if (!res.ok) throw new Error();
      const meta = USER_TYPES.find((u) => u.id === id);
      toast.success(`Switched to ${meta?.label ?? id}`);
    } catch {
      toast.error("Switch failed");
    }
  };

  return (
    <div className="space-y-3">
      {/* Profile header */}
      <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/12 to-transparent p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-lg font-black text-emerald-950">
            {(userName ?? "U")
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map((w) => w[0]?.toUpperCase())
              .join("") || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-foreground">{userName ?? "Guest user"}</div>
            <div className="text-[11px] text-muted-foreground">
              {userTypes.length} role{userTypes.length === 1 ? "" : "s"} ·{" "}
              {USER_TYPES.find((u) => u.id === currentType)?.label ?? currentType}
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Switch user type
        </div>
        <div className="space-y-1.5">
          {switchable.map((u) => {
            const active = u.id === currentType;
            return (
              <button
                key={u.id}
                onClick={() => switchType(u.id)}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                  active
                    ? "border-cyan-500/40 bg-cyan-500/[0.06]"
                    : "border-border/50 bg-card/40 hover:bg-foreground/[0.03]"
                }`}
              >
                <span className="text-2xl">{u.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-foreground">{u.label}</div>
                  <div className="text-[11px] text-muted-foreground">{u.description}</div>
                </div>
                {active && <Check className="h-4 w-4 text-cyan-400" strokeWidth={3} />}
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/[0.05] py-2.5 text-xs font-bold text-rose-400 transition hover:bg-rose-500/10"
      >
        <LogOut className="h-3.5 w-3.5" /> Log out
      </button>
    </div>
  );
}

function PreferencesSection() {
  const [prefs, setPrefs] = useState({
    theme: "dark",
    language: "English",
    notifications: true,
    sounds: false,
    haptics: true,
    compact: false,
  });

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-border/50 bg-card/40 p-3.5">
        <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-amber-400">
          Appearance
        </div>
        <Row label="Theme">
          <select
            value={prefs.theme}
            onChange={(e) => setPrefs({ ...prefs, theme: e.target.value })}
            className="rounded-lg border border-border/60 bg-background px-2 py-1 text-xs font-semibold text-foreground"
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="auto">Auto</option>
          </select>
        </Row>
        <Row label="Language">
          <select
            value={prefs.language}
            onChange={(e) => setPrefs({ ...prefs, language: e.target.value })}
            className="rounded-lg border border-border/60 bg-background px-2 py-1 text-xs font-semibold text-foreground"
          >
            <option>English</option>
            <option>Twi</option>
            <option>Ga</option>
            <option>Hausa</option>
            <option>French</option>
          </select>
        </Row>
        <Row label="Compact mode">
          <Toggle on={prefs.compact} onClick={() => setPrefs({ ...prefs, compact: !prefs.compact })} />
        </Row>
      </div>

      <div className="rounded-2xl border border-border/50 bg-card/40 p-3.5">
        <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-amber-400">
          Notifications & feedback
        </div>
        <Row label="Push notifications">
          <Toggle on={prefs.notifications} onClick={() => setPrefs({ ...prefs, notifications: !prefs.notifications })} />
        </Row>
        <Row label="Sound effects">
          <Toggle on={prefs.sounds} onClick={() => setPrefs({ ...prefs, sounds: !prefs.sounds })} />
        </Row>
        <Row label="Haptic feedback">
          <Toggle on={prefs.haptics} onClick={() => setPrefs({ ...prefs, haptics: !prefs.haptics })} />
        </Row>
      </div>

      <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.05] p-3 text-[11px] text-muted-foreground">
        Preferences are stored locally on this device. Theme + language sync to your
        account on next sign-in.
      </div>
    </div>
  );
}

function PrivacySection() {
  const [controls, setControls] = useState({
    locationHistory: true,
    tripAnalytics: true,
    personalizedPricing: true,
    shareWithPools: true,
    marketingEmails: false,
  });

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-border/50 bg-card/40 p-3.5">
        <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-rose-400">
          Data controls
        </div>
        <Row label="Location history" sub="Save trip origins/destinations">
          <Toggle on={controls.locationHistory} onClick={() => setControls({ ...controls, locationHistory: !controls.locationHistory })} />
        </Row>
        <Row label="Trip analytics" sub="Use trip data to improve routing">
          <Toggle on={controls.tripAnalytics} onClick={() => setControls({ ...controls, tripAnalytics: !controls.tripAnalytics })} />
        </Row>
        <Row label="Personalized pricing" sub="Allow AI to tailor offers">
          <Toggle on={controls.personalizedPricing} onClick={() => setControls({ ...controls, personalizedPricing: !controls.personalizedPricing })} />
        </Row>
        <Row label="Share with pools" sub="Pool members see your first name">
          <Toggle on={controls.shareWithPools} onClick={() => setControls({ ...controls, shareWithPools: !controls.shareWithPools })} />
        </Row>
        <Row label="Marketing emails" sub="Occasional product updates">
          <Toggle on={controls.marketingEmails} onClick={() => setControls({ ...controls, marketingEmails: !controls.marketingEmails })} />
        </Row>
      </div>

      <button className="w-full rounded-xl border border-rose-500/30 bg-rose-500/[0.05] py-2.5 text-xs font-bold text-rose-400 transition hover:bg-rose-500/10">
        Download my data
      </button>
      <button className="w-full rounded-xl border border-rose-500/40 bg-rose-500/[0.08] py-2.5 text-xs font-bold text-rose-300 transition hover:bg-rose-500/15">
        Delete account
      </button>

      <div className="rounded-xl border border-rose-500/30 bg-rose-500/[0.05] p-3 text-[11px] text-muted-foreground">
        <span className="font-semibold text-foreground">Your data, your terms.</span> Oryx only
        uses what it needs to optimize your mobility. You can export or delete everything at any
        time.
      </div>
    </div>
  );
}

function Row({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-foreground">{label}</div>
        {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative h-5 w-9 rounded-full transition ${on ? "bg-emerald-500" : "bg-foreground/15"}`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${on ? "left-[18px]" : "left-0.5"}`}
      />
    </button>
  );
}

export default SettingsHub;
