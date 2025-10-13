# Daham VOC - GCP VM 배포 가이드

## 📋 사전 준비
- GCP 계정 (무료 크레딧 $300 활용 가능)
- 로컬에서 정상 작동 확인 완료

---

## 🖥️ Step 1: GCP VM 인스턴스 생성

### 1.1 Compute Engine으로 이동
1. [GCP Console](https://console.cloud.google.com) 접속
2. **Compute Engine** > **VM 인스턴스** 클릭
3. **인스턴스 만들기** 클릭

### 1.2 인스턴스 설정
```
이름: daham-voc-server
리전: asia-northeast3 (서울)
영역: asia-northeast3-a

머신 구성:
  - 시리즈: E2
  - 머신 유형: e2-small (2 vCPU, 2GB 메모리)
    * 개발/테스트: e2-micro (무료 티어)
    * 운영 환경: e2-medium 이상 권장

부팅 디스크:
  - 운영체제: Ubuntu
  - 버전: Ubuntu 22.04 LTS
  - 디스크 크기: 30GB (표준 영구 디스크)

방화벽:
  ☑ HTTP 트래픽 허용
  ☑ HTTPS 트래픽 허용
```

### 1.3 VM 생성 후 고정 IP 설정 (선택사항)
```
VPC 네트워크 > IP 주소 > 외부 IP 주소 예약
유형: 고정
이름: daham-voc-ip
연결 대상: daham-voc-server 선택
```

---

## 🔧 Step 2: 방화벽 규칙 추가

### 2.1 백엔드 포트 열기 (3000)
```
VPC 네트워크 > 방화벽 > 방화벽 규칙 만들기

이름: allow-backend-3000
대상: 네트워크의 모든 인스턴스
소스 IPv4 범위: 0.0.0.0/0
프로토콜 및 포트:
  ☑ tcp:3000
```

### 2.2 프론트엔드 포트 열기 (5173)
```
이름: allow-frontend-5173
대상: 네트워크의 모든 인스턴스
소스 IPv4 범위: 0.0.0.0/0
프로토콜 및 포트:
  ☑ tcp:5173
```

---

## 💻 Step 3: VM에 접속 및 환경 설정

### 3.1 SSH 접속
```bash
# GCP Console에서 SSH 버튼 클릭
# 또는 로컬에서
gcloud compute ssh daham-voc-server --zone=asia-northeast3-a
```

### 3.2 시스템 업데이트
```bash
sudo apt update && sudo apt upgrade -y
```

### 3.3 Node.js 설치 (v18 LTS)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # v18.x.x 확인
npm --version   # 9.x.x 확인
```

### 3.4 PostgreSQL 설치
```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
sudo systemctl status postgresql  # 실행 확인
```

### 3.5 PostgreSQL 설정
```bash
# PostgreSQL 사용자로 전환
sudo -u postgres psql

# psql 프롬프트에서 실행
CREATE DATABASE daham_voc;
CREATE USER daham_user WITH PASSWORD 'your_strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE daham_voc TO daham_user;
ALTER DATABASE daham_voc OWNER TO daham_user;
\q  # 종료
```

### 3.6 외부 접속 허용 (선택사항 - 보안 주의!)
```bash
# PostgreSQL 설정 편집
sudo nano /etc/postgresql/14/main/postgresql.conf
# 다음 줄 찾아서 수정:
# listen_addresses = 'localhost'  →  listen_addresses = '*'

# 접속 허용 설정
sudo nano /etc/postgresql/14/main/pg_hba.conf
# 파일 끝에 추가:
# host    all             all             0.0.0.0/0               md5

# PostgreSQL 재시작
sudo systemctl restart postgresql
```

---

## 📦 Step 4: 프로젝트 배포

### 4.1 Git 설치 및 프로젝트 클론
```bash
sudo apt install -y git
cd ~
git clone https://github.com/YOUR_USERNAME/daham_voc.git
cd daham_voc
```

### 4.2 백엔드 설정
```bash
cd backend
npm install

# 환경 변수 설정
nano .env
```

**.env 파일 내용:**
```env
NODE_ENV=production
PORT=3000

# 로컬 PostgreSQL 사용
DATABASE_URL=postgresql://daham_user:your_strong_password_here@localhost:5432/daham_voc

# MongoDB (선택사항)
MONGODB_URI=mongodb://localhost:27017/daham_voc

# Redis (선택사항)
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d

# GCP Storage
GCP_PROJECT_ID=your-project-id
GCP_BUCKET_NAME=daham-voc-images
GCP_KEY_FILE=./config/gcp-service-account-key.json

# Image Upload
MAX_IMAGE_SIZE=10485760
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp

# CORS (VM의 외부 IP 또는 도메인)
CORS_ORIGIN=http://YOUR_VM_EXTERNAL_IP:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 4.3 데이터베이스 마이그레이션 및 시드
```bash
cd ~/daham_voc/backend
npx prisma generate
npx prisma db push
npx prisma db seed
```

### 4.4 프론트엔드 설정
```bash
cd ~/daham_voc/web
npm install

# 환경 변수 설정
nano .env
```

**.env 파일 내용:**
```env
VITE_API_BASE_URL=http://YOUR_VM_EXTERNAL_IP:3000/api/v1
VITE_KAKAO_MAP_APP_KEY=c49d3caee184645323027f84b59a9f8f
```

---

## 🚀 Step 5: PM2로 프로세스 관리

### 5.1 PM2 설치
```bash
sudo npm install -g pm2
```

### 5.2 백엔드 실행
```bash
cd ~/daham_voc/backend
pm2 start src/server.ts --name daham-backend --interpreter ts-node
```

### 5.3 프론트엔드 빌드 및 실행
```bash
cd ~/daham_voc/web
npm run build

# 프로덕션 서버로 실행
pm2 serve dist 5173 --name daham-frontend --spa
```

### 5.4 PM2 자동 시작 설정
```bash
pm2 startup
# 출력된 명령어 복사해서 실행
pm2 save
```

### 5.5 PM2 상태 확인
```bash
pm2 status
pm2 logs        # 모든 로그
pm2 logs daham-backend  # 백엔드 로그만
pm2 logs daham-frontend # 프론트엔드 로그만
```

---

## 🌐 Step 6: 도메인 연결 (선택사항)

### 6.1 Nginx 설치 및 리버스 프록시 설정
```bash
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/daham-voc
```

**Nginx 설정:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 프론트엔드
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 백엔드 API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Nginx 활성화:**
```bash
sudo ln -s /etc/nginx/sites-available/daham-voc /etc/nginx/sites-enabled/
sudo nginx -t  # 설정 테스트
sudo systemctl restart nginx
```

### 6.2 SSL 인증서 설정 (Let's Encrypt)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 🔄 Step 7: 업데이트 배포 스크립트

**deploy.sh 생성:**
```bash
nano ~/daham_voc/deploy.sh
```

**스크립트 내용:**
```bash
#!/bin/bash
echo "🚀 Daham VOC 배포 시작..."

cd ~/daham_voc

echo "📥 Git Pull..."
git pull origin main

echo "🔧 백엔드 업데이트..."
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
pm2 restart daham-backend

echo "🎨 프론트엔드 업데이트..."
cd ../web
npm install
npm run build
pm2 restart daham-frontend

echo "✅ 배포 완료!"
pm2 status
```

**실행 권한 부여:**
```bash
chmod +x ~/daham_voc/deploy.sh
```

**배포 실행:**
```bash
~/daham_voc/deploy.sh
```

---

## 📊 Step 8: 모니터링 및 유지보수

### 8.1 로그 확인
```bash
# PM2 로그
pm2 logs

# Nginx 로그
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# PostgreSQL 로그
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### 8.2 리소스 모니터링
```bash
# 시스템 리소스
htop

# 디스크 사용량
df -h

# 메모리 사용량
free -h
```

### 8.3 데이터베이스 백업
```bash
# 백업 스크립트
nano ~/backup-db.sh
```

**백업 스크립트:**
```bash
#!/bin/bash
BACKUP_DIR=~/backups
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d_%H%M%S)
PGPASSWORD=your_strong_password_here pg_dump -U daham_user -h localhost daham_voc > $BACKUP_DIR/daham_voc_$DATE.sql
echo "✅ 백업 완료: $BACKUP_DIR/daham_voc_$DATE.sql"

