# paper-explainer-video

논문(PDF·arXiv 링크·텍스트)을 3–5분짜리 내레이션 설명 영상(MP4 + 자막)으로 만드는 Claude 스킬입니다.

## 설치

Claude Code에서:

```
/plugin marketplace add t09n0tch/paper-explainer-video-marketplace
/plugin install paper-explainer-video@paper-explainer
```

저장소: https://github.com/t09n0tch/paper-explainer-video-marketplace

설치 후 "이 논문 영상으로 만들어줘"라고 하면 됩니다. 업데이트는 `/plugin marketplace update paper-explainer`.

## 필요한 것

| 도구 | 설치 |
|---|---|
| ffmpeg | macOS `brew install ffmpeg` · Windows `winget install ffmpeg` · Linux `apt-get install ffmpeg` |
| Playwright + Chromium | `pip install playwright && python -m playwright install chromium` |
| edge-tts (기본 음성) | `pip install edge-tts` (인터넷 필요) |

없는 것은 Claude가 작업 중에 설치를 안내합니다.

## 기본값과 변경

| | 기본값 |
|---|---|
| 음성 | Microsoft 신경망 음성 `ko-KR-SunHiNeural` (edge-tts). 못 쓰면 이 컴퓨터의 다른 음성으로 자동 대체 |
| 영상 | H.264 (libx264), CRF 18, preset medium, 1920×1080 30fps |
| 오디오 | AAC 192 kbps |

바꾸고 싶으면 Claude에게 말하면 됩니다.

- "다른 목소리 들려줘" → 이 컴퓨터에서 가능한 음성 샘플을 만들어 고르게 해줍니다.
- "이번 영상만 남자 목소리로" → 그 영상의 `script.json`에만 저장
- "앞으로 계속 Yuna 목소리로", "앞으로 CRF 23으로" → `~/.config/paper-explainer-video/config.json`에 저장되어 이후 모든 영상에 적용
- "기본값으로 되돌려" → 위 파일 삭제

직접 하려면 `skills/paper-explainer-video/scripts/settings.py show | set | reset`.
