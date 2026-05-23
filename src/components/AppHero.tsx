import Image from "next/image";

export function AppHero() {
  return (
    <header className="card-hope-warm mb-6 overflow-hidden p-0">
      {/* 모바일: 사진 위 + 텍스트 오버레이 */}
      <div className="relative md:hidden">
        <Image
          src="/images/hero-city-day.jpg"
          alt="햇살이 비치는 도시 거리"
          width={1400}
          height={560}
          className="h-40 w-full object-cover object-center"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white/92 via-white/25 to-transparent" />
        <HeroCopy className="absolute bottom-0 left-0 right-0 px-5 pb-5 pt-8" />
      </div>

      {/* PC: 사진·텍스트 나란히 (얇은 띠 형태 방지) */}
      <div className="hidden md:grid md:grid-cols-[1.15fr_1fr] md:min-h-[220px]">
        <div className="relative min-h-[220px]">
          <Image
            src="/images/hero-city-day.jpg"
            alt=""
            width={1400}
            height={560}
            className="absolute inset-0 h-full w-full object-cover object-center"
            priority
            sizes="55vw"
            aria-hidden
          />
        </div>
        <div className="flex flex-col justify-center border-l border-amber-200/40 bg-gradient-to-br from-white via-amber-50/40 to-sky-50/30 px-6 py-6 lg:px-8">
          <HeroCopy />
        </div>
      </div>
    </header>
  );
}

function HeroCopy({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <p className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-sky-800 shadow-sm backdrop-blur-sm">
        <span aria-hidden>☀️</span>
        서울 장애인 콜택시
      </p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-800 lg:text-3xl">
        <span className="text-sky-600">함께 나가요</span>
        , 일정·이용 도우미
      </h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600 lg:text-base">
        바깥 활동을 계획할 때 수월한 시간을 찾고, 약속에 맞춰 콜 접수 시각을
        안내해 드립니다.
      </p>
    </div>
  );
}
