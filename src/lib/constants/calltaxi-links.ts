/** 서울시설공단 장애인콜택시 공식 링크 */
export const CALLTAXI_LINKS = {
  home: "https://www.sisul.or.kr/open_content/calltaxi/",
  /** 회원가입·이용 등록 안내 */
  join: "https://www.sisul.or.kr/open_content/calltaxi/introduce/join.jsp",
  /** 인터넷 콜접수 (로그인) */
  internetCall: "http://calltaxi.sisul.or.kr",
  internetLogin:
    "https://www.sisul.or.kr/open_content/calltaxi/guidance/internet.jsp",
  /** 이용방법·콜접수 안내 */
  guide: "https://www.sisul.or.kr/open_content/calltaxi/introduce/guide2.jsp",
  androidApp:
    "https://play.google.com/store/apps/details?id=sisul.calltaxi2020&hl=ko",
  iosAppSearch:
    "https://apps.apple.com/kr/search?term=%EC%84%9C%EC%9A%B8%EC%9E%A5%EC%95%A0%EC%9D%B8%EC%BD%9C%ED%83%9D%EC%8B%9C",
  phoneTel: "tel:15884388",
  phoneDisplay: "1588-4388",
} as const;

export function getPrimaryApplyUrl(userAgent?: string) {
  const ua = userAgent ?? "";
  if (/android/i.test(ua)) return CALLTAXI_LINKS.androidApp;
  if (/iphone|ipad|ipod/i.test(ua)) return CALLTAXI_LINKS.iosAppSearch;
  return CALLTAXI_LINKS.internetCall;
}
