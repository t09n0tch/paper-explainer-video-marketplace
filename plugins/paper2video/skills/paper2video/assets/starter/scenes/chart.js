// A chart scene: a headline enters word by word, two bars grow, a source line names the table.
const CH = [['기존 평가', 0.77, 'var(--second)'], ['지연 반영', 0.10, 'var(--main)']];
SCENE('chart', {
  init(k) {
    let rows = '';
    CH.forEach((r, i) => {
      rows += '<div style="position:absolute;left:140px;top:' + (420 + i * 110) + 'px;width:1600px;height:70px">' +
        '<div style="position:absolute;left:0;top:14px;font-size:32px;font-weight:700">' + r[0] + '</div>' +
        '<div class="chart-b' + i + '" style="position:absolute;left:260px;top:10px;height:50px;width:1300px;border-radius:10px;background:' + r[2] + ';transform-origin:0 50%"></div>' +
        '<div class="num chart-v' + i + '" style="position:absolute;left:260px;top:12px;font-size:36px;font-weight:700"></div></div>';
    });
    k.stage.append(k.h('<div class="ground"><div class="words" style="left:140px;top:170px"><h2 class="line">순위가 뒤집힌다</h2></div>' + rows +
      '<div class="src" style="position:absolute;right:84px;top:680px">예시 값 · 실제 영상에서는 논문 표 번호를 적는다</div></div>'));
    this.l = k.q('.line'); this.b = [k.q('.chart-b0'), k.q('.chart-b1')]; this.v = [k.q('.chart-v0'), k.q('.chart-v1')];
  },
  render(t, k) {
    k.fadeWords(this.l, t, 0.2);
    CH.forEach((r, i) => {
      const g = k.eo(k.seg(t, 0.8 + i * 0.4, 1.8 + i * 0.4)), v = r[1] * g;
      this.b[i].style.transform = 'scaleX(' + v + ')';
      this.v[i].textContent = v.toFixed(2);
      this.v[i].style.transform = 'translateX(' + (v * 1300 + 20) + 'px)';
    });
  },
});
