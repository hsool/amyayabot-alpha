# AmyayaBot

AmyayaBot은 **치지직 방송에 AI 캐릭터를 붙여 운영하는 로컬 방송 파트너**입니다. 스트리머의 말, 시청자 채팅, 후원/구독, OBS 씬, 필요하면 방송 화면 맥락까지 참고해 **아바타, 말풍선, TTS, 채팅 메시지, OBS 오버레이**로 반응합니다.

단순 자동응답 봇이 아니라, 방송 흐름 안에서 “캐릭터가 같이 말하고”, “시청자 이벤트를 정리하고”, “방송 상황에 맞춰 과하지 않게 반응하도록 제어하는” 통합 시스템을 목표로 합니다.

---

## 누구를 위한 프로젝트인가요?

- 치지직 방송에 AI 캐릭터를 붙이고 싶은 스트리머
- OBS 브라우저 소스로 아바타/말풍선/TTS/인터랙션을 한 번에 띄우고 싶은 운영자
- 투표, 추첨, 룰렛, 노래신청, 후원 반응, 구독 반응을 하나의 설정 화면에서 관리하고 싶은 사람
- 나중에 Python/FastAPI + React 코드베이스를 유지보수하거나 직접 확장하려는 개발자

---

## 핵심 특징

| 특징 | 방송에서의 의미 |
| --- | --- |
| 로컬 실행 | 설정 화면과 오버레이를 내 PC에서 실행하고 OBS 브라우저 소스로 붙입니다. |
| 설정 중심 운영 | 대부분의 기능을 `/settings` 화면에서 켜고 끄며, 기능별 출력 채널을 조정합니다. |
| 출력 채널 분리 | 같은 AI 반응도 말풍선만, TTS만, 채팅만, 또는 조합해서 보낼 수 있습니다. |
| 치지직 이벤트 연동 | 채팅, 후원, 구독, 방송 제목/카테고리 제어를 Chzzk OAuth/API 경로로 다룹니다. |
| OBS 연동 | OBS WebSocket으로 현재 씬/소스 정보를 읽고 DND, Vision, scene/source 선택에 활용합니다. |
| 다양한 TTS 선택지 | Edge TTS, Supertonic 로컬, Supertone API, Fish Audio를 프리셋으로 선택합니다. |
| 안전장치 | DND 모드, moderation, 출력 길이 제한, 채팅 발송 제한으로 방송 중 과한 출력을 줄입니다. |

---

## 지금 설정할 수 있는 주요 기능

- **AI 캐릭터 반응**: Gemini 기반 문장 생성, 페르소나/캐릭터 말투, 스트리머 정보 반영
- **말풍선/아바타/TTS**: OBS 오버레이에 캐릭터와 말풍선을 표시하고 음성으로 출력
- **STT/대화 모드**: 마이크 음성을 인식하고 캐릭터 이름 호출 후 짧은 대화 세션 유지
- **채팅 출력/매크로**: AI 반응 채팅 전송, `!명령어` 매크로, 첫 채팅 환영 메시지, 배칭 메시지
- **후원/구독 반응**: 금액/티어별 반응 강도, 출력 채널, 고정 패턴 메시지 또는 LLM 생성 선택
- **추가 기능**: 투표, 추첨, 룰렛, 후원 투표, 노래신청
- **웹·팬카페 검색/장기 기억**: Naver/Brave 검색, 팬카페 최신 공개글 조회, Gemini embedding 기반 기억 검색을 보조 도구로 사용
- **화면 인식(실험실)**: OBS 스크린샷과 ROI 프로필을 이용해 방송 화면 맥락을 반응에 보조 활용

> 처음부터 전부 켜지 마세요. 첫 방송 테스트는 **Gemini + 말풍선 + OBS `/overlay` + Edge TTS 또는 TTS OFF** 정도로 시작하는 것을 권장합니다.

---

## 실행 환경

### 기본 필요 항목

- Python 3.10~3.13 권장
- Node.js / npm
- OBS Studio 28 이상 권장(WebSocket 내장)
- Google Gemini API 키
- 치지직 방송 계정

### 선택 기능별 필요 항목

