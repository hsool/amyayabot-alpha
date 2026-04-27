---
title: FAQ & Troubleshooting
nav_order: 30
has_children: true
---
# FAQ & Troubleshooting

방송 준비 중 막혔을 때 빠르게 확인하는 위키형 문서 모음입니다. 먼저 아래 순서로 확인해 주세요.

1. **자주 묻는 질문**: 기능을 켜야 하는 기준, API 키가 필요한 이유, 다른 봇과 함께 쓰는 방법
2. **문제 해결**: 연결은 됐는데 반응이 안 나오거나, OBS/음성/검색이 동작하지 않을 때
3. **운영 체크리스트**: 방송 전·중·후에 확인할 항목

## 문서 바로가기

| 문서 | 언제 보나요? |
| --- | --- |
| [FAQ](faq.md) | 기능과 설정의 의미를 빠르게 확인하고 싶을 때 |
| [Troubleshooting](troubleshooting.md) | 오류 메시지, 무반응, 연결 실패를 해결할 때 |
| [Operations Checklist](operations-checklist.md) | 방송 전 리허설과 방송 후 정리를 할 때 |

## 먼저 확인할 공통 원칙

- **설정 변경 후 저장**: 대부분의 설정은 저장 버튼을 눌러야 `data/config.json`에 반영됩니다.
- **연결형 기능은 별도 연결 필요**: CHZZK, OBS, STT, TTS, Vision은 각각 필요한 권한·포트·키가 다릅니다.
- **비밀값은 공개하지 않기**: Gemini, Naver, CHZZK, TTS API 키는 방송 화면·GitHub·디스코드에 노출하지 마세요.
- **한 번에 하나씩 켜기**: 처음부터 모든 기능을 켜면 원인 분리가 어려우니 Gemini → Overlay → CHZZK → STT/OBS/Vision 순서로 점검하는 편이 안전합니다.

## 현재 문서 기준

이 위키는 Phase 24 공개 문서 재작성 기준의 **현재 사용 가이드**입니다. 과거 사용자 문서 v1은 참고용으로만 보존되어 있으며, 오래된 v2 phase engineering notes는 현재 문서와 섞이지 않도록 제거했습니다.
