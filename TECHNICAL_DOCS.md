# AmyayaBot 기술 문서

> AI 기반 치지직(Chzzk) 스트리밍 컴패니언 봇 — 아키텍처 및 개발 레퍼런스

---

## 목차

1. [아키텍처 개요](#1-아키텍처-개요)
2. [디렉토리 구조](#2-디렉토리-구조)
3. [Backend 서비스 상세](#3-backend-서비스-상세)
4. [스킬 시스템](#4-스킬-시스템)
5. [데이터 모델 (schemas.py)](#5-데이터-모델-schemaspy)
6. [API 엔드포인트](#6-api-엔드포인트)
7. [Frontend 구조](#7-frontend-구조)
8. [설정 구조 (default.json)](#8-설정-구조-defaultjson)
9. [이벤트 흐름도](#9-이벤트-흐름도)
10. [아바타 제작 가이드](#10-아바타-제작-가이드)
11. [의존성](#11-의존성)
12. [배포 및 실행](#12-배포-및-실행)

---

## 1. 아키텍처 개요

### 시스템 구성도

```
┌─────────────────────────────────────────────────────────────────────┐
│                         AmyayaBot 시스템                             │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  Chzzk 채팅  │  │  Chzzk 후원  │  │     마이크 입력           │  │
│  └──────┬───────┘  └──────┬───────┘  └───────────┬──────────────┘  │
│         │                 │                       │                 │
│  ┌──────▼───────────────────────┐   ┌─────────────▼──────────────┐  │
│  │      ChzzkService            │   │       SttService            │  │
│  │  - OAuth2 인증               │   │  - faster-whisper/          │  │
│  │  - WebSocket 채팅/후원 수신  │   │    sensevoice 엔진          │  │
│  │  - 지수 백오프 재연결        │   │  - VAD (silero-vad)         │  │
│  │  - send_chat() 전송          │   │  - StreamerSpeech 이벤트    │  │
│  └──────┬───────────────────────┘   └──────────────┬─────────────┘  │
│         │ on_chat / on_donation           _on_speech│                │
│  ┌──────▼───────────────────────────────────────────▼─────────────┐  │
│  │                    EventPipeline                               │  │
│  │  _chat_buffer(max50)  _stt_buffer  _context_buffer(max30)     │  │
│  │         │                                                      │  │
│  │  봇필터→채팅필터→스킬수집→명령어→!드랍→버퍼 (_on_chat 순서)  │  │
│  │         │                                                      │  │
│  │  10초마다 flush → GeminiService.analyze_chat()                │  │
│  │  후원 즉시 → GeminiService.react_to_donation()               │  │
│  │         │                                                      │  │
│  │  schedule_reaction() → TtsService.generate() → base64 MP3    │  │
│  │         │              → ChzzkService.send_chat() (채팅응답)  │  │
│  └─────────┬──────────────────────────────────────────────────────┘  │
│            │ overlay_callback                                        │
│  ┌─────────▼──────────────────────────────────────────────────────┐  │
│  │              WebSocket /ws/overlay 브로드캐스트                │  │
│  └─────────┬──────────────────────────────────────────────────────┘  │
│            │                    ┌──────────────────────────────────┐  │
│            │  ◄──────────────── │    HeartbeatService             │  │
│            │                    │ - chat/STT 침묵 모니터링        │  │
│            │                    │ - normal→heartbeat→idle 전환    │  │
│            │                    └──────────────────────────────────┘  │
│            │                    ┌──────────────────────────────────┐  │
│            │  ◄──────────────── │    ConversationMode             │  │
│            │                    │ - 이름 호출 → 1:1 대화          │  │
│            │                    └──────────────────────────────────┘  │
└────────────┼────────────────────────────────────────────────────────┘
             │ WebSocket JSON
┌────────────▼────────────────────────────────────────────────────────┐
│                    Frontend (React/TypeScript)                      │
│                                                                     │
│  Overlay.tsx                         Settings.tsx                  │
│  ┌────────────────────────────┐      ┌───────────────────────────┐ │
│  │ Avatar / Live2DAvatar      │      │ 10탭 설정 UI              │ │
│  │ SpeechBubble (타이핑효과)  │      │ useSettings / useWebSocket│ │
│  │ DonationEffect (파티클)    │      │ REST API 호출             │ │
│  │ audio 재생 → 립싱크        │      └───────────────────────────┘ │
│  └────────────────────────────┘                                    │
└─────────────────────────────────────────────────────────────────────┘
```

### Backend ↔ Frontend 통신 흐름

```
Frontend (React)                Backend (FastAPI)
     │                               │
     │  GET /api/settings            │
     │ ──────────────────────────►  │
     │  { 전체 설정 (API키 마스킹) } │
     │ ◄──────────────────────────  │
     │                               │
     │  PUT /api/settings            │
     │  { 변경할 섹션 }  ──────────► │  ConfigManager.update()
     │  { 새 설정 반환 } ◄────────── │  → on_change 콜백 → 각 서비스
     │                               │
     │  WebSocket /ws/overlay        │
     │ ◄─────────────────────────── │  OverlayEvent JSON 브로드캐스트
     │  { type, data, [audio] }      │
     │                               │
```

### WebSocket 이벤트 흐름

```
Backend EventPipeline / HeartbeatService / ConversationMode
    │
    │  schedule_reaction(OverlayEvent) → _deliver()
    │       ├── TTS 생성 → base64 audio 필드 삽입
    │       └── overlay_callback(event)
    │               │
    │           ws_manager.broadcast(event.model_dump())
    │               │
    │    ┌──────────┴──────────────────────────────┐
    │    │         JSON 전송 (모든 연결 클라이언트)  │
    │    └──────────┬──────────────────────────────┘
    │               │
Frontend useWebSocket.ts
    │
    ├── type: "reaction"           → AIReaction  → 말풍선 + 아바타 감정
    ├── type: "donation_reaction"  → 말풍선 + 파티클 이펙트 + 오디오
    ├── type: "heartbeat_reaction" → 말풍선 + 아바타 감정 + 오디오
    ├── type: "idle_reaction"      → 말풍선
    ├── type: "status"             → ServiceStatus 업데이트
    └── type: "service_control"   → 서비스 중단 알림
```

---

## 2. 디렉토리 구조

```
amyayabot/
├── backend/
│   ├── main.py                      # FastAPI 앱 진입점, lifespan, WebSocket, REST
│   ├── requirements.txt             # Python 패키지 목록
│   ├── api/
│   │   └── settings.py              # 설정/서비스제어/프로필/STT/Chzzk OAuth API
│   ├── config/
│   │   ├── manager.py               # ConfigManager: 로드/저장/deep merge/변경 알림
│   │   ├── presets.py               # 타이밍 프리셋 정의
│   │   └── default.json             # 기본 설정값 (19개 섹션)
│   ├── models/
│   │   └── schemas.py               # Pydantic 데이터 모델 전체
│   ├── services/
│   │   ├── event_pipeline.py        # 중앙 이벤트 오케스트레이터
│   │   ├── chzzk_service.py         # Chzzk OAuth2 + WebSocket
│   │   ├── gemini_service.py        # Gemini AI 반응 생성
│   │   ├── stt_service.py           # 음성 인식 파사드 (VAD/청크)
│   │   ├── tts_service.py           # TTS 파사드 (엔진 위임)
│   │   ├── heartbeat.py             # 침묵 감지 / 자동 반응
│   │   ├── conversation_mode.py     # 이름 호출 → 1:1 대화 세션
│   │   ├── namecall_detector.py     # STT 버퍼에서 트리거 이름 스캔
│   │   ├── mood_analyzer.py         # 채팅 분위기 정규식 분석
│   │   ├── reaction_tracker.py      # 최근 반응 히스토리 / 반복 방지
│   │   ├── chat_filter.py           # 봇/유저/스트리머 필터
│   │   ├── game_mode.py             # 카테고리 → 게임/일반 프로필 전환
│   │   ├── profile_manager.py       # data/profiles/*.json CRUD
│   │   ├── text_processor.py        # 감정 태그 추출 유틸
│   │   ├── stt/                     # STT 엔진 구현체
│   │   │   ├── base.py              # STTEngine ABC
│   │   │   ├── factory.py           # create_stt_engine()
│   │   │   ├── faster_whisper_engine.py
│   │   │   └── sensevoice_engine.py
│   │   └── tts/                     # TTS 엔진 구현체
│   │       ├── base.py              # TTSEngine ABC
│   │       ├── factory.py           # create_tts_engine()
│   │       ├── edge_tts_engine.py
│   │       ├── supertonic_engine.py
│   │       ├── supertone_api_engine.py
│   │       ├── fish_speech_engine.py
│   │       └── emotion_mapper.py    # 감정 → TTS 파라미터 매핑
│   └── skills/
│       ├── base.py                  # BaseSkill, SkillContext, SkillResult
│       ├── registry.py              # SkillRegistry
│       ├── chat_commands.py         # ChatCommandProcessor (! 접두사)
│       ├── settings_control.py      # SettingsControlSkill
│       ├── vote.py                  # VoteSkill
│       ├── raffle.py                # RaffleSkill
│       ├── song_request.py          # SongRequestSkill
│       ├── auto_response.py         # AutoResponseSkill
│       └── chat_summary.py          # ChatSummarySkill
├── frontend/
│   ├── package.json
│   └── src/
│       ├── App.tsx                  # 라우터 설정 (/, /overlay, /settings)
│       ├── main.tsx                 # React 진입점
│       ├── types/index.ts           # TypeScript 타입 전체 정의
│       ├── pages/
│       │   ├── Overlay.tsx          # OBS 브라우저 소스용 오버레이
│       │   └── Settings.tsx         # 설정 관리 UI (10탭 사이드바)
│       ├── components/
│       │   ├── Avatar.tsx           # PNG/파츠 모드 아바타
│       │   ├── Live2DAvatar.tsx     # Live2D 모드 아바타 (React.lazy)
│       │   ├── SpeechBubble.tsx     # 말풍선 (타이핑 효과)
│       │   ├── DonationEffect.tsx   # 후원 파티클 이펙트
│       │   └── settings/            # 설정 탭 컴포넌트 14개
│       │       ├── QuickStartSettings.tsx
│       │       ├── ApiSettings.tsx
│       │       ├── PersonaSettings.tsx
│       │       ├── HeartbeatSettings.tsx  (반응 설정)
│       │       ├── SttSettings.tsx
│       │       ├── AvatarSettings.tsx
│       │       ├── BubbleSettings.tsx
│       │       ├── TtsSettings.tsx
│       │       ├── ModerationSettings.tsx
│       │       ├── DonationSettings.tsx
│       │       ├── ResponseSettings.tsx
│       │       ├── TimingSettings.tsx
│       │       ├── StatusIndicator.tsx
│       │       └── ColorPicker.tsx
│       ├── hooks/
│       │   ├── useSettings.ts       # 설정 CRUD (GET/PUT /api/settings)
│       │   └── useWebSocket.ts      # WebSocket 자동 재접속 훅
│       └── styles/
│           ├── overlay.css
│           ├── settings.css
│           ├── global.css
│           └── fonts.css
├── data/
│   ├── auto_responses.json          # AutoResponseSkill 영속 데이터
│   └── profiles/                    # 저장된 프로필 JSON 파일들
├── docs/                            # 추가 문서 디렉토리
├── sample/                          # 샘플 에셋
├── start.sh                         # Linux/Mac 시작 스크립트
└── start.bat                        # Windows 시작 스크립트
```

---

## 3. Backend 서비스 상세

### 1. EventPipeline

**역할**: 모든 이벤트를 통합하는 중앙 오케스트레이터. ChzzkService/SttService에서 이벤트를 수신하여 버퍼링하고, GeminiService를 호출하여 반응을 생성한 뒤 오버레이/TTS/채팅으로 출력한다.

**주요 메서드**:

| 메서드 | 설명 |
|--------|------|
| `start()` | 콜백 연결 및 flush 루프 시작 |
| `stop()` | flush 루프 종료 및 콜백 해제 |
| `_on_chat(message)` | 채팅 수신 핸들러 (봇필터→채팅필터→스킬수집→명령어→!드랍→버퍼 순서) |
| `_on_donation(event)` | 후원 수신 핸들러 (즉시 처리, 티어 매칭) |
| `_on_speech(speech)` | STT 음성 수신 핸들러 (STT 버퍼에 추가) |
| `_flush()` | 버퍼 드레인 → GeminiService 호출 → 반응 전달 |
| `schedule_reaction(event)` | 최소 간격 보장, STT 침묵 대기 후 deliver |
| `_deliver(event)` | TTS 생성 → 채팅 전송 → overlay_callback 호출 |

**내부 상태**:
- `_chat_buffer`: `deque(maxlen=50)` — 최근 채팅 50건
- `_stt_buffer`: `list` — 누적된 StreamerSpeech
- `_context_buffer`: `deque(maxlen=30)` — 채팅+STT 혼합 컨텍스트
- `current_mode`: `"normal" | "heartbeat" | "idle"`
- `_reaction_lock`: 반응 직렬화용 asyncio.Lock

**의존 서비스**: ChzzkService, SttService, GeminiService, HeartbeatService, TtsService, NameCallDetector, ConversationMode, MoodAnalyzer, ReactionTracker, ChatFilter, SkillRegistry, ChatCommandProcessor

**설정 키**: `timing.chat_buffer_interval` (flush 간격, 기본 10초), `timing.min_reaction_gap` (최소 반응 간격, 기본 6초), `chat_reaction.enabled`, `chat_reaction.output_mode`, `chat_response`

---

### 2. ChzzkService

**역할**: Chzzk OAuth2 인증과 채팅/후원 WebSocket 연결을 관리한다. 채팅 전송 시 `[캐릭터이름]` 접두사를 자동으로 붙여 봇 채팅임을 식별한다.

**주요 메서드**:

| 메서드 | 설명 |
|--------|------|
| `start()` | OAuth2 로그인 후 WebSocket 연결 시작 |
| `stop()` | 연결 해제 및 재접속 취소 |
| `restart()` | stop() 후 start() — 설정 변경 시 자동 호출 |
| `send_chat(text)` | 채팅 메시지 전송 (`[캐릭터이름] text` 형태) |
| `generate_auth_url(redirect_url)` | OAuth2 인증 URL 생성 |
| `complete_auth(code, state)` | OAuth2 코드로 인증 완료 |
| `_connect_with_retry()` | 지수 백오프 재연결 루프 |

**의존 서비스**: ConfigManager

**설정 키**: `chzzk.channel_id` (자동 감지, 수동 입력 가능). Client ID/Secret은 봇 앱에 내장 (코드 내 하드코딩, 사용자 설정 불필요).

**재연결 정책**: 최대 5회, 지수 백오프 1→2→4→8→16초

**상태**: `"disconnected" | "connecting" | "connected" | "reconnecting" | "auth_required" | "authenticating" | "error"`

---

### 3. GeminiService

**역할**: Google Gemini AI API를 호출하여 채팅/후원/음성/대화/아이들 반응을 생성한다. 페르소나 프롬프트 조합, 함수 호출(function calling), JSON 응답 파싱, 감정 태그 추출, 모델 자동 마이그레이션을 담당한다.

**주요 메서드**:

| 메서드 | 설명 |
|--------|------|
| `analyze_chat(messages, speeches, mood_context, anti_repeat)` | 채팅 버퍼 분석 → AIReaction |
| `react_to_donation(event)` | 후원 이벤트 반응 → AIReaction (감정 love/happy 강제) |
| `react_to_speech(speeches)` | 스트리머 발화만 반응 (heartbeat용) |
| `react_to_conversation(speeches, history, tools)` | 대화 모드 반응; tools 있으면 function calling |
| `generate_idle_reaction(idle_type, context)` | 세그먼트별 아이들 반응 (viewer_quiet / streamer_quiet / both_quiet) |
| `_generate(prompt)` | Gemini API 텍스트 생성 (내부) |
| `_generate_with_tools(prompt, tools)` | Function calling API 호출 (내부) |
| `_parse_response(raw_text)` | JSON 추출 → AIReaction 변환 |
| `_build_persona_block()` | 페르소나/스트리머/관계 설정을 프롬프트 블록으로 조합 |

**의존 서비스**: ConfigManager

**설정 키**: `gemini.api_key`, `gemini.model`, `persona.*`, `moderation.*`, `conversation.*`

**모델 자동 마이그레이션**: `gemini-2.0-flash-lite` → `gemini-2.5-flash-lite`, `gemini-2.0-flash` → `gemini-2.5-flash`

---

### 4. SttService

**역할**: 마이크 입력을 sounddevice로 캡처하여 STT 엔진(faster-whisper 또는 sensevoice)에 전달하고, 인식 결과를 StreamerSpeech로 콜백한다. VAD(Voice Activity Detection) 모드와 고정 청크 모드를 지원한다.

**주요 메서드**:

| 메서드 | 설명 |
|--------|------|
| `start()` | STT 서비스 시작 (VAD/청크 모드 선택) |
| `stop()` | 스트림 종료 및 리소스 해제 |
| `set_callback(callback)` | StreamerSpeech 콜백 등록 |
| `get_audio_devices()` | 사용 가능한 오디오 입력 장치 목록 (classmethod) |
| `_process_loop_vad(cfg)` | Silero VAD 기반 음성 구간 감지 후 즉시 전사 |
| `_process_loop(cfg)` | 고정 청크 단위 버퍼링 후 전사 |

**의존 서비스**: ConfigManager, STTEngine (factory로 생성)

**설정 키**: `stt.enabled`, `stt.engine`, `stt.model_size`, `stt.model_path`, `stt.cpu_threads`, `stt.audio_device`, `stt.chunk_duration`, `stt.vad_enabled`, `stt.vad_threshold`, `stt.vad_min_speech_ms`, `stt.vad_min_silence_ms`, `stt.sensevoice_model_path`

**엔진**: `faster_whisper` (WhisperModel, HuggingFace 다운로드), `sensevoice` (sherpa-onnx, ONNX 모델)

---

### 5. TtsService

**역할**: 설정에 따라 적절한 TTS 엔진을 선택하여 텍스트를 오디오 bytes로 변환한다. 이모지/괄호/수면음 등을 사전 정제한다.

**주요 메서드**:

| 메서드 | 설명 |
|--------|------|
| `generate(text, emotion, intensity)` | 텍스트 정제 후 엔진에 위임 → bytes |
| `_get_engine()` | 현재 설정에서 TTSEngine 인스턴스 생성 |
| `_clean_for_tts(text)` | 이모지, 괄호 의성어, zzz, ... 제거 |

**의존 서비스**: ConfigManager, TTSEngine (factory로 생성)

**설정 키**: `tts.enabled`, `tts.active_preset`, `tts.presets`, `tts.output_volume`, `tts.supertone_api_key`, `tts.fish_api_key`

**엔진 종류**:
- `edge_tts`: Microsoft Edge Neural TTS (네트워크)
- `supertonic`: 로컬 ONNX 기반 TTS
- `supertone_api`: Supertone REST API
- `fish_speech`: Fish Audio 클라우드 API (유료, API 키 필요)

---

### 6. HeartbeatService

**역할**: 채팅과 STT의 마지막 수신 시간을 모니터링하여 침묵을 감지하고 자동으로 반응을 생성한다. `normal → heartbeat → idle` 상태를 전환하며, ConversationMode 진입 시 pause/resume으로 일시 중단된다.

**주요 메서드**:

| 메서드 | 설명 |
|--------|------|
| `start()` / `stop()` | 하트비트 루프 시작/종료 |
| `pause()` / `resume()` | ConversationMode 연동 일시 중단/재개 |
| `update_chat_time()` | 채팅 수신 시 타임스탬프 갱신 |
| `update_stt_time()` | STT 수신 시 타임스탬프 갱신 |
| `set_stt_buffer(speeches)` | STT 버퍼 갱신 |
| `_heartbeat_loop()` | 3-way 침묵 감지: viewer_quiet / streamer_quiet / both_quiet |
| `_do_heartbeat_reaction(speeches)` | STT 기반 Gemini 반응 생성 |
| `_do_idle_reaction(idle_type)` | 아이들 메시지 또는 LLM 아이들 반응 |

**의존 서비스**: ConfigManager, GeminiService(콜백), EventPipeline(콜백)

**설정 키**: `heartbeat.enabled`, `heartbeat.silence_threshold`, `heartbeat.reaction_interval`, `heartbeat.idle_messages`, `heartbeat.use_llm_for_idle`, `heartbeat.dynamic_silence`, `heartbeat.min_silence_threshold`, `heartbeat.max_silence_threshold`

**모드**:
- `normal`: 채팅/STT 모두 활성
- `heartbeat`: 채팅 침묵 + STT 버퍼 있음 → Gemini 반응
- `idle`: 채팅/STT 모두 침묵 → 랜덤/LLM 아이들 메시지

---

### 7. ConversationMode

**역할**: NameCallDetector가 이름 호출을 감지하면 활성화되는 1:1 대화 세션. max_turns 또는 타임아웃까지 스트리머와 연속 대화를 유지하며, 스킬 function call 분기와 되묻기(followup) 상태 머신을 포함한다.

**주요 메서드**:

| 메서드 | 설명 |
|--------|------|
| `enter(trigger_speeches)` | 대화 모드 진입 (HeartbeatService pause 연동) |
| `exit()` | 대화 종료, 히스토리 초기화 |
| `on_stt_update(speeches)` | 대화 중 새 발화 수신 처리 |
| `_generate_response(speeches, cfg)` | Gemini 호출 (tools 포함 시 function calling) |
| `_handle_function_call(fc)` | function_call dict → 스킬 실행 |
| `_handle_skill_result(result)` | SkillResult 처리 (되묻기 또는 응답 전달) |

**내부 상태**: `_active`, `_turn_count`, `_conversation_history`, `_pending_skill` (되묻기 대기 스킬), `_pending_context`

**의존 서비스**: ConfigManager, GeminiService(콜백), EventPipeline(콜백), SkillRegistry, HeartbeatService(콜백)

**설정 키**: `conversation.max_turns`, `conversation.response_delay_min`, `conversation.response_delay_max`, `conversation.max_response_length`, `conversation.partner_mode_prompt`, `namecall.conversation_timeout`

---

### 8. NameCallDetector

**역할**: EventPipeline에서 전달된 STT 버퍼를 2초(기본) 간격으로 스캔하여 트리거 이름을 감지하면 ConversationMode.enter()를 호출한다.

**주요 메서드**:

| 메서드 | 설명 |
|--------|------|
| `start()` / `stop()` | 스캔 루프 시작/종료 |
| `set_stt_buffer(speeches)` | STT 버퍼 업데이트 |
| `set_trigger_callback(callback)` | 감지 시 호출할 콜백 등록 |
| `_scan_buffer(cfg)` | 버퍼에서 트리거 이름 검색, min_response_gap 준수 |

**의존 서비스**: ConfigManager

**설정 키**: `namecall.enabled`, `namecall.trigger_names`, `namecall.scan_interval` (기본 2.0초), `namecall.min_response_gap` (기본 3.0초), `persona.character.name` (자동 포함)

---

### 9. MoodAnalyzer

**역할**: 채팅 메시지와 스트리머 발화에서 LLM 호출 없이 정규식으로 방송 분위기를 분석하여 `MoodSummary`를 생성하고, Gemini 프롬프트에 삽입할 컨텍스트 문자열을 반환한다.

**주요 메서드**:

| 메서드 | 설명 |
|--------|------|
| `analyze(messages, speeches)` | 분위기 분석 → MoodSummary |
| `get_mood_context(messages, speeches)` | 프롬프트 삽입용 문자열 생성 |

**분위기 카테고리**: 폭소, 놀림/조롱, 흥분/환호, 위로/응원, 분노/불만, 긴장, 일상잡담 (채팅) + 좌절, 흥분, 기쁨, 집중 (스트리머)

**의존 서비스**: 없음 (독립 유틸리티)

---

### 10. ReactionTracker

**역할**: 최근 15개 반응 히스토리를 deque로 추적하여, Gemini 프롬프트에 `[최근 반응 (반복 금지)]` 섹션을 삽입함으로써 동일한 표현이 반복되는 것을 방지한다.

**주요 메서드**:

| 메서드 | 설명 |
|--------|------|
| `record(reaction, context_mood)` | 반응 기록 |
| `get_anti_repeat_context()` | 최근 5개 반응 → 반복 금지 프롬프트 문자열 |
| `get_recent_emotions()` | 최근 감정 목록 |

**의존 서비스**: 없음 (독립 유틸리티)

---

### 11. ChatFilter

**역할**: 봇 자체 채팅(`[캐릭터이름]` 접두사), excluded_users 목록, 스트리머 본인 채팅을 EventPipeline 진입 전에 필터링한다.

**주요 메서드**:

| 메서드 | 설명 |
|--------|------|
| `should_exclude(message)` | True이면 해당 메시지를 버퍼에 추가하지 않음 |
| `update_config(excluded_users, exclude_streamer, character_name)` | 런타임 설정 변경 |

**의존 서비스**: 없음

**설정 키**: `chat_filter.excluded_users`, `chat_filter.exclude_streamer`, `persona.character.name`

---

### 12. GameModeManager

**역할**: 방송 카테고리 변경 이벤트를 수신하여 게임 카테고리인 경우 지정된 게임 프로필을 적용하고, 그렇지 않으면 일반 프로필로 복원한다.

**주요 메서드**:

| 메서드 | 설명 |
|--------|------|
| `on_category_change(category_id, category)` | 카테고리 변경 → 모드 전환 판단 |
| `update_config(game_mode_config)` | 런타임 설정 갱신 |

**의존 서비스**: ProfileManager

**설정 키**: `game_mode.enabled`, `game_mode.auto_detect`, `game_mode.game_categories`, `game_mode.profile_name`

---

### 13. ProfileManager

**역할**: `data/profiles/*.json` 파일로 설정 스냅샷을 CRUD한다. 저장 시 민감 정보(`chzzk`, `gemini`)를 자동 제외하고, 파일명은 특수문자를 언더스코어로 sanitize한다.

**주요 메서드**:

| 메서드 | 설명 |
|--------|------|
| `save_profile(name, config)` | 현재 설정을 프로필로 저장 (민감정보 제외) |
| `load_profile(name)` | 프로필 파일 로드 |
| `list_profiles()` | 전체 프로필 목록 |
| `delete_profile(name)` | 프로필 삭제 |
| `reset_to_default(current_config)` | default.json으로 리셋 (API 키 보존) |

**의존 서비스**: 없음

**설정 키**: 파일 저장 경로 `data/profiles/`; 민감 정보 제외 키: `{"chzzk", "gemini"}`

---

## 4. 스킬 시스템

### 기본 구조

```python
# 스킬 실행 컨텍스트
@dataclass
class SkillContext:
    trigger: Literal["voice", "chat_command"]
    params: dict[str, Any]          # Gemini function_call args 또는 채팅 파라미터
    streamer_speech: str | None
    chat_message: Any | None        # ChatMessage
    pipeline: Any | None            # EventPipeline 참조

# 스킬 실행 결과
@dataclass
class SkillResult:
    success: bool
    response_text: str              # 오버레이/TTS로 출력할 텍스트
    data: dict[str, Any]            # 추가 반환 데이터
    needs_followup: bool            # 되묻기 필요 여부
    followup_prompt: str            # 되묻기 텍스트

# 추상 기반 클래스
class BaseSkill(ABC):
    name: str
    description: str
    requires_chat_command: bool
    command_permissions: dict[str, str]  # command → "all" | "streamer" | "manager"

    async def execute(ctx: SkillContext) -> SkillResult: ...
    async def on_chat_command(message, args) -> SkillResult: ...
    def on_chat_received(message) -> None: ...         # 활성 스킬에 모든 채팅 전달
    def get_function_schema() -> dict: ...             # Gemini function calling 스키마
```

### SkillRegistry

```python
class SkillRegistry:
    def register(skill: BaseSkill) -> None
    def get(name: str) -> BaseSkill | None
    def list_skills() -> list[dict]
    def get_adk_tools() -> list                   # voice_control 활성 스킬을 ADK Tool로 반환
    def has_voice_enabled_skills() -> bool        # voice_control 활성 스킬 존재 여부 확인
    def active_skills() -> list[BaseSkill]        # _active=True 인 스킬만
```

### ChatCommandProcessor (! 접두사)

```python
class ChatCommandProcessor:
    prefix: str           # 기본 "!"
    enabled: bool

    def register_command(command: str, skill_name: str) -> None
    def process(message: ChatMessage) -> ChatCommand | None
```

채팅 명령어 처리 흐름:
```
채팅 수신 → EventPipeline._on_chat()
    │
    ├── command_processor.process(message)
    │       │
    │       └── 명령어 인식 → skill_registry.get(skill_name)
    │                               │
    │                               └── skill.on_chat_command(message, args)
    │                                       │
    │                                       └── SkillResult (response_text → 채팅 전송 없음, 로컬 처리)
    │
    └── 명령어 아닌 경우 → 버퍼 추가
```

### 각 스킬 상세

#### SettingsControlSkill

- **역할**: 음성 명령으로 화이트리스트에 등록된 봇 설정을 변경
- **허용 키**: `timing.*`, `heartbeat.*`, `chat_reaction.enabled`, `tts.enabled`, `bubble.enabled`, `chat_response.enabled`, `conversation.*`
- **값 범위 검증**: `_BOUNDS` 딕셔너리로 min/max 체크
- **Gemini function schema**: `changes` 객체 (dot-path → 값 맵)

#### VoteSkill

- **역할**: 채팅 투표 생성/집계
- **모드**: 선택형 (options 지정) / 자유형 (빈 options)
- **채팅 명령어**: `!투표 <선택지>`, `!투표결과`
- **command_permissions**: `투표결과` → streamer, 기본 → all
- **Gemini function schema**: `action` (start/end/status), `options`

#### RaffleSkill

- **역할**: 시청자 추첨
- **모드**: `instant` (최근 채팅 50명 중 즉시 추첨) / `open→draw` (참여 모집 후 추첨)
- **채팅 명령어**: `!참여`
- **`on_chat_received`**: 모든 채팅에서 닉네임을 recent_chat deque에 기록

#### SongRequestSkill

- **역할**: 노래 신청 큐 관리
- **제한**: 1인당 최대 3곡, 중복 신청 방지
- **채팅 명령어**: `!노래 <곡명>`, `!큐`, `!스킵`
- **command_permissions**: `스킵` → streamer, 기본 → all

#### AutoResponseSkill

- **역할**: 채팅 명령어에 고정 응답 등록 / 자동 응답
- **영속성**: `data/auto_responses.json` 파일에 저장
- **Gemini function schema**: `action` (register/delete/list), `command`, `response`

#### ChatSummarySkill

- **역할**: 최근 채팅 요약 (TTS 전용, 채팅 응답 없음)
- **별도 asyncio.Task**: `start` 액션 시 `_periodic_loop` 태스크 생성
- **기본 간격**: 300초
- **말풍선 토글**: `toggle_bubble` 액션으로 ON/OFF
- **Gemini function schema**: `action` (now/start/stop/toggle_bubble), `interval`

### Gemini function calling 통합 흐름

```
ConversationMode._generate_response()
    │
    ├── skill_registry.has_voice_enabled_skills()   → bool (도구 사용 여부 판단)
    │       → True면 gemini_service가 get_adk_tools()로 ADK Tool 목록을 가져옴
    │       → LLM이 직접 도구 선택 (키워드 필터 없음)
    │
    ├── gemini_service.react_to_conversation(speeches, history, tools=has_tools)
    │       │
    │       └── _generate_with_tools(prompt, tools)
    │               │
    │               ├── 텍스트 응답 → {"type": "text", "text": "..."}
    │               └── 함수 호출 → {"type": "function_call", "name": "...", "args": {...}}
    │
    ├── function_call 인 경우 → _handle_function_call(fc)
    │       │
    │       └── skill.execute(SkillContext(trigger="voice", params=args))
    │               │
    │               └── SkillResult → _handle_skill_result(result)
    │                       │
    │                       ├── needs_followup=True → _pending_skill 저장 → 되묻기 출력
    │                       └── needs_followup=False → response_text 오버레이 전달
    │
    └── 텍스트 응답 인 경우 → AIReaction → overlay_callback
```

---

## 5. 데이터 모델 (schemas.py)

### 최상위 설정 모델

```python
class AppConfig(BaseModel):
    chzzk: ChzzkConfig
    gemini: GeminiConfig
    persona: PersonaConfig
    timing: TimingConfig
    stt: SttConfig
    heartbeat: HeartbeatConfig
    namecall: NameCallConfig
    conversation: ConversationConfig
    avatar: AvatarConfig
    bubble: BubbleConfig
    donation: DonationConfig
    moderation: ModerationConfig
    chat_response: ChatResponseConfig
    tts: TtsConfig
    server: ServerConfig
```

### 설정 모델 상세

```python
class PersonaConfig(BaseModel):
    system_prompt: str                        # 기본 페르소나 자유 형식 프롬프트
    preset: str                               # "장난꾸러기" | "츤데레" 등
    streamer: StreamerInfo                    # 스트리머 & 방송 정보
    character: CharacterIdentity              # 캐릭터 정체성
    relationship: RelationshipConfig          # 캐릭터-스트리머 관계

class StreamerInfo(BaseModel):
    name, personality, speech_style: str
    habits, main_content, main_games: list[str]
    broadcast_atmosphere, community_vibe: str
    broadcast_memes, recurring_jokes: list[str]

class CharacterIdentity(BaseModel):
    name, role, personality, speech_style: str
    catchphrases, likes, dislikes, quirks: list[str]
    backstory: str

class RelationshipConfig(BaseModel):
    relationship_type: str                    # 기본 "친구"
    dynamic: str
    viewer_attitude: str

class TimingConfig(BaseModel):
    chat_buffer_interval: int = 10            # 채팅 분석 주기 (초)
    bubble_display_time: int = 5              # 말풍선 표시 시간 (초)
    max_response_length: int = 50             # 최대 응답 길이 (자)
    min_reaction_gap: int = 4                 # 최소 반응 간격 (초)

class SttConfig(BaseModel):
    enabled: bool = False
    engine: str = "faster_whisper"            # "faster_whisper" | "sensevoice"
    model_size: Literal["tiny","base","small","medium"] = "small"
    model_path: str = ""
    cpu_threads: int = 4
    audio_device: int | None = None
    chunk_duration: int = 10
    vad_enabled: bool = True
    vad_threshold: float = 0.5
    vad_min_speech_ms: int = 250
    vad_min_silence_ms: int = 500
    sensevoice_model_path: str = ""

class TtsConfig(BaseModel):
    enabled: bool = False
    active_preset: str = "기본"
    output_volume: int = 100                  # 0~100
    presets: list[TtsPreset]                  # 10개 프리셋
    supertonic_lang: str = "ko"
    supertone_api_key: str = ""
    fish_api_key: str = ""

class TtsPreset(BaseModel):
    name: str
    engine: str                               # "edge_tts"|"supertonic"|"supertone_api"|"fish_speech"
    # edge_tts 파라미터
    voice: str = "ko-KR-InJoonNeural"
    pitch, rate, volume: str
    # supertonic 파라미터
    supertonic_voice: str = "M1"
    supertonic_speed: float = 1.0
    supertonic_steps: int = 5
    # supertone_api 파라미터
    supertone_voice_id, supertone_model: str
    # fish_speech 파라미터
    fish_reference_id, fish_model: str

class HeartbeatConfig(BaseModel):
    enabled: bool = True
    silence_threshold: int = 30              # 침묵 판정 시간 (초)
    reaction_interval: int = 20              # 반응 체크 주기 (초)
    idle_messages: list[str]
    use_llm_for_idle: bool = False
    dynamic_silence: bool = False
    min_silence_threshold: int = 20
    max_silence_threshold: int = 180

class BubbleConfig(BaseModel):
    enabled: bool = True
    max_width: int = 320
    font_size: int = 15
    position: Literal["right","top","bottom","left"] = "right"
    offset_x, offset_y: int = 0
    background_color: str = "rgba(255, 255, 255, 0.88)"
    text_color: str = "#222222"
    border_radius: int = 18
    border_color: str = "transparent"
    border_width: int = 0
    font_family: str = "default"
    font_weight: Literal["normal","bold"] = "normal"
    text_stroke_color: str = "#000000"
    text_stroke_width: float = 0
    opacity: float = 1.0                     # 0.0~1.0
    tail_auto: bool = True

class AvatarConfig(BaseModel):
    current_set: str = "default"
    emotions: list[str]                      # 15개 감정 목록
    mode: Literal["png","parts","live2d"] = "png"
    animation_strength: float = 1.0
    live2d_model: str = ""
    live2d_scale: float = 1.0
    live2d_offset_x, live2d_offset_y: int = 0
    live2d_lipsync: bool = True
    live2d_gesture_motions: dict | None = None

class DonationConfig(BaseModel):
    enabled: bool = True
    min_amount: int = 1000
    tiers: list[DonationTier]               # 기본 3 티어

class DonationTier(BaseModel):
    min_amount: int
    max_amount: int | None
    intensity: int = 5                       # 1~10
    use_tts: bool = True
    use_bubble: bool = True
    reaction_mode: str = "llm"              # "llm" | "pattern"
    pattern_messages: list[str] | None

class ModerationConfig(BaseModel):
    no_nickname_mention: bool = True
    block_politics, block_religion: bool = True
    block_sexual, block_profanity: bool = True
    block_discrimination: bool = True
    custom_blocked_topics: list[str]
    filter_prompts: dict[str, str] | None    # 항목별 커스텀 프롬프트
    custom_filter_rules: list[dict]          # type/value/enabled 규칙 목록
```

### 이벤트/메시지 모델

```python
class ChatMessage(BaseModel):
    nickname: str
    content: str
    timestamp: datetime
    is_streamer: bool = False

class DonationEvent(BaseModel):
    nickname: str
    amount: int
    message: str = ""

class StreamerSpeech(BaseModel):
    text: str
    timestamp: datetime

class AIReaction(BaseModel):
    text: str                                # 반응 텍스트 (50자 이내)
    emotion: Literal[                        # 15가지 감정
        "happy","surprised","angry","neutral","love",
        "sad","excited","confused","sleepy","embarrassed",
        "playful","smug","scared","touched","bored"
    ] = "neutral"
    intensity: float = 0.5                   # 0.0~1.0

class MoodSummary(BaseModel):
    primary_mood: str = "일상잡담"
    intensity: float = 0.0                   # 0.0~1.0
    secondary_mood: str = ""
    streamer_mood: str = ""
    summary: str = ""                        # 프롬프트 삽입용 설명

class OverlayEvent(BaseModel):
    type: str      # "reaction"|"donation_reaction"|"heartbeat_reaction"|"idle_reaction"|"status"|"service_control"
    data: Any      # AIReaction.model_dump() 또는 기타 dict
```

---

## 6. API 엔드포인트

### 설정 API (`/api/settings`)

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/settings` | 전체 설정 조회. API 키는 앞 4자리만 표시하고 나머지 마스킹 |
| PUT | `/api/settings` | 설정 부분 업데이트. 마스킹된 값(`****` 포함)은 자동 제외 |
| GET | `/api/settings/status` | 서비스 실행 상태 조회 (chzzk_connected, stt_active, current_mode, gemini_ok, uptime_seconds) |
| POST | `/api/settings/services/control` | 서비스 생명주기 제어. `action`: start/stop/pause/resume, `target`: chzzk/stt/heartbeat/namecall/all |
| GET | `/api/settings/services/status` | 서비스별 상세 런타임 상태 |
| GET | `/api/settings/presets` | 타이밍 프리셋 목록 |
| POST | `/api/settings/presets/apply` | 프리셋 적용. `body`: `{name: string}` |

### 프로필 API (`/api/settings/profiles`)

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/settings/profiles` | 저장된 프로필 목록 |
| POST | `/api/settings/profiles` | 현재 설정을 프로필로 저장. `body`: `{name: string}` |
| GET | `/api/settings/profiles/{name}` | 프로필 내용 조회 |
| PUT | `/api/settings/profiles/{name}` | 프로필을 현재 설정에 적용 (chzzk/gemini 키 보존) |
| DELETE | `/api/settings/profiles/{name}` | 프로필 삭제 |
| POST | `/api/settings/reset-default` | default.json으로 초기화 (API 키 보존) |

### STT API (`/api/stt`)

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/stt/model-status` | STT 모델 다운로드 여부 확인. `?engine=faster_whisper\|sensevoice&model_size=small` |
| POST | `/api/stt/model-download` | STT 모델 다운로드. `body`: `{engine, model_size}` |
| POST | `/api/stt/model-delete` | STT 모델 삭제. `body`: `{engine, model_size}` |

### Chzzk OAuth API (`/api/chzzk`)

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/chzzk/auth-url` | OAuth2 인증 URL 생성 |
| POST | `/api/chzzk/auth-complete` | OAuth2 코드로 인증 완료. `body`: `{code, state}` |
| GET | `/api/chzzk/status` | Chzzk 연결 상태 (status, chat_count, donation_count, connected_at) |

### TTS API

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/tts/preview` | TTS 미리듣기. `body`: `{text, emotion, intensity, preset}` → `audio/mpeg` 바이너리 |
| GET | `/api/tts/supertonic/status` | supertonic 설치 및 모델 준비 여부 |
| POST | `/api/tts/supertonic/download` | supertonic 모델 다운로드 |
| POST | `/api/tts/supertonic/delete` | supertonic 모델 캐시 삭제 |

### 기타 API

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/status` | 시스템 전체 상태 (chzzk stats, heartbeat_mode, websocket_clients) |
| GET | `/api/audio-devices` | 사용 가능한 오디오 입력 장치 목록 |
| GET | `/api/live2d-models` | `frontend/public/avatars/live2d/` 스캔 → 모델 목록 (expressions, parameters 포함) |
| POST | `/api/stt/test` | 지정 시간 동안 녹음 후 음성 인식 테스트. `body`: `{duration, device}` |

### WebSocket

| Path | 설명 |
|------|------|
| `WS /ws/overlay` | 실시간 오버레이 이벤트 스트림 (OverlayEvent JSON) |
| `WS /ws/stt-monitor` | STT 오디오 레벨 실시간 스트림. `?device=N` → `{level: float}` |

---

## 7. Frontend 구조

### 페이지

#### Overlay.tsx (`/overlay`)

OBS 브라우저 소스용 페이지. WebSocket으로 OverlayEvent를 수신하여 아바타 감정 전환, 말풍선 표시, 후원 이펙트, 오디오 재생을 처리한다.

- `useWebSocket` 훅으로 `/ws/overlay` 연결 및 자동 재접속
- 폴링(5초)으로 bubble/avatar 설정 변경 감지
- `audio` 필드 수신 시 base64 → Blob → `Audio.play()`
- 아바타 모드에 따라 `Avatar` 또는 `Live2DAvatar` 렌더링 (React.lazy)
- 말풍선 `position` 설정에 따라 flexDirection 변경 (right→row, left→row-reverse, top/bottom→column)

#### Settings.tsx (`/settings`)

10탭 사이드바 설정 관리 UI. 탭 전환 시 스크롤 상단 복귀. `localConfig` 상태로 미저장 변경사항 추적.

**탭 목록**:
1. 빠른 설정 (QuickStartSettings)
2. API 연결 (ApiSettings) — Chzzk OAuth, Gemini API 키
3. 페르소나 (PersonaSettings) — 캐릭터/스트리머/관계 설정
4. 반응 설정 (HeartbeatSettings) — timing, heartbeat, namecall, conversation
5. STT 설정 (SttSettings) — 엔진/모델/VAD/오디오 장치
6. 아바타 설정 (AvatarSettings) — PNG 세트/뷰포트/Live2D
7. 출력 설정 (BubbleSettings) — 말풍선 스타일/채팅 응답
8. TTS 음성 (TtsSettings) — 엔진/프리셋/미리듣기
9. 콘텐츠 관리 (ModerationSettings) — 필터 규칙
10. 후원 반응 (DonationSettings) — 티어별 설정

### 컴포넌트

| 컴포넌트 | 설명 |
|---------|------|
| `Avatar.tsx` | PNG 교체 모드 및 파츠 분리(SVG) 모드 아바타. 눈 깜빡임/입 움직임/감정 애니메이션 |
| `Live2DAvatar.tsx` | Cubism + PixiJS Live2D 아바타. 립싱크/표현식/파라미터 제어 (React.lazy 코드 스플리팅) |
| `SpeechBubble.tsx` | 말풍선. 50ms 간격 타이핑 효과, 표시 후 600ms 페이드아웃 |
| `DonationEffect.tsx` | 후원 파티클 이펙트. 금액 티어별 파티클 수/지속 시간/화면 플래시 |

### 설정 컴포넌트 14개

`frontend/src/components/settings/`:
- `QuickStartSettings.tsx` — 빠른 켜기/끄기 토글 + 프리셋 적용
- `ApiSettings.tsx` — Chzzk OAuth URL 생성, Gemini API 키
- `PersonaSettings.tsx` — 캐릭터/스트리머/관계 상세 설정
- `HeartbeatSettings.tsx` — 타이밍/하트비트/호명 감지/대화 설정
- `SttSettings.tsx` — STT 엔진 선택, 모델 다운로드/삭제, 오디오 테스트
- `AvatarSettings.tsx` — 아바타 세트 업로드, 뷰포트 인터랙티브 프리뷰
- `BubbleSettings.tsx` — 말풍선 스타일, 출력 방식(버블/채팅/둘다/랜덤)
- `TtsSettings.tsx` — TTS 엔진/프리셋 CRUD, 미리듣기
- `ModerationSettings.tsx` — 토픽 차단, 커스텀 규칙(keyword/contains/regex/category)
- `DonationSettings.tsx` — 후원 티어 금액/강도/TTS/버블/패턴 설정
- `ResponseSettings.tsx` — 채팅 응답 설정
- `TimingSettings.tsx` — 타이밍 세부 설정
- `StatusIndicator.tsx` — 서비스 상태 표시
- `ColorPicker.tsx` — 색상 선택 공용 컴포넌트

### Custom Hooks

#### useSettings.ts

```typescript
function useSettings(): {
  config: AppConfig | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  saveConfig(config: AppConfig): Promise<void>;   // PUT /api/settings
  reload(): void;                                  // GET /api/settings 재호출
}
```

#### useWebSocket.ts

```typescript
function useWebSocket(url: string): {
  lastMessage: OverlayEvent | null;
  readyState: number;
}
// 자동 재접속: 1초 딜레이, 컴포넌트 언마운트 시 close
```

### 타입 정의 (types/index.ts)

주요 타입:

```typescript
type Emotion = 'happy' | 'surprised' | 'angry' | 'neutral' | 'love' |
               'sad' | 'excited' | 'confused' | 'sleepy' | 'embarrassed' |
               'playful' | 'smug' | 'scared' | 'touched' | 'bored';

type OverlayEventType = 'reaction' | 'donation_reaction' |
                        'heartbeat_reaction' | 'idle_reaction' |
                        'status' | 'service_control';

interface AIReaction {
  text: string;
  emotion: Emotion;
  intensity: number;
  audio?: string;           // base64 MP3 (TTS 있을 때)
}

interface ServiceStatus {
  chzzk_connected: boolean;
  stt_active: boolean;
  current_mode: 'normal' | 'heartbeat' | 'idle';
  recent_chat_count: number;
  gemini_ok: boolean;
  uptime_seconds: number;
}

interface AppConfig {
  chzzk, gemini, persona, timing, stt, heartbeat, namecall,
  conversation, avatar, bubble, moderation, tts, server,
  donation?, chat_response?, chat_reaction?, chat_commands?,
  chat_filter?, game_mode?
}
```

---

## 8. 설정 구조 (default.json)

19개 섹션, 총 기본값:

```json
{
  "chzzk": {
    "client_id": "",            // (미사용) 봇 앱에 내장됨
    "client_secret": "",        // (미사용) 봇 앱에 내장됨
    "channel_id": ""            // 대상 채널 ID (자동 감지, 수동 입력 가능)
  },
  "gemini": {
    "api_key": "",              // Google Gemini API 키
    "model": "gemini-2.5-flash-lite"
  },
  "persona": {
    "system_prompt": "너는 방송에 함께 출연하는 장난꾸러기 펫이야...",
    "preset": "장난꾸러기",
    "streamer": {               // StreamerInfo: name, personality, speech_style,
      ...                       //   habits[], broadcast_atmosphere, main_content[],
    },                          //   main_games[], broadcast_memes[], community_vibe,
    "character": {              //   recurring_jokes[]
      ...                       // CharacterIdentity: name, role, personality,
    },                          //   speech_style, catchphrases[], backstory,
    "relationship": {           //   likes[], dislikes[], quirks[]
      "relationship_type": "친구", "dynamic": "", "viewer_attitude": ""
    }
  },
  "timing": {
    "chat_buffer_interval": 10, // 채팅 버퍼 flush 주기 (초)
    "bubble_display_time": 5,   // 말풍선 표시 시간 (초)
    "max_response_length": 50,  // Gemini 응답 최대 글자수
    "min_reaction_gap": 6       // 반응 간 최소 간격 (초)
  },
  "stt": {
    "enabled": false,
    "engine": "sensevoice",     // "faster_whisper" | "sensevoice"
    "model_size": "small",
    "model_path": "",
    "cpu_threads": 4,
    "audio_device": null,       // null = 시스템 기본 장치
    "chunk_duration": 10,
    "vad_enabled": true,
    "vad_threshold": 0.5,
    "vad_min_speech_ms": 250,
    "vad_min_silence_ms": 500,
    "sensevoice_model_path": ""
  },
  "heartbeat": {
    "enabled": true,
    "silence_threshold": 30,    // 침묵 판정 시간 (초)
    "reaction_interval": 20,    // 반응 체크 주기 (초)
    "idle_messages": ["...(하품)", "zzZ...", ...],
    "use_llm_for_idle": true,   // true: Gemini로 아이들 반응 생성
    "dynamic_silence": false,   // true: 채팅 활동량에 따라 threshold 동적 조정
    "min_silence_threshold": 20,
    "max_silence_threshold": 180
  },
  "namecall": {
    "enabled": true,
    "trigger_names": ["에이미", "아야"],
    "scan_interval": 2.0,       // STT 버퍼 스캔 주기 (초)
    "min_response_gap": 3.0,    // 최소 반응 간격 (초)
    "conversation_timeout": 30.0
  },
  "conversation": {
    "max_turns": 10,
    "response_delay_min": 1.0,
    "response_delay_max": 3.0,
    "max_response_length": 80,
    "partner_mode_prompt": "너는 지금 스트리머의 파트너로서 대화하고 있어..."
  },
  "avatar": {
    "current_set": "default",
    "emotions": ["neutral", "happy", ...],  // 15개
    "mode": "png",              // "png" | "parts" | "live2d"
    "animation_strength": 1.0,
    "lipsync_strength": 1.0,
    "motion_strength": 1.0,
    "viewport": {
      "width": 240, "height": 280,
      "fit": "contain",         // "contain" | "cover" | "fill"
      "position": "center center"
    },
    "live2d_model": "", "live2d_scale": 1.0,
    "live2d_offset_x": 0, "live2d_offset_y": 0,
    "live2d_lipsync": true
  },
  "bubble": {
    "enabled": true,
    "max_width": 320, "font_size": 15,
    "position": "right",        // "right" | "left" | "top" | "bottom"
    "offset_x": 0, "offset_y": 0,
    "background_color": "rgba(255, 255, 255, 0.88)",
    "text_color": "#222222",
    "border_radius": 18,
    "border_color": "transparent", "border_width": 0,
    "font_family": "default",
    "font_weight": "normal",
    "text_stroke_color": "#000000", "text_stroke_width": 0,
    "opacity": 1.0, "tail_auto": true
  },
  "donation": {
    "enabled": true, "min_amount": 1000,
    "tiers": [
      { "min_amount": 1000, "max_amount": 4999, "intensity": 3, "use_tts": false, "use_bubble": true, "reaction_mode": "llm" },
      { "min_amount": 5000, "max_amount": 9999, "intensity": 5, "use_tts": true,  "use_bubble": true, "reaction_mode": "llm" },
      { "min_amount": 10000, "max_amount": null, "intensity": 9, "use_tts": true,  "use_bubble": true, "reaction_mode": "llm" }
    ]
  },
  "moderation": {
    "no_nickname_mention": true,
    "block_politics": true, "block_religion": true,
    "block_sexual": true, "block_profanity": true, "block_discrimination": true,
    "custom_blocked_topics": [], "filter_prompts": {}
  },
  "chat_response": {
    "enabled": false,           // AI 반응을 채팅으로 전송
    "max_length": 100           // 채팅 전송 최대 글자 (초과 시 ...로 자름)
  },
  "chat_reaction": {
    "enabled": true,
    "output_mode": "both"       // "bubble" | "chat_response" | "both" | "random"
  },
  "tts": {
    "enabled": false,
    "active_preset": "기본 (로컬)",
    "output_volume": 100,
    "presets": [ ... ],         // 10개 기본 프리셋 (supertonic + edge_tts 혼합)
    "supertonic_lang": "ko",
    "supertone_api_key": "", "fish_api_key": ""
  },
  "server": {
    "host": "0.0.0.0",
    "port": 18300,
    "frontend_port": 18300
  },
  "chat_commands": {
    "enabled": true, "prefix": "!",
    "enabled_skills": ["vote", "raffle", "song_request", "auto_response"]
  },
  "chat_filter": {
    "excluded_users": [],
    "exclude_streamer": false
  },
  "game_mode": {
    "enabled": false, "auto_detect": true,
    "game_categories": ["게임"],
    "profile_name": ""
  }
}
```

---

## 9. 이벤트 흐름도

### 채팅 이벤트 흐름

```
Chzzk 채팅 수신
    │
    ▼
ChzzkService.on_chat (chzzkpy Message → ChatMessage)
    │
    ▼
EventPipeline._on_chat(message)
    │
    ├── [0] 봇 자체 채팅 필터: "[캐릭터이름]" 접두사 → return
    ├── [1] 커스텀 필터 규칙 (keyword/contains/regex/category) → return
    ├── [2] ChatFilter.should_exclude() (excluded_users, 스트리머) → return
    ├── [3] SkillRegistry.active_skills() → skill.on_chat_received(message)  (투표/추첨 집계)
    ├── [4] ChatCommandProcessor.process(message) → 명령어 처리 → return
    ├── [5] ! 접두사 채팅 드랍 → return
    └── [6] _chat_buffer.append() + _context_buffer.append()
                │
                │ (10초마다 _flush_loop 타이머)
                ▼
            EventPipeline._flush()
                │
                ├── MoodAnalyzer.analyze() → mood_context 생성
                ├── ReactionTracker.get_anti_repeat_context() → anti_repeat 생성
                │
                ▼
            GeminiService.analyze_chat(messages, speeches, mood_context, anti_repeat)
                │   프롬프트 구성: 페르소나 + 안전규칙 + 반응가이드 + 분위기 + 채팅 + 발화 + 반복방지
                │   → Gemini API 호출 → JSON 파싱 → AIReaction
                │
                ▼
            ReactionTracker.record(reaction)
                │
                ▼
            EventPipeline.schedule_reaction(OverlayEvent)
                │   STT 침묵 5초 대기 (발화 중이면 최대 30초)
                │   min_reaction_gap 보장
                │
                ▼
            EventPipeline._deliver(event)
                │
                ├── TtsService.generate(text, emotion, intensity) → base64 MP3
                │       └── event.data["audio"] = base64 삽입
                │
                ├── (chat_response.enabled) ChzzkService.send_chat("[캐릭터] text")
                │
                └── overlay_callback(event)
                        └── ws_manager.broadcast(event.model_dump())
                                └── Frontend 모든 클라이언트에 JSON 전송
```

### 후원 이벤트 흐름

```
Chzzk 후원 수신
    │
    ▼
ChzzkService.on_donation (chzzkpy Donation → DonationEvent)
    │
    ▼
EventPipeline._on_donation(event)
    │
    ├── donation.enabled 체크, min_amount 체크
    ├── 티어 매칭 (min_amount ~ max_amount 범위)
    │
    ├── reaction_mode == "pattern" → 랜덤 패턴 메시지 → AIReaction
    └── reaction_mode == "llm" → GeminiService.react_to_donation(event)
                                      │ 금액별 티어 가이드 포함 프롬프트
                                      │ 감정 love/happy 강제
                                      ▼
                                  AIReaction
    │
    ▼
OverlayEvent(type="donation_reaction", data={...reaction, donation_amount, donation_nickname})
    │
    ▼
schedule_reaction → _deliver → TTS + overlay_callback
```

### 음성/하트비트 흐름

```
마이크 입력 (sounddevice 16kHz mono)
    │
    ▼
SttService (VAD 또는 청크 버퍼링)
    │
    ▼
STTEngine.transcribe(audio) → text
    │
    ▼
StreamerSpeech → EventPipeline._on_speech()
    │
    ├── _stt_buffer.append() + _context_buffer.append()
    ├── HeartbeatService.update_stt_time()
    └── NameCallDetector.set_stt_buffer()

HeartbeatService._heartbeat_loop() (reaction_interval초 주기)
    │
    ├── chat_silence < silence_threshold → normal 모드 유지
    │
    ├── chat_quiet=True, stt_quiet=False, stt_buffer 있음
    │       → heartbeat 모드
    │       → GeminiService.react_to_speech(stt_buffer)
    │       → OverlayEvent(type="heartbeat_reaction")
    │       → _do_idle_reaction("viewer_quiet")
    │
    ├── stt_quiet=True, chat_quiet=False
    │       → idle 모드
    │       → _do_idle_reaction("streamer_quiet")
    │
    └── 둘 다 quiet
            ├── stt_buffer 있음 → heartbeat 모드 → react_to_speech
            └── stt_buffer 없음 → idle 모드 → idle 메시지/LLM
```

### 이름 호출 → 대화 흐름

```
SttService → StreamerSpeech
    │
    ▼
NameCallDetector._scan_loop() (2초 주기)
    │
    ├── trigger_names 검색 (config + 캐릭터 이름)
    └── 감지 시 → _on_trigger(triggered_speeches)
                        │
                        ▼
                ConversationMode.enter(speeches)
                    │
                    ├── HeartbeatService.pause()
                    ├── GeminiService.react_to_conversation(speeches, history, tools)
                    │       │
                    │       ├── function_call 반환 → _handle_function_call()
                    │       │       └── skill.execute(SkillContext) → SkillResult
                    │       │               └── needs_followup → _pending_skill 저장
                    │       │
                    │       └── AIReaction 반환 → overlay_callback
                    │
                    ├── _conversation_history 업데이트
                    └── 타임아웃(30초) 또는 max_turns(10) → exit()
                                                                 └── HeartbeatService.resume()
```

---

## 10. 아바타 제작 가이드

### PNG 모드 (PNGTuber)

감정별 PNG 이미지를 통째로 교체하는 방식. 가장 간단하고 즉시 시작 가능하다.

**파일 구조**:
```
frontend/public/avatars/{세트명}/
├── neutral.png       # 기본
├── happy.png         # 행복
├── surprised.png     # 놀람
├── angry.png         # 화남
├── love.png          # 사랑
├── sad.png           # 슬픔
├── excited.png       # 신남
├── confused.png      # 혼란
├── sleepy.png        # 졸림
├── embarrassed.png   # 부끄러움
├── playful.png       # 장난
├── smug.png          # 도발
├── scared.png        # 공포
├── touched.png       # 감동
└── bored.png         # 지루
```

**파일명 규칙**: 반드시 위 15개 감정명과 동일해야 한다. 대소문자 구분 있음.

**권장 규격**:
- 동일 해상도 (예: 300×350, 512×512)
- 투명 배경 PNG-24
- 뷰포트보다 크면 `cover` 모드 + 잘림 위치 설정으로 원하는 부분 표시 가능

**설정**: 설정 UI → 아바타 설정 → 렌더링 모드 "PNG 교체" → 아바타 세트 선택

---

### SVG 파츠 모드

파츠(몸통/눈/눈썹/입/이펙트)를 개별 SVG 레이어로 분리하여 CSS 절대 위치로 합성한다.

**viewBox 규격**: 모든 파일 동일하게 `viewBox="0 0 300 350"` 사용

**파일 구조**:
```
frontend/public/avatars/parts/
├── body.svg              # 몸통 (고정 요소)
├── eyes/
│   ├── normal.svg        # 기본 눈
│   ├── closed.svg        # 깜빡임용 감은 눈
│   ├── happy.svg         # 웃는 눈
│   ├── angry.svg         # 찌푸린 눈
│   └── love.svg          # 하트 눈
├── eyebrows/
│   ├── normal.svg        # 기본 눈썹
│   ├── raised.svg        # 놀람 올린 눈썹
│   └── angry.svg         # V자 찌푸린 눈썹
├── mouth/
│   ├── closed.svg        # 기본 닫힌 입
│   ├── open.svg          # 말하기용 벌린 입
│   ├── smile.svg         # 웃음
│   ├── o.svg             # 놀람 O형
│   └── pout.svg          # 삐침/불만
└── effects/
    ├── heart.svg         # 하트 3개
    ├── sweat.svg         # 땀방울
    └── exclamation.svg   # 느낌표
```

**좌표 가이드 (300×350 기준)**:

| 파츠 | X 범위 | Y 범위 |
|------|--------|--------|
| 몸통 | 전체 | 전체 |
| 눈 | 좌 ~115, 우 ~185 | ~120~135 |
| 눈썹 | 좌 96~134, 우 166~204 | ~102~112 |
| 입 | ~130~170 | ~178~192 |
| 이펙트 | ~240~280 (우측) | ~20~110 (상단) |

**핵심 규칙**: 모든 파일이 동일한 viewBox를 사용하고, 같은 좌표계에서 해당 파츠 위치에만 그린다.

**감정 → 파츠 매핑**:

| 감정 | 눈 | 눈썹 | 입 | 이펙트 |
|------|----|----|-----|--------|
| neutral | normal | normal | closed | - |
| happy | happy | normal | smile | - |
| surprised | normal | raised | o | exclamation |
| angry | angry | angry | pout | sweat |
| love | love | normal | smile | heart |
| sad | closed | normal | pout | sweat |
| excited | happy | raised | smile | exclamation |
| confused | normal | raised | closed | sweat |
| sleepy | closed | normal | closed | - |
| embarrassed | happy | normal | closed | sweat |
| playful | happy | raised | smile | - |
| smug | happy | normal | smile | - |
| scared | normal | raised | o | sweat |
| touched | love | normal | smile | heart |
| bored | closed | normal | pout | - |

---

### Live2D 모드

Cubism Core SDK + pixi-live2d-display + PixiJS v6으로 `.model3.json` 모델을 실시간 렌더링한다.

**모델 배치**:
```
frontend/public/avatars/live2d/
└── {모델명}/
    ├── {모델명}.model3.json    # 모델 진입점
    ├── textures/               # 텍스처 파일들
    ├── physics/                # 물리 설정
    ├── motions/                # 모션 파일들
    └── expressions/            # 표현식 파일들 (*.exp3.json)
```

**표현식(Expression) 매핑 방식**:

| 방식 | 조건 | 동작 |
|------|------|------|
| Expression 프리셋 | 모델에 *.exp3.json 존재 | `setExpression(감정명)` 호출 |
| 파라미터 직접 제어 | 항상 병행 적용 | 파라미터 값 직접 설정 |

**지원 파라미터**:
- `ParamEyeLOpen`, `ParamEyeROpen` — 눈 개폐 (깜빡임)
- `ParamMouthOpenY` — 입 개폐 (립싱크: 0.3~0.9 범위 랜덤 변동)
- `ParamBreath` — 호흡 애니메이션 (사인파)
- `ParamAngleX`, `ParamAngleY`, `ParamAngleZ` — 머리 방향

**아이들 애니메이션**:
- 눈 깜빡임: 3~5초 랜덤 간격, 150ms 감은 후 복귀
- 호흡: 연속 사인파 `ParamBreath`

**립싱크**:
- TTS 활성화 시: `audioPlaying` 상태 → `isTalking` prop 연계
- TTS 비활성화 시: 말풍선 표시 여부(`bubbleVisible`) 폴백

**설정 예시**:
```json
{
  "avatar": {
    "mode": "live2d",
    "live2d_model": "my_model",
    "live2d_scale": 1.0,
    "live2d_offset_x": 0,
    "live2d_offset_y": 0,
    "live2d_lipsync": true
  }
}
```

**is_toggle 표현식**: `*.exp3.json` 파라미터가 모두 `Param\d+` 패턴이고 값이 0 또는 1인 경우 자동 감지하여 토글 방식으로 적용.

---

## 11. 의존성

### Python (backend/requirements.txt)

| 패키지 | 버전 | 용도 |
|--------|------|------|
| fastapi | >=0.115.0 | HTTP/WebSocket 서버 |
| uvicorn[standard] | >=0.32.0 | ASGI 서버 |
| chzzkpy | >=2.1.5 | Chzzk OAuth2 채팅/후원 연동 |
| google-genai | >=1.0.0 | Gemini AI API (신규 SDK) |
| faster-whisper | >=1.1.0 | 음성 인식 (Whisper ONNX) |
| sounddevice | >=0.5.0 | 오디오 캡처 |
| silero-vad | >=5.1 | Voice Activity Detection |
| numpy | >=1.26.0 | 오디오 데이터 처리 |
| pydantic | >=2.9.0 | 데이터 검증/직렬화 |
| python-multipart | >=0.0.12 | 파일 업로드 |
| aiofiles | >=24.1.0 | 비동기 파일 I/O |
| websockets | >=13.0 | WebSocket 지원 |
| edge-tts | >=7.0.0 | Microsoft Edge Neural TTS |
| supertonic | >=0.1.0 | 로컬 ONNX TTS 엔진 |

### Node.js (frontend/package.json)

**dependencies**:

| 패키지 | 버전 | 용도 |
|--------|------|------|
| react | ^19.2.0 | UI 프레임워크 |
| react-dom | ^19.2.0 | React DOM 렌더링 |
| react-router-dom | ^7.13.1 | 클라이언트 사이드 라우팅 |
| pixi.js | ^6.5.10 | 2D 렌더링 엔진 (Live2D용) |
| pixi-live2d-display | ^0.4.0 | PixiJS 기반 Live2D 모델 렌더링 |

**devDependencies** (주요):

| 패키지 | 버전 | 용도 |
|--------|------|------|
| vite | ^7.3.1 | 빌드 도구 및 개발 서버 |
| typescript | ~5.9.3 | 타입 안전 |
| @vitejs/plugin-react | ^5.1.1 | Vite React 플러그인 |

---

## 12. 배포 및 실행

### start.sh (Linux/Mac)

```bash
./start.sh
```

동작 순서:
1. `.venv/bin/activate` 존재 확인 → 없으면 Python venv 생성
2. `pip install -q -r backend/requirements.txt`
3. `frontend/node_modules/.package-lock.json` 확인 → 없으면 `npm install`
4. Backend: `python backend/main.py &` (포트 18300)
5. Frontend: `npx vite --host &` (포트 18300)
6. Ctrl+C 시 양쪽 프로세스 동시 종료

### start.bat (Windows)

동일한 순서로 Windows 환경에서 실행. `.venv\Scripts\activate.bat` 경로 사용.

### 크로스 플랫폼 호환성

다른 OS에서 생성된 환경 자동 감지 후 재생성:
- Python venv: 플랫폼별 활성화 파일 존재 여부로 판별
- node_modules: `.package-lock.json` 파일 존재 여부로 유효성 판별

### 개발 모드

| 구성 | URL |
|------|-----|
| Backend API | http://localhost:18300 |
| Frontend Dev Server | http://localhost:18300 |
| 설정 페이지 | http://localhost:18300/settings |
| 오버레이 (OBS용) | http://localhost:18300/overlay |
| WebSocket | ws://localhost:18300/ws/overlay |

### 빌드 모드

```bash
cd frontend
npm run build
# dist/ 폴더 생성 → uvicorn이 정적 파일 서빙
```

빌드 후 Frontend는 개발 서버와 동일한 포트 18300에서 서빙된다.

### 포트 구성

| 포트 | 용도 | 설정 키 |
|------|------|---------|
| 18300 | Backend API/WebSocket | `server.port` |
| 18300 | Frontend (개발/빌드 통일) | `server.frontend_port` / Vite 기본값 |

### 초기 설정 순서

1. `./start.sh` 실행
2. `http://localhost:18300/settings` 접속
3. **API 연결** 탭 → "연결하기" 버튼 클릭 → 네이버 로그인 → 권한 승인
4. **API 연결** 탭 → Gemini API 키 입력
5. **페르소나** 탭 → 캐릭터 이름/성격 설정
6. (선택) **STT 설정** → 엔진 선택/모델 다운로드/마이크 설정
7. (선택) **TTS 음성** → 엔진 선택/프리셋 설정
8. OBS에 브라우저 소스 추가: `http://localhost:18300/overlay` (배경 투명)
9. **설정 저장** 버튼 클릭

### 환경 변수

| 변수 | 용도 |
|------|------|
| `HF_HUB_DISABLE_SYMLINKS_WARNING` | HuggingFace 심볼릭 링크 경고 억제 (자동 설정) |
| `SUPERTONIC_CACHE_DIR` | supertonic 모델 캐시 경로 (기본: `~/.cache/supertonic2`) |
