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

Python 3.10 이상과 디스크 약 1.5 GB만 있으면 돼요. 처음 실행하면 스킬이 `p2v setup`으로 필요한 도구를 전용 venv(`~/.local/share/paper2video/venv`)에 한 번 설치해요. Playwright와 Chromium, 오프라인 음성(Supertonic·Kokoro), pypdf, 그리고 ffmpeg가 없으면 ffmpeg까지 설치해요.

| 선택 사항 | 설치 |
|---|---|
| poppler (논문 표를 가장 깔끔하게 추출) | macOS `brew install poppler` · Linux `apt-get install poppler-utils` |

모든 단계는 명령어 하나 `p2v`로 실행해요. 터미널에서 직접 쓸 수도 있어요.

```bash
python3 skills/paper2video/scripts/p2v.py doctor   # 설치 상태와 사용할 음성
python3 skills/paper2video/scripts/p2v.py smoke    # 전체 도구 체인 점검, ALL PASS로 끝나야 정상
python3 skills/paper2video/scripts/p2v.py test     # 검사기 회귀 테스트
```

## 무엇으로 그리나

- **3D 세계**: three.js(WebGL)로 논문의 무대(방, 도로, 로봇 작업대)를 진짜 3D로 만들고, 장면마다 카메라 각도를 바꿔 다시 찾아가요. 물체 위에는 라벨이 따라 붙어요.
- **템플릿**: 막대·그룹 막대·선 그래프·파이프라인·카드·표·분할 막대·수식·타임라인 레인. 결과와 비교 장면은 영상마다 같은 품질로 나와요.
- **완성 예제**: RRARA 논문(arXiv 2506.07223) 영상 한 편 전체(15장면, claims 69개)를 코드로 담았어요. 스킬이 새 영상을 만들기 전에 이 예제를 보고 따라 해요.

## 팩트 체크

영상에 나오는 숫자와 주장은 모두 논문 원문과 대조해요. 대본 승인 대신 이 검증이 들어가요.

1. **claims.json**: 영상이 말하거나 보여 주는 사실과 숫자마다 논문 원문 인용이나 표의 행을 붙여요. 직접 계산한 값, 해석, 설명용 예시는 화면에 `계산값`, `예시` 같은 표시를 달아야 해요.
2. **기계 검사** (`check_claims.py`): 인용과 표 값이 `paper.txt`에 실제로 있는지, 자막·TTS 문장·**플레이어가 실제로 화면에 그린 모든 글자**(`verify/onscreen.json`) 속 숫자가 전부 출처가 있는지 확인해요. FAIL 0, WARN 0이어야 다음 단계로 가요.
3. **독립 검증**: 대본을 쓰지 않은 새 subagent가 조건·단서(벤치마크, 비교 대상, 하드웨어), 흐름, 화면, 라이선스를 검토해 `VERIFY.md`를 써요. PASS가 나와야 최종 렌더링해요. 3번 고쳐도 통과하지 못하면 멈추고 남은 문제를 알려 줘요.

