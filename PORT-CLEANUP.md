# 포트 충돌 해결 가이드

## 문제 상황
개발 서버를 여러 번 실행하다 보면 포트가 이미 사용 중이어서 다른 포트에서 실행되는 경우가 있습니다.

## 해결 방법

### 1. 자동 포트 정리 후 서버 실행 (권장)

포트를 자동으로 정리하고 서버를 시작합니다:

**프론트엔드 (포트 5173):**
```bash
cd web
npm run dev:clean
```

**백엔드 (포트 3000):**
```bash
cd backend
npm run dev:clean
```

### 2. 수동으로 포트만 정리

서버를 시작하지 않고 포트만 정리하고 싶을 때:

**프론트엔드:**
```bash
cd web
npm run kill-port
```

**백엔드:**
```bash
cd backend
npm run kill-port
```

### 3. 일반 서버 실행 (기존 방식)

```bash
# 프론트엔드
cd web
npm run dev

# 백엔드
cd backend
npm run dev
```

## 수동으로 포트 확인 및 종료

### Windows에서 포트 사용 프로세스 확인
```bash
# 5173 포트 확인
netstat -ano | findstr :5173

# 3000 포트 확인
netstat -ano | findstr :3000
```

### 프로세스 종료
```bash
# PID를 확인한 후 종료 (예: PID가 12345인 경우)
taskkill /F /PID 12345
```

## 추천 워크플로우

1. **처음 시작할 때:** `npm run dev:clean` 사용
2. **이미 정상 실행 중일 때:** 기존 서버 유지
3. **포트 충돌 발생 시:** `npm run dev:clean`으로 재시작

## 참고사항

- `dev:clean` 명령은 기존 포트를 사용 중인 프로세스를 강제 종료하므로 주의하세요
- 다른 애플리케이션이 같은 포트를 사용하는 경우 해당 애플리케이션도 종료될 수 있습니다
