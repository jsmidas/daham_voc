# 구현 가이드 - Phase 5: 모바일 앱 (3주)

> **⚠️ 필수 선행 작업**: Phase 1, 2, 3 완료 필수
> **📅 예상 기간**: 3주 (Week 10-12)
> **📊 예상 작업량**: ~60개 파일, ~10,000 라인
> **✅ 실제 상태**: 핵심 기능 구현 완료 (15개 파일, Expo 기반 간소화 버전)

---

## 📋 Phase 5 개요

### 주요 목표
1. **React Native 모바일 앱** 구축 (Android/iOS)
2. **오프라인 모드** 지원 (WatermelonDB)
3. **카메라 기능** (기기 저장 없이 직접 업로드)
4. **GPS 기반 출퇴근 체크인**
5. **FCM 푸시 알림**

### 기술 스택
- **Framework**: React Native CLI
- **UI Library**: React Native Paper
- **내비게이션**: React Navigation v6
- **상태 관리**: Context API
- **로컬 DB**: WatermelonDB (오프라인)
- **카메라**: react-native-vision-camera
- **GPS**: react-native-geolocation-service
- **푸시 알림**: React Native Firebase (FCM)
- **HTTP Client**: Axios

---

## 🗂️ Phase 5 파일 맵

### 프로젝트 구조

```
mobile/
├── android/
├── ios/
├── src/
│   ├── api/                      [API 호출 함수들]
│   │   ├── auth.api.ts           [100-150 라인]
│   │   ├── menu.api.ts           [100-150 라인]
│   │   ├── photo.api.ts          [150-200 라인]
│   │   ├── feedback.api.ts       [100-150 라인]
│   │   └── attendance.api.ts     [100-150 라인]
│   │
│   ├── components/               [재사용 컴포넌트]
│   │   ├── Camera/
│   │   │   └── CameraView.tsx    [300-400 라인] 카메라 화면
│   │   │
│   │   ├── Map/
│   │   │   └── MapView.tsx       [200-300 라인] 카카오맵
│   │   │
│   │   └── Common/
│   │       ├── Loading.tsx       [50-80 라인]
│   │       └── ImageViewer.tsx   [150-200 라인] 이미지 확대
│   │
│   ├── screens/                  [화면 컴포넌트]
│   │   ├── auth/
│   │   │   └── LoginScreen.tsx   [200-300 라인]
│   │   │
│   │   ├── home/
│   │   │   ├── HomeScreen.tsx    [250-350 라인] 홈 화면
│   │   │   └── StaffHomeScreen.tsx [250-350 라인] 담당자 홈
│   │   │
│   │   ├── attendance/
│   │   │   ├── CheckInScreen.tsx [300-400 라인] 출퇴근 체크인
│   │   │   └── AttendanceListScreen.tsx [200-300 라인]
│   │   │
│   │   ├── camera/
│   │   │   └── PhotoCaptureScreen.tsx [300-400 라인] 사진 촬영
│   │   │
│   │   ├── menu/
│   │   │   └── MenuListScreen.tsx [200-300 라인] 식단 조회
│   │   │
│   │   ├── feedback/
│   │   │   ├── FeedbackFormScreen.tsx [250-350 라인] VOC 작성
│   │   │   └── FeedbackListScreen.tsx [200-300 라인] VOC 목록
│   │   │
│   │   └── photo/
│   │       └── PhotoGalleryScreen.tsx [200-300 라인] 사진 갤러리
│   │
│   ├── context/                  [Context API]
│   │   └── AuthContext.tsx       [150-200 라인]
│   │
│   ├── database/                 [WatermelonDB]
│   │   ├── models/
│   │   │   ├── Menu.ts           [100-150 라인]
│   │   │   ├── Photo.ts          [100-150 라인]
│   │   │   └── Feedback.ts       [100-150 라인]
│   │   │
│   │   ├── schema.ts             [150-200 라인]
│   │   └── sync.ts               [200-300 라인] 동기화 로직
│   │
│   ├── services/
│   │   ├── gps.service.ts        [150-200 라인] GPS 서비스
│   │   ├── camera.service.ts     [100-150 라인] 카메라 권한
│   │   └── notification.service.ts [150-200 라인] FCM 설정
│   │
│   ├── utils/
│   │   ├── axios.ts              [100-150 라인]
│   │   ├── storage.ts            [80-120 라인] AsyncStorage
│   │   └── constants.ts          [80-120 라인]
│   │
│   ├── types/
│   │   └── index.ts              [100-150 라인]
│   │
│   ├── App.tsx                   [150-200 라인]
│   └── navigation.tsx            [200-300 라인] 네비게이션 설정
│
├── .env
├── package.json
└── app.json
```

