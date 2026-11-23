# 무신사 재입고 알리미 PWA

대상 옵션:
- 상품 링크: https://musinsa.onelink.me/PvkC/t0cn3kqj
- 사용자 지정 옵션: 블랙: 서밋 화이트 / L
- 참고 품번: IR2245-010 (사용자 제공 정보)

## 현재 구현 범위
- 모바일 PWA 화면
- 서비스 워커 및 웹 푸시 구독 코드
- 구독 저장 및 테스트 푸시 서버
- 상품 옵션 표시

## 아직 필요한 작업
**무신사 재고 데이터 연동은 구현되어 있지 않습니다.** `/api/stock`은 의도적으로 501을 반환합니다. 이 프로젝트는 현재 실제 재고를 조회하거나 자동 감시하지 않습니다.
정확한 옵션의 재고를 확인할 수 있는 공식/허가된 데이터 소스 또는 제휴 API가 필요합니다. 상품 페이지의 HTML을 무단으로 반복 수집하거나 로그인·CAPTCHA·접근 제한을 우회하도록 구성하지 않았습니다.

## 실행
1. Node.js 18 이상 설치
2. `npm install`
3. VAPID 키 생성: `npx web-push generate-vapid-keys`
4. 환경변수 설정:
   - `VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
   - `VAPID_SUBJECT` (예: `mailto:you@example.com`)
5. `npm start`
6. HTTPS를 지원하는 호스팅에 배포
7. iPhone Safari에서 사이트 열기 → 공유 → 홈 화면에 추가 → 앱 실행 → 알림 허용

로컬 개발 중에는 localhost가 예외적으로 허용되지만, iPhone 실사용은 HTTPS 배포가 필요합니다.

## 재고 확인 연동 시
허가된 재고 소스를 연결한 뒤 서버 측 스케줄러에서 5분 이상 간격으로 옵션 재고를 확인하고, `out_of_stock -> in_stock` 변화가 있을 때만 저장된 구독으로 푸시를 보내도록 구현해야 합니다. 실제 확인 주기와 사용 조건은 데이터 제공자의 정책을 따라야 합니다.
