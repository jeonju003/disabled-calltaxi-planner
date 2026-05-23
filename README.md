# 장애인 콜택시 일정·이용 도우미

서울시 **장애인콜시스템**·**일별 이용현황** 공공데이터와 로컬 캘린더·PWA로, 이용 패턴 확인과 약속·콜 접수 시각 계획을 돕는 웹 앱입니다.

## 기능

| 탭 | 기능 |
|----|------|
| **패턴** | `disabledCalltaxi` 건별 데이터 → 요일·시간 히트맵 |
| **일별** | 시설공단 일별 이용현황 → 일별 평균 대기·접수/탑승 |
| **일정** | 약속 입력 → 콜 접수 권장 시각·대안 시간 |
| **내 일정** | 브라우저 저장 + **.ics**로 휴대폰 캘린더 가져오기 |
| **모바일** | PWA(홈 화면 추가), 하단 탭, 터치 UI |

## 환경 변수

`.env.local` 예시:

```env
SEOUL_OPEN_API_KEY=발급키

# 일별 이용현황 — 신청서 메일(jhyoon@sisul.or.kr) 후 회신 URL
SISUL_DAILY_API_URL=https://회신받은주소?key={key}&sDate={sDate}&eDate={eDate}
SISUL_DAILY_API_KEY=발급키
```

`SISUL_DAILY_API_URL`에 `{key}`, `{sDate}`, `{eDate}` 플레이스홀더를 쓰거나,  
기본 쿼리 `?key=…&sDate=…&eDate=…` 형태 URL만 넣어도 됩니다.

키가 없으면 **데모 데이터**로 동작합니다.

## API

### 서울 장애인콜시스템

```
http://openapi.seoul.go.kr:8088/{키}/json/disabledCalltaxi/1/1000/YYYYMMDD
```

### 일별 이용현황 (시설공단)

- [신청 안내](https://www.sisul.or.kr/open_content/calltaxi/community/api.jsp)
- 요청: `key`, `sDate`, `eDate` (`yyyy-mm-dd`)
- 응답: 차량운행, 접수건, 탑승건, 평균대기시간(분), 평균요금, 평균승차거리(km)

앱 API: `GET /api/daily-stats?days=14`

## 실행

```bash
cd disabled-calltaxi-planner
cp .env.example .env.local
npm install
npm run dev
```

### 모바일(PWA) 설치

1. HTTPS 또는 `localhost`에서 접속  
2. Chrome: 메뉴 → **홈 화면에 추가** / Safari: **공유 → 홈 화면에 추가**  
3. 앱 내 「홈 화면에 추가」 배너(지원 브라우저)

## 캘린더 저장

- 데이터는 **이 기기 브라우저** `localStorage`에만 저장됩니다.  
- 「휴대폰 캘린더(.ics)」로 구글/애플 캘린더에 **콜 접수**·**약속** 이벤트를 가져올 수 있습니다.

## 주의

- 공공데이터는 **과거·집계** 정보이며 실시간 배차와 다릅니다.  
- 일별 API URL·필드명은 기관 회신에 따라 다를 수 있어, 파서는 여러 필드명을 시도합니다.

## 출처

- 서울특별시 장애인콜시스템 Open API  
- 서울시설공단 장애인콜택시 일별 이용현황  