---

## 🚨 중복 방지 규칙 (Phase 5)

### ❌ 절대 금지 사항
1. **GPS 권한 요청**: `gps.service.ts`에서만
2. **카메라 권한 요청**: `camera.service.ts`에서만
3. **API 호출**: `api/*.api.ts`에서만
4. **로컬 DB 접근**: `database/`를 통해서만

---

## 📅 Week 10: 모바일 앱 기본 구조

### Task 10.1: React Native CLI 프로젝트 생성

**명령어**:
```bash
npx react-native init DahamVocMobile --template react-native-template-typescript

cd DahamVocMobile
```

**의존성 설치**:
```bash
# UI & Navigation
npm install react-native-paper react-navigation @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context

# Data & Storage
npm install @nozbe/watermelondb @react-native-async-storage/async-storage axios

# GPS & Camera
npm install react-native-geolocation-service react-native-vision-camera
npm install react-native-permissions

# Push Notification
npm install @react-native-firebase/app @react-native-firebase/messaging

# Utilities
npm install dayjs react-native-image-picker
```

**iOS 추가 설정** (필요 시):
```bash
cd ios && pod install && cd ..
```

---

### Task 10.2: 환경 변수 설정

**파일**: `mobile/.env`
**예상 라인**: 10-20 라인

```env
API_BASE_URL=http://localhost:3000/api
KAKAO_MAP_APP_KEY=your_kakao_map_key
```

---

### Task 10.3: Axios 설정

**파일**: `mobile/src/utils/axios.ts`
**예상 라인**: 100-150 라인

```typescript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';

export const apiClient = axios.create({
  baseURL: Config.API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
      // 로그인 화면으로 이동 (navigation 필요)
    }

    return Promise.reject(error);
  }
);
```

---

### Task 10.4: AuthContext 설정

**파일**: `mobile/src/context/AuthContext.tsx`
**예상 라인**: 150-200 라인

```typescript
import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 앱 시작 시 저장된 인증 정보 로드
    loadAuthData();
  }, []);

  const loadAuthData = async () => {
    try {
      const savedToken = await AsyncStorage.getItem('token');
      const savedUser = await AsyncStorage.getItem('user');

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error('Failed to load auth data', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (newToken: string, newUser: User) => {
    await AsyncStorage.setItem('token', newToken);
    await AsyncStorage.setItem('user', JSON.stringify(newUser));

    setToken(newToken);
    setUser(newUser);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');

    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        login,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
```

---

### Task 10.5: Navigation 설정

**파일**: `mobile/src/navigation.tsx`
**예상 라인**: 200-300 라인

```typescript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useAuth } from './context/AuthContext';

// Screens
import LoginScreen from './screens/auth/LoginScreen';
import StaffHomeScreen from './screens/home/StaffHomeScreen';
import MenuListScreen from './screens/menu/MenuListScreen';
import PhotoCaptureScreen from './screens/camera/PhotoCaptureScreen';
import FeedbackFormScreen from './screens/feedback/FeedbackFormScreen';
import CheckInScreen from './screens/attendance/CheckInScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// 담당자 탭 네비게이션
function StaffTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName = 'home';

          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'Menu') iconName = 'calendar';
          else if (route.name === 'Camera') iconName = 'camera';
          else if (route.name === 'Feedback') iconName = 'message';
          else if (route.name === 'CheckIn') iconName = 'clock';

          return <Icon name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={StaffHomeScreen} options={{ title: '홈' }} />
      <Tab.Screen name="Menu" component={MenuListScreen} options={{ title: '식단' }} />
      <Tab.Screen name="Camera" component={PhotoCaptureScreen} options={{ title: '사진' }} />
      <Tab.Screen name="Feedback" component={FeedbackFormScreen} options={{ title: 'VOC' }} />
      <Tab.Screen name="CheckIn" component={CheckInScreen} options={{ title: '출퇴근' }} />
    </Tab.Navigator>
  );
}

export default function Navigation() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null; // 로딩 화면 표시
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!isAuthenticated ? (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <Stack.Screen
            name="Main"
            component={StaffTabNavigator}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

---

### Task 10.6: 로그인 화면

**파일**: `mobile/src/api/auth.api.ts`
**예상 라인**: 100-150 라인

```typescript
import { apiClient } from '../utils/axios';

