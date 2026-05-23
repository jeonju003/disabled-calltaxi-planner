import Image from "next/image";

export function AppHero() {
  return (
    <header className="card-hope-warm mb-6 overflow-hidden p-0">
      <div className="relative">
        <Image
          src="/illustrations/hero-hope.svg"
          alt=""
          width={800}
          height={320}
          className="h-36 w-full object-cover object-center sm:h-44 md:h-52"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 pt-8 sm:px-6">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-sky-800 shadow-sm backdrop-blur-sm">
            <span aria-hidden>☀️</span>
            서울 장애인 콜택시
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
            <span className="text-sky-600">함께 나가요</span>
            , 일정·이용 도우미
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
            바깥 활동을 계획할 때 수월한 시간을 찾고, 약속에 맞춰 콜 접수 시각을
            안내해 드립니다.
          </p>
        </div>
      </div>
    </header>
  );
}
