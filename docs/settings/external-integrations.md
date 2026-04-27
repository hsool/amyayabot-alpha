---
title: 외부 연동 설정
parent: Settings Guide
nav_order: 2
---
# 외부 연동 설정

AmyayaBot은 로컬에서 실행되지만, 일부 기능은 외부 API나 OBS 연결이 필요합니다. 이 문서는 **어떤 기능이 어떤 외부 설정을 요구하는지**와 **설정 화면의 어느 필드에 넣어야 하는지**를 설명합니다.

> 외부 서비스의 콘솔 UI, 모델명, 과금/한도는 바뀔 수 있습니다. 공개 배포 전에는 각 공식 문서를 다시 확인하세요.

---

## 한눈에 보는 외부 연동

| 연동 | 꼭 필요한 기능 | 설정 위치 | 공식 문서/콘솔 |
| --- | --- | --- | --- |
| Gemini API | AI 반응 생성, Vision, 장기 기억 embedding fallback | 연결 설정 → Gemini AI | [Gemini API docs](https://ai.google.dev/gemini-api/docs), [API key](https://aistudio.google.com/app/apikey) |
| CHZZK OAuth/API | 채팅/후원/구독 이벤트, 채팅 전송, 방송 제어 | 연결 설정 → Chzzk OAuth | [CHZZK Authorization](https://chzzk.gitbook.io/chzzk/chzzk-api/authorization) |
| OBS WebSocket | DND 씬 감지, Vision 캡처, scene/source 선택 | 연결 설정 → OBS 연동 | [OBS Remote Control Guide](https://obsproject.com/kb/remote-control-guide) |
| Naver Search API | 공식 웹/카페 검색 보조 | 연결 설정 → 웹/팬카페 검색 | [Naver Search API](https://developers.naver.com/docs/serviceapi/search/web/web.md) |
| Naver Cafe 공개글 목록 | 팬카페 숫자 ID 기반 최신글/조회수순/댓글순 조회 | 연결 설정 → 웹/팬카페 검색 | 비공식 웹 API 관찰 경로라 별도 공식 문서 없음 |
| Brave Search API | 웹 검색 fallback/보조 | 연결 설정 → 웹/팬카페 검색 | [Brave Search API](https://api-dashboard.search.brave.com/) |
| Fish Audio | Fish Speech TTS | 연결 설정 → TTS 모델/API, TTS 출력 | [Fish Audio TTS API](https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech) |
| Supertone API | Supertone cloud TTS | 연결 설정 → TTS 모델/API, TTS 출력 | [Supertone TTS Guide](https://docs.supertoneapi.com/en/user-guide/text-to-speech) |
| Supertonic 로컬 | 로컬 ONNX TTS | 연결 설정 → TTS 모델/API | provider/runtime 상태는 앱 내 Supertonic 관리 패널 확인 |

---

## Gemini API 키

### 무엇에 쓰이나요?

- 일반 AI 반응 생성
- 대화모드 응답 생성
- 후원/구독/idle/reactive 문장 생성
- Vision 화면 분석
- 장기 기억 embedding 키가 비어 있을 때 fallback

### 설정 방법

1. Google AI Studio에서 API key를 발급합니다.
2. AmyayaBot `/settings` → **연결 설정 → Gemini AI**로 이동합니다.
3. **API 키** 필드에 붙여넣고 저장합니다.
4. 기본 모델은 설정 화면의 LLM 모델에서 선택하거나 직접 입력할 수 있습니다.

### 장기 기억 embedding 모델

현재 설정 파일의 기본 장기 기억 embedding 모델은 `gemini-embedding-2-preview`입니다. 연결 설정의 **임베딩 API 키**를 비워두면 Gemini API 키를 재사용합니다.

주의:

- Google 공식 embedding 문서에서는 최신/사용 가능 모델명이 계속 갱신됩니다. 예를 들어 2026년 현재 문서에는 `gemini-embedding-2`, 텍스트 전용 `gemini-embedding-001` 같은 설명이 포함됩니다. 현재 코드 기본값과 공식 최신 모델명이 다를 수 있으므로 public release 전 검증하세요.
- 장기 기억은 로컬 DB에 저장되므로, 테스트 중 쌓인 기억을 초기화하려면 연결 설정의 장기 메모리 초기화 기능을 사용하세요.

---

## CHZZK OAuth/API

### 무엇에 쓰이나요?

- 치지직 채팅/후원/구독 이벤트 수신
- 봇 채팅 전송
- 방송 제목/카테고리/태그 제어
- 채팅 명령어와 매크로 운영

### 설정 필드

| 필드 | 설명 |
| --- | --- |
| Client ID | CHZZK 개발자 앱의 clientId |
| Client Secret | CHZZK 개발자 앱의 clientSecret |
| 연결하기 | OAuth 인증 코드 발급 → token 발급 절차 실행 |
| 연결 해제 | token/revoke 또는 로컬 연결 상태 해제 |

### OAuth 흐름 요약

CHZZK 공식 문서 기준 인증 코드는 `https://chzzk.naver.com/account-interlock`에서 요청하고, `redirectUri`로 `code`와 `state`가 전달됩니다. access token은 1일, refresh token은 30일 유효하다고 문서화되어 있습니다.

AmyayaBot에서 직접 앱을 운영할 때는:

1. CHZZK 개발자 페이지에서 앱을 등록합니다.
2. 로그인 redirect URL을 로컬 callback 주소와 맞춥니다. 현재 봇은 로컬 OAuth callback에 포트 `18301`을 사용합니다.
3. 발급된 Client ID/Secret을 **연결 설정 → Chzzk OAuth**에 입력합니다.
4. 연결하기 버튼으로 브라우저 인증을 완료합니다.

주의:

- redirect URI가 앱 등록값과 다르면 인증이 실패합니다.
- Client ID/Secret만으로 방송 권한을 행사하는 것은 아니며, 사용자 로그인과 OAuth 권한 허용이 필요합니다.
- 그래도 공개 repo나 방송 화면에는 secret을 노출하지 않는 것이 원칙입니다.

---

## OBS WebSocket 연결

### OBS WebSocket은 왜 필요한가요?

OBS 브라우저 소스는 오버레이를 화면에 띄우는 기능입니다. OBS WebSocket은 AmyayaBot이 OBS의 현재 상태를 읽는 연결입니다.

| 기능 | OBS WebSocket 필요 여부 | 이유 |
| --- | --- | --- |
| `/overlay` 브라우저 소스 표시 | 필요 없음 | 브라우저 소스 URL만 있으면 표시 가능 |
| DND 씬 자동 감지 | 필요 | 현재 씬 이름을 읽어 DND 정책 적용 |
| Vision 스크린샷 | 필요 | 현재 program scene/source를 캡처해야 함 |
| ROI source 선택 | 필요 | scene/source catalog를 읽어 선택 UI 제공 |
| 현재 씬 상태 표시 | 필요 | 연결 상태와 current scene 조회 |

### OBS에서 켜기

OBS 28 이상은 WebSocket 기능이 기본 포함되어 있습니다. 공식 OBS Remote Control Guide는 OBS 28+에서 WebSocket이 기본 포함되며, 비밀번호 보호를 강력히 권장한다고 안내합니다.

1. OBS 실행
2. 상단 메뉴 **Tools → obs-websocket Settings** 또는 **도구 → WebSocket 서버 설정** 열기
3. WebSocket server 활성화
4. 인증 사용을 켜고 비밀번호를 설정하거나 자동 생성된 비밀번호 확인
5. 포트 확인. OBS WebSocket v5 기본 포트는 일반적으로 `4455`입니다.
6. 저장

### AmyayaBot에 입력

1. `/settings` → **연결 설정 → OBS 연동**
2. 활성화 ON
3. host 입력
   - 같은 PC: `localhost`
   - 다른 PC: OBS가 켜진 PC의 LAN IP
4. port 입력: 보통 `4455`
5. password 입력
6. 저장 후 **연결 적용** 클릭
7. 상태에 current scene이 표시되는지 확인

### 흔한 실패 원인

| 증상 | 확인할 것 |
| --- | --- |
| 연결 실패 | OBS가 켜져 있는지, WebSocket server가 enabled인지 |
| 인증 실패 | 비밀번호가 OBS 설정과 같은지 |
| timeout | host가 `localhost`인지, 다른 PC면 방화벽/LAN IP가 맞는지 |
| Vision만 실패 | OBS 연결은 되어도 캡처 대상 scene/source가 없거나 guard가 막는지 |

---

## 웹/팬카페 검색

### 무엇에 쓰이나요?

Gemini 도구가 웹/네이버 결과 또는 스트리머 팬카페의 최근 공개글을 참고해야 할 때 사용합니다. 현재 설정 UI 이름은 **연결 설정 → 웹/팬카페 검색**입니다.

### 공식 Naver Search API 설정 방법

공식 웹문서/카페글 검색을 사용하려면 Naver Developers 키가 필요합니다. Naver 공식 문서 기준 Search API는 비로그인 방식 Open API이며, 요청 헤더에 Client ID와 Client Secret을 넣어 호출합니다. 웹문서 검색 API는 하루 호출 한도 25,000회로 문서화되어 있습니다.

1. Naver Developers에서 애플리케이션을 등록합니다.
2. API 설정에서 검색 API 사용 권한을 켭니다.
3. Client ID와 Client Secret을 확인합니다.
4. AmyayaBot `/settings` → **연결 설정 → 웹/팬카페 검색**
5. **공식 Naver Search API 선택 설정** 영역에 Naver Client ID/Secret을 입력 후 저장합니다.

이 키는 일반 웹 검색, 공식 카페글 검색, 팬카페 이름/URL slug 기반 후처리 필터에 사용됩니다. 아래 숫자 `cafeId`/`clubid` 조회만 쓸 때는 필수값이 아닙니다.

### 팬카페 cafeId / clubid

이 값은 페르소나 성격이나 말투가 아니라 **외부 데이터 연결값**입니다. 그래서 설정 위치는 페르소나 탭이 아니라 **연결 설정 → 웹/팬카페 검색**입니다. 숫자 `clubid`/`cafeId`만 입력하는 경로는 Naver Client ID/Secret이 없어도 동작합니다.

설정 UI에서는 이 필드가 Naver Client ID/Secret보다 위에 표시됩니다. 팬카페 최신글만 확인하려면:

1. **웹/팬카페 검색** 토글을 켭니다.
2. **팬카페 cafeId / clubid**에 숫자 ID 또는 `https://cafe.naver.com/ca-fe/cafes/{id}` 형태의 URL을 입력합니다.
3. 저장 후 AI에게 “팬카페 최신글”, “팬카페 조회수 많은 글”, “팬카페 댓글 많은 글”처럼 요청합니다.

Naver 공식 **카페글 검색 API**는 요청 파라미터로 특정 카페 ID를 직접 제한하는 기능을 제공하지 않습니다. 공식 파라미터는 `query`, `display`, `start`, `sort`이며, 응답 항목에 `cafename`, `cafeurl`이 포함됩니다.

AmyayaBot은 입력값 형태에 따라 두 경로를 사용합니다.

1. **숫자 `clubid`/`cafeId` 입력**
   `https://apis.naver.com/cafe-web/cafe-boardlist-api/v1/cafes/{cafeId}/menus/0/articles` 형태의 네이버 카페 웹 내부 API로 해당 카페의 최신 공개글 목록을 가져온 뒤, 제목/요약/게시판명/작성자명에서 질문 키워드를 로컬로 필터링합니다. “조회수 많은 글”, “댓글 많은 글”, “좋아요/추천 많은 글”처럼 물어보면 최근 공개글 묶음 안에서 `readCount`/`commentCount`/`likeCount` 기준으로 정렬합니다. 이 방식은 공식 Search Open API 키가 없어도 동작할 수 있지만, 네이버가 공개 계약으로 보장한 API가 아니므로 응답 스키마나 접근 정책이 바뀔 수 있습니다.
2. **카페 URL slug 또는 팬카페 이름 입력**
   공식 카페글 검색 API에서 공개 검색 결과를 넓게 받아온 뒤 `cafename` 또는 `cafeurl`이 설정값과 맞는 항목만 후처리 필터링합니다.

입력 예시:

| 입력값 | 매칭 방식 | 권장도 |
| --- | --- | --- |
| `31444127` | 내부 boardlist API로 해당 numeric cafeId의 최신 공개글을 가져온 뒤 로컬 필터 | 가장 정확하지만 비공식 API 의존 |
| `https://cafe.naver.com/ca-fe/cafes/31444127` | URL에서 numeric cafeId 추출 후 boardlist API 사용 | 권장 |
| `https://cafe.naver.com/amyayafan` | 공식 검색 결과의 `cafeurl` slug와 정확히 비교 | 공식 API 기반 |
| `amyayafan` | 응답의 `cafeurl` slug와 비교 | 권장 |
| `아먀야 팬카페` | 응답의 `cafename`과 비교 | 가능하지만 이름이 비슷한 카페가 있으면 부정확할 수 있음 |

주의:

- 비공개 게시판, 멤버 전용 글, 검색 비허용 글은 검색 API 결과에 나오지 않습니다.
- 내부 boardlist API는 “카페 최신글 목록” API에 가깝습니다. `query` 파라미터를 넣어도 서버에서 검색 필터로 적용되지 않아, AmyayaBot이 최근 몇 페이지를 받아온 뒤 로컬로 필터링/정렬합니다.
- `/menus/{menuId}/articles` 형태로 게시판별 최신글 조회도 가능하지만, 비로그인 public 경로에서 전체 메뉴 구조를 안정적으로 내려주는 API는 확인되지 않았습니다. 현재는 전체글 목록에 등장한 `menuId`/`menuName`만 관찰할 수 있고, 빈 게시판이나 권한 제한 게시판은 알 수 없습니다.
- 내부 API 경로는 네이버 웹 클라이언트에서 관찰되는 비공식 경로이므로 public release 전 동작 여부를 다시 확인하세요.
- 안정성을 우선하면 공식 Naver Search API 키를 발급하고 URL slug/팬카페 이름 기반 후처리 필터를 사용하세요. 정확한 카페 제한을 우선하면 numeric cafeId를 입력하세요.

---

## Brave Search API

Brave 검색은 Naver와 별도로 웹 검색 보조에 사용할 수 있습니다.

| 설정 | 효과 |
| --- | --- |
| Brave API Keys | 여러 개 저장 가능. rate limit/fallback을 고려해 순차적으로 사용할 수 있습니다. |
| max query length | 검색어가 너무 길어지는 것을 제한합니다. |

Brave 키는 비용/한도가 있을 수 있으므로 방송 중 자동 검색을 많이 켜기 전 사용량 정책을 확인하세요.

---

## TTS provider 연결

TTS는 두 단계를 나누어 생각하세요.

1. **연결 설정**에서 API 키 또는 로컬 런타임 준비
2. **TTS 출력**에서 active preset이 해당 provider를 실제로 사용하도록 선택

### Edge TTS

| 항목 | 설명 |
| --- | --- |
| 키 | 필요 없음 |
| preset 필드 | voice, pitch, rate, volume |
| 장점 | 첫 테스트가 쉽고 mp3 streaming 경로가 있습니다. |
| 제한 | 감정 스타일을 지원하지 않습니다. |

### Supertonic 로컬

| 항목 | 설명 |
| --- | --- |
| 키 | 필요 없음 |
| 준비 | 연결 설정 → TTS 모델/API → Supertonic 로컬 엔진 상태 확인/다운로드 |
| preset 필드 | voice style, speed, steps |
| 장점 | 로컬 실행, API 과금 없음, 빠른 합성 |
| 제한 | 감정 스타일 미지원, 로컬 런타임/모델 준비 필요 |

### Supertone API

공식 Supertone API 문서는 TTS 호출에 voice ID와 API key가 필요하다고 설명합니다. 현재 AmyayaBot 코드의 Supertone engine은 Supertone Play 계열 REST 경로를 사용하므로, provider 정책 변경 시 endpoint/인증 방식 검증이 필요합니다.

| 항목 | 설명 |
| --- | --- |
| 키 | 연결 설정 → Supertone API 키 |
| voice | TTS 출력 → Supertone 음성 관리에서 추가하거나 voice ID 직접 입력 |
| preset 필드 | voice ID, language, speed |
| 장점 | 감정/style 기반 음성 가능 |
| 제한 | API 비용/한도, endpoint 정책 변경 가능성 |

### Fish Audio / Fish Speech

Fish Audio 공식 TTS API는 `Authorization: Bearer <token>`과 모델 헤더(`s2-pro` 등), `reference_id`, `temperature`, `top_p` 같은 필드를 사용합니다.

| 항목 | 설명 |
| --- | --- |
| 키 | 연결 설정 → Fish Audio API 키 |
| voice/reference | TTS 출력 → Fish Audio 음성 관리에서 추가하거나 reference ID 직접 입력 |
| model | 현재 기본/권장 `s2-pro` |
| temperature | 높을수록 표현 변화가 커지고, 낮을수록 안정적 |
| top_p | 샘플링 다양성 조정 |
| 장점 | streaming 경로, emotion tag, reference voice 활용 |
| 제한 | API 비용/한도, reference ID 품질/권한 영향 |

---

## 설정 후 반드시 하는 테스트

| 연동 | 테스트 |
| --- | --- |
| Gemini | 짧은 AI 반응 생성 또는 디버그 speech/chat 주입 |
| CHZZK | OAuth 상태 `연결됨`, 테스트 채팅 출력 OFF 상태에서 이벤트 수신 확인 |
| OBS | 현재 scene 표시, DND scene policy 목록 로드 |
| 웹/팬카페 검색 | 팬카페 숫자 ID는 “최신글/조회수 많은 글” 테스트, 공식 Naver/Brave 검색은 API 키 저장 후 도구 테스트 |
| TTS | TTS 출력 탭의 미리듣기 |
| Fish/Supertone | provider 음성 검색/추가 후 해당 preset active로 선택 |
| Supertonic | 로컬 엔진 상태가 ready인지 확인 후 미리듣기 |
| Vision | Vision 수동 테스트 또는 ROI test를 방송 전 비공개로 실행 |

---

## 관련 문서

- 설정값별 효과: [설정 탭별 상세 레퍼런스](settings-reference.md)
- 퀵세팅: [퀵세팅 / 온보딩](../guides/first-run-onboarding.md)
- 문제 해결: [Troubleshooting](../wiki/troubleshooting.md)