export interface LoginRequest {
  email: string;
  password: string;
}

export async function login(data: LoginRequest) {
  return apiClient.post('/auth/login', data);
}

export async function logout() {
  return apiClient.post('/auth/logout');
}
```

**파일**: `mobile/src/screens/auth/LoginScreen.tsx`
**예상 라인**: 200-300 라인

```typescript
import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { login as apiLogin } from '../../api/auth.api';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('오류', '이메일과 비밀번호를 입력하세요');
      return;
    }

    setLoading(true);

    try {
      const response = await apiLogin({ email, password });

      await login(response.data.token, response.data.user);

      Alert.alert('성공', '로그인되었습니다');
    } catch (error: any) {
      Alert.alert('로그인 실패', error.response?.data?.message || '다시 시도하세요');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Daham VOC
      </Text>

      <TextInput
        label="이메일"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />

      <TextInput
        label="비밀번호"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      <Button mode="contained" onPress={handleLogin} loading={loading} style={styles.button}>
        로그인
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    textAlign: 'center',
    marginBottom: 40,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
  },
});
```

---

## 📅 Week 11: 모바일 핵심 기능

### Task 11.1: GPS 서비스

**파일**: `mobile/src/services/gps.service.ts`
**예상 라인**: 150-200 라인

```typescript
import Geolocation from 'react-native-geolocation-service';
import { PermissionsAndroid, Platform } from 'react-native';

export interface Location {
  latitude: number;
  longitude: number;
}

// GPS 권한 요청
export async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );

    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }

  // iOS는 Info.plist 설정 필요
  return true;
}

// 현재 위치 가져오기
export async function getCurrentLocation(): Promise<Location> {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );
  });
}

// 위치 추적 시작
export function watchLocation(callback: (location: Location) => void): number {
  return Geolocation.watchPosition(
    (position) => {
      callback({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    },
    (error) => {
      console.error('Location watch error:', error);
    },
    {
      enableHighAccuracy: true,
      distanceFilter: 10, // 10m 이동 시마다 업데이트
    }
  );
}

// 위치 추적 중지
export function clearLocationWatch(watchId: number): void {
  Geolocation.clearWatch(watchId);
}
```

---

### Task 11.2: 출퇴근 체크인 화면

**파일**: `mobile/src/api/attendance.api.ts`
**예상 라인**: 100-150 라인

```typescript
import { apiClient } from '../utils/axios';

export async function checkIn(data: { siteId: string; latitude: number; longitude: number }) {
  return apiClient.post('/attendance/check-in', data);
}

export async function checkOut(data: { attendanceId: string; latitude: number; longitude: number }) {
  return apiClient.post('/attendance/check-out', data);
}

export async function getMyAttendances(dateFrom: string, dateTo: string) {
  return apiClient.get('/attendances', { params: { dateFrom, dateTo } });
}
```

**파일**: `mobile/src/screens/attendance/CheckInScreen.tsx`
**예상 라인**: 300-400 라인

```typescript
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, Text, Card } from 'react-native-paper';
import { getCurrentLocation, requestLocationPermission } from '../../services/gps.service';
import { checkIn, checkOut } from '../../api/attendance.api';
import { useAuth } from '../../context/AuthContext';

export default function CheckInScreen() {
  const { user } = useAuth();
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);

  useEffect(() => {
    loadLocation();
  }, []);

  const loadLocation = async () => {
    const hasPermission = await requestLocationPermission();

    if (!hasPermission) {
      Alert.alert('권한 필요', 'GPS 권한이 필요합니다');
      return;
    }

    try {
      const loc = await getCurrentLocation();
      setLocation(loc);
    } catch (error) {
      Alert.alert('오류', 'GPS 위치를 가져올 수 없습니다');
    }
  };

  const handleCheckIn = async () => {
    if (!location) {
      Alert.alert('오류', 'GPS 위치를 확인하세요');
      return;
    }

    // 사업장 선택 로직 필요 (임시로 하드코딩)
    const siteId = 'temp-site-id';

    setLoading(true);

    try {
      const response = await checkIn({
        siteId,
        latitude: location.latitude,
        longitude: location.longitude,
      });

      setTodayAttendance(response.data);

      Alert.alert('성공', '출근 체크인되었습니다');
    } catch (error: any) {
      Alert.alert('실패', error.response?.data?.message || '다시 시도하세요');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!location || !todayAttendance) {
      Alert.alert('오류', '출근 기록이 없습니다');
      return;
    }

    setLoading(true);

    try {
      await checkOut({
        attendanceId: todayAttendance.id,
        latitude: location.latitude,
        longitude: location.longitude,
      });

      Alert.alert('성공', '퇴근 체크아웃되었습니다');
      setTodayAttendance(null);
    } catch (error: any) {
      Alert.alert('실패', error.response?.data?.message || '다시 시도하세요');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>
        출퇴근 체크인
      </Text>

      <Card style={styles.card}>
        <Card.Content>
          <Text>현재 위치:</Text>
          {location ? (
            <Text>
              위도: {location.latitude.toFixed(6)}, 경도: {location.longitude.toFixed(6)}
            </Text>
          ) : (
            <Text>GPS 위치를 가져오는 중...</Text>
          )}
        </Card.Content>
      </Card>

      <Button
        mode="contained"
        onPress={handleCheckIn}
        loading={loading}
        disabled={!location || !!todayAttendance}
        style={styles.button}
      >
        출근 체크인
      </Button>

      <Button
        mode="contained"
        onPress={handleCheckOut}
        loading={loading}
        disabled={!location || !todayAttendance}
        style={styles.button}
      >
        퇴근 체크아웃
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    marginBottom: 20,
  },
  card: {
    marginBottom: 20,
  },
  button: {
    marginTop: 16,
  },
});
```

---

### Task 11.3: 카메라 화면 (기기 저장 안 함)

**파일**: `mobile/src/screens/camera/PhotoCaptureScreen.tsx`
**예상 라인**: 300-400 라인

```typescript
import React, { useState, useRef } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import { Button } from 'react-native-paper';
import { apiClient } from '../../utils/axios';

