
/* eslint-disable react-hooks/set-state-in-effect */

"use client";

import { useCallback, useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

/**
 * Simpan event di luar komponen agar tidak hilang
 * ketika InstallButton unmount dan mount kembali.
 */
let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;

const PROMPT_READY_EVENT = "incomeon-install-prompt-ready";

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event: Event) => {
    event.preventDefault();

    deferredInstallPrompt = event as BeforeInstallPromptEvent;

    window.dispatchEvent(new Event(PROMPT_READY_EVENT));

    console.info("[PWA] Install prompt tersimpan");
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;

    window.dispatchEvent(new Event(PROMPT_READY_EVENT));

    console.info("[PWA] Aplikasi berhasil di-install");
  });
}

export default function InstallButton() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(
      deferredInstallPrompt
    );

  const [isInstalled, setIsInstalled] = useState(false);
  const [message, setMessage] = useState("");
  const [installing, setInstalling] = useState(false);

  const checkInstalled = useCallback(() => {
    const standalone = window.matchMedia(
      "(display-mode: standalone)"
    ).matches;

    const iosStandalone = (
      navigator as Navigator & { standalone?: boolean }
    ).standalone === true;

    setIsInstalled(standalone || iosStandalone);
  }, []);

  useEffect(() => {
    const syncPrompt = () => {
      setInstallPrompt(deferredInstallPrompt);
    };

    const handleInstalled = () => {
      deferredInstallPrompt = null;
      setInstallPrompt(null);
      setIsInstalled(true);
      setInstalling(false);
      setMessage("");
    };

    const displayMode = window.matchMedia(
      "(display-mode: standalone)"
    );

    // Pasang listener dahulu, baru sinkronkan state.
    window.addEventListener(PROMPT_READY_EVENT, syncPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    displayMode.addEventListener("change", checkInstalled);

    checkInstalled();
    syncPrompt();

    return () => {
      window.removeEventListener(PROMPT_READY_EVENT, syncPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
      displayMode.removeEventListener("change", checkInstalled);
    };
  }, [checkInstalled]);

  const handleInstall = async () => {
    if (installing || isInstalled) return;

    // Gunakan state terbaru, termasuk event yang diterima
    // sebelum komponen ini dipasang.
    const promptEvent =
      deferredInstallPrompt ?? installPrompt;

    if (!promptEvent) {
      setMessage(
        "Dialog instalasi belum tersedia. Muat ulang website dan coba lagi, atau gunakan menu ⋮ Chrome → Install app."
      );

      console.warn(
        "[PWA] Tidak ada beforeinstallprompt yang tersedia."
      );

      return;
    }

    setInstalling(true);
    setMessage("");

    try {
      // Prompt hanya boleh dipakai satu kali.
      deferredInstallPrompt = null;
      setInstallPrompt(null);

      await promptEvent.prompt();

      const choice = await promptEvent.userChoice;

      console.info(
        "[PWA] Hasil instalasi:",
        choice.outcome
      );

      if (choice.outcome === "accepted") {
        setMessage("Permintaan instalasi diterima.");
      } else {
        setMessage("Instalasi dibatalkan.");
      }
    } catch (error) {
      console.error("[PWA] Gagal membuka prompt:", error);

      setMessage(
        "Dialog instalasi gagal dibuka. Muat ulang website dan coba lagi."
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
