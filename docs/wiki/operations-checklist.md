---
title: Operations Checklist
parent: FAQ & Troubleshooting
nav_order: 1
---
# Operations Checklist

이 문서는 방송 전/중/후에 AmyayaBot 운영 상태를 빠르게 점검하기 위한 체크리스트다.

---

## 방송 전 체크

### 기본 기동
- [ ] `start.sh` / `start.bat` 또는 현재 실행 방식으로 앱이 정상 기동됨
- [ ] 설정 페이지가 열림
- [ ] 필요한 경우 overlay route가 열림

### AI / 연결
- [ ] Gemini API 키가 들어가 있음
- [ ] 치지직 usable connection 상태 확인
- [ ] OBS를 쓴다면 browser source 경로가 맞음

### first-run / onboarding
- [ ] 처음 쓰는 환경이면 onboarding dashboard에서 필수값 입력 완료
- [ ] 이미 다른 봇이 `!명령어`를 처리한다면 chat command overlap 확인

### 출력 채널
- [ ] TTS / 말풍선 / 채팅 출력 중 최소 1개 이상 활성화
- [ ] 방송 스타일에 맞게 너무 과하지 않은지 확인

### 자동 반응
- [ ] reactive on/off 확인
- [ ] idle on/off 확인
- [ ] 반응 빈도가 너무 높거나 낮지 않은지 확인

### vision
- [ ] vision을 사용할 계획이면 live guard / excluded scene/source가 맞는지 확인
- [ ] manual vision test가 필요하면 방송 전에 한 번 확인

---

## 방송 중 체크

### 대화 / 반응
- [ ] namecall이 실제로 잘 들어오는가?
- [ ] reactive가 과하게 끼어들지 않는가?
- [ ] idle이 방송 흐름을 망치지 않는가?

### 상호작용
- [ ] 현재 진행 중인 interactive lock 상태를 알고 있는가?
- [ ] live control에서 stop/refresh가 필요한 상황은 없는가?
- [ ] song request queue / playback 상태가 정상인가?

### 안전 / 운영
- [ ] provider safety가 너무 강해서 캐릭터가 죽지 않는가?
- [ ] 다른 봇과 `!명령어` 충돌이 없는가?
- [ ] voice control 허용 범위가 방송 운영에 맞는가?

---

## 방송 후 체크

- [ ] 비정상 queue / lock 상태가 남지 않았는지 확인
- [ ] 필요하면 debug artifact / screenshot / manual test 결과 저장
- [ ] 다음 방송 전에 바꿀 설정이 있었는지 메모

---

## 같이 보면 좋은 문서
- `docs/guides/streamer-quickstart.md`
- `docs/settings/index.md`