export default function PhotoCaptureScreen() {
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef<Camera>(null);
  const devices = useCameraDevices();
  const device = devices.back;

  React.useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    const status = await Camera.requestCameraPermission();
    setHasPermission(status === 'authorized');
  };

  const takePhoto = async () => {
    if (!cameraRef.current) return;

    setLoading(true);

    try {
      const photo = await cameraRef.current.takePhoto({
        flash: 'auto',
      });

      // 사진 업로드 (기기에 저장하지 않음)
      await uploadPhoto(photo);

      Alert.alert('성공', '사진이 업로드되었습니다');
    } catch (error) {
      Alert.alert('오류', '사진 촬영 실패');
    } finally {
      setLoading(false);
    }
  };

  const uploadPhoto = async (photo: any) => {
    const formData = new FormData();

    formData.append('image', {
      uri: `file://${photo.path}`,
      type: 'image/jpeg',
      name: 'photo.jpg',
    } as any);

    formData.append('siteId', 'temp-site-id');
    formData.append('latitude', '37.5');
    formData.append('longitude', '127.0');
    formData.append('photoDate', new Date().toISOString());
    formData.append('photoTime', new Date().toISOString());
    formData.append('mealType', 'LUNCH');

    await apiClient.post('/meal-photos', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Button onPress={requestCameraPermission}>카메라 권한 요청</Button>
      </View>
    );
  }

  if (!device) {
    return <View />;
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={true}
      />

      <View style={styles.controls}>
        <Button mode="contained" onPress={takePhoto} loading={loading}>
          사진 촬영
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});
```

---

### Task 11.4: VOC 작성 화면

**파일**: `mobile/src/screens/feedback/FeedbackFormScreen.tsx`
**예상 라인**: 250-350 라인

```typescript
import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { Rating } from 'react-native-ratings';
import { apiClient } from '../../utils/axios';

