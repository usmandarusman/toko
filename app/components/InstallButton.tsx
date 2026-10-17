
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
  const [message, setMessage] = useState("");
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const checkInstalled = () => {
      const standalone = window.matchMedia(
        "(display-mode: standalone)"
      ).matches;

      const iosStandalone = (
        navigator as Navigator & { standalone?: boolean }
      ).standalone === true;

      setIsInstalled(standalone || iosStandalone);
    };

    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();

      setInstallPrompt(event as BeforeInstallPromptEvent);
      setMessage("");
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      setInstalling(false);
      setMessage("");
    };

    const displayMode = window.matchMedia(
      "(display-mode: standalone)"
    );

    checkInstalled();

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstall
    );

    window.addEventListener("appinstalled", handleInstalled);
    displayMode.addEventListener("change", checkInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstall
      );

      window.removeEventListener(
        "appinstalled",
        handleInstalled
      );

      displayMode.removeEventListener("change", checkInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (installing || isInstalled) return;

    if (!installPrompt) {
      setMessage(
        "Dialog instalasi belum tersedia. Gunakan menu ⋮ Chrome → Install app. Jika opsi tersebut tersedia, website dapat di-install, tetapi browser belum memberikan dialog ke tombol ini."
      );
      return;
    }

    setInstalling(true);
    setMessage("");

    try {
      const promptEvent = installPrompt;

      setInstallPrompt(null);

      await promptEvent.prompt();

      const choice = await promptEvent.userChoice;

      if (choice.outcome === "accepted") {
        setMessage("Permintaan instalasi diterima.");
      } else {
        setMessage("Instalasi dibatalkan.");
      }
    } catch (error) {
      console.error("Gagal memulai instalasi PWA:", error);

      setMessage(
        "Instalasi gagal dimulai. Muat ulang website lalu coba lagi."
      );
    } finally {
      setInstalling(false);
    }
  };

  if (isInstalled) return null;

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        onClick={handleInstall}
        disabled={installing}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-400/30 bg-indigo-500 px-2 py-1 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 transition duration-200 hover:-translate-y-0.5 hover:bg-indigo-600 hover:shadow-indigo-500/30 active:translate-y-0 disabled:cursor-wait disabled:opacity-60"
      >
        <span className="text-sm">
          {installing ? "Memproses..." : "Install App"}
        </span>
      </button>

      {message && (
        <p
          role="status"
          aria-live="polite"
          className="max-w-[220px] text-right text-[11px] leading-4 text-[var(--kt-muted)]"
        >
          {message}
        </p>
      )}
    </div>
  );
}
