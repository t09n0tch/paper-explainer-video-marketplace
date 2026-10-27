# pdf2video

PDF를 TTS 내레이션 설명 영상(MP4 + 자막)으로 만드는 Claude 스킬 모음입니다.

[![논문 → 영상 · paper2video](https://img.shields.io/badge/%EB%85%BC%EB%AC%B8_%E2%86%92_%EC%98%81%EC%83%81-paper2video-0969da?style=for-the-badge)](#paper2video)&nbsp;
[![강의자료 → 영상 · lecture2video](https://img.shields.io/badge/%EA%B0%95%EC%9D%98%EC%9E%90%EB%A3%8C_%E2%86%92_%EC%98%81%EC%83%81-lecture2video-1a7f37?style=for-the-badge)](#lecture2video)

| 플러그인 | 입력 | 결과 |
|---|---|---|
| [`paper2video`](#paper2video) | 논문 한 편 (PDF · arXiv 링크 · 텍스트) | 3–5분 모션그래픽 설명 영상 |
| [`lecture2video`](#lecture2video) | 강의 슬라이드 PDF | 실제 슬라이드 위 5–8분 복습 영상 여러 편 (하나로 합치기 가능) |

## 설치

Claude Code에서 마켓플레이스를 추가하고, 필요한 스킬을 설치하세요.

```
/plugin marketplace add t09n0tch/pdf2video
/plugin install paper2video@pdf2video
/plugin install lecture2video@pdf2video
```

업데이트

```
/plugin marketplace update pdf2video
```

---

# paper2video

논문(PDF·arXiv 링크·텍스트)을 3–5분짜리 내레이션 설명 영상(MP4 + 자막)으로 만드는 스킬입니다.

## 사용법

> **👤 사용자**
>
> ```
> /paper2video:paper2video # 스킬
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
Model : Opus 5.5 medium

[ASPIRE: Agentic Skills Discovery for Robotics](https://research.nvidia.com/labs/gear/aspire/assets/aspire.pdf)

https://github.com/user-attachments/assets/c3926738-7376-4dc4-a5e2-92bd735e5d04

[고화질 다운로드 (1080p, 22.6 MB)](https://github.com/t09n0tch/pdf2video/releases/download/examples/aspire-film.mp4) · [대본](examples/aspire/narration.md) · [자막](examples/aspire/narration.srt)

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
- "앞으로 계속 Yuna 목소리로", "앞으로 CRF 23으로" → `~/.config/paper2video/config.json`에 저장되어 이후 모든 영상에 적용
- "기본값으로 되돌려" → 위 파일 삭제

직접 하려면 `skills/paper2video/scripts/settings.py show | set | reset`.

[↑ 맨 위로](#pdf2video)

---

# lecture2video

강의 슬라이드 PDF를 섹션별 5–8분 복습 영상으로 만드는 Claude 스킬입니다. 슬라이드 위에 그림을 새로 그리는 대신 **교수님 슬라이드를 그대로 띄우고**, 내레이션이 말하는 줄에 형광펜·밑줄·동그라미를 맞춰 짚어 줘요. 슬라이드에 빠져 있는 "왜"는 음성이 채우고, 가장 어려운 개념만 애니메이션으로 다시 그려요.

## 사용법

> **👤 사용자**
>
> ```
> /lecture2video:lecture2video
> ~/Downloads/vae.pdf 영상으로 만들어줘
> ```

> **🤖 Claude**
>
> 30장을 다섯 편으로 나눴어요. 1편(슬라이드 3–7, 오토인코더) 내레이션 초안이에요. 이대로 진행할까요?

> **👤 사용자**
>
> 좋아, 전체 끝까지 만들어서 하나의 영상으로 만들어줘

> **🤖 Claude**
>
> 완성했어요. `lecture.mp4` (17분, 챕터 37개) · `lecture.srt` (자막) · `lecture-chapters.txt` (유튜브 타임스탬프)

## 한 편의 구성

| 장면 | 방식 |
|---|---|
| 지난 편 복습 · 학습 목표 | 카드 |
| 슬라이드 설명 (대부분) | 실제 슬라이드 위에서 문장마다 한 곳을 강조. 장면 코드 없이 데이터 몇 줄로 만들어져요 |
| 핵심 개념 1–2개 | 다시 그린 애니메이션 (예: 재매개화 트릭에서 ε은 고정, μ·σ가 움직이면 z가 따라 움직임) |
| 확인 문제 | 5초 카운트다운 후 정답 장면 |
| 정리 · 다음 편 예고 | 카드 |

- 슬라이드에 없는 설명·예시·문제에는 화면에 **보충** 표시가 붙어요.
- 수식은 슬라이드 표기 그대로 KaTeX로 조판해요.
- 자막은 기본적으로 화면에 새기지 않고 **소프트 자막**(MP4 자막 트랙 + `.srt`)으로 넣어요. 화면에 새기려면 "자막을 화면에 넣어줘"라고 하면 돼요.
- 여러 편은 `join.py`로 자막과 챕터("2편 · ① 밀도 추정")까지 함께 이어 붙여요.

## 필요한 것

| 도구 | 설치 |
|---|---|
| PyMuPDF | `pip install pymupdf` |
| ffmpeg | macOS `brew install ffmpeg` · Windows `winget install ffmpeg` · Linux `apt-get install ffmpeg` |
| Playwright + Chromium | `pip install playwright && python -m playwright install chromium` |
| edge-tts (기본 음성) | `pip install edge-tts` (인터넷 필요) |

음성과 인코딩 기본값, 바꾸는 방법은 위의 논문 스킬과 같아요. 사용자 설정만 `~/.config/lecture2video/config.json`에 따로 저장돼요.

## 주의

만든 영상에는 강의 슬라이드와 그 안의 교재 그림이 그대로 들어가요. 개인 복습용이 아니라면 공개 업로드 전에 강의자의 허락을 받으세요.

[↑ 맨 위로](#pdf2video)