export default function FeedbackFormScreen() {
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!content) {
      Alert.alert('오류', 'VOC 내용을 입력하세요');
      return;
    }

    setLoading(true);

    try {
      await apiClient.post('/feedbacks', {
        siteId: 'temp-site-id', // 사업장 선택 로직 필요
        content,
        rating,
        feedbackType: 'STAFF',
      });

      Alert.alert('성공', 'VOC가 등록되었습니다');
      setContent('');
      setRating(5);
    } catch (error: any) {
      Alert.alert('실패', error.response?.data?.message || '다시 시도하세요');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>
        VOC 작성
      </Text>

      <Text>별점</Text>
      <Rating
        startingValue={rating}
        onFinishRating={setRating}
        style={styles.rating}
      />

      <TextInput
        label="VOC 내용"
        value={content}
        onChangeText={setContent}
        multiline
        numberOfLines={6}
        style={styles.input}
      />

      <Button mode="contained" onPress={handleSubmit} loading={loading} style={styles.button}>
        VOC 제출
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    marginBottom: 20,
  },
  rating: {
    alignSelf: 'flex-start',
    marginVertical: 10,
  },
  input: {
    marginTop: 16,
  },
  button: {
    marginTop: 20,
  },
});
```

---

## 📅 Week 12: 오프라인 모드 & 최적화

### Task 12.1: WatermelonDB 설정

**파일**: `mobile/src/database/schema.ts`
**예상 라인**: 150-200 라인

```typescript
import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'menus',
      columns: [
        { name: 'site_id', type: 'string' },
        { name: 'date', type: 'number' },
        { name: 'meal_type', type: 'string' },
        { name: 'image_url_1', type: 'string', isOptional: true },
        { name: 'image_url_2', type: 'string', isOptional: true },
        { name: 'menu_text', type: 'string', isOptional: true },
        { name: 'synced', type: 'boolean' },
      ],
    }),
    tableSchema({
      name: 'meal_photos',
      columns: [
        { name: 'site_id', type: 'string' },
        { name: 'photo_date', type: 'number' },
        { name: 'image_url', type: 'string' },
        { name: 'latitude', type: 'number' },
        { name: 'longitude', type: 'number' },
        { name: 'synced', type: 'boolean' },
      ],
    }),
    tableSchema({
      name: 'feedbacks',
      columns: [
        { name: 'site_id', type: 'string' },
        { name: 'content', type: 'string' },
        { name: 'rating', type: 'number' },
        { name: 'synced', type: 'boolean' },
      ],
    }),
  ],
});
```

**파일**: `mobile/src/database/sync.ts`
**예상 라인**: 200-300 라인

```typescript
import { synchronize } from '@nozbe/watermelondb/sync';
import { database } from './index';
import { apiClient } from '../utils/axios';

export async function syncDatabase() {
  await synchronize({
    database,
    pullChanges: async ({ lastPulledAt }) => {
      // 서버에서 변경사항 가져오기
      const response = await apiClient.get('/sync/pull', {
        params: { lastPulledAt },
      });

      return response.data;
    },
    pushChanges: async ({ changes }) => {
      // 로컬 변경사항을 서버로 전송
      await apiClient.post('/sync/push', { changes });
    },
  });
}
```

---

### Task 12.2: FCM 푸시 알림 설정

**파일**: `mobile/src/services/notification.service.ts`
**예상 라인**: 150-200 라인

```typescript
import messaging from '@react-native-firebase/messaging';
import { Alert } from 'react-native';

// FCM 권한 요청
export async function requestNotificationPermission(): Promise<boolean> {
  const authStatus = await messaging().requestPermission();

  return (
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL
  );
}

// FCM 토큰 가져오기
export async function getFCMToken(): Promise<string | null> {
  try {
    const token = await messaging().getToken();
    return token;
  } catch (error) {
    console.error('Failed to get FCM token', error);
    return null;
  }
}

// 포그라운드 메시지 핸들러
export function setupForegroundMessageHandler() {
  return messaging().onMessage(async (remoteMessage) => {
    Alert.alert(
      remoteMessage.notification?.title || 'Notification',
      remoteMessage.notification?.body || ''
    );
  });
}

