---
title: Home
nav_order: 1
permalink: /
---
# AmyayaBot 문서 홈

AmyayaBot은 치지직 방송에 AI 캐릭터를 붙여 **아바타, 말풍선, TTS, 채팅, OBS 오버레이**로 반응하게 만드는 로컬 방송 파트너입니다.

이번 문서의 기준은 “스트리머가 설정 화면을 보며 실제로 무엇을 켜야 하는지 이해할 수 있는가”입니다. 단순히 기능을 나열하지 않고, 각 설정이 방송에서 어떤 효과를 내는지와 어떤 외부 연결이 필요한지를 함께 설명합니다.

---

## 처음 읽는 순서

1. [퀵세팅 / 온보딩](guides/first-run-onboarding.md) — 가장 단순하게 첫 화면을 띄우는 경로
2. [Quick Start](guides/streamer-quickstart.md) — 실행, OBS 오버레이, 치지직/OBS 최소 연결
3. [Full Setup Guide](guides/streamer-detailed-setup.md) — 외부 API와 방송 운영 기능을 단계별로 연결
4. [설정 탭별 상세 레퍼런스](settings/settings-reference.md) — 설정 페이지 각 탭/기능/변수/주의사항
5. [외부 연동 설정](settings/external-integrations.md) — CHZZK, Gemini, 웹/팬카페 검색, OBS, TTS API 키 발급/입력
6. [Troubleshooting](wiki/troubleshooting.md) — 안 될 때 확인할 순서

---

## 주요 오버레이 URL

| URL | 용도 |
| --- | --- |
| `/overlay` | 메인 캐릭터, 말풍선, TTS, 일반 알림 |
| `/overlay/interactive` | 투표, 추첨, 룰렛, 후원 투표 |
| `/overlay/music` | 노래신청 플레이어/큐 표시 |

---

## 설정 설명의 원칙

- **빠른 설정**은 처음 켤 기능을 고르는 곳입니다.
- **연결 설정**은 외부 API 키와 OBS/치지직/검색/TTS provider를 붙이는 곳입니다.
- **출력 탭**은 캐릭터가 어디로 보이고 들리는지를 조정합니다.
- **기능 탭**은 후원, 구독, 노래신청, 투표, Vision 같은 방송 기능을 조정합니다.
- **DND/Moderation/고급 설정**은 방송 중 과도한 반응과 위험한 출력을 줄이는 안전장치입니다.

기능별 상세 설명은 [설정 탭별 상세 레퍼런스](settings/settings-reference.md)에 한곳으로 모았습니다. 예전처럼 얕은 페이지를 여러 개 넘겨 다니지 않아도 됩니다.

---

## 개발자 / 유지보수자 문서

기술 구조와 유지보수 기준은 [TECHNICAL_DOCS.md](TECHNICAL_DOCS.md)를 참고하세요. public docs는 스트리머 운영 중심, technical docs는 코드 유지보수 중심으로 분리합니다.
