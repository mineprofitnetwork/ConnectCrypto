"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LucideIcon, LogOut, Menu, X } from "lucide-react";
import { USDTGoldLogo } from "@/components/logos/USDTGoldLogo";
import { USDTOriginalLogo } from "@/components/logos/USDTOriginalLogo";
import { ISTTimer } from "@/components/ui/ist-timer";

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface AppSidebarProps {
  navItems: NavItem[];
  activeTab: string;
  setActiveTab: (id: string) => void;
  selectedLogo: "gold" | "original" | "custom";
  customLogoCid?: string;
  onLogout: () => void;
  title: string;
  subtitle: string;
  className?: string;
}

export function AppSidebar({
  navItems,
  activeTab,
  setActiveTab,
  selectedLogo,
  customLogoCid,
  onLogout,
  title,
  subtitle,
  className,
}: AppSidebarProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      {/* Mobile Menu Toggle */}
      <div className="lg:hidden fixed top-6 right-6 z-[201]">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-xl h-12 w-12 border-white/10 bg-black/60 backdrop-blur-xl"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[199] lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-[200] w-72 lg:w-80 bg-black/40 backdrop-blur-2xl border-r border-white/[0.05] transition-transform duration-300 lg:translate-x-0 flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full",
          className
        )}
      >
        {/* Branding */}
        <div className="p-8 border-b border-white/[0.05]">
          <div className="flex items-center gap-4 group">
            <div className="transition-transform group-hover:scale-110 duration-500 shrink-0">
              {selectedLogo === "gold" ? (
                <USDTGoldLogo className="w-12 h-12" />
              ) : selectedLogo === "original" ? (
                <USDTOriginalLogo className="w-12 h-12" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                  {customLogoCid ? (
                    <img src={`https://4everland.io/ipfs/${customLogoCid}`} alt="Logo" className="w-10 h-10 object-contain" />
                  ) : (
                    <USDTOriginalLogo className="w-12 h-12" />
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-headline font-black text-xl uppercase tracking-tighter leading-none truncate">
                {title}
              </span>
              <span className="text-[9px] text-primary font-bold uppercase tracking-[0.3em] leading-none mt-1.5 truncate">
                {subtitle}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto no-scrollbar">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              onClick={() => {
                setActiveTab(item.id);
                setIsOpen(false);
              }}
              className={cn(
                "w-full flex items-center justify-start gap-4 px-6 py-4 h-auto rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all group",
                activeTab === item.id
                  ? "bg-primary text-white glow-primary"
                  : "text-white/40 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon
                className={cn(
                  "w-4 h-4 transition-colors",
                  activeTab === item.id ? "text-white" : "text-white/20 group-hover:text-white/60"
                )}
              />
              {item.label}
            </Button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-6 border-t border-white/[0.05] space-y-6">
          <div className="px-4">
            <ISTTimer className="text-white/40" />
          </div>
          <Button
            variant="ghost"
            onClick={onLogout}
            className="w-full h-14 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-red-500 hover:bg-red-500/5 transition-all"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Terminate Session
          </Button>
        </div>
      </aside>
    </>
  );
}