// 백그라운드 메시지 핸들러
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('Background message:', remoteMessage);
});
```

---

## ✅ Phase 5 완료 체크리스트 (실제 구현 기준)

### Week 10: 모바일 기본 구조 (Expo 기반)
- [x] ~~Task 10.1: React Native CLI 프로젝트 생성~~ → **Expo 프로젝트 생성**
- [x] Task 10.2: 환경 변수 설정 → `.env` 파일
- [x] Task 10.3: Axios 설정 → `utils/axios.ts`
- [x] ~~Task 10.4: AuthContext 설정~~ → **Zustand 스토어로 대체** (`store/authStore.ts`)
- [x] Task 10.5: Navigation 설정 → `navigation/AppNavigator.tsx`
- [x] Task 10.6: 로그인 화면 → `screens/LoginScreen.tsx`

### Week 11: 핵심 기능
- [x] ~~Task 11.1: GPS 서비스~~ → **expo-location 사용**
- [x] Task 11.2: 출퇴근 체크인 화면 → `screens/AttendanceScreen.tsx`
- [ ] ~~Task 11.3: 카메라 화면~~ → **미구현**
- [x] Task 11.4: VOC 작성 화면 → `screens/FeedbackScreen.tsx`

### Week 12: 오프라인 & 최적화
- [x] ~~Task 12.1: WatermelonDB 설정~~ → **React Query + AsyncStorage로 대체**
- [ ] ~~Task 12.2: FCM 푸시 알림~~ → **미구현**

### 추가 구현된 기능 (가이드에 없음)
- [x] **네트워크 상태 감지** → `utils/useNetworkStatus.ts`
- [x] **오프라인 배너** → `components/NetworkBanner.tsx`
- [x] **오프라인 액션 큐** → `utils/offlineStorage.ts`
- [x] **React Query 영속화** → AsyncStoragePersister

### 미구현 화면 (가이드 예상)
- [ ] 식단 조회 화면
- [ ] 사진 갤러리 화면
- [ ] VOC 목록 화면
- [ ] 근태 목록 화면

### 통합 테스트 (실제 완료 항목)
- [x] 로그인/로그아웃
- [x] GPS 권한 및 위치 추적
- [x] 출퇴근 체크인/체크아웃
- [ ] ~~카메라 촬영 및 업로드~~ → **미구현**
- [x] VOC 작성 및 별점
- [x] 오프라인 캐싱 (React Query)
- [ ] ~~FCM 푸시 알림~~ → **미구현**

---

## 📝 Agent 인계 템플릿

```
=== Phase 5 완료 보고 ===

완료한 작업:
- Week 10: React Native 기본 구조
- Week 11: GPS, 카메라, VOC 핵심 기능
- Week 12: WatermelonDB 오프라인, FCM 알림

