# iOS 푸시 알림(APNs) 활성화 가이드

> 다함푸드 VOC iOS 1.0.4 출시 후, 푸시 알림 활성화를 위한 절차 정리.
> 회사 PC에서 진행 (APNs `.p8` 파일 보관 위치).

## 📋 사전 확인 (이미 완료된 것)

- [x] Apple Developer 계정 활성 (`sos1253@gmail.com`, Team `2UQDWHJ95K`)
- [x] App Store Connect에 앱 등록 (App ID `6764727176`, Bundle ID `com.daham.voc`)
- [x] iOS 1.0.4 App Store 심사 통과 (2026-05-09)
- [x] Apple Developer 콘솔에서 **"Daham VOC APNs Key"** 발급 (`.p8` 파일)
- [x] Firebase 프로젝트 `daham-food` 생성 + iOS 앱 등록
- [x] [mobile/GoogleService-Info.plist](mobile/GoogleService-Info.plist) 커밋 완료
- [x] [mobile/app.json](mobile/app.json) `ios.googleServicesFile` 참조 설정

## 🚧 회사에서 진행할 작업

### Step 1: APNs Key 정보 확인

Apple Developer Portal → **Certificates, Identifiers & Profiles** → **Keys** 메뉴에서 "Daham VOC APNs Key" 클릭.

다음 3가지 정보를 메모:

| 항목 | 위치 | 예시 |
|---|---|---|
| `.p8` 파일 | 키 발급 시 다운로드한 파일 | `AuthKey_XXXXXXXXXX.p8` |
| **Key ID** | 키 상세 페이지 (10자리) | `ABC123DEF4` |
| **Team ID** | Apple Developer 우측 상단 | `2UQDWHJ95K` ✓ (확정) |

⚠️ `.p8` 파일을 잃어버렸다면 → 그 키는 **Revoke** 후 새로 발급 (재다운로드 불가).

### Step 2: Firebase Console에 APNs Key 업로드

1. https://console.firebase.google.com/project/daham-food/settings/cloudmessaging 접속
2. **Apple 앱 구성** 섹션에서 `com.daham.voc` 항목 찾기
3. **APNs 인증 키** → **업로드** 클릭
4. 입력:
   - 파일: `AuthKey_XXXXXXXXXX.p8`
   - **Key ID**: (Step 1에서 메모한 값)
   - **Team ID**: `2UQDWHJ95K`
5. **업로드** 클릭

✅ 업로드 후 "APNs 인증 키" 항목에 Key ID가 표시되면 성공.

### Step 3: 앱 버전 업데이트

[mobile/app.json](mobile/app.json) 수정:

```json
{
  "expo": {
    "version": "1.0.5",        // 1.0.4 → 1.0.5
    "ios": {
      "buildNumber": "2"        // "1" → "2"
    }
  }
}
```

> Android는 EAS `autoIncrement: true`로 자동 증가하므로 별도 작업 불필요.

### Step 4: 운영 빌드 + 자동 제출

```bash
cd mobile

# iOS만 다시 빌드 (Android는 푸시 이미 동작 중)
eas build --platform ios --profile production --auto-submit
```

빌드 약 15-30분 + App Store 심사 1-3일.

### Step 5: 푸시 동작 검증

#### 5-1. 빌드 완료 후 TestFlight로 사전 테스트 (권장)

1. EAS 빌드 완료 → TestFlight에 자동 업로드됨 (auto-submit + Apple 처리 시간)
2. 본인 iPhone에 TestFlight 앱 설치 → 베타 버전 다운로드
3. 앱 로그인 → **알림 권한 허용**
4. 백엔드 로그에서 푸시 토큰 등록 확인:
   ```
   [push] 토큰 등록 완료 (platform=ios, token=ExponentPushToken[...])
   ```

#### 5-2. 관리자 웹에서 공지 발송 테스트

