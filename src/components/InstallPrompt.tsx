"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [dismissed, setDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsStandalone(true);
    }
    const dismissedAt = localStorage.getItem("pwa-install-dismissed");
    if (dismissedAt && Date.now() - Number(dismissedAt) < 7 * 86400000) {
      setDismissed(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (isStandalone || dismissed || !deferred) return null;

  async function install() {
    await deferred?.prompt();
    const { outcome } = await deferred!.userChoice;
    if (outcome === "accepted") setDeferred(null);
    setDismissed(true);
  }

  function close() {
    localStorage.setItem("pwa-install-dismissed", String(Date.now()));
    setDismissed(true);
  }

  return (
    <div className="fixed bottom-[calc(7.5rem+env(safe-area-inset-bottom))] left-3 right-3 z-40 mx-auto max-w-lg card-hope-warm p-4 shadow-lg md:bottom-4">
      <p className="text-sm font-bold text-sky-900">홈 화면에 추가</p>
      <p className="mt-1 text-xs text-sky-900/80">
        앱처럼 설치하면 일정·콜 접수 시각을 더 빠르게 확인할 수 있습니다.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={install}
          className="btn-primary flex-1 rounded-xl py-2.5 text-sm font-bold"
        >
          설치
        </button>
        <button
          type="button"
          onClick={close}
          className="rounded-xl px-4 py-2.5 text-sm text-sky-800"
        >
          나중에
        </button>
      </div>
    </div>
  );
}
