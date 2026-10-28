// The signature shot: fire-task bars grow to the frozen-world scores, shrink to the TCM scores
// (a ghost keeps the old length), then the rows re-sort by the new ranking. Table 1, fire.
const FLIP = [   // agent, Base, TCM   (Table 1, Fire)
  ['Claude-3.7-sonnet', 0.77, 0.10], ['MCTS', 0.75, 0.25], ['GPT-5', 0.73, 0.35], ['GPT-4', 0.71, 0.22], ['Claude-4.6-sonnet', 0.71, 0.18],
  ['Gemini-3.5-flash', 0.69, 0.22], ['GPT-3.5', 0.65, 0.44], ['Llama-2-7b-hf', 0.60, 0.05], ['Rule', 0.33, 0.35], ['Greedy', 0.08, 0.11],
];
SCENE('flip', {
  init(k) {
    const L = 360, BW = 1080, RH = 62, TOP = 250;
    let html = '<div class="ground"><div class="grid"></div></div><h3 style="position:absolute;left:140px;top:140px;margin:0;font-size:46px">화재 과제 평균 가치 비율</h3>' +
      '<div class="chip fl-mode" style="left:140px;top:204px"></div>';
    FLIP.forEach((r, i) => {
      html += '<div class="fl-row" style="position:absolute;left:140px;top:' + (TOP + i * RH) + 'px;width:1640px;height:' + RH + 'px">' +
        '<div style="position:absolute;left:0;top:12px;width:' + (L - 24) + 'px;text-align:right;font-size:28px;font-weight:700">' + r[0] + '</div>' +
        '<div class="fl-ghost" style="position:absolute;left:' + L + 'px;top:12px;height:38px;width:' + BW + 'px;border:2px dashed color-mix(in srgb, var(--second) 30%, transparent);border-radius:8px;transform-origin:0 50%;box-sizing:border-box"></div>' +
        '<div class="fl-bar" style="position:absolute;left:' + L + 'px;top:12px;height:38px;width:' + BW + 'px;border-radius:8px;transform-origin:0 50%"></div>' +
        '<div class="num fl-v" style="position:absolute;left:' + L + 'px;top:14px;font-size:28px;font-weight:700"></div>' +
        '<div class="chip fl-1" style="top:6px;font-size:22px;padding:6px 14px;background:var(--accent);color:var(--ground)">1위</div></div>';
    });
    html += '<div class="src" style="position:absolute;right:140px;top:890px">Table 1 · Fire · Base / TCM</div>';
    k.stage.append(k.h('<div>' + html + '</div>'));
    const q = (s) => [...k.stage.querySelectorAll(s)];
    Object.assign(this, { L, BW, RH, TOP, row: q('.fl-row'), bar: q('.fl-bar'), ghost: q('.fl-ghost'), v: q('.fl-v'), one: q('.fl-1'), mode: k.q('.fl-mode') });
    const rank = FLIP.map((r, i) => i).sort((a, b) => FLIP[b][2] - FLIP[a][2]);
    this.pos = []; rank.forEach((ri, p) => { this.pos[ri] = p; });
  },
  render(t, k) {
    const { seg, eo, eio, lerp } = k, c = k.caps;
    const shrink = eio(seg(t, c[2].t0 + 0.2, c[2].t0 + 1.4)), sort = eio(seg(t, c[3].t0 + 0.2, c[3].t0 + 1.2));
    this.mode.textContent = shrink > 0.5 ? 'TCM · 추론 시간만큼 세계가 진행' : '기존 평가 · 세계 정지';
    this.mode.style.background = shrink > 0.5 ? 'var(--main)' : ''; this.mode.style.color = shrink > 0.5 ? 'var(--ground)' : '';
    FLIP.forEach((r, i) => {
      const g = eo(seg(t, 0.6 + i * 0.12, 1.4 + i * 0.12)), w = lerp(r[1], r[2], shrink) * g;
      const hl = i === 0 && t > c[1].t0 + 0.2, fast = i === 6 && sort > 0;
      this.bar[i].style.transform = 'scaleX(' + Math.max(0.0001, w) + ')';
      this.bar[i].style.background = fast ? 'var(--accent)' : hl ? 'var(--main)' : 'color-mix(in srgb, var(--second) 40%, var(--ground))';
      this.ghost[i].style.transform = 'scaleX(' + Math.max(0.0001, r[1]) + ')'; this.ghost[i].style.opacity = shrink;
      this.v[i].textContent = (shrink > 0.5 ? r[2] : r[1]).toFixed(2);
      this.v[i].style.opacity = eo(seg(t, 1.2 + i * 0.12, 1.5 + i * 0.12)) * (1 - Math.sin(Math.PI * shrink) * 0.9);
      this.v[i].style.transform = 'translateX(' + (w * this.BW + 16) + 'px)';
      this.one[i].style.left = (this.L + w * this.BW + 110) + 'px';
      this.one[i].style.opacity = i === 0 ? eo(seg(t, c[1].t0 + 0.3, c[1].t0 + 0.6)) * (1 - shrink) : i === 6 ? eo(seg(t, c[3].t0 + 1.2, c[3].t0 + 1.5)) : 0;
      this.row[i].style.top = lerp(this.TOP + i * this.RH, this.TOP + this.pos[i] * this.RH, sort) + 'px';
    });
  },
});
