---
title: Full Setup Guide
parent: Guides
nav_order: 3
---
# Full Setup Guide

이 문서는 첫 실행 이후 실제 방송에 쓰기 전까지의 권장 연결 순서입니다. 세부 설정값 설명은 [설정 탭별 상세 레퍼런스](../settings/settings-reference.md), 외부 계정/API 발급은 [외부 연동 설정](../settings/external-integrations.md)을 함께 보세요.

---

## 권장 연결 순서

| 단계 | 작업 | 성공 기준 |
| --- | --- | --- |
| 1 | Gemini API 키 입력 | 설정 저장 후 AI 반응 테스트가 실패하지 않음 |
| 2 | 페르소나 작성 | 캐릭터 이름/스트리머 이름/주 콘텐츠가 반응에 반영됨 |
| 3 | OBS `/overlay` 추가 | 방송 화면에 아바타/말풍선이 보임 |
| 4 | TTS 선택 | 미리듣기에서 음성이 재생됨 |
| 5 | Chzzk OAuth 연결 | 연결 상태가 `연결됨`으로 표시되고 채팅/이벤트 수신 가능 |
| 6 | 채팅 출력/매크로 조정 | 테스트 문구와 발송 제한을 확인한 뒤 실제 채팅 출력 ON |
| 7 | OBS WebSocket 연결 | 현재 씬이 표시되고 scene/source 목록을 읽을 수 있음 |
| 8 | DND/후원/구독/추가 기능 | 방송 운영 방식에 맞춰 하나씩 켜고 테스트 |
| 9 | STT/대화모드 | 마이크 입력 레벨과 호명 이름이 정상 동작 |
| 10 | Vision/ROI | OBS 캡처, Gemini 분석, scene/source 정책이 모두 정상 |

---

## 기능별 후속 설정

### OBS 오버레이

- 메인 캐릭터: `/overlay`
- 투표/추첨/룰렛/후원 투표: `/overlay/interactive`
- 노래신청: `/overlay/music`

OBS WebSocket이 없어도 브라우저 소스는 보입니다. 다만 DND 씬 자동 감지, Vision, scene/source 선택은 WebSocket이 필요합니다.

### 치지직

치지직 OAuth를 연결하면 채팅/후원/구독 이벤트와 일부 방송 제어 기능을 사용할 수 있습니다. OAuth redirect/callback은 로컬 포트 `18301` 경로를 사용합니다. 직접 앱을 발급해 쓰는 경우 등록한 redirect URI와 실제 callback이 일치해야 합니다.

### TTS

- 빠른 테스트: Edge TTS
- 로컬 고속: Supertonic
- 감정/스타일이 필요한 유료/클라우드: Supertone API 또는 Fish Audio

TTS는 반드시 **TTS 출력 탭의 미리듣기**로 먼저 확인하세요. provider API 키가 있어도 active preset이 다른 엔진이면 해당 키를 사용하지 않습니다.

### 채팅 매크로

환영 메시지는 첫 채팅을 보낸 시청자 기준으로 동작합니다. 배칭을 켜면 짧은 시간 안에 여러 명이 들어왔을 때 별도 배칭 메시지를 1건 만들어 채팅 과다 발송을 줄입니다. 변수와 예시는 [채팅 출력/매크로](../settings/settings-reference.md#채팅-출력매크로)에 정리되어 있습니다.

### STT / 대화 모드

STT는 마이크 장치, VAD, 모델 준비 상태에 영향을 많이 받습니다. 대화 모드를 켜기 전에는 **오디오 입력 모니터**와 **음성 인식 테스트**로 입력이 들어오는지 확인하세요.

### Vision

Vision은 실험 기능입니다. OBS WebSocket, Gemini API, 방송 상태 guard, scene/source 정책, ROI 프로필이 모두 맞아야 안정적으로 동작합니다. 처음에는 전체 프레임 분석보다 수동 테스트와 ROI test를 먼저 사용하세요.

---

## 방송 전 체크리스트

- [ ] API 키 입력 화면이 방송에 노출되지 않음
- [ ] OBS 브라우저 소스 URL이 로컬 주소와 맞음
- [ ] 말풍선/TTS 출력 채널이 의도한 기능에서만 켜져 있음
- [ ] 채팅 출력은 실제 방송에서 켜도 되는 문구인지 확인함
- [ ] 후원/구독 패턴 메시지의 `{nickname}`, `{amount}` 변수가 올바르게 보임
- [ ] DND 씬 정책이 토크/게임/BRB 씬에 맞게 설정됨
- [ ] 유료 API(Fish/Supertone/Brave 등) 사용량과 과금 가능성을 이해함
