---
title: FAQ
parent: FAQ & Troubleshooting
nav_order: 3
---
# FAQ

## 반드시 모든 기능을 다 켜야 하나요?
아니. 현재 구조에서는 필요한 기능만 켜도 된다. 다만 출력 채널은 최소 1개 이상 켜는 편이 좋다.

## 다른 봇을 이미 쓰고 있는데 같이 써도 되나요?
가능하지만 `!명령어` overlap을 먼저 조정하는 게 좋다. 필요하면 AmyayaBot 쪽 command handling을 꺼두고 시작하는 편이 안전하다.

## vision은 꼭 필요한가요?
아니다. 현재 구조에서도 vision은 보조 계층이다. 없어도 기본 반응 시스템은 운영 가능하다.

## STT 엔진은 onboarding에서 왜 안 고르나요?
현재 first-run 흐름은 SenseVoice 기본 전제를 두고 단순화돼 있다. 깊은 STT 조정은 상세 설정에서 하는 편이 더 안전하다.

## why current docs랑 v1 docs가 둘 다 있나요?
current-state 문서 세트가 단계적으로 정비 중이라서 historical/reference 문서인 `docs/v1/`를 함께 유지하고 있다. 우선은 current-state docs를 먼저 보고, 비어 있는 부분만 v1을 보조 참고로 쓰는 게 좋다.