| 기능 | 추가로 필요한 것 |
| --- | --- |
| 치지직 채팅/후원/방송 제어 | Chzzk OAuth 연결 또는 직접 발급한 Client ID/Secret |
| OBS 씬/DND/Vision | OBS WebSocket host/port/password |
| 팬카페 최신 공개글 조회 | 네이버 카페 숫자 `cafeId`/`clubid` 또는 `ca-fe/cafes/{id}` URL. 숫자 ID 경로는 Naver API 키 없이 동작하지만 비공식 공개글 목록 API에 의존 |
| Naver 공식 웹/카페 검색 | Naver Developers Search API Client ID/Secret. 팬카페 이름/URL slug 후처리 필터나 일반 웹 검색에 사용 |
| Brave 검색 | Brave Search API key |
| 장기 기억 | Gemini embedding 모델 사용 가능 API 키(비워두면 기본 Gemini 키 사용) |
| Fish Audio TTS | Fish Audio API key + voice/reference ID |
| Supertone API TTS | Supertone API key + voice ID |
| Supertonic 로컬 TTS | Supertonic 로컬 런타임/모델 다운로드 |
| 노래신청 | yt-dlp 기반 YouTube 검색/스트리밍 경로가 정상 동작해야 함 |

외부 발급/연결 절차는 [외부 연동 설정](docs/settings/external-integrations.md)에 모았습니다.

---

## 설치와 실행

```bash
# Linux / macOS
chmod +x launchers/unix/start.sh
./launchers/unix/start.sh

# Windows
AmyayaBot.cmd
```

Windows에서는 루트의 `AmyayaBot.cmd`를 더블클릭하는 것을 권장합니다. PowerShell에서 직접 실행한다면 `.\AmyayaBot.cmd`를 사용하세요. 내부 호환 스크립트는 `launchers/` 아래에 보관합니다.

일반 실행 주소:

- 설정 화면: <http://localhost:18300/settings>
- 메인 오버레이: <http://localhost:18300/overlay>
- 인터랙티브 오버레이: <http://localhost:18300/overlay/interactive>
- 음악 오버레이: <http://localhost:18300/overlay/music>

개발 모드에서는 Vite 프론트엔드가 `http://localhost:18200`에서 열릴 수 있습니다. 실제 주소는 터미널 출력이 우선입니다.

---

## 가장 단순한 첫 설정 순서

1. `/settings` 열기
2. **연결 설정 → Gemini AI**에 API 키 입력
3. **페르소나**에서 스트리머 이름, 캐릭터 이름, 주 콘텐츠, 캐릭터 프리셋 입력
4. **빠른 설정**에서 말풍선 ON, TTS는 원하는 경우만 ON, 채팅 출력은 처음엔 OFF
5. OBS 브라우저 소스에 `http://localhost:18300/overlay` 추가
6. 말풍선/아바타가 보이면 TTS, 치지직 OAuth, OBS WebSocket, STT, 매크로, 후원/구독 등을 단계적으로 켜기

화면을 따라 하는 설명은 [퀵세팅/온보딩](docs/guides/first-run-onboarding.md)을 보세요.

---

## 설정 기능 상세 설명

설정 화면은 탭이 많기 때문에 README에 모든 설명을 넣지 않습니다. 대신 실제 탭별로 아래 내용을 정리했습니다.

- 각 탭이 하는 일
- 각 설정값을 바꾸면 방송에서 무엇이 달라지는지
- 필요한 외부 API/OBS/오버레이 후속 설정
- 변수 템플릿 예시
- 켜면 위험하거나 비용이 생길 수 있는 부분

자세한 내용: [설정 탭별 상세 레퍼런스](docs/settings/settings-reference.md)

---

## 문제가 생기면

- 오버레이가 안 보임 → OBS 브라우저 소스 URL, 포트 `18300`, 브라우저 소스 새로고침 확인
- AI가 말하지 않음 → Gemini API 키, TTS 활성화, 출력 채널, 브라우저 소스 오디오 모니터링 확인
- 치지직 채팅 전송 실패 → Chzzk OAuth 상태와 채팅 출력/발송 제한 확인
- OBS 씬을 못 읽음 → OBS WebSocket 활성화, 포트 `4455`, 비밀번호, 방화벽 확인
- Fish/Supertone 음성이 안 나옴 → API 키, voice/reference ID, 프리셋의 active engine 확인

상세 순서: [Troubleshooting](docs/wiki/troubleshooting.md)

---

## 개발자 / 유지보수자 문서

현 코드 기준의 구조, API, 서비스 경계, 설정 모델, 유지보수 포인트는 [TECHNICAL_DOCS.md](TECHNICAL_DOCS.md)에 정리되어 있습니다.

---

## 보안과 공개 전 주의

- `data/config.json`, API 키, OAuth 토큰, OBS 비밀번호는 공개하지 마세요.
- 방송 화면/스크린샷에 API 키 입력칸이 노출되지 않도록 주의하세요.
- 외부 API의 모델명, 권한, rate limit, 콘솔 UI는 바뀔 수 있습니다. 공개 릴리스 전에는 공식 문서와 실제 설정 화면을 다시 확인하세요.
