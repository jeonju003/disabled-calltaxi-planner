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
    "inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition-colors active:scale-[0.98]";
  const styles = {
    primary: "bg-sky-600 text-white hover:bg-sky-700 shadow-sm",
    secondary: "bg-white text-sky-900 border border-sky-200 hover:bg-sky-50",
    outline:
      "bg-transparent text-slate-700 border border-slate-300 hover:bg-slate-50",
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
      className="mb-6 rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-4 shadow-sm sm:p-5"
      aria-labelledby="calltaxi-apply-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="calltaxi-apply-heading"
            className="text-base font-bold text-slate-900 sm:text-lg"
          >
            장애인 콜택시 신청·접수
          </h2>
          <p className="mt-1 text-sm text-slate-600 leading-relaxed">
            회원 등록 후 앱·인터넷·전화로 콜을 접수할 수 있습니다. 아래 버튼을
            누르면 공식 사이트·앱으로 이동합니다.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <ExternalLink
          href={primaryUrl}
          variant="primary"
          className="sm:col-span-2 min-h-[48px] text-base"
        >
          콜택시 바로 신청하기
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

      <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-sky-100 pt-3 text-sm">
        <a
          href={CALLTAXI_LINKS.phoneTel}
          className="font-semibold text-sky-800 underline-offset-2 hover:underline"
        >
          전화 {CALLTAXI_LINKS.phoneDisplay}
        </a>
        <span className="text-slate-400">·</span>
        <a
          href={CALLTAXI_LINKS.guide}
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-600 underline-offset-2 hover:text-sky-800 hover:underline"
        >
          이용방법 안내
        </a>
        <span className="text-slate-400">·</span>
        <a
          href={CALLTAXI_LINKS.home}
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-600 underline-offset-2 hover:text-sky-800 hover:underline"
        >
          공식 홈페이지
        </a>
      </div>
    </section>
  );
}

/** 모바일 하단 고정 빠른 신청 버튼 */
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
      className="fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom))] left-4 right-4 z-40 mx-auto flex max-w-lg items-center justify-center rounded-full bg-sky-600 py-3.5 text-center text-sm font-bold text-white shadow-lg active:bg-sky-700 md:hidden"
    >
      콜택시 신청하기
    </a>
  );
}
