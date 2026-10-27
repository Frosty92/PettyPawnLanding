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

// The waitlist: an email and a tap on iPhone or Android, stored by /api/waitlist (functions/api/waitlist.js), which
// answers "joined" for a new email and "already" for one on the list. Both forms show the answer, so the closer does not
// ask again once the hero has one. Enter picks the phone the visitor is on, or asks which on a computer.
(() => {
  const forms = [...document.querySelectorAll('form.waitlist')];
  if (!forms.length) return;
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const LINES = {
    joined: "You're on the waitlist.",
    already: "You're already on the waitlist.",
    invalid: 'Enter a valid email.',
    platform: 'Tap iPhone or Android.',
    failed: 'Something went wrong. Try again.',
  };
  const ua = navigator.userAgent;
  const onPhone = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) ? 'ios'
    : /Android/.test(ua) ? 'android' : null;
  const params = new URLSearchParams(location.search);
  let source = params.get('utm_source') || params.get('ref') || '';
  if (!source && document.referrer) {
    try { const host = new URL(document.referrer).hostname; if (host !== location.hostname) source = host; } catch (e) { /* no referrer */ }
  }

  const finish = (status, email, from) => {
    forms.forEach((f) => {
      f.querySelector('.waitlist-done-line').textContent = LINES[status];
      f.querySelector('.waitlist-done-email').textContent = email;
      f.querySelector('.waitlist-fields').hidden = true;
      f.querySelector('.waitlist-note').textContent = '';
      f.querySelector('.waitlist-done').hidden = false;
    });
    from.querySelector('.waitlist-done').focus({ preventScroll: true });
  };

  forms.forEach((form) => {
    const input = form.querySelector('.waitlist-email');
    const note = form.querySelector('.waitlist-note');
    const buttons = form.querySelectorAll('[data-platform]');
    const say = (line, error) => { note.textContent = line || ''; note.classList.toggle('is-error', Boolean(error)); };
    const invalid = () => { input.setAttribute('aria-invalid', 'true'); say(LINES.invalid, true); input.focus(); };

    const send = async (platform) => {
      const email = input.value.trim().toLowerCase();
      if (!EMAIL.test(email)) return invalid();
      input.removeAttribute('aria-invalid');
      if (!platform) return say(LINES.platform, true);
      buttons.forEach((b) => { b.disabled = true; });
      form.setAttribute('aria-busy', 'true');
      say('');
      try {
        const res = await fetch('/api/waitlist', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email, platform, source, website: form.querySelector('.waitlist-trap').value }),
        });
        const data = await res.json().catch(() => ({}));
        if (data.status === 'joined' || data.status === 'already') return finish(data.status, email, form);
        if (data.error === 'invalid_email') return invalid();
        say(LINES.failed, true);
      } catch (e) {
        say(LINES.failed, true);
      } finally {
        buttons.forEach((b) => { b.disabled = false; });
        form.removeAttribute('aria-busy');
      }
    };

    buttons.forEach((b) => b.addEventListener('click', () => send(b.dataset.platform)));
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); send(onPhone); } });
    input.addEventListener('input', () => { if (input.hasAttribute('aria-invalid')) { input.removeAttribute('aria-invalid'); say(''); } });
    form.addEventListener('submit', (e) => e.preventDefault());
  });
})();
