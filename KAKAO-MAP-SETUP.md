# 카카오맵 API 설정 가이드

현재 지도가 표시되지 않는 이유는 **카카오 개발자 콘솔 설정**이 필요하기 때문입니다.

## 문제 상황
- 스크립트 로드 실패: `Failed to load Kakao script`
- 현재 사용 중인 키: `2ec48bfd86a549a69da630e18d685008`

## 해결 방법

### 1단계: 카카오 개발자 콘솔 접속
1. https://developers.kakao.com 접속
2. 로그인
3. 내 애플리케이션 선택

### 2단계: JavaScript 키 확인
1. 앱 설정 > 앱 키 메뉴
2. **JavaScript 키** 확인 (REST API 키 아님!)
3. JavaScript 키를 복사

### 3단계: 웹 플랫폼 도메인 등록
1. 앱 설정 > 플랫폼 메뉴
2. Web 플랫폼 추가
3. 다음 도메인들을 등록:
   ```
   http://localhost:5173
   http://localhost:5174
   ```

### 4단계: .env 파일 업데이트
`web/.env` 파일에서 JavaScript 키로 변경:
```env
VITE_API_BASE_URL=/api/v1
VITE_KAKAO_MAP_APP_KEY=여기에_JavaScript_키_입력
```

### 5단계: 서버 재시작
```bash
# 프론트엔드 재시작 (Ctrl+C로 중지 후)
cd web
npm run dev
```

## 주의사항

### REST API 키 vs JavaScript 키
- **REST API 키**: 주소 검색 API에 사용 (현재 사용 중)
- **JavaScript 키**: 지도 SDK에 사용 (필요!)

두 키는 **다릅니다**. 현재 `.env`에 설정된 키는 REST API 키로 보입니다.

### 키 관리
- JavaScript 키를 구한 후 `.env` 파일 업데이트
- 만약 하나의 키로 두 가지를 다 지원하려면:
  - 카카오 개발자 콘솔에서 해당 키에 대해
  - 웹 플랫폼 도메인 등록 필수

## 테스트 방법

설정 완료 후:
1. 브라우저 새로고침 (Shift + F5로 캐시 삭제)
2. F12 개발자 도구 > Console 탭
3. 다음 로그 확인:
   - ✅ `Kakao script loaded successfully`
   - ✅ `Map initialization complete!`

## 대안 (임시)

카카오 API 설정이 어려운 경우, 주소와 좌표만 표시하는 리스트 뷰로 대체 가능합니다.

---

## 참고 링크
- 카카오 개발자 콘솔: https://developers.kakao.com
- 카카오맵 API 가이드: https://apis.map.kakao.com/web/guide/
