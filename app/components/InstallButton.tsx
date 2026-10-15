/* eslint-disable react-hooks/set-state-in-effect */

"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

export default function InstallButton() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();

      setInstallPrompt(
        event as BeforeInstallPromptEvent
      );
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone
    ) {
      setIsInstalled(true);
    }

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstall
    );

    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstall
      );

      window.removeEventListener(
        "appinstalled",
        handleInstalled
      );
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) {
      alert(
        "Instalasi otomatis belum tersedia. Buka menu browser, lalu pilih Install app atau Tambahkan ke layar utama."
      );
      return;
    }

    await installPrompt.prompt();

    const choice = await installPrompt.userChoice;

    if (choice.outcome === "accepted") {
      setInstallPrompt(null);
    }
  };

  if (isInstalled) return null;

  return (
    <button
      type="button"
      onClick={handleInstall}
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-400/30 bg-indigo-500 px-2 py-1 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 transition duration-200 hover:-translate-y-0.5 hover:bg-indigo-600 hover:shadow-indigo-500/30 active:translate-y-0"
    >
      <span className="text-sm">Install App</span>
    </button>
  );
}