검증 방식, 3D 기본 요소, 템플릿 구성, 오프라인 음성, `p2v` 도구 체인은 [SunandBean/paper2video](https://github.com/SunandBean/paper2video) (MIT, Sunbin Kim)를 참고해 한국어 내레이션과 이 스킬의 장면 구조에 맞게 다시 만들었어요. three.js(MIT)를 함께 배포해요.


## 기본값과 변경

### 기본값

| 항목 | 기본값 |
|---|---|
| 음성 | 오프라인 신경망 음성: 한국어와 그 밖의 언어는 Supertonic 3 `F1`, 영어는 Kokoro `af_heart` (인터넷 불필요, 매번 같은 결과) · 못 쓰면 edge-tts SunHi, 그다음 이 컴퓨터의 다른 음성으로 자동 대체 |
| 영상 | H.264 (libx264) · CRF 18 · preset medium · 1920×1080 · 30fps |
| 오디오 | AAC · 192 kbps |

### 변경 방법

Claude에게 말로 하면 됩니다.

| 하고 싶은 것 | 이렇게 말하기 | 적용 범위 | 저장 위치 |
|---|---|---|---|
| 목소리 들어 보고 고르기<br>(이 컴퓨터에서 쓸 수 있는 음성 샘플을 만들어 줌) | "다른 목소리 들려줘" | 고른 뒤 정함 | — |
| 이번 영상만 바꾸기 | "이번 영상만 남자 목소리로" | 이 영상만 | 그 영상의 `script.json` |
| 앞으로 계속 바꾸기 | "앞으로 계속 Yuna 목소리로", "앞으로 CRF 23으로" | 이후 모든 영상 | `~/.config/paper2video/config.json` |
| 기본값으로 되돌리기 | "기본값으로 되돌려" | 이후 모든 영상 | 위 파일 삭제 |

터미널에서 직접 하려면 `skills/paper2video/scripts/settings.py show | set | reset`.

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
> 30장을 다섯 편으로 나눠 차례로 만들게요. 1편(슬라이드 3–7, 오토인코더)부터 시작해요.
>
> 1편 완료 · 3:16 · 검증 PASS, 2편 시작
>
> …
>
> 다섯 편을 모두 만들고 하나로 이었어요. `lecture.mp4` · `lecture.srt` (자막) · `lecture-chapters.txt` (유튜브 타임스탬프) · 편별 `film.mp4`
>
> | 편 | 슬라이드 | 길이 | 검증 | 보충 |
> |---|---|---|---|---|
> | 1 | 3–7 | 3:16 | PASS | 784 예시, M = D 확인 문제 |
> | … | | | | |

중간에 확인을 묻지 않고 끝까지 만들어요. 편마다 독립 검증이 확인을 대신해요. 한 편만 원하면 "1편만", "슬라이드 9–15만"처럼 말하면 돼요.

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

## 예시: 오토인코더와 VAE (머신러닝 강의, 슬라이드 30장)
Model : Opus 5.5

Beamer 강의자료 PDF 하나로 만든 다섯 편(차원 축소 → 밀도 추정 → ELBO → 학습과 생성 → 정리)을 하나로 이은 17분 영상이에요. 아래 미리보기는 용량 때문에 540p 저화질이에요.

https://github.com/user-attachments/assets/8663691e-55b5-4586-b6be-d2ad302056c4

[고화질 다운로드 (1080p, 122.8 MB)](https://github.com/t09n0tch/pdf2video/releases/download/examples/vae-lecture-film.mp4) · [대본](examples/vae-lecture/narration.md) · [자막](examples/vae-lecture/narration.srt) · [챕터](examples/vae-lecture/chapters.txt)

## 필요한 것

Python 3.10 이상만 있으면 돼요. 처음 실행하면 스킬이 `l2v setup`으로 도구를 한 번 설치해요. Playwright와 Chromium, PyMuPDF, 오프라인 음성, ffmpeg(없을 때)를 설치하고, paper2video와 같은 venv와 음성 모델을 함께 써요. paper2video를 이미 설치했다면 PyMuPDF만 추가돼요.

```bash
python3 skills/lecture2video/scripts/l2v.py doctor   # 설치 상태와 사용할 음성
python3 skills/lecture2video/scripts/l2v.py smoke    # 전체 도구 체인 점검, ALL PASS로 끝나야 정상
```

## 슬라이드 충실도 검사

영상에 나오는 내용은 모두 교수님 슬라이드와 대조해요.

1. **claims.json**: 영상이 말하거나 보여 주는 사실·숫자·수식마다 슬라이드 쪽 번호와 그 쪽의 원문을 붙여요. 슬라이드에 없는 설명, 확인 문제, 직관, 교재 내용은 **보충**으로 표시하고 이유나 출처를 적어요.
2. **기계 검사** (`l2v check`): 다음을 확인해요. FAIL 0, WARN 0이어야 다음 단계로 가요.
   - 인용이 그 쪽에 실제로 있는지
   - 자막, TTS 문장, 화면 글자 속 숫자가 모두 출처가 있는지
   - 보충·계산값·예시 표시가 화면에 떴는지
   - **형광펜과 동그라미가 실제 슬라이드 줄이나 그림 위에 떨어지는지**
   - 화면에 나온 수식 목록은 검증 에이전트가 슬라이드와 비교할 수 있게 따로 정리해요.
3. **독립 검증**: 영상을 만들지 않은 새 subagent가 슬라이드 표기, 보충의 정확성, 확인 문제의 답, 흐름, 화면을 검토해 `VERIFY.md`를 써요. PASS가 나와야 최종 렌더링해요.

챕터가 바뀔 때마다 이번 편의 챕터 목록이 화면 위쪽에 잠깐 떠서, 지금 강의의 어디쯤인지 먼저 보여 줘요.

음성과 인코딩 기본값, 바꾸는 방법은 [위의 논문 스킬](#기본값과-변경)과 같아요. 사용자 설정만 `~/.config/lecture2video/config.json`에 따로 저장돼요.

## 주의

만든 영상에는 강의 슬라이드와 그 안의 교재 그림이 그대로 들어가요. 개인 복습용이 아니라면 공개 업로드 전에 강의자의 허락을 받으세요.

[↑ 맨 위로](#pdf2video)
