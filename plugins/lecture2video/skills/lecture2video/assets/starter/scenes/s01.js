// A slide scene: no drawing code, only which box to point at during which sentence.
// Boxes come from slides.json (use "lines" for text, "figures" for diagrams).
SLIDE('s01', { page: 1, steps: [
  { cap: 0, box: [0.10, 0.30, 0.90, 0.45], mark: 'hl' },
  { cap: 1, box: [0.30, 0.55, 0.70, 0.85], mark: 'circle' },
] });
