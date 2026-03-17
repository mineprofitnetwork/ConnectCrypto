"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Smartphone, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!window.matchMedia('(display-mode: standalone)').matches) {
        setIsVisible(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    (deferredPrompt as any).prompt();
    const { outcome } = await (deferredPrompt as any).userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setIsVisible(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[200] md:max-w-xs md:left-auto animate-in slide-in-from-bottom-5 duration-500">
      <Card className="glass-card glow-primary border-primary/30 rounded-2xl overflow-hidden shadow-2xl">
        <CardContent className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 p-2 rounded-xl text-primary border border-primary/10">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <p className="font-headline font-bold text-[10px] tracking-tight uppercase">Native App</p>
              <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Add to Home Screen</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" onClick={() => setIsVisible(false)} className="rounded-lg hover:bg-white/5 h-8 w-8">
              <X className="w-4 h-4 text-muted-foreground" />
            </Button>
            <Button size="sm" className="bg-primary hover:bg-primary/90 glow-primary font-bold text-[8px] uppercase tracking-widest px-4 rounded-lg h-8 text-white" onClick={handleInstall}>
              Install
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

