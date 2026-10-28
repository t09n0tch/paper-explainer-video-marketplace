// Response latency vs value rate under TCM (Table 2), points appearing in latency order; sentence 2
// adds each slow model's frozen-world average (Table 1, mean of the three tasks) above it with a drop line.
const PTS = [   // agent, RL (s), TCM value rate (Table 2), Base average (Table 1, mean of Fire/Flood/Wind) or null
  ['Rule', 0.00, 0.19, null], ['Greedy', 0.14, 0.07, null], ['GPT-3.5', 2.54, 0.25, 0.37], ['GPT-5', 4.00, 0.21, 0.48], ['MCTS', 4.30, 0.14, null],
  ['GPT-4', 5.46, 0.16, 0.45], ['Gemini-3.5-flash', 5.94, 0.13, null], ['Claude-4.6-sonnet', 9.83, 0.11, null], ['Claude-3.7-sonnet', 13.05, 0.07, 0.49], ['Llama-2-7b-hf', 14.36, 0.03, null],
];
SCENE('curve', {
  init(k) {
    const X0 = 300, Y0 = 820, WD = 1300, HD = 560, fx = (x) => X0 + x / 15 * WD, fy = (y) => Y0 - y / 0.5 * HD;
    let svg = '<svg class="art" viewBox="0 0 1920 1080"><line x1="' + X0 + '" y1="' + Y0 + '" x2="' + (X0 + WD) + '" y2="' + Y0 + '" stroke="currentColor" stroke-opacity=".3" stroke-width="2"/>' +
      '<line x1="' + X0 + '" y1="' + Y0 + '" x2="' + X0 + '" y2="' + (Y0 - HD) + '" stroke="currentColor" stroke-opacity=".3" stroke-width="2"/>';
    let html = '';
    PTS.forEach((p, i) => {
      svg += '<circle class="cv-p" cx="' + fx(p[1]) + '" cy="' + fy(p[2]) + '" r="13" fill="var(--second)"/>';
      if (p[3] != null) svg += '<line class="cv-d" x1="' + fx(p[1]) + '" y1="' + fy(p[3]) + '" x2="' + fx(p[1]) + '" y2="' + fy(p[2]) + '" stroke="var(--main)" stroke-width="3" stroke-dasharray="8 8"/>' +
        '<circle class="cv-b" cx="' + fx(p[1]) + '" cy="' + fy(p[3]) + '" r="13" fill="none" stroke="var(--main)" stroke-width="3"/>';
      const dy = { MCTS: 8, 'GPT-4': -44, 'Gemini-3.5-flash': 10, Greedy: 4 }[p[0]];   // hand-placed where points crowd
      html += '<div class="small cv-l" style="position:absolute;left:' + (fx(p[1]) + 20) + 'px;top:' + (fy(p[2]) + (dy != null ? dy : i % 2 ? -4 : -40)) + 'px;white-space:nowrap">' + p[0] + '</div>';
    });
    svg += '</svg>';
    [0, 5, 10, 15].forEach((x) => { html += '<div class="small num" style="position:absolute;left:' + (fx(x) - 40) + 'px;top:' + (Y0 + 12) + 'px;width:80px;text-align:center">' + x + '</div>'; });
    [0, 0.25, 0.5].forEach((y) => { html += '<div class="small num" style="position:absolute;left:' + (X0 - 100) + 'px;top:' + (fy(y) - 18) + 'px;width:84px;text-align:right">' + y.toFixed(2) + '</div>'; });
    k.stage.append(k.h('<div><div class="ground"><div class="grid"></div></div><h3 style="position:absolute;left:140px;top:140px;margin:0;font-size:46px">응답 지연 vs 가치 비율 (TCM)</h3>' + svg + html +
      '<div class="small" style="position:absolute;left:' + X0 + 'px;top:' + (Y0 + 52) + 'px;width:' + WD + 'px;text-align:center">응답 지연 RL (초)</div>' +
      '<div class="card cv-k" style="right:120px;top:150px;width:430px"><div class="small"><span style="color:var(--second)">●</span> TCM 성적 &nbsp; <span class="hl">○</span> 세계를 멈춘 기존 평가의 평균 (계산값)</div></div>' +
      '<div class="src" style="position:absolute;right:140px;top:900px">Table 2 · 기존 평가 평균 = Table 1 세 과제의 평균</div></div>'));
    const q = (s) => [...k.stage.querySelectorAll(s)];
    Object.assign(this, { p: q('.cv-p'), l: q('.cv-l'), d: q('.cv-d'), b: q('.cv-b'), key: k.q('.cv-k') });
  },
  render(t, k) {
    const { seg, eo } = k, c = k.caps;
    PTS.forEach((p, i) => { const a = eo(seg(t, 0.5 + i * 0.15, 0.8 + i * 0.15)); this.p[i].style.opacity = a; this.l[i].style.opacity = a; });
    this.d.forEach((d, i) => { const a = eo(seg(t, c[1].t0 + 0.3 + i * 0.3, c[1].t0 + 0.7 + i * 0.3)); d.style.opacity = a; this.b[i].style.opacity = a; });
    this.key.style.opacity = eo(seg(t, c[1].t0, c[1].t0 + 0.4));
  },
});
