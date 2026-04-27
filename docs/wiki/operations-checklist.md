---
title: Operations Checklist
parent: FAQ & Troubleshooting
nav_order: 3
---
# Operations Checklist

방송 전에 이 체크리스트를 한 번 훑으면 “켜져 있는데 안 나오는” 문제를 줄일 수 있습니다.

## 방송 전 10분

### 필수

- [ ] 백엔드 실행 후 `http://localhost:18300/settings` 접속 확인
- [ ] Gemini API 상태 확인
- [ ] OBS에 `/overlay` Browser Source 표시 확인
- [ ] 캐릭터 위치, 말풍선 위치, 폰트 크기 확인
- [ ] 테스트 반응 또는 TTS preview로 소리 확인
- [ ] CHZZK OAuth 연결 상태 확인

### 기능별 선택

- [ ] STT를 쓸 경우 마이크 장치와 인식 테스트 확인
- [ ] OBS/Vision을 쓸 경우 OBS WebSocket 연결, 장면/소스 목록 확인
- [ ] 신청곡을 쓸 경우 `/overlay/music` 소스와 검색 테스트 확인
- [ ] 투표/추첨/룰렛을 쓸 경우 `/overlay/interactive` 소스 표시 확인
- [ ] 팬카페 최신글 조회를 쓸 경우 숫자 `cafeId`/`clubid` 저장 및 “최신글/조회수 많은 글” 검색 테스트 확인
- [ ] 공식 Naver 웹/카페 검색을 쓸 경우 Client ID/Secret 저장 확인

## 방송 중

- [ ] 반응이 과하면 반응 빈도/쿨다운을 즉시 낮춥니다.
- [ ] 채팅이 빠른 날에는 채팅 반응 길이와 출력 채널을 줄입니다.
- [ ] STT 오인식이 잦으면 VAD threshold를 올리거나 STT를 잠시 끕니다.
- [ ] Vision 비용/지연이 느껴지면 분석 주기를 늘리거나 테스트 기능만 사용합니다.
- [ ] 캐릭터가 방송 맥락과 맞지 않는 말을 하면 페르소나/금칙어/출력 길이를 먼저 조정합니다.

## 방송 후

- [ ] 방송 로그·메모리 처리 상태를 확인합니다.
- [ ] 문제가 있었던 장면, 설정, 로그 시간을 기록합니다.
- [ ] 다음 방송에 쓸 프로필을 별도 이름으로 저장합니다.
- [ ] 공개 저장소에 올릴 파일에 API 키가 들어가지 않았는지 확인합니다.

## 공개 배포 전

- [ ] `data/config.json`에 실제 키가 남아 있지 않은지 확인
- [ ] README와 `docs/`가 현재 기능 기준인지 확인
- [ ] `docs-legacy/v1`은 참고용으로만 남기고, 오래된 v2 문서는 섞이지 않도록 제거
- [ ] GitHub Pages에서 스크린샷 경로가 깨지지 않는지 확인
