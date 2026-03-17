"use client";

import React from "react";
import { AppSidebar, NavItem } from "./AppSidebar";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
  activeTab: string;
  setActiveTab: (id: string) => void;
  selectedLogo: "gold" | "original" | "custom";
  customLogoCid?: string;
  onLogout: () => void;
  title: string;
  subtitle: string;
  className?: string;
  contentClassName?: string;
}

export function DashboardLayout({
  children,
  navItems,
  activeTab,
  setActiveTab,
  selectedLogo,
  customLogoCid,
  onLogout,
  title,
  subtitle,
  className,
  contentClassName,
}: DashboardLayoutProps) {
  return (
    <div className={cn("min-h-screen bg-transparent flex font-body selection:bg-primary/30", className)}>
      {/* Persistent Sidebar */}
      <AppSidebar
        navItems={navItems}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedLogo={selectedLogo}
        customLogoCid={customLogoCid}
        onLogout={onLogout}
        title={title}
        subtitle={subtitle}
      />

      {/* Main Content Area */}
      <main
        className={cn(
          "flex-1 flex flex-col min-w-0 h-screen overflow-y-auto no-scrollbar lg:ml-80 transition-all duration-300",
          contentClassName
        )}
      >
        <div className="w-full max-w-[1800px] mx-auto p-6 md:p-10 lg:p-12 space-y-8 pb-32">
          {children}
        </div>
      </main>
    </div>
  );
}
