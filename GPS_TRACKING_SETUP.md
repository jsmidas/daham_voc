# GPS 추적 기능 구현 준비 완료

## 📋 완료된 작업

### ✅ 1. 백엔드 API 구현
모든 배송 추적 API가 구현되었습니다:

#### **엔드포인트 목록**
```
POST   /api/v1/delivery-logs/initialize      - 일일 배송 기록 일괄 생성
GET    /api/v1/delivery-logs/my-today        - 오늘의 나의 배송 기록 조회
POST   /api/v1/delivery-logs/:id/check-in    - 사업장 도착 체크인
POST   /api/v1/delivery-logs/:id/check-out   - 사업장 출발 체크아웃
GET    /api/v1/delivery-logs                 - 배송 기록 목록 조회
GET    /api/v1/delivery-logs/:id             - 배송 기록 상세 조회
DELETE /api/v1/delivery-logs/:id             - 배송 기록 삭제
```

#### **주요 기능**
- ✅ 배송 시작 시 GPS 좌표 자동 저장
- ✅ 100m 반경 Geofencing 검증
- ✅ 체크인/체크아웃 시간 및 위치 기록
- ✅ 이동 거리 및 소요 시간 자동 계산
- ✅ 문제 발생 시 이슈 리포트 기능

### ✅ 2. 모바일 앱 설정
GPS 관련 권한과 플러그인이 설정되었습니다:

#### **Android 권한**
- `ACCESS_FINE_LOCATION` - 정밀 위치
- `ACCESS_COARSE_LOCATION` - 대략적 위치
- `ACCESS_BACKGROUND_LOCATION` - 백그라운드 위치
- `FOREGROUND_SERVICE` - 포그라운드 서비스
- `FOREGROUND_SERVICE_LOCATION` - 위치 포그라운드 서비스

#### **iOS 권한 (Info.plist)**
- `NSLocationWhenInUseUsageDescription`
- `NSLocationAlwaysAndWhenInUseUsageDescription`
- `NSLocationAlwaysUsageDescription`

### ✅ 3. 모바일 유틸리티 & API
필요한 모든 헬퍼 함수가 구현되었습니다:

#### **위치 유틸리티** (`mobile/src/utils/location.ts`)
```typescript
- requestLocationPermissions()    // 위치 권한 요청
- getCurrentLocation()             // 현재 위치 가져오기
- calculateDistance()              // 두 좌표 간 거리 계산
- isNearLocation()                 // 목표 지점 근처 확인
- startWatchingLocation()          // 실시간 위치 추적 시작
- stopWatchingLocation()           // 위치 추적 중지
```

#### **배송 API** (`mobile/src/api/deliveryLog.ts`)
```typescript
- getMyTodayLogs()                 // 오늘의 배송 목록
- initializeDailyLogs()            // 배송 시작
- checkIn()                        // 체크인
- checkOut()                       // 체크아웃
- getDeliveryLogs()                // 배송 이력
```

### ✅ 4. 상태 관리
Zustand 기반 배송 상태 관리가 준비되었습니다:

#### **DeliveryStore** (`mobile/src/store/deliveryStore.ts`)
```typescript
- isDelivering: boolean             // 배송 진행 중 여부
- todayLogs: DeliveryLog[]          // 오늘의 배송 목록
- currentLocation: LocationCoords   // 현재 위치
- locationSubscription              // 위치 감시 구독
```

---

## 🚀 다음 단계: 화면 구현

이제 준비가 완료되었으니 실제 화면을 구현하면 됩니다:

### **필요한 화면들**

#### 1. **배송 시작 화면**
```typescript
// mobile/src/screens/DeliveryStartScreen.tsx
- 오늘 배송할 코스 선택
- [배송 시작] 버튼 → initializeDailyLogs() 호출
- 권한 요청 및 위치 추적 시작
```

#### 2. **배송 진행 화면** (가장 중요!)
```typescript
// mobile/src/screens/DeliveryProgressScreen.tsx
- 지도에 현재 위치 표시
- 오늘의 배송 목록 (순서대로)
- 각 사업장:
  - [체크인] 버튼 (100m 이내에서만 활성화)
  - [체크아웃] 버튼 (체크인 후에만 활성화)
- 실시간 위치 업데이트
```

#### 3. **배송 완료 화면**
```typescript
// mobile/src/screens/DeliveryCompleteScreen.tsx
- 오늘 배송 요약
  - 총 배송 건수
  - 총 소요 시간
  - 총 이동 거리
- 이슈 발생 건수
```

#### 4. **배송 이력 화면** (관리자용)
```typescript
// web/src/pages/delivery/DeliveryHistoryPage.tsx
- 날짜별 배송 이력
- 기사별 필터링
- 코스별 필터링
- 지도에 이동 경로 표시
```

---

## 📝 구현 예시

