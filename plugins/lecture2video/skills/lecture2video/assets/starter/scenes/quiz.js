SCENE('quiz', {
  init(k) {
    k.stage.append(k.h('<div class="ground"><div class="grid"></div></div>'));
    this.tag = k.h('<div class="words" style="left:0;right:0;top:250px;align-items:center"><p class="tag">확인 문제</p><p class="sub">잠깐 멈추고 생각해 보세요</p></div>');
    this.q = k.h('<p class="line" style="position:absolute;left:260px;right:260px;top:420px;margin:0;text-align:center">잠재 차원을 <span class="tex">M = D</span>로 두면,<br>오토인코더는 무엇을 배울까요?</p>');
    this.badge = k.h('<div class="extra" style="right:120px;top:44px">보충</div>');
    this.ring = k.h('<svg class="art" viewBox="0 0 1920 1080"><circle cx="960" cy="800" r="70" fill="none" stroke="#EDE8E0" stroke-opacity=".15" stroke-width="10"/><circle cx="960" cy="800" r="70" fill="none" stroke="#5CC8C2" stroke-width="10" pathLength="1" stroke-dasharray="1" transform="rotate(-90 960 800)" stroke-linecap="round"/></svg>');
    this.n = k.h('<div class="num" style="position:absolute;left:910px;top:768px;width:100px;text-align:center;font-size:56px;font-weight:700"></div>');
    k.stage.append(this.tag, this.q, this.badge, this.ring, this.n);
  },
  render(t, k) {
    const { seg, eo } = k, c = k.caps;
    PARTS.rise(k, this.tag, t, c[0].t0 + 0.1);
    PARTS.rise(k, this.q, t, c[1].t0 + 0.3);
    this.badge.style.opacity = eo(seg(t, 0.4, 0.9));
    const a = c[1].t1 + 0.1, b = k.dur - 0.3, left = Math.max(0, b - t);
    const on = eo(seg(t, a - 0.4, a));
    this.ring.style.opacity = on; this.n.style.opacity = on;
    this.ring.lastChild.setAttribute('stroke-dashoffset', seg(t, a, b));
    this.n.textContent = String(Math.min(5, Math.ceil(left)));
  },
});
