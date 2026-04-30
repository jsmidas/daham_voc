# 다함푸드 VOC 랜딩 페이지

`dahamvoc.co.kr` (apex + www) 의 마케팅 / 회사 소개 / 개인정보 처리방침 페이지.

## 목적

1. App Store / Google Play 심사관에게 회사 신뢰도 어필
2. 잠재 고객사에게 앱 기능 소개 + 다운로드 링크 제공
3. **개인정보 처리방침 URL 호스팅** — App Store 심사 필수 요건
4. Google Play 도메인 인증 사이트 (이미 등록됨)

## 구성

| 파일 | 경로 | 역할 |
|---|---|---|
| `index.html` | `/` | 메인 랜딩 페이지 |
| `privacy.html` | `/privacy.html` | 개인정보 처리방침 (심사 필수) |
| `terms.html` | `/terms.html` | 이용약관 |
| `assets/favicon.svg` | `/assets/favicon.svg` | 파비콘 |

## 기술 스택

- **빌드 도구 없음** (정적 HTML)
- Tailwind CSS (CDN)
- Pretendard Variable (CDN)
- 모바일 반응형, SEO 메타태그, OG 태그 포함

## 로컬 미리보기

```bash
# Python 으로 간단 서버
cd landing
python -m http.server 8080
# 또는 Node.js
npx serve .
```

http://localhost:8080 접속.

## 배포 (GCP VM)

### 1. Nginx 설정 변경

`nginx-dahamvoc.conf` 에서 `dahamvoc.co.kr` 서버 블록을 다음으로 교체:

```nginx
server {
    server_name dahamvoc.co.kr www.dahamvoc.co.kr;
    root /var/www/landing;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    # 정적 자산 캐싱
    location /assets/ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/dahamvoc.co.kr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dahamvoc.co.kr/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}
```

⚠️ 기존 [nginx-dahamvoc.conf:64-82](../nginx-dahamvoc.conf#L64-L82) 의 `dahamvoc.co.kr` → `localhost:5173` 프록시 블록을 위 정적 서빙 블록으로 **교체** 해야 함. 현재는 잘못된 SSL 인증서(`api.dahamvoc.co.kr`) 를 참조 중이므로 별도 SSL 발급 필요.

### 2. SSL 인증서 발급 (apex + www 동시)

```bash
sudo certbot --nginx -d dahamvoc.co.kr -d www.dahamvoc.co.kr
```

### 3. 디렉토리 권한 + 파일 업로드

```bash
sudo mkdir -p /var/www/landing
sudo chown -R sos1253:sos1253 /var/www/landing

# 로컬에서 (예: scp / rsync)
rsync -avz --delete landing/ sos1253@34.47.75.181:/var/www/landing/

sudo nginx -t && sudo systemctl reload nginx
```

### 4. (선택) GitHub Actions 자동 배포

`.github/workflows/deploy-landing.yml` 추가:

```yaml
name: Deploy Landing
on:
  push:
    branches: [main]
    paths:
      - 'landing/**'
      - '.github/workflows/deploy-landing.yml'
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup SSH
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.GCP_SSH_KEY }}" > ~/.ssh/id_ed25519
          chmod 600 ~/.ssh/id_ed25519
          ssh-keyscan -H 34.47.75.181 >> ~/.ssh/known_hosts
      - name: rsync to GCP
        run: |
          rsync -avz --delete ./landing/ sos1253@34.47.75.181:/var/www/landing/
```

## TODO (런칭 전 채워야 함)

- [ ] **사업자등록번호** — `index.html` 의 `data-todo="biz-reg"` 마크 부분 (footer)
- [ ] **App Store 다운로드 URL** — 심사 통과 후 `data-app-store-placeholder` 마크된 두 곳을 실제 URL 로 교체
- [ ] **앱 스크린샷 2장** — `index.html` Hero 섹션의 placeholder 박스
- [ ] **사진 첨부**: `assets/screenshot-1.png`, `assets/screenshot-2.png` 등 추가 시 placeholder 교체

## 외부 의존성 (CDN)

- `cdn.tailwindcss.com` — Tailwind CSS
- `cdn.jsdelivr.net/gh/orioncactus/pretendard` — Pretendard Variable 폰트

운영 안정성 우려 시 self-host 마이그레이션 가능. 다만 정적 페이지라 외부 CDN 의존이 일반적으로 문제 없음.
