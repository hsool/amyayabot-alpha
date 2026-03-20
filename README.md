# AmyayaBot

치지직(Chzzk) 방송용 AI 캐릭터 봇 — 채팅, 후원, 음성에 실시간 반응하는 OBS 오버레이

---

<!-- 스크린샷 (추후 추가) -->

---

## 주요 기능

### 🤖 AI 반응
- **AI 채팅 반응** — Gemini AI가 실시간 채팅을 분석, 15가지 감정으로 반응 (on/off 토글, 출력 모드: 말풍선/채팅/둘다/랜덤)
- **후원 반응** — 금액별 3단계 티어, AI/패턴 반응 모드, 파티클 이펙트
- **분위기 분석** — 채팅 분위기/감정 패턴 분석, 반복 반응 방지

### 🎙️ 음성
- **TTS 음성 출력** — 4개 엔진 지원 (Edge-TTS, Supertonic, Supertone API, Fish Speech), 10개 프리셋
- **STT 음성 인식** — Faster-Whisper / SenseVoice 선택, VAD(음성활동감지)
- **Live2D 립싱크** — TTS 재생 중 ParamMouthOpenY 자동 애니메이션

### 🎭 아바타
- **트리플 모드 아바타** — PNG 교체(PNGTuber) / SVG 파츠 분리 / Live2D (pixi-live2d-display)
- **말풍선 커스터마이징** — 4방향 위치, 크기, 색상, 폰트, 꼬리 자동 방향

### 🧠 스킬 시스템
- **음성 명령** — Gemini function calling으로 자연어 명령 처리 (투표, 추첨, 노래 신청, 채팅 요약 등)
- **채팅 명령어** — `!` 접두사 명령어 (on/off 토글, 접두사 커스텀)
- **호명 감지 + 1:1 대화 모드** — 이름 호출 시 ConversationMode 진입, 최대 10턴

### ⚙️ 운영
- **하트비트 시스템** — 채팅 침묵 감지 → 자동 아이들 반응, 동적 임계값
- **채팅 필터** — 봇/특정유저/스트리머 채팅 필터링
- **콘텐츠 모더레이션** — 정치/종교/성적/욕설/차별 필터
- **게임 모드** — 방송 카테고리 변경 감지 → 프로필 자동 전환
- **사용자 프로필** — 전체 설정 저장/복원/삭제/기본값 초기화
- **페르소나 구조화** — 스트리머 정보, 캐릭터 정체성, 관계 설정, 19개 프리셋
- **웹 기반 설정 UI** — 10개 탭, 빠른설정(2컬럼), 타이밍 프리셋, 실시간 미리보기

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Backend | Python 3.10+, FastAPI, Uvicorn, Pydantic v2 |
| Frontend | React 19, TypeScript, Vite 7 |
| AI | Google Gemini 2.5 (채팅 분석 + function calling) |
| STT | Faster-Whisper / SenseVoice |
| 플랫폼 | chzzkpy v2 (Chzzk OAuth2, 채팅/후원 WebSocket) |
| 아바타 | pixi-live2d-display, PixiJS v6 |
| TTS | Edge-TTS, Supertonic, Supertone API, Fish Speech |

---

## 사전 요구사항

