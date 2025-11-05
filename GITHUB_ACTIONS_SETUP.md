# GitHub Actions 자동 배포 설정 가이드

## 1. GitHub Secrets 설정

GitHub 저장소에서 다음 Secrets를 설정해야 합니다:

**Settings → Secrets and variables → Actions → New repository secret**

### 필요한 Secrets:

1. **GCP_SSH_PRIVATE_KEY**
   - GCP VM에 접속할 수 있는 SSH 개인키
   - 값: SSH 개인키 전체 내용 (-----BEGIN ... END----- 포함)

2. **GCP_VM_IP**
   - GCP VM의 외부 IP 주소
   - 예: `34.64.123.456` 또는 `dahamvoc.co.kr`

3. **GCP_VM_USER**
   - SSH 접속 사용자명
   - 예: `daham`

## 2. SSH 키 확인/생성 방법

### GCP Console에서 확인:
```bash
# GCP VM SSH 접속 후
cat ~/.ssh/authorized_keys
```

### 로컬에서 SSH 키 확인:
```bash
# Windows
type %USERPROFILE%\.ssh\id_rsa

# Linux/Mac
cat ~/.ssh/id_rsa
```

## 3. 배포 실행 방법

### 자동 배포 (main 브랜치 푸시 시)
```bash
git push origin main
# 자동으로 배포가 시작됩니다
```

### 수동 배포
1. GitHub 저장소 → Actions 탭
2. "Deploy to GCP VM" 워크플로우 선택
3. "Run workflow" 버튼 클릭
4. "Run workflow" 확인

## 4. 배포 확인

GitHub Actions 탭에서 실시간 로그를 확인할 수 있습니다.

배포 완료 후:
- Backend: https://api.dahamvoc.co.kr/health
- Frontend: https://admin.dahamvoc.co.kr

## 5. 트러블슈팅

### SSH 연결 실패
- GCP_SSH_PRIVATE_KEY가 올바른지 확인
- GCP VM의 방화벽 설정 확인 (22번 포트 오픈)

### 권한 오류
- GCP VM에서 sudo 권한 확인
- /var/www 디렉토리 권한 확인
