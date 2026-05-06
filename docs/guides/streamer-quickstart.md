---
title: Quick Start
parent: Guides
nav_order: 2
---
# Quick Start

이 문서는 “AmyayaBot을 실행하고 OBS에 붙인 뒤, 안전하게 첫 반응을 확인하는 것”을 목표로 합니다.

---

## 1. 실행

```bash
# Linux / macOS
chmod +x launchers/unix/start.sh
./launchers/unix/start.sh

# Windows
AmyayaBot.cmd
```

Windows에서는 압축을 푼 폴더의 루트에서 `AmyayaBot.cmd`를 더블클릭하세요. PowerShell에서 실행한다면 `.\AmyayaBot.cmd`를 입력합니다.

주소:

- 설정: `http://localhost:18300/settings`
- 메인 오버레이: `http://localhost:18300/overlay`

---

## 2. 필수값 입력

| 위치 | 값 | 설명 |
| --- | --- | --- |
| 연결 설정 → Gemini AI | API 키 | AI 반응 생성에 필요합니다. |
| 페르소나 | 스트리머 이름 / 캐릭터 이름 / 주 콘텐츠 / 프리셋 | 캐릭터 말투와 방송 맥락 기준입니다. |
| 빠른 설정 | 말풍선 ON | 가장 안전한 첫 출력입니다. |
| OBS 브라우저 소스 | `/overlay` URL | 방송 화면에 캐릭터와 말풍선을 띄웁니다. |

---

## 3. 채팅 출력은 나중에 켜기

`채팅 출력`은 AI가 만든 문장을 실제 치지직 채팅방에 보냅니다. 처음부터 켜면 테스트 문구가 방송 채팅에 노출될 수 있습니다.

권장 순서:

1. 말풍선으로 문장 확인
2. TTS 미리듣기 확인
3. 치지직 OAuth 연결
4. 채팅 출력 ON
5. 발송 제한과 매크로 문구 확인

---

## 4. OBS WebSocket은 브라우저 소스와 다릅니다

OBS 브라우저 소스는 오버레이를 “보여주는” 기능입니다. OBS WebSocket은 AmyayaBot이 OBS의 현재 씬/소스 정보를 “읽거나 제어하는” 연결입니다.

| 필요한 기능 | OBS WebSocket 필요 여부 |
| --- | --- |
| `/overlay`를 OBS에 띄우기 | 필요 없음 |
| DND 씬 자동 감지 | 필요 |
| Vision 화면 캡처/ROI | 필요 |
| OBS scene/source 목록 선택 | 필요 |

설정 방법은 [외부 연동 설정 → OBS WebSocket](../settings/external-integrations.md#obs-websocket-연결)을 참고하세요.

---

## 5. 다음에 켤 기능

| 하고 싶은 일 | 다음에 볼 문서 |
| --- | --- |
| 각 설정값 의미를 알고 싶음 | [설정 탭별 상세 레퍼런스](../settings/settings-reference.md) |
| CHZZK/Gemini/Naver/OBS/TTS API 키나 팬카페 ID를 연결하고 싶음 | [외부 연동 설정](../settings/external-integrations.md) |
| 채팅 매크로 변수와 배칭 효과를 알고 싶음 | [채팅 출력/매크로](../settings/settings-reference.md#채팅-출력매크로) |
| Fish/Supertone/Supertonic 차이를 알고 싶음 | [TTS 출력](../settings/settings-reference.md#tts-출력) |
| 문제가 생김 | [Troubleshooting](../wiki/troubleshooting.md) |
