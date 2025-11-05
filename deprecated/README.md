# Deprecated Files

이 디렉토리의 파일들은 **더 이상 사용하지 않습니다**.

## ⚠️ 왜 Deprecated 되었나?

### 수동 배포 스크립트들

**파일들:**
- `deploy-all.sh`
- `deploy-backend.sh`
- `deploy-web.sh`

**Deprecated 이유:**
- GitHub Actions로 자동 배포 시스템 구축 완료
- 수동 배포는 불필요하고 실수 가능성이 높음
- 코드 푸시만으로 자동 배포되도록 개선됨

**대신 사용할 것:**
```bash
# 자동 배포 (권장)
git push origin main

# 수동 배포가 필요한 경우
# DEPLOYMENT.md 문서의 "수동 배포" 섹션 참고
```

## 📚 참고 문서

- **자동 배포 가이드**: [DEPLOYMENT.md](../DEPLOYMENT.md)
- **GitHub Actions 설정**: [GITHUB_ACTIONS_SETUP.md](../GITHUB_ACTIONS_SETUP.md)

---

**보관 이유:** 응급 상황이나 참고가 필요할 때를 위해 보관
**삭제 예정:** 2025년 3월 (3개월 후)
