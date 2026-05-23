"use client";

import { useEffect, useState } from "react";
import {
  CALLTAXI_LINKS,
  getPrimaryApplyUrl,
} from "@/lib/constants/calltaxi-links";
import { cn } from "@/lib/utils/cn";

function ExternalLink({
  href,
  children,
  variant = "secondary",
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline";
  className?: string;
}) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition-all active:scale-[0.98]";
  const styles = {
    primary: "btn-primary",
    secondary:
      "bg-white/95 text-sky-900 border border-sky-200/60 hover:bg-sky-50 shadow-sm",
    outline:
      "bg-white/60 text-slate-700 border border-amber-200/50 hover:bg-amber-50/80",
  };
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(base, styles[variant], className)}
    >
      {children}
    </a>
  );
}

export function CallTaxiApplyPanel() {
  const [primaryUrl, setPrimaryUrl] = useState<string>(
    CALLTAXI_LINKS.internetCall,
  );

  useEffect(() => {
    setPrimaryUrl(getPrimaryApplyUrl(navigator.userAgent));
  }, []);

  return (
    <section
      className="card-hope-warm mb-6 overflow-hidden p-4 sm:p-5"
      aria-labelledby="calltaxi-apply-heading"
    >
      <div className="flex gap-3">
        <span className="section-icon shrink-0" aria-hidden>
          🚕
        </span>
        <div>
          <h2
            id="calltaxi-apply-heading"
            className="text-base font-bold text-slate-800 sm:text-lg"
          >
            장애인 콜택시 신청·접수
          </h2>
          <p className="mt-1 text-sm text-slate-600 leading-relaxed">
            회원 등록 후 앱·인터넷·전화로 콜을 접수할 수 있습니다. 한 번의
            클릭으로 공식 채널로 이동합니다.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <ExternalLink
          href={primaryUrl}
          variant="primary"
          className="sm:col-span-2 min-h-[48px] text-base"
        >
          ✨ 콜택시 바로 신청하기
        </ExternalLink>
        <ExternalLink href={CALLTAXI_LINKS.join} variant="secondary">
          회원가입·이용등록
        </ExternalLink>
        <ExternalLink href={CALLTAXI_LINKS.internetCall} variant="secondary">
          인터넷 콜접수
        </ExternalLink>
        <ExternalLink href={CALLTAXI_LINKS.androidApp} variant="outline">
          Android 앱
        </ExternalLink>
        <ExternalLink href={CALLTAXI_LINKS.iosAppSearch} variant="outline">
          iPhone 앱
        </ExternalLink>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-amber-200/40 pt-3 text-sm">
        <a
          href={CALLTAXI_LINKS.phoneTel}
          className="rounded-lg bg-sky-100/80 px-2.5 py-1 font-semibold text-sky-800"
        >
          📞 {CALLTAXI_LINKS.phoneDisplay}
        </a>
        <a
          href={CALLTAXI_LINKS.guide}
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-600 hover:text-sky-700 underline-offset-2 hover:underline"
        >
          이용방법
        </a>
        <a
          href={CALLTAXI_LINKS.home}
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-600 hover:text-sky-700 underline-offset-2 hover:underline"
        >
          공식 홈
        </a>
      </div>
    </section>
  );
}

export function CallTaxiApplyFab() {
  const [primaryUrl, setPrimaryUrl] = useState<string>(
    CALLTAXI_LINKS.internetCall,
  );

  useEffect(() => {
    setPrimaryUrl(getPrimaryApplyUrl(navigator.userAgent));
  }, []);

  return (
    <a
      href={primaryUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-4 right-4 z-40 mx-auto flex max-w-lg items-center justify-center gap-2 rounded-full bg-gradient-to-r from-sky-500 via-cyan-500 to-sky-600 py-3.5 text-center text-sm font-bold text-white shadow-lg shadow-sky-400/40 active:scale-[0.98] md:hidden"
    >
      <span aria-hidden>🚕</span>
      콜택시 신청하기
    </a>
  );
}
