/* cards.js — the text scenes every episode has, as one call each.
 *
 *   CARD('recap', { tag, title, tex, texSize, texCap, texAt, lines: [[cap, at, html], ...], next: {title, sub, src}, credit, badge, src })
 *   GOALS('goals', { items: [[cap, at, text], ...], src })
 *   QUIZ('quiz', { html, badge })            // set "hold": 5 on the scene in script.json for the countdown
 *
 * `cap`/`at` time each element from a sentence start, so re-voicing keeps them in step.
 * html may contain <span class="tex">…</span> (escape backslashes: '\\theta').
 */
(function () {
  const ground = (k) => k.stage.append(k.h('<div class="ground"><div class="grid"></div></div>'));
  const T = (k, cap, at) => k.caps[Math.min(cap, k.caps.length - 1)].t0 + (at || 0);
  const tag = (k, html, css) => { const e = k.h('<div style="position:absolute;' + css + '"></div>'); e.innerHTML = html; k.stage.append(e); return e; };

  window.CARD = function (id, o) {
    SCENE(id, {
      init(k) {
        ground(k);
        this.head = tag(k, '<div class="words" style="position:static"><p class="tag"></p><p class="line"></p></div>', 'left:160px;top:150px;width:1600px');
        this.head.querySelector('.tag').textContent = o.tag || '';
        this.head.querySelector('.line').textContent = o.title || '';
        this.eq = o.tex ? tag(k, '<span class="tex"></span>', 'left:160px;top:390px;font-size:' + (o.texSize || 58) + 'px') : null;
        if (this.eq) this.eq.firstChild.textContent = o.tex;
        this.lines = (o.lines || []).map((l, i) => tag(k, '<p class="sub" style="margin:0">' + l[2] + '</p>', 'left:160px;width:1040px;top:' + ((o.tex ? 540 : 420) + i * 84) + 'px'));
        this.next = o.next ? tag(k, '<div class="card" style="position:static;width:520px"><p class="tag" style="margin:0 0 14px">' + (o.next.tag || '다음 편') + '</p><h4 style="font-size:40px">' + o.next.title + '</h4><p class="small" style="margin:0">' + (o.next.sub || '') + '</p><p class="src" style="margin:18px 0 0">' + (o.next.src || '') + '</p></div>', 'left:1260px;top:' + (o.tex ? 560 : 400) + 'px') : null;
        this.credit = o.credit ? tag(k, '<p class="src" style="margin:0">' + o.credit + '</p>', 'left:160px;top:940px') : null;
        this.badge = o.badge ? tag(k, '<div class="extra" style="position:static">' + o.badge + '</div>', 'right:120px;top:44px') : null;
        this.src = o.src ? tag(k, '<div class="slsrc" style="position:static">' + o.src + '</div>', 'right:120px;top:54px') : null;
      },
      render(t, k) {
        PARTS.rise(k, this.head, t, 0.2);
        if (this.eq) PARTS.wipe(this.eq, k.eio(k.seg(t, T(k, o.texCap || 0, o.texAt == null ? 0.4 : o.texAt), T(k, o.texCap || 0, (o.texAt == null ? 0.4 : o.texAt) + 1.4))));
        this.lines.forEach((e, i) => PARTS.rise(k, e, t, T(k, o.lines[i][0], o.lines[i][1])));
        if (this.next) PARTS.rise(k, this.next, t, T(k, o.next.cap == null ? k.caps.length - 1 : o.next.cap, o.next.at == null ? 0.6 : o.next.at));
        if (this.credit) PARTS.rise(k, this.credit, t, T(k, k.caps.length - 1, 1.4));
        [this.badge, this.src].forEach((e) => { if (e) e.style.opacity = k.eo(k.seg(t, 0.5, 1.0)); });
      },
    });
  };

  window.GOALS = function (id, o) {
    SCENE(id, {
      init(k) {
        ground(k);
        this.head = tag(k, '<div class="words" style="position:static"><p class="tag">이 영상의 목표</p><p class="line">끝나면 할 수 있는 세 가지</p></div>', 'left:240px;top:250px;width:1500px');
        this.items = o.items.map((it, i) => {
          const e = tag(k, '<div style="display:flex;align-items:center;gap:28px"><span class="num" style="width:64px;height:64px;border-radius:50%;background:var(--accent);color:var(--ground);display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:700">' + (i + 1) + '</span><span class="sub" style="font-size:44px;color:var(--second)"></span></div>', 'left:240px;top:' + (520 + i * 110) + 'px');
          e.querySelector('.sub').textContent = it[2]; return e;
        });
        this.src = o.src ? tag(k, '<div class="slsrc" style="position:static">' + o.src + '</div>', 'right:120px;top:54px') : null;
      },
      render(t, k) {
        PARTS.rise(k, this.head, t, T(k, 0, 0.2));
        this.items.forEach((e, i) => PARTS.rise(k, e, t, T(k, o.items[i][0], o.items[i][1])));
        if (this.src) this.src.style.opacity = k.eo(k.seg(t, 0.4, 0.9));
      },
    });
  };

  window.QUIZ = function (id, o) {
    SCENE(id, {
      init(k) {
        ground(k);
        this.tag = tag(k, '<div class="words" style="position:static;align-items:center"><p class="tag">확인 문제</p><p class="sub">잠깐 멈추고 생각해 보세요</p></div>', 'left:0;right:0;top:230px');
        this.q = tag(k, '<p class="line" style="margin:0;text-align:center;line-height:1.5;font-size:' + (o.size || 64) + 'px">' + o.html + '</p>', 'left:200px;right:200px;top:400px');
        this.badge = tag(k, '<div class="extra" style="position:static">' + (o.badge || '보충') + '</div>', 'right:120px;top:44px');
        this.ring = k.h('<svg class="art" viewBox="0 0 1920 1080"><circle cx="960" cy="820" r="70" fill="none" stroke="#EDE8E0" stroke-opacity=".15" stroke-width="10"/><circle cx="960" cy="820" r="70" fill="none" stroke="#5CC8C2" stroke-width="10" pathLength="1" stroke-dasharray="1" transform="rotate(-90 960 820)" stroke-linecap="round"/></svg>');
        this.n = k.h('<div class="num" style="position:absolute;left:910px;top:788px;width:100px;text-align:center;font-size:56px;font-weight:700"></div>');
        k.stage.append(this.ring, this.n);
      },
      render(t, k) {
        const c = k.caps;
        PARTS.rise(k, this.tag, t, c[0].t0 + 0.1);
        PARTS.rise(k, this.q, t, c[c.length - 1].t0 + 0.3);
        this.badge.style.opacity = k.eo(k.seg(t, 0.4, 0.9));
        const a = c[c.length - 1].t1 + 0.1, b = k.dur - 0.3, on = k.eo(k.seg(t, a - 0.4, a));
        this.ring.style.opacity = on; this.n.style.opacity = on;
        this.ring.lastChild.setAttribute('stroke-dashoffset', k.seg(t, a, b));
        this.n.textContent = String(Math.max(1, Math.min(5, Math.ceil(b - t))));
      },
    });
  };
})();
