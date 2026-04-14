# AmyayaBot

AmyayaBot은 **치지직(Chzzk) 방송을 함께 진행해 주는 AI 캐릭터 파트너 봇**이야.
스트리머 목소리, 시청자 채팅, 후원/구독 이벤트, 상호작용 기능, 필요하면 방송 화면까지 참고해서
**말풍선 / TTS / 채팅 / OBS 오버레이**로 반응을 만들어 준다.

쉽게 말하면,
단순히 채팅에 답만 하는 봇보다는 **방송에 함께 들어와 있는 AI 캐릭터 시스템**에 더 가깝다.

---

## 이 프로젝트로 할 수 있는 것

AmyayaBot은 한 가지 기능만 하는 봇이 아니야.
방송할 때 실제로 많이 손이 가는 것들을 한 프로젝트 안에서 같이 다룬다.

- **스트리머 음성 반응**
  - STT로 스트리머 말을 듣고
  - 필요하면 호명(namecall) 기반 대화모드로 자연스럽게 들어갈 수 있어.
- **자동 반응**
  - 채팅이 활발할 때 reactive 반응
  - 조용할 때 idle 반응
  - 후원 / 구독 이벤트 반응
- **출력 채널을 여러 방식으로 조합 가능**
  - TTS
  - 말풍선
  - 채팅 출력
  - OBS 오버레이
- **방송용 상호작용 기능 포함**
  - 투표 / 추첨 / 룰렛 / 노래신청
- **실험적 vision 지원**
  - 방송 화면을 보조적으로 읽어서 반응을 보강하는 흐름을 실험 중이야.
- **운영 화면이 이미 갖춰져 있음**
  - First-Run Onboarding
  - 상세 설정 페이지
  - 디버그 / 수동 테스트 도구

---

## 누구에게 잘 맞나?

이 프로젝트는 특히 이런 사람에게 잘 맞아.

- 치지직 방송에 **AI 캐릭터 파트너**를 붙이고 싶은 사람
- 단순 채팅봇보다 **말하고, 듣고, 반응하는 방송 보조 시스템**을 원하는 사람
- TTS, 말풍선, 오버레이, 상호작용 기능을 **한 프로젝트에서 같이 쓰고 싶은 사람**
- 나중에 직접 손보거나 확장할 수 있는 Python/FastAPI + React 기반 프로젝트가 필요한 사람

---

## 가장 빠르게 시작하는 순서

걱정하지 마.
처음에는 **모든 설정을 다 이해하려고 할 필요가 없어.**

### 1) 봇 실행

```bash
# Linux / macOS
chmod +x start.sh
./start.sh

# Windows
start.bat
```

실행이 끝나면 보통 가장 먼저 여는 곳은 여기야.

- **설정 페이지:** `http://localhost:18300/settings`

개발 모드에서는 주소가 조금 다를 수 있으니,
**터미널에 마지막으로 출력된 URL**을 먼저 확인하는 게 가장 안전해.

### 2) 처음엔 이것만 하면 돼

처음에는 아래 항목만 채워도 시작할 수 있어.

1. **Gemini API 키**
2. **스트리머 이름**
3. **캐릭터 이름 / 프리셋**
4. **주요 콘텐츠**
5. **출력 채널 하나 이상**
   - TTS / 말풍선 / 채팅 중 최소 1개
6. 필요하면 **OBS 오버레이 / OBS WebSocket**
7. 필요하면 **치지직 OAuth 연결**

특히 치지직은 이제 보통 **Channel ID를 직접 적는 흐름이 아니라**,
**연동 버튼으로 로그인/OAuth 연결을 먼저 하는 흐름**으로 보면 돼.

### 3) OBS를 쓴다면

대표적으로 많이 쓰는 오버레이 경로는 이거야.

- 메인 오버레이: `/overlay`
- 인터랙티브 오버레이: `/overlay/interactive`
- 음악 오버레이: `/overlay/music`

처음에는 보통 **메인 오버레이 하나만 먼저 붙여도 충분**해.

---

## 문서는 이렇게 읽으면 쉬워

### 방송을 빨리 시작하고 싶다면
1. **[Streamer Quickstart](docs/guides/streamer-quickstart.md)**
2. **[Streamer Detailed Setup](docs/guides/streamer-detailed-setup.md)**
3. **[First-Run Onboarding](docs/guides/first-run-onboarding.md)**
4. **[Settings Guide](docs/settings/index.md)**

### 문제가 생기면
- **[FAQ](docs/wiki/faq.md)**
- **[Troubleshooting](docs/wiki/troubleshooting.md)**

### 개발/수정까지 하고 싶다면
- `docs-dev/architecture/*`
- `docs-dev/pipelines/*`
- `docs-dev/api/*`
- `docs-dev/development/*`

개발자 문서는 남겨두되,
공개 문서 메인 동선에서는 **스트리머/일반 사용자 문서를 먼저 보게 하는 방향**으로 정리하고 있어.

---

## 지금 특히 알아두면 좋은 점

- `chat_commands.enabled`는 단순 매크로만이 아니라 **AmyayaBot의 `!` 명령 처리 전반**에 영향을 줘.
- vision은 아직 **실험적/보조 계층**이야. 없어도 기본 방송 운영은 가능해.
- 치지직 연결은 **기본 OAuth 연동**과 **고급 Client ID/Secret override**를 구분해서 보면 쉬워.
  - 대부분의 사용자는 먼저 연동 버튼으로 로그인하면 돼.
  - 고급 override는 운영/배포 상황에서만 만지는 편이 좋아.

---

## 한 줄 요약

AmyayaBot은 **치지직 방송에서 AI 캐릭터가 말하고, 듣고, 반응하고, 운영을 도와주도록 만든 방송 파트너 시스템**이야.
처음에는 `settings`에서 Gemini + 캐릭터 + 출력 + 필요하면 OBS/치지직만 잡고, 나머지는 문서를 보면서 천천히 넓혀가면 돼.
