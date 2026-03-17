# 문제 해결 가이드

AmyayaBot을 사용하다 문제가 생겼을 때 참고하는 문서입니다. 증상별로 원인과 해결책을 제시합니다.

---

## 아바타가 표시되지 않음

### 증상

OBS 오버레이에 아바타(에이미) 이미지가 안 보임

### 원인 별 해결책

#### 1. 이미지 파일 경로가 잘못됨

**확인 방법:**
```
아바타 이미지 파일 위치:
/frontend/public/avatars/png/{세트명}/{감정}.png

예: /frontend/public/avatars/png/default/happy.png
```

**해결 방법:**
1. 아바타 파일이 실제로 위 경로에 있는지 확인
2. 파일명이 정확한지 확인 (대소문자 구분)
3. 설정에서 `avatar.current_set` 값 확인
   ```yaml
   avatar:
     current_set: "default"  # 이 폴더가 존재하는지 확인
     mode: "png"
   ```

#### 2. PNG 모드와 Live2D 모드 혼동

**확인 방법:**
```yaml
avatar:
  mode: "png"        # PNG 사용 설정
  # 또는
  mode: "live2d"     # Live2D 모드 설정
```

**해결 방법:**
- PNG 사용 시: 각 감정별 이미지 파일 필요
- Live2D 사용 시: Live2D 모델 파일 필요
- 둘 중 하나만 설정해서 사용

#### 3. Live2D 모델 파일 손상 또는 누락

**해결 방법:**
1. 모델 파일 경로 확인:
   ```
   /frontend/public/avatars/live2d/{모델명}/
   ```
2. 필요한 파일:
   - `{모델명}.model3.json`
   - 관련 물리 파일들 (.physics3.json)
   - 모션/표정 파일들
3. 파일이 손상되었다면 재설치

#### 4. 브라우저 캐시 문제

**해결 방법:**
1. OBS에서 브라우저 소스 새로고침 (F5)
2. 또는 OBS 완전 재시작
3. 브라우저 개발자 도구에서 캐시 삭제

### 확인 명령어

브라우저 개발자 도구 콘솔에서:
```javascript
// 현재 설정 확인
fetch('/api/settings').then(r => r.json()).then(console.log);
```

---

## AI가 반응하지 않음

### 증상

호명 후 에이미가 응답하지 않거나, 대화 중 대답이 없음

### 원인 별 해결책

#### 1. 호명 감지 실패

**확인 방법:**

```
당신: "에이미야!" (또는 설정된 캐릭터 이름)
→ 반응 없음
```

**원인과 해결:**

| 원인 | 확인 방법 | 해결책 |
|------|---------|--------|
| 호명 감지 비활성화 | 설정에서 `namecall.enabled` 확인 | `namecall.enabled: true`로 설정 |
| STT가 텍스트 변환 안 함 | 콘솔에서 STT 오류 메시지 확인 | STT 문제 해결 가이드 참조 |
| 이름이 인식 안 됨 | 마이크 테스트 | 마이크 설정 확인 |

**해결 명령어 (Chzzk 연결 상태):**

```bash
# 백엔드 로그 확인
tail -f backend/logs/amyayabot.log | grep -i namecall
```

#### 2. Gemini API 오류

**증상:**
- 호명은 감지되지만 응답이 없음
- 콘솔에 "Gemini API error" 메시지

**확인 방법:**
1. API 키가 설정되어 있는지 확인
   ```bash
   echo $GOOGLE_API_KEY  # 값이 나와야 함
   ```

