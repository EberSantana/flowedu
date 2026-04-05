import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Singleton para o evento de instalação (capturado antes do React montar)
let cachedPrompt: BeforeInstallPromptEvent | null = null;
const listeners: Set<(prompt: BeforeInstallPromptEvent | null) => void> = new Set();

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    cachedPrompt = e as BeforeInstallPromptEvent;
    listeners.forEach((fn) => fn(cachedPrompt));
  });
}

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

export function useInstallPWA() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(cachedPrompt);
  const [installed, setInstalled] = useState(isStandalone);

  useEffect(() => {
    const handler = (prompt: BeforeInstallPromptEvent | null) => setInstallPrompt(prompt);
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(display-mode: standalone)");
    const handler = (e: MediaQueryListEvent) => setInstalled(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const canInstall = !installed && (!!installPrompt || isIOS());

  async function triggerInstall(): Promise<"accepted" | "dismissed" | "ios"> {
    if (isIOS()) return "ios";
    if (!installPrompt) return "dismissed";
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      cachedPrompt = null;
      setInstallPrompt(null);
      listeners.forEach((fn) => fn(null));
    }
    return outcome;
  }

  return { canInstall, installPrompt, isIOS: isIOS(), installed, triggerInstall };
}