- Python 3.10 ~ 3.13 (3.14는 일부 패키지의 Windows 바이너리 wheel 미제공으로 Visual C++ Build Tools 필요)
- 치지직(네이버) 계정 (별도 개발자 등록 불필요)
- [Google Gemini API 키](https://aistudio.google.com/apikey)

---

## 빠른 시작

### 1. 설치 및 실행

```bash
# Linux/Mac
chmod +x start.sh
./start.sh

# Windows
start.bat
```

시작 스크립트가 자동으로 Python 가상환경 생성, 의존성 설치, 모든 서비스를 실행합니다.

### 2. 접속

| 페이지 | URL | 용도 |
|--------|-----|------|
| 설정 페이지 | http://localhost:18300/settings | 모든 설정 관리 |
| 오버레이 | http://localhost:18300/overlay | OBS 브라우저 소스 |

---

## 초기 설정 순서

### 1단계: 치지직 연결

1. 설정 페이지 → **API 설정** 탭에서 **"연결하기"** 버튼 클릭
2. 브라우저에서 네이버 로그인 페이지가 열리면 로그인 후 권한 승인
3. 연결 상태가 "연결됨"으로 바뀌면 완료

> 인증 과정에서 `localhost:8080` 포트를 임시로 사용합니다. 다른 프로그램이 이 포트를 사용 중이면 충돌할 수 있습니다.

### 2단계: Gemini API 설정

1. [Google AI Studio](https://aistudio.google.com/apikey)에서 API 키 발급
2. 설정 페이지 → **API 설정** 탭에서 키 입력

### 3단계: 아바타 설정

1. 설정 페이지 → **아바타 설정** 탭에서 렌더링 모드 선택 (PNG / SVG / Live2D)
2. 감정별 PNG 또는 SVG 파츠, Live2D 모델 파일 배치

### 4단계: OBS 연결

1. OBS에서 소스 추가 → **브라우저**
2. URL: `http://localhost:18300/overlay`
3. 너비/높이를 방송 해상도에 맞게 설정 (투명 배경 기본 적용)

---

## OBS 연결 방법

OBS 브라우저 소스를 이용해 오버레이를 방송 화면에 추가합니다.

```
URL: http://localhost:18300/overlay
너비: 방송 해상도 너비 (예: 1920)
높이: 방송 해상도 높이 (예: 1080)
```

- 배경은 기본적으로 투명 처리됩니다.
- 아바타 위치와 말풍선 위치는 설정 페이지에서 조정 가능합니다.

---

## 아바타 모드

| 모드 | 설명 |
|------|------|
| PNG 교체 (PNGTuber) | 감정별 단일 PNG를 통째로 교체. 가장 간편 |
| 파츠 분리 (SVG) | SVG 레이어 합성 (눈 깜빡임, 입 움직임). 더 생동감 있는 표현 |
| Live2D | pixi-live2d-display 기반. TTS 재생 중 립싱크 지원 |

### 커스텀 아바타 제작

**PNG 모드**: `data/avatars/{세트명}/` 폴더에 감정별 PNG 15장 배치 (파일명: `{감정}.png`)

**SVG 모드**: `data/avatars/parts/`의 SVG 파일 교체. 모든 SVG는 동일한 `viewBox` 사용 (기본: `0 0 300 350`)

**Live2D 모드**: `data/avatars/live2d/` 폴더에 모델 파일 배치. `.model3.json` 기준으로 로드

---

## 스킬 시스템

### 음성 명령 (Gemini Function Calling)

스트리머가 말로 자연어 명령을 내리면 Gemini가 의도를 파악해 스킬을 실행합니다.

| 예시 발화 | 동작 |
|-----------|------|
| "좀 조용히 해" | 반응 간격 조절 (설정 제어) |
| "투표 시작해" | 채팅 투표 시작 |
| "추첨해줘" | 시청자 추첨 |
| "노래 신청 열어줘" | 노래 신청 큐 관리 |
| "인사 등록해줘" | 자동응답 커스텀 명령어 등록 |
| "채팅 요약해줘" | 최근 채팅 내용 요약 |

### 채팅 명령어

채팅창에서 `!` 접두사로 시작하는 명령어를 인식합니다 (접두사 커스텀 가능).

- 반응 on/off 토글
- 각종 기능 실시간 제어

### 호명 감지 + 1:1 대화 모드

시청자가 봇의 이름을 호출하면 `ConversationMode`로 진입하여 최대 10턴의 1:1 대화를 진행합니다.

---

## 설정 프로필 & 게임 모드

### 사용자 프로필

전체 설정을 프로필로 저장하고 언제든 복원할 수 있습니다.

- 프로필 저장 / 복원 / 삭제
- 기본값 초기화
- 설정 페이지 → **프로필** 탭에서 관리

### 게임 모드

치지직 방송 카테고리가 변경되면 미리 설정해 둔 프로필로 자동 전환됩니다. 게임에 따라 캐릭터 성격, 반응 패턴을 다르게 운영할 수 있습니다.

---

## 감정 시스템 (15종)

`neutral` `happy` `surprised` `angry` `love` `sad` `excited` `confused` `sleepy` `embarrassed` `playful` `smug` `scared` `touched` `bored`

---

## 포트 구성

| 서비스 | 포트 |
|--------|------|
| 서비스 (API + 설정 페이지 + 오버레이) | 18300 |

---

## 문제 해결

**아바타가 표시되지 않음**
- OBS 브라우저 소스 URL이 `http://localhost:18300/overlay`인지 확인
- 서버가 실행 중인지 확인 (http://localhost:18300)

**AI가 반응하지 않음**
- 설정 페이지에서 Gemini API 키가 올바르게 입력되었는지, 치지직 연결 상태가 정상인지 확인
- 설정 페이지 상태 탭에서 서비스 연결 상태 확인
- AI 채팅 반응이 on 상태인지 확인

**STT가 동작하지 않음**
- 설정에서 STT 활성화 여부 및 오디오 디바이스 확인
- 첫 실행 시 Whisper 모델 다운로드에 시간이 걸릴 수 있음

**TTS가 동작하지 않음**
- 설정에서 TTS 활성화 여부 확인
- 음성 프리셋이 선택되어 있는지 확인
- Supertone API / Fish Speech 사용 시 해당 서비스 API 키 확인

**Windows에서 pip install 실패 (aiohttp 빌드 에러)**
- Python 3.14 이상에서는 일부 패키지의 pre-built wheel이 아직 제공되지 않아 C 컴파일이 필요합니다
- **해결 1 (권장)**: Python 3.12 또는 3.13으로 변경
- **해결 2**: [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) 설치 ("Desktop development with C++" 워크로드 선택)

**Chzzk 연결이 끊어짐**
- OAuth2 토큰 만료 시 설정 페이지에서 재인증 필요
- 방화벽이 18300 포트를 차단하고 있지 않은지 확인

**말풍선이 아바타 밖으로 벗어남**
- 설정 페이지 → **말풍선 설정** 탭에서 위치(상/하/좌/우)와 오프셋 조정

---

## 상세 문서

- [사용 설명서](docs/user-guide.md) — 기능별 상세 사용법
- [기술 문서](TECHNICAL_DOCS.md) — 아키텍처, API, 커스터마이징 가이드

---

## 라이선스

MIT License (추후 결정)