2. API 할당량 확인
   - [Google Cloud Console](https://console.cloud.google.com)
   - 프로젝트 선택 → API 할당량
   - Generative Language API 확인

**해결책:**
1. API 키 확인 및 재설정
   ```bash
   export GOOGLE_API_KEY="your-api-key"
   ```
2. API 할당량 증가 신청
3. 일일 한도에 도달했다면 내일 다시 시도

#### 3. 대화 모드 비활성화

**확인 방법:**
```yaml
conversation:
  enabled: false  # 비활성화 상태
```

**해결책:**
```yaml
conversation:
  enabled: true
```

#### 4. 최대 턴 도달

**증상:**
- 정해진 턴 수(기본 10턴)에 도달하면 대화 종료

**해결책:**
- 이는 정상 동작입니다
- 다시 호명하면 새로운 대화 시작
- 필요하면 설정에서 `conversation.max_turns` 증가

### 디버깅 방법

백엔드 터미널에서 로그 확인:

```bash
# 대화 모드 로그
grep -i "conversation" backend/logs/amyayabot.log

# Gemini 호출 로그
grep -i "gemini" backend/logs/amyayabot.log
```

---

## STT (음성 인식)가 동작하지 않음

### 증상

- 마이크는 켜져 있는데 음성이 텍스트로 변환 안 됨
- "STT unavailable" 오류
- 마이크 권한 요청이 안 나옴

### 원인 별 해결책

#### 1. 마이크 권한 없음

**Windows:**
1. 설정 → 개인 정보 보호 및 보안 → 마이크
2. "앱이 마이크에 액세스하도록 허용" 활성화
3. Python이 마이크 접근 권한 있는지 확인

**Mac/Linux:**
```bash
# 마이크 장치 확인
arecord -l              # Linux
pactl list sources      # PulseAudio
```

#### 2. 마이크 장치가 없거나 선택 안 됨

**확인 방법:**
```bash
python -c "import sounddevice; print(sounddevice.query_devices())"
```

**해결책:**
1. 마이크 장치 선택:
   ```bash
   # device_index를 설정 파일에 추가
   audio:
     input_device: 1  # 원하는 장치 번호
   ```

2. 마이크 연결 상태 확인

#### 3. STT 엔진 설정 오류

**확인 방법:**
```yaml
stt:
  enabled: true
  engine: "google"      # Google STT 사용
  # 또는
  engine: "whisper"     # Whisper 모델 사용
```

**해결책:**
- Google STT: API 키 확인 (Gemini와 동일)
- Whisper: 모델 파일 다운로드 (첫 실행 시 자동)

#### 4. 소음이 많은 환경

**증상:**
- 상황에 따라 인식 불안정

**해결책:**
1. 마이크 제어 확인 (노이즈 캔슬링 ON)
2. 배경 소음 줄이기 (TV, 에어컨 등)
3. 더 가까이 마이크에 말하기
4. STT 민감도 조정:
   ```yaml
   stt:
     silence_threshold: 0.03  # 낮을수록 민감
     min_duration: 1.0        # 최소 녹음 시간 (초)
   ```

### 테스트 방법

터미널에서:
```bash
# 마이크 테스트 (5초 녹음)
ffmpeg -f dshow -i audio="마이크 이름" -t 5 test.wav
```

---

## TTS (음성 출력)가 동작하지 않음

### 증상

- 에이미가 말풍선으로만 응답하고 음성이 안 나옴
- 또는 음성이 나오지만 불완전함

### 원인 별 해결책

#### 1. TTS 비활성화됨

**확인 방법:**
```yaml
tts:
  enabled: false  # 비활성화 상태
```

**해결책:**
```yaml
tts:
  enabled: true
```

#### 2. 스피커 음량이 0

**확인:**
- Windows: 트레이의 스피커 아이콘 확인
- 볼륨이 0이 아닌지 확인
- 뮤트 상태 해제

**해결책:**
```yaml
tts:
  output_volume: 100  # 1~100
```

#### 3. 기본 스피커 설정 오류

**Windows:**
```
설정 → 시스템 → 소리 → 출력 장치
→ 원하는 스피커 선택
```

**Linux:**
```bash
pactl list sinks
pactl set-default-sink <sink-number>
```

#### 4. TTS API 오류 (Google Cloud TTS)

**확인 방법:**
- [Google Cloud Console](https://console.cloud.google.com)에서 Text-to-Speech API 활성화 확인
- 요금 한도 확인

**해결책:**
1. API 활성화 확인
2. 서비스 계정 키 설정 확인
   ```bash
   echo $GOOGLE_APPLICATION_CREDENTIALS
   ```
3. API 할당량 문제: Google Cloud 콘솔에서 확인

### 테스트 방법

브라우저 콘솔에서:
```javascript
// 테스트 TTS 재생
fetch('/api/tts', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({text: "테스트"})
}).then(r => r.blob()).then(blob => {
  new Audio(URL.createObjectURL(blob)).play()
});
```

---

## Windows pip install 실패

### 증상

```
ERROR: Could not find a version that satisfies the requirement...
```

또는 특정 패키지 설치 실패

### 원인과 해결책

#### 1. Python 버전 호환성

**확인:**
```bash
python --version  # 3.8 이상 필요
```

**해결:**
```bash
# Python 3.9 이상으로 재설치
# https://www.python.org/downloads/
```

#### 2. pip 업데이트 필요

```bash
python -m pip install --upgrade pip
```

#### 3. Windows 빌드 도구 부재

일부 패키지는 C++ 컴파일러 필요:

```
Visual Studio Code → "Desktop development with C++" 설치
또는
https://visualstudio.microsoft.com/downloads/
```

#### 4. 특정 패키지 설치 실패

**예: pyaudio 설치 실패**

```bash
# 대신 다음 사용
pip install pipwin
pipwin install pyaudio
```

**예: numpy/scipy 설치 실패**

```bash
# 미리 빌드된 바이너리 다운로드
pip install numpy --only-binary :all:
```

### 해결 순서

```bash
1. python -m pip install --upgrade pip
2. python -m pip install --upgrade setuptools wheel
3. python -m pip install -r requirements.txt
```

---

## Chzzk (치즈스팅) 연결 끊어짐

### 증상

- 채팅이 안 들어옴
- 후원 메시지 감지 안 됨
- "Chzzk disconnected" 메시지

### 원인별 해결책

#### 1. 인증 정보 오류

**확인:**
```bash
# 설정 파일 확인
cat config.json | grep -i chzzk
```

**필요한 정보:**
- Channel ID (채널 ID)
- Auth Token (인증 토큰)
- 또는 Chzzk 계정 정보

**해결:**
1. Chzzk 웹사이트에서 설정 다시 확인
2. 인증 토큰 재발급
3. 설정 파일에 올바른 값 입력:
   ```yaml
   chzzk:
     channel_id: "your_channel_id"
     auth_token: "your_token"  # 민감한 정보, 공유 금지
   ```

#### 2. 네트워크 연결 끊김

**해결:**
1. 인터넷 연결 상태 확인
2. 방화벽에서 포트 차단되지 않았는지 확인
3. VPN 사용 시 비활성화 후 다시 시도

#### 3. Chzzk 서버 문제

**확인:**
- [Chzzk 상태 페이지](https://status.chzzk.naver.com) (또는 Naver 공식 채널)

**해결:**
- 잠시 기다렸다가 다시 연결 시도
- 백엔드 재시작:
  ```bash
  python main.py  # 중단 후 재실행
  ```

#### 4. 토큰 만료

**해결:**
1. 정기적으로 토큰 재발급
2. 또는 자동 갱신 설정 확인

### 재연결 로그 확인

```bash
# Chzzk 연결 관련 로그
grep -i "chzzk" backend/logs/amyayabot.log | tail -20
```

---

## 말풍선 위치 문제

### 증상

- 말풍선이 아바타 뒤에 가려짐
- 위치가 잘못된 곳에 표시됨
- 텍스트가 화면 밖으로 나감

### 원인별 해결책

#### 1. 말풍선 위치 설정 오류

**현재 설정 확인:**
```yaml
bubble:
  position: "right"  # "top", "bottom", "left", "right"
```

**해결:**
상황에 맞게 위치 변경:
- 우측에 공간 없음 → `"left"`로 변경
- 하단에 공간 없음 → `"top"`으로 변경

#### 2. OBS 레이어 순서 문제

**해결:**
1. OBS의 소스 패널에서
2. "메인 오버레이" 소스를 맨 앞으로 이동

#### 3. 말풍선 최대 너비 초과

**설정 확인:**
```yaml
bubble:
  max_width: 400  # 픽셀 단위
```

**해결:**
- 너비 조정:
  ```yaml
  bubble:
    max_width: 350  # 더 좁게 설정
  ```
- 또는 말풍선 비활성화:
  ```yaml
  bubble:
    enabled: false
  ```

---

## 호명 감지가 안 됨

### 증상

- "에이미야"라고 해도 대화 모드 시작 안 됨
- 하지만 다른 명령(투표 등)은 작동함

### 원인별 해결책

#### 1. 호명 감지 비활성화됨

**확인:**
```yaml
namecall:
  enabled: false
```

**해결:**
```yaml
namecall:
  enabled: true
```

#### 2. STT가 텍스트를 잘못 변환

**예:**
- 당신: "에이미야!"
- STT: "에미야" (잘못된 인식)

**해결:**
1. 더 명확하게 발음하기
2. 마이크 위치 조정 (더 가까이)
3. 배경 소음 감소

#### 3. 호명 트리거 키워드 설정 오류

**확인:**
```yaml
namecall:
  trigger_names: []  # 추가 호명 단어
```

**설정에서 캐릭터 이름 확인:**
```yaml
persona:
  character:
    name: "에이미"  # 이 이름으로 자동 감지
```

**해결:**
- 캐릭터 이름이 올바른지 확인
- 이름 뒤에 "야", "아" 자동 추가됨 확인

#### 4. 최소 응답 간격 때문에

**증상:**
- 방금 호명했는데 다시 호명해도 안 됨

**원인:**
```yaml
namecall:
  min_response_gap: 3  # 3초 최소 간격
```

**해결:**
- 3초 이상 기다렸다가 호명하기
- 또는 설정 줄이기 (1초로):
  ```yaml
  namecall:
    min_response_gap: 1
  ```

#### 5. TTS 재생 중이어서

에이미가 말하는 중에는 호명 감지가 안 됩니다 (오감지 방지).

**해결:**
- TTS가 끝날 때까지 기다렸다가 호명하기

---

## 상호작용 (투표/추첨)이 안 됨

### 증상

- 음성으로 "투표 시작"이라고 해도 반응 없음
- 채팅 명령 (!투표, !참여 등)이 안 됨

### 원인별 해결책

#### 1. 대화 모드가 아닌 상태에서 음성 명령

**증상:**
```
당신: "투표를 시작해줄래?" (호명 없이)
→ 반응 없음
```

**해결:**
반드시 호명 후에 사용:
```
당신: "에이미야, 투표를 시작해줄래?"
→ 작동함
```

#### 2. 채팅 명령 비활성화됨

**확인:**
```yaml
chat_commands:
  enabled: false
```

**해결:**
```yaml
chat_commands:
  enabled: true
```

#### 3. 이미 다른 상호작용이 실행 중

**증상:**
```
진행 중: 투표
당신: "추첨도 할래?"
에이미: "투표가 진행 중입니다"
```

**해결:**
- 진행 중인 기능 완료하기
- 또는 수동으로 종료:
  ```
  당신: "투표를 종료해줄래?"
  ```

#### 4. 스킬 키워드 미인식

**예:**
```
당신: "투표를 한 번 해봐"
→ AI가 키워드를 못 찾으면 반응 안 함
```

**해결:**
명확한 키워드 사용:
```
당신: "에이미야, 투표를 시작할래?"
→ "투표" 키워드 명확
```

#### 5. 채팅 시스템 연결 오류

**확인:**
```bash
# Chzzk 채팅 연결 상태 확인
grep -i "chat" backend/logs/amyayabot.log | tail -10
```

**해결:**
- Chzzk 연결 확인 (위 섹션 참조)
- 백엔드 재시작

---

## 포트 충돌

### 증상

```
ERROR: Address already in use
포트 3000을 사용할 수 없음
포트 18300을 사용할 수 없음
```

### 원인별 해결책

#### 1. 같은 프로세스가 이미 실행 중

**확인 (Windows):**
```bash
netstat -ano | findstr :3000
```

**확인 (Mac/Linux):**
```bash
lsof -i :3000
```

**해결:**
```bash
# 프로세스 종료 (Windows)
taskkill /PID <PID> /F

# 또는
# 기존 실행 중인 AmyayaBot 모두 종료
```

#### 2. 다른 애플리케이션이 포트 사용 중

**해결:**
1. 다른 애플리케이션 종료
2. 또는 포트 번호 변경:
   ```yaml
   server:
     port: 3001       # 3000 대신 3001 사용
   websocket:
     port: 18301      # 18300 대신 18301 사용
   ```
   그 후 OBS 오버레이 URL도 변경:
   ```
   http://localhost:3001/overlay
   ```

### 포트 변경 후 재설정

1. 설정 파일 수정
2. OBS 브라우저 소스 URL 업데이트
3. 모든 프로세스 재시작

---

## 일반적인 지식

### 로그 파일 위치

```
백엔드: backend/logs/amyayabot.log
프론트엔드: 브라우저 개발자 도구 콘솔
```

### 백엔드 재시작

```bash
# 터미널에서 Ctrl+C로 중단
# 그 후 다시 시작
python main.py
```

### 프론트엔드 재시작

```bash
# frontend 디렉토리에서
npm run dev

# 또는 개발 중 자동 재로드 활성화
# 브라우저에서 F5 새로고침
```

### 설정 파일 구조

```yaml
config.yml 또는 config.json
├── stt (음성 인식)
├── tts (음성 출력)
├── namecall (호명 감지)
├── conversation (대화 모드)
├── chzzk (채팅 플랫폼)
└── ... (기타 설정)
```

---

## 여전히 문제 해결이 안 되면?

1. **로그 파일 확인:**
   ```bash
   tail -100 backend/logs/amyayabot.log
   ```

2. **브라우저 콘솔 확인:**
   - F12 개발자 도구 → 콘솔 탭
   - 오류 메시지 캡처

3. **설정 파일 검증:**
   - YAML 문법 확인
   - 필수 항목 확인

4. **백엔드/프론트엔드 최신 버전 확인:**
   ```bash
   git pull origin main
   ```

