# 브랜치 전략 및 작업 절차 (imgambler)

## 1. 매일 작업 시작 전 브랜치 생성
```bash
git checkout -b feature/YYYY-MM-DD
```
- 예시: `git checkout -b feature/2024-05-15`

## 2. 작업 후 커밋 & 푸시
```bash
git add .
git commit -m "작업 내용"
git push -u origin feature/YYYY-MM-DD
```
- 예시: `git push -u origin feature/2024-05-15`

## 3. 작업 완료 후 main에 병합
- PR(Pull Request)로 main에 병합하거나, 직접 병합
- 병합 후 main 브랜치로 돌아가서 최신 상태 유지
```bash
git checkout main
git pull origin main
```

## 4. 기타
- main 브랜치는 항상 안정적인 상태로 유지
- 각 작업 브랜치는 날짜별로 관리
- 필요시 `git fetch --all`로 원격 브랜치 동기화

---

문의/요청사항은 언제든 기록 및 공유! 