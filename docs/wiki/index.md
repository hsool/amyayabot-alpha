---
title: FAQ & Troubleshooting
nav_order: 30
has_children: true
---
# FAQ & Troubleshooting

방송 준비 중 막혔을 때 빠르게 확인하는 문서입니다. 짧은 FAQ와 운영 체크리스트는 현재 기준의 [Troubleshooting](troubleshooting.md) 한 페이지로 통합했습니다.

## 문서 바로가기

| 문서 | 언제 보나요? |
| --- | --- |
| [Troubleshooting](troubleshooting.md) | 오류 메시지, 무반응, 연결 실패, FAQ, 방송 전·중·후 체크리스트를 확인할 때 |

## 먼저 확인할 공통 원칙

- **설정 변경 후 저장**: 대부분의 설정은 저장 버튼을 눌러야 `data/config.json`에 반영됩니다.
- **연결형 기능은 별도 연결 필요**: CHZZK, OBS, STT, TTS, Vision은 각각 필요한 권한·포트·키가 다릅니다.
- **비밀값은 공개하지 않기**: Gemini, Naver, CHZZK, TTS API 키는 방송 화면·GitHub·디스코드에 노출하지 마세요.
- **한 번에 하나씩 켜기**: 처음부터 모든 기능을 켜면 원인 분리가 어려우니 Gemini → Overlay → CHZZK → STT/OBS/Vision 순서로 점검하는 편이 안전합니다.

## 현재 문서 기준

이 위키는 Phase 24 공개 문서 재작성 기준의 **현재 사용 가이드**입니다. 과거 사용자 문서 v1은 참고용으로만 보존되어 있으며, 오래된 v2 phase engineering notes는 현재 문서와 섞이지 않도록 제거했습니다.
