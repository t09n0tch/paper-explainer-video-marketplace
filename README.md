# paper-explainer-video

논문(PDF·arXiv 링크·텍스트)을 3–5분짜리 내레이션 설명 영상(MP4 + 자막)으로 만드는 Claude 스킬입니다.

## 설치

Claude Code에서:

```
/plugin marketplace add t09n0tch/paper-explainer-video-marketplace
/plugin install paper-explainer-video@paper-explainer
```

업데이트는 `/plugin marketplace update paper-explainer`.

## 사용법

> **👤 사용자**
>
> ```
> /paper-explainer-video:paper-explainer-video # 스킬
> https://arxiv.org/abs/2607.00272 # 논문 url
> ```

> **🤖 Claude**
>
> 논문을 끝까지 읽고 대본을 썼어요. 두 가지만 골라 주세요.
> - 목소리: SunHi (여성) · InJoon (남성) · …
> - 길이: 초안 그대로 · 조금 줄이기

> **👤 사용자**
>
> SunHi, 그대로

> **🤖 Claude**
>
> 완성했어요. `film.mp4` · `narration.srt` (자막) · `narration.md` (대본)

## 예시: ASPIRE (NVIDIA, 2026)

[ASPIRE: Agentic Skills Discovery for Robotics](https://research.nvidia.com/labs/gear/aspire/assets/aspire.pdf)

https://github.com/user-attachments/assets/c3926738-7376-4dc4-a5e2-92bd735e5d04

[고화질 다운로드 (1080p, 22.6 MB)](https://github.com/t09n0tch/paper-explainer-video-marketplace/releases/download/examples/aspire-film.mp4) · [대본](examples/aspire/narration.md) · [자막](examples/aspire/narration.srt)

## 필요한 것

| 도구 | 설치 |
|---|---|
| ffmpeg | macOS `brew install ffmpeg` · Windows `winget install ffmpeg` · Linux `apt-get install ffmpeg` |
| Playwright + Chromium | `pip install playwright && python -m playwright install chromium` |
| edge-tts (기본 음성) | `pip install edge-tts` (인터넷 필요) |


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