# 7일 이상 된 백업 삭제
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
```

**자동 백업 (매일 새벽 2시):**
```bash
chmod +x ~/backup-db.sh
crontab -e
# 추가:
# 0 2 * * * ~/backup-db.sh
```

---

## 🔗 접속 정보

**배포 완료 후 접속:**
- 프론트엔드: `http://YOUR_VM_EXTERNAL_IP:5173`
- 백엔드 API: `http://YOUR_VM_EXTERNAL_IP:3000/api/v1`
- Health Check: `http://YOUR_VM_EXTERNAL_IP:3000/health`

**로그인:**
- 전화번호: `01012345678`
- 비밀번호: `1234`

---

## 💰 예상 비용 (월)

**무료 티어 (e2-micro):**
- VM: $0 (무료 한도 내)
- 스토리지: $0.40 (30GB)
- 네트워크: $0 (1GB/월까지 무료)
- **합계: ~$0.40/월**

**운영 환경 (e2-small):**
- VM: ~$14/월
- 스토리지: $0.40 (30GB)
- 네트워크: ~$1/월
- **합계: ~$15.40/월**

---

## 🆘 문제 해결

### 포트가 열리지 않을 때
```bash
sudo ufw status
sudo ufw allow 3000
sudo ufw allow 5173
```

### PM2 프로세스가 자동 시작되지 않을 때
```bash
pm2 unstartup
pm2 startup
# 출력된 명령어 실행
pm2 save
```

### PostgreSQL 접속 오류
```bash
# PostgreSQL 상태 확인
sudo systemctl status postgresql

# 로그 확인
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

---

## 📝 다음 단계

1. ✅ GCP VM 인스턴스 생성
2. ✅ PostgreSQL 설치 및 설정
3. ✅ 프로젝트 배포
4. ✅ PM2로 프로세스 관리
5. 🔄 도메인 연결 (선택사항)
6. 🔒 SSL 인증서 설정 (선택사항)
7. 📊 모니터링 설정
8. 🔄 자동 백업 설정

**배포 성공!** 🎉
