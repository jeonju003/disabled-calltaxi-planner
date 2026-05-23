import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "장애인 콜택시 일정 도우미",
    short_name: "콜택시 일정",
    description:
      "서울 장애인 콜택시 이용 패턴과 약속 일정·콜 접수 시각을 안내합니다.",
    start_url: "/",
    display: "standalone",
    background_color: "#fef9c3",
    theme_color: "#7DD3FC",
    orientation: "portrait-primary",
    lang: "ko",
    icons: [
      {
        src: "/icons/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