1. https://admin.dahamvoc.co.kr 로그인
2. 공지사항 작성 → **푸시 알림 발송** 체크 → 등록
3. iPhone 알림센터에 도착 확인

#### 5-3. 직접 Expo Push API 호출 테스트 (선택)

```bash
curl -H "Content-Type: application/json" \
  -X POST https://exp.host/--/api/v2/push/send \
  -d '{
    "to": "ExponentPushToken[테스트 토큰]",
    "title": "푸시 테스트",
    "body": "iOS 푸시 동작 확인"
  }'
```

응답에 `"status": "ok"`가 오면 Expo Push 단계까지는 정상.

## 🆘 트러블슈팅

### ❌ 토큰은 발급되는데 알림이 안 옴

원인 후보:

1. **APNs Key를 Firebase에 안 올렸음** → Step 2 재확인
2. **개발 빌드 사용 중** → TestFlight/App Store 빌드여야 운영 APNs 사용
3. **알림 권한 거부** → 설정 앱 → 다함푸드 VOC → 알림 ON
4. **방해금지 모드** → iOS 설정에서 확인

### ❌ "Invalid push token" 에러

- 토큰 형식이 `ExponentPushToken[...]`이어야 함
- iOS 시뮬레이터는 푸시 토큰 발급 불가 (실기기 필수)

### ❌ Firebase 콘솔에 iOS 앱이 안 보임

- https://console.firebase.google.com/project/daham-food/settings/general 에서 **앱 추가** → iOS
- Bundle ID: `com.daham.voc` 입력
- 새로 다운로드된 `GoogleService-Info.plist`로 [mobile/GoogleService-Info.plist](mobile/GoogleService-Info.plist) 교체 후 재커밋

## 📊 푸시 흐름 (iOS)

```text
[웹/관리자 공지 작성]
    ↓ POST /notices (sendPush=true)
[GCP VM 백엔드]
    ↓ pushTokenService → 활성 토큰 조회
    ↓ pushSendService → fetch('https://exp.host/--/api/v2/push/send')
[Expo Push Service]
    ↓ FCM v1 API (등록된 fcm-key.json 사용)
[Firebase FCM]
    ↓ APNs로 forwarding (등록된 APNs Auth Key 사용)
[Apple APNs]
    ↓
[iPhone] → OS 알림센터에 표시
```

## 🔗 관련 파일

- 모바일 토큰 발급: [mobile/src/hooks/usePushNotifications.ts](mobile/src/hooks/usePushNotifications.ts)
- 백엔드 토큰 관리: [backend/src/services/push-token.service.ts](backend/src/services/push-token.service.ts)
- 백엔드 푸시 발송: [backend/src/services/push-send.service.ts](backend/src/services/push-send.service.ts)
- 공지 자동 발송: [backend/src/services/notice.service.ts](backend/src/services/notice.service.ts) `sendPushForNotice()`
- iOS Firebase 설정: [mobile/GoogleService-Info.plist](mobile/GoogleService-Info.plist)
- EAS 빌드 설정: [mobile/eas.json](mobile/eas.json)
- 빌드 명령어 가이드: [CLAUDE.md](CLAUDE.md) "모바일 앱 (수동 빌드)" 섹션

## ✅ 체크리스트 (회사 작업 시 사용)

- [ ] `.p8` 파일 / Key ID 확인
- [ ] Firebase Console에 APNs Key 업로드
- [ ] [mobile/app.json](mobile/app.json) version 1.0.5, buildNumber "2"로 증가
- [ ] `eas build --platform ios --profile production --auto-submit` 실행
- [ ] TestFlight 다운로드 + 알림 권한 허용
- [ ] 백엔드 로그에서 토큰 등록 확인
- [ ] 관리자 웹에서 공지 발송 → iPhone 수신 확인
- [ ] App Store 심사 통과 후 1.0.5 배포

---

**작성일**: 2026-05-12
**관련 출시**: iOS 1.0.4 (푸시 비활성화) → 1.0.5 (푸시 활성화 예정)
