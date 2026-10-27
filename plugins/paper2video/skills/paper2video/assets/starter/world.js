// The paper's setting, shared by every world scene. Metres; x across, y deep.
window.WORLD = {
  w: 16, h: 10,
  walls: [[0, 0, 16, 0.22], [0, 9.78, 6.8, 10], [9.2, 9.78, 16, 10], [0, 0, 0.22, 10], [15.78, 0, 16, 10], [9.9, 0, 10.12, 4], [9.9, 6, 10.12, 10]],
  boxes: [[1, 0.5, 5.4, 1.3, 0.9], [3.4, 4.2, 6.6, 6, 0.75], [11, 0.7, 14.6, 3.3, 0.5]],
  items: { 56: [2.6, 2.8, 5], 57: [13.2, 5, 1], 62: [13.4, 8.4, 5] },
  // hazard field: 0..1 at (x, y) for spread f (0 = start, 1 = late)
  fire(x, y, f) { return Math.max(0, Math.min(1, (0.5 + 3.2 * f - Math.hypot(x - 12.8, y - 1.6)) / 1.2)); },
};