### **배송 시작 버튼**
```typescript
import { initializeDailyLogs } from '@/api/deliveryLog';
import { requestLocationPermissions, startWatchingLocation } from '@/utils/location';
import { useDeliveryStore } from '@/store/deliveryStore';

const handleStartDelivery = async () => {
  try {
    // 1. 위치 권한 요청
    const hasPermission = await requestLocationPermissions();
    if (!hasPermission) {
      Alert.alert('권한 필요', '위치 권한이 필요합니다.');
      return;
    }

    // 2. 배송 기록 생성
    const logs = await initializeDailyLogs({
      routeId: selectedRoute.id,
      driverId: user.id,
      deliveryDate: new Date().toISOString(),
    });

    // 3. 상태 업데이트
    setTodayLogs(logs);
    setIsDelivering(true);

    // 4. 위치 추적 시작
    const subscription = await startWatchingLocation((location) => {
      setCurrentLocation(location);
    });
    setLocationSubscription(subscription);

    // 5. 진행 화면으로 이동
    navigation.navigate('DeliveryProgress');
  } catch (error) {
    Alert.alert('오류', error.message);
  }
};
```

### **체크인 버튼**
```typescript
import { checkIn } from '@/api/deliveryLog';
import { getCurrentLocation, isNearLocation } from '@/utils/location';

const handleCheckIn = async (log: DeliveryLog) => {
  try {
    // 1. 현재 위치 가져오기
    const location = await getCurrentLocation();
    if (!location) {
      Alert.alert('오류', '위치를 가져올 수 없습니다.');
      return;
    }

    // 2. 사업장과의 거리 확인
    const { isNear, distance } = isNearLocation(
      location,
      { latitude: log.site.latitude, longitude: log.site.longitude },
      100
    );

    if (!isNear) {
      Alert.alert(
        '거리 초과',
        `사업장과 ${distance}m 떨어져 있습니다. 100m 이내에서 체크인해주세요.`
      );
      return;
    }

    // 3. 체크인 API 호출
    const updatedLog = await checkIn(log.id, {
      latitude: location.latitude,
      longitude: location.longitude,
    });

    // 4. 상태 업데이트
    updateLog(log.id, updatedLog);

    Alert.alert('체크인 완료', `${log.site.name}에 체크인되었습니다.`);
  } catch (error) {
    Alert.alert('오류', error.message);
  }
};
```

### **체크아웃 버튼**
```typescript
import { checkOut } from '@/api/deliveryLog';
import { getCurrentLocation } from '@/utils/location';

const handleCheckOut = async (log: DeliveryLog) => {
  try {
    // 1. 현재 위치 가져오기
    const location = await getCurrentLocation();
    if (!location) {
      Alert.alert('오류', '위치를 가져올 수 없습니다.');
      return;
    }

    // 2. 이슈 여부 확인 (선택사항)
    const hasIssue = await showIssueDialog();

    // 3. 체크아웃 API 호출
    const updatedLog = await checkOut(log.id, {
      latitude: location.latitude,
      longitude: location.longitude,
      note: hasIssue.note,
      issueReported: hasIssue.reported,
      issueDetail: hasIssue.detail,
    });

    // 4. 상태 업데이트
    updateLog(log.id, updatedLog);

    Alert.alert('체크아웃 완료', `${log.site.name}에서 출발했습니다.`);
  } catch (error) {
    Alert.alert('오류', error.message);
  }
};
```

---

## 🔧 테스트 방법

### **1. 백엔드 API 테스트**
```bash
# 배송 기록 생성
curl -X POST http://localhost:3000/api/v1/delivery-logs/initialize \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "routeId": "route-uuid",
    "driverId": "driver-uuid",
    "deliveryDate": "2025-01-22"
  }'

# 오늘의 배송 목록 조회
curl http://localhost:3000/api/v1/delivery-logs/my-today \
  -H "Authorization: Bearer YOUR_TOKEN"

# 체크인
curl -X POST http://localhost:3000/api/v1/delivery-logs/LOG_ID/check-in \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 35.8714,
    "longitude": 128.6014
  }'
```

### **2. 모바일 앱 테스트**
```bash
# 앱 실행
cd mobile
npm start

# Android 에뮬레이터에서 위치 시뮬레이션
# 설정 > 위치 > 위치 모드 켜기
# Extended Controls (⋯) > Location에서 GPS 좌표 입력
```

---

## 📚 추가 참고 자료

### **Expo Location 문서**
https://docs.expo.dev/versions/latest/sdk/location/

### **React Native Maps**
https://github.com/react-native-maps/react-native-maps

### **Geofencing 예제**
```typescript
// 특정 반경 내 진입 감지
const subscription = await startWatchingLocation((location) => {
  sites.forEach(site => {
    const { isNear, distance } = isNearLocation(
      location,
      { latitude: site.latitude, longitude: site.longitude },
      100
    );

    if (isNear) {
      // 사업장 근처 진입 알림
      Alert.alert('도착', `${site.name} 근처입니다 (${distance}m)`);
    }
  });
});
```

---

## 🎯 다음 할 일

1. ✅ 백엔드 API 구현 (완료)
2. ✅ 모바일 설정 및 유틸리티 (완료)
3. ⏳ **모바일 화면 구현** (다음 단계)
   - DeliveryProgressScreen 구현
   - 지도 통합 (react-native-maps)
   - 체크인/체크아웃 UI
4. ⏳ 웹 관리자 화면 구현
   - 배송 이력 조회
   - 실시간 모니터링 (선택)
5. ⏳ 테스트 및 버그 수정

---

**준비 완료! 이제 화면 구현만 하면 됩니다.** 🚀

어떤 화면부터 구현할까요?
