---
title: Troubleshooting
parent: FAQ & Troubleshooting
nav_order: 2
---
# Troubleshooting

이 문서는 current-state 기준으로 **자주 겪는 문제와 첫 대응 방향**을 정리한다.

---

## 1. settings는 열리는데 반응이 없다

먼저 확인:
- Gemini API 키 존재 여부
- 출력 채널(TTS/말풍선/채팅) 최소 1개 활성화 여부
- reactive / idle / namecall 관련 enable 상태

다음으로 확인:
- 치지직 usable connection 여부
- namecall 사용 시 STT가 실제로 들어오는지

---

## 2. namecall이 잘 안 잡힌다

먼저 확인:
- STT enabled
- 올바른 입력 장치 선택
- namecall enabled
- 마이크 입력 품질 / 주변 소음

체감 이슈:
- 이름이 너무 흔하거나 비슷한 단어가 많으면 오작동 가능
- timeout / 대화 템포 문제와 헷갈릴 수 있음

---

## 3. TTS는 켰는데 소리가 안 난다

먼저 확인:
- TTS enabled
- active preset / provider usable 상태
- 실제 반응 lane에서 TTS route가 켜져 있는지

추가 확인:
- 출력 장치 / 브라우저 audio playback / OBS audio routing

---

## 4. 말풍선은 나오는데 AI가 이상하게 조용하다

가능성:
- chat output이 꺼져 있음
- TTS가 꺼져 있음
- reactive/idle 빈도가 너무 보수적임
- safety / context policy가 예상보다 강하게 걸림

---

## 5. vision이 켜져 있는데도 안 돈다

먼저 확인:
- live guard에 걸린 건 아닌가?
- excluded scene/source에 걸린 건 아닌가?
- focus 상태는 아닌가?
- OBS 연결이 실제 usable한가?
- manual test 결과에서 skip reason이 무엇인가?

중요:
- enabled=true 만으로는 충분하지 않다
- runtime gate를 같이 봐야 한다

---

## 6. `!명령어`가 안 먹는다 / 다른 봇과 충돌한다

먼저 확인:
- `chat_commands.enabled`
- 외부 봇이 같은 prefix/명령어를 먹고 있지 않은지
- interaction / song request / macro 경로가 어떤 command를 기대하는지

중요:
- 이 문제는 단순 기능 오류가 아니라 운영 UX 문제인 경우가 많다

---

## 7. onboarding이 안 뜬다

가능성:
- 필수값이 이미 채워져 있음
- dismiss 상태가 남아 있음
- 디버그 탭의 재오픈 기능이 필요한 상황

---

## 8. 무엇부터 확인해야 할지 모르겠을 때

추천 순서:
1. settings 페이지 열리는지
2. status / connection 상태
3. debug/manual surface로 최소 입력 주입
4. output 채널 확인
5. feature별 gate 확인

---

## 같이 보면 좋은 문서
- `docs/settings/index.md`
