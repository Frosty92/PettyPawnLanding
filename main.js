// Reveal sections as they arrive, play the story's clip from its start once it is in view, and keep the clips still for
// people who asked for less motion.
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -10% 0px', threshold: .1 });
    items.forEach((el) => io.observe(el));
  } else {
    items.forEach((el) => el.classList.add('in'));
  }

  const clips = document.querySelectorAll('video.clip');
  if (reduce) { clips.forEach((clip) => { clip.removeAttribute('autoplay'); clip.pause(); clip.controls = true; }); return; }
  // A clip plays while most of it is on screen and rests otherwise, so the story's starts from its first frame.
  if (!('IntersectionObserver' in window)) { clips.forEach((v) => { v.autoplay = true; v.play().catch(() => {}); }); return; }
  const watch = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.intersectionRatio >= .4) e.target.play().catch(() => {}); else e.target.pause(); });
  }, { threshold: [0, .4] });
  clips.forEach((v) => watch.observe(v));
})();

// Capture aid: ?snap=<section id> shows that section at the top of the page (the sections above it are hidden), so a
// headless browser can screenshot it without scrolling.
(() => {
  const id = new URLSearchParams(location.search).get('snap');
  const el = id && document.getElementById(id);
  if (!el) return;
  document.querySelectorAll('.reveal').forEach((r) => r.classList.add('in'));
  for (const sib of document.querySelector('main').children) { if (sib === el) break; sib.style.display = 'none'; }
})();