생성된 주요 파일:
1. mobile/src/context/AuthContext.tsx - 인증 컨텍스트
2. mobile/src/navigation.tsx - 네비게이션 설정
3. mobile/src/services/gps.service.ts - GPS 서비스
4. mobile/src/services/notification.service.ts - FCM 설정
5. mobile/src/screens/* - 각종 화면 컴포넌트
6. mobile/src/database/ - WatermelonDB 설정

테스트 완료:
- [x] 로그인/로그아웃
- [x] GPS 출퇴근 체크인
- [x] 카메라 촬영 (기기 저장 안 함)
- [x] VOC 작성
- [x] 오프라인 동기화
- [x] FCM 푸시 알림

주의사항:
- Android/iOS 각각 권한 설정 필요
- react-native-vision-camera 네이티브 설정 필요
- FCM 설정 파일 (google-services.json, GoogleService-Info.plist) 필요

다음 단계:
- Phase 6 (배포 및 테스트) 진행
```

---

## 📊 Phase 5 실제 구현 상태 (2025-10-12 기준)

### ⚠️ 주요 차이점: Expo 기반 간소화 구현

실제 구현은 **React Native CLI 대신 Expo**를 사용하여 훨씬 간소화된 형태로 구현되었습니다.

| 항목 | 가이드 예상 | 실제 구현 | 차이점 |
|-----|----------|---------|--------|
| **프레임워크** | React Native CLI | **Expo** | ⚠️ 완전히 다른 접근 |
| **상태 관리** | Context API | **Zustand** | ⚠️ 더 간단한 상태 관리 |
| **오프라인 DB** | WatermelonDB | **React Query + AsyncStorage** | ⚠️ 더 간단한 방식 |
| **GPS** | react-native-geolocation-service | **expo-location** | ✅ Expo 내장 |
| **카메라** | react-native-vision-camera | **미구현** | ❌ 없음 |
| **푸시 알림** | FCM | **미구현** | ❌ 없음 |
| **UI 라이브러리** | React Native Paper | **Native Components** | ⚠️ 직접 스타일링 |
| **지도** | Kakao Maps | **react-native-maps** | ⚠️ 다른 라이브러리 |

### 📂 실제 파일 구조 (15개 파일)

```
mobile/
├── src/
│   ├── api/                         [4개 파일]
│   │   ├── attendance.api.ts         ✅ 출퇴근 API
│   │   ├── auth.api.ts               ✅ 인증 API
│   │   ├── feedback.api.ts           ✅ VOC API
│   │   └── site.api.ts               ✅ 사업장 API
│   │
│   ├── components/                   [1개 파일]
│   │   └── NetworkBanner.tsx         ✅ 네트워크 상태 배너
│   │
│   ├── navigation/                   [1개 파일]
│   │   └── AppNavigator.tsx          ✅ 탭 네비게이션
│   │
│   ├── screens/                      [4개 파일]
│   │   ├── AttendanceScreen.tsx      ✅ 출퇴근 화면
│   │   ├── FeedbackScreen.tsx        ✅ VOC 작성 화면
│   │   ├── HomeScreen.tsx            ✅ 홈 화면
│   │   └── LoginScreen.tsx           ✅ 로그인 화면
│   │
│   ├── store/                        [1개 파일]
│   │   └── authStore.ts              ✅ Zustand 인증 스토어
│   │
│   ├── types/                        [1개 파일]
│   │   └── index.ts                  ✅ TypeScript 타입
│   │
│   └── utils/                        [3개 파일]
│       ├── axios.ts                  ✅ Axios 설정
│       ├── offlineStorage.ts         ✅ 오프라인 저장소
│       └── useNetworkStatus.ts       ✅ 네트워크 상태 훅
│
├── package.json                      ✅ Expo 기반 의존성
└── app.json                          ✅ Expo 설정
```

### ✅ 구현 완료 기능

| 기능 분류 | 상세 기능 | 구현 상태 | 참고 |
|---------|---------|----------|------|
| **인증** | 로그인/로그아웃 | ✅ 완료 | LoginScreen.tsx, authStore.ts |
| | JWT 토큰 저장 (AsyncStorage) | ✅ 완료 | authStore.ts |
| | 자동 로그인 | ✅ 완료 | authStore.ts persist |
| **홈 화면** | 사용자 정보 표시 | ✅ 완료 | HomeScreen.tsx |
| | 부문별 정보 표시 | ✅ 완료 | user.division |
| | 로그아웃 기능 | ✅ 완료 | HomeScreen.tsx |
| **출퇴근** | GPS 위치 권한 요청 | ✅ 완료 | expo-location |
| | 출근 체크인 | ✅ 완료 | AttendanceScreen.tsx |
| | 퇴근 체크아웃 | ✅ 완료 | AttendanceScreen.tsx |
| | 오늘 출퇴근 기록 조회 | ✅ 완료 | getTodayAttendance |
| | GPS 좌표 기록 | ✅ 완료 | Location.getCurrentPositionAsync |
| | 상태별 UI (출근전/출근/퇴근) | ✅ 완료 | status 기반 |
| **VOC** | VOC 작성 (내용) | ✅ 완료 | FeedbackScreen.tsx |
| | 별점 선택 (1-5) | ✅ 완료 | Slider 컴포넌트 |
| | 피드백 타입 구분 | ✅ 완료 | STAFF/CLIENT |
| | 사업장 선택 | ✅ 완료 | sites 조회 |
| **네비게이션** | 탭 네비게이션 | ✅ 완료 | Bottom Tabs |
| | 인증 기반 라우팅 | ✅ 완료 | Stack Navigator |
| **네트워크** | 네트워크 상태 감지 | ✅ 완료 | useNetworkStatus.ts |
| | 오프라인 배너 표시 | ✅ 완료 | NetworkBanner.tsx |
| **오프라인** | 오프라인 액션 저장 | ✅ 완료 | offlineStorage.ts |
| | React Query 캐싱 | ✅ 완료 | AsyncStoragePersister |
| **API 통신** | Axios 인터셉터 (JWT) | ✅ 완료 | axios.ts |
| | 토큰 만료 처리 (401) | ✅ 완료 | 자동 로그아웃 |

### ❌ 미구현 기능 (가이드 대비)

| 기능 분류 | 상세 기능 | 가이드 예상 | 미구현 사유 |
|---------|---------|-----------|----------|
| **카메라** | 사진 촬영 화면 | react-native-vision-camera | ❌ 구현 안 됨 |
| | 사진 직접 업로드 (기기 저장 안 함) | ✅ 예정 | ❌ 카메라 미구현 |
| **오프라인 DB** | WatermelonDB | 복잡한 오프라인 DB | ❌ React Query로 대체 |
| | 동기화 로직 | sync.ts | ❌ 간소화 |
| **푸시 알림** | FCM 설정 | @react-native-firebase | ❌ 구현 안 됨 |
| | 포그라운드 알림 | ✅ 예정 | ❌ 미구현 |
| | 백그라운드 알림 | ✅ 예정 | ❌ 미구현 |
| **추가 화면** | 식단 조회 화면 | MenuListScreen | ❌ 구현 안 됨 |
| | 사진 갤러리 화면 | PhotoGalleryScreen | ❌ 구현 안 됨 |
| | VOC 목록 화면 | FeedbackListScreen | ❌ 구현 안 됨 |
| | 근태 목록 화면 | AttendanceListScreen | ❌ 구현 안 됨 |
| **지도** | 카카오맵 연동 | Kakao Maps SDK | ❌ react-native-maps 사용 |

### 📦 실제 의존성 (package.json)

**주요 의존성:**
```json
{
  "expo": "~54.0.12",                                    // Expo SDK
  "react-native": "0.81.4",                             // React Native
  "@react-navigation/bottom-tabs": "^7.4.8",            // 탭 네비게이션
  "@react-navigation/native": "^7.1.18",                // 네비게이션
  "@react-navigation/native-stack": "^7.3.27",          // 스택 네비게이션
  "@tanstack/react-query": "^5.90.2",                   // 데이터 페칭
  "@tanstack/react-query-persist-client": "^5.90.2",    // Query 영속화
  "@react-native-async-storage/async-storage": "^2.2.0", // 로컬 저장소
  "@react-native-community/netinfo": "11.4.1",          // 네트워크 상태
  "axios": "^1.12.2",                                   // HTTP 클라이언트
  "expo-location": "~19.0.7",                           // GPS
  "react-native-maps": "^1.26.14",                      // 지도
  "zustand": "^5.0.8"                                   // 상태 관리
}
```

### 🔍 가이드 vs 실제 비교

#### 1. 프레임워크 선택의 차이

**가이드**: React Native CLI
- 네이티브 모듈 완전 제어
- 복잡한 설정 필요
- Android/iOS 별도 설정

**실제**: Expo
- 빠른 개발 속도
- 간단한 설정
- 많은 기능이 내장됨
- 네이티브 모듈 제한적

#### 2. 상태 관리의 차이

**가이드**: Context API
- React 기본 제공
- 간단한 전역 상태

**실제**: Zustand
- 더 간단한 문법
- 타입스크립트 친화적
- 퍼시스트 플러그인 내장

#### 3. 오프라인 전략의 차이

**가이드**: WatermelonDB
- 완전한 로컬 DB
- 복잡한 동기화
- SQLite 기반

**실제**: React Query + AsyncStorage
- 간단한 캐싱
- 자동 리페칭
- 오프라인 액션 큐

### 📈 통계

| 항목 | 가이드 예상 | 실제 구현 | 달성률 |
|-----|----------|---------|--------|
| **총 파일 수** | ~60개 | 15개 | 25% |
| **총 라인 수** | ~10,000 | ~1,500 | 15% |
| **주요 화면** | 10개 이상 | 4개 | 40% |
| **API 파일** | 5개 | 4개 | 80% |
| **핵심 기능** | 12개 | 6개 | 50% |

### 🎯 실제 구현의 장점

1. **빠른 개발 속도**: Expo로 설정 간소화
2. **안정적인 기반**: 검증된 라이브러리 조합
3. **핵심 기능 집중**: 출퇴근, VOC 등 필수 기능
4. **유지보수 용이**: 간단한 구조

### ⚠️ 한계점

1. **카메라 기능 없음**: 배식 사진 촬영 불가
2. **푸시 알림 없음**: 실시간 알림 불가
3. **오프라인 제한적**: 간단한 캐싱만 지원
4. **화면 부족**: 목록 조회 등 추가 화면 필요

### 🚀 향후 개선 방향

1. **카메라 추가**: expo-camera 또는 expo-image-picker 사용
2. **Expo Notifications**: FCM 대신 Expo 푸시 알림 사용
3. **추가 화면 구현**: 식단, 사진 갤러리, VOC 목록
4. **네이티브 모듈**: 필요시 Expo Bare Workflow로 전환

---

## 📌 다음 Phase 안내

**Phase 6**: 배포 및 테스트 (1주)
- Week 13: Docker, CI/CD, GCP Cloud Run 배포

**파일**: `구현_가이드_Phase6.md` 참조
