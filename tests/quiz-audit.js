/* Drives the quiz in a real page, for tests/test_quiz_page.py. Not part of the site.
   The test serves two copies of the site side by side: /old (main as published)
   and /new (this folder). CFG is written into audit.html by the test. Results are
   posted back to the test's own server; nothing leaves this machine. */
(async () => {
  const out = { cases: {}, errors: [] };
  const KEY = 'mep-v1';
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  async function until(fn, what, ms = 12000) {
    const t = Date.now();
    for (;;) {
      let v; try { v = fn(); } catch (e) { v = null; }
      if (v) return v;
      if (Date.now() - t > ms) throw new Error('timed out waiting for ' + what);
      await sleep(40);
    }
  }
  const state = () => JSON.parse(localStorage.getItem(KEY) || '{}');
  const D = f => f.contentDocument;
  const top = f => { const s = D(f).querySelectorAll('.sheet'); return s[s.length - 1]; };
  const edition = (site, date) => fetch(site + '/briefs/' + date + '.json').then(r => r.json());
  async function load(site, date, w = 390) {
    document.querySelectorAll('iframe').forEach(f => f.remove());
    const f = document.createElement('iframe');
    f.style.cssText = 'width:' + w + 'px;height:844px;border:0';
    document.body.append(f);
    f.src = site + '/index.html?d=' + date + '&still';
    await until(() => D(f) && D(f).querySelector('#quiz .btn'), 'the quiz card on ' + site + ' ' + date);
    return f;
  }
  /* answer items in order: pattern[i] true picks the right option, false a wrong one */
  async function answer(f, items, pattern, how) {
    const log = [];
    for (let i = 0; i < pattern.length; i++) {
      const it = items[i];
      const btns = await until(() => {
        const s = top(f), b = [...s.querySelectorAll('.opt')];
        return b.length === 4 && !b[0].disabled && s.querySelector('.body h2').textContent === it.q ? b : null;
      }, 'question ' + (i + 1));
      const s = top(f), k = pattern[i] ? it.answer : (it.answer + 1) % 4, optBottom = btns[3].getBoundingClientRect().bottom;
      if (how === 'keys') D(f).dispatchEvent(new f.contentWindow.KeyboardEvent('keydown', { key: (i % 2 ? 'abcd' : '1234')[k], bubbles: true }));
      else btns[k].click();
      const nx = await until(() => [...s.querySelectorAll('.btn')].find(b => /Next question|See my score/.test(b.textContent)), 'the next button after question ' + (i + 1));
      const get = q => (s.querySelector(q) || {}).textContent || '';
      log.push({ live: get('.sr'), focusNext: D(f).activeElement === nx, rev: get('.rev'), setup: get('.setup'), marks: btns.map(b => b.className), optBottom, nextH: nx.getBoundingClientRect().height });
      nx.click();
    }
    return log;
  }
  const start = f => D(f).querySelector('#quiz .btn').click();
  const score = f => until(() => top(f).querySelector('.score'), 'the score screen');
  async function run(name, fn) { try { out.cases[name] = await fn(); } catch (e) { out.errors.push(name + ': ' + e.message); } }

  /* the same three days, answered the same way, on the old page and the new one */
  async function parity(site) {
    localStorage.clear(); const res = [];
    for (const [date, pat] of CFG.par) {
      const b = await edition(site, date), f = await load(site, date);
      start(f); await answer(f, b.quiz, pat, 'click');
      const sc = await score(f), s = top(f);
      res.push({ score: sc.textContent, pts: s.querySelector('.pts').textContent, revise: [...s.querySelectorAll('.why b')].map(x => x.textContent) });
    }
    const st = state(); Object.values(st.days || {}).forEach(d => delete d.at);
    return { res, state: st };
  }
  await run('parityOld', () => parity('/old'));
  await run('parityNew', () => parity('/new'));

  await run('keys', async () => {
    localStorage.clear();
    const b = await edition('/new', CFG.real), f = await load('/new', CFG.real), pat = [true, false, true, true, true];
    start(f); const log = await answer(f, b.quiz, pat, 'keys'); await score(f);
    const day = state().days[CFG.real], before = localStorage.getItem(KEY), review = state().review.length;
    const pm = [...top(f).querySelectorAll('.btn')].find(x => /^Practise the 1 you missed$/.test(x.textContent));
    let practice = null;
    if (pm) { pm.click(); await answer(f, [b.quiz[1]], [true], 'click'); await score(f); practice = { pts: top(f).querySelector('.pts').textContent, unchanged: localStorage.getItem(KEY) === before }; }
    return { log, day, review, hasPractise: !!pm, practice };
  });

  await run('resume', async () => {
    localStorage.clear();
    const b = await edition('/new', CFG.real); let f = await load('/new', CFG.real);
    start(f); await answer(f, b.quiz, [true, true], 'click');
    f = await load('/new', CFG.real);
    return { h2: D(f).querySelector('#quiz h2').textContent, btn: D(f).querySelector('#quiz .btn').textContent };
  });

  await run('seven', async () => {
    localStorage.clear();
    const b = await edition('/new', CFG.seven), f = await load('/new', CFG.seven);
    const card = D(f).querySelector('#quiz h2').textContent;
    start(f); const log = await answer(f, b.quiz, b.quiz.map(() => true), 'click'); const sc = await score(f);
    const st = state();
    return { card, score: sc.textContent, day: st.days[CFG.seven], lessons: st.lessons, rev: log.map(l => l.rev) };
  });

  await run('sunday', async () => {
    localStorage.clear();
    const b = await edition('/new', CFG.sunday); let f = await load('/new', CFG.sunday);
    (await until(() => D(f).querySelector('#scenario .btn'), 'the scenario card')).click();
    const log = await answer(f, [b.scenario], [true], 'click'); await score(f);
    const first = { bonus: state().bonus, points: state().points, scen: (state().scen || {})[CFG.sunday], setup: log[0].setup, title: top(f).querySelector('.sbar strong').textContent };
    f = await load('/new', CFG.sunday);
    const card = (await until(() => D(f).querySelector('#scenario p'), 'the scenario card again')).textContent;
    D(f).querySelector('#scenario .btn').click();
    await answer(f, [b.scenario], [true], 'click'); await score(f);
    return { first, card, again: { bonus: state().bonus, points: state().points, title: top(f).querySelector('.sbar strong').textContent } };
  });

  /* the Opening Day scene: drawn, counts the tables, ends in the right ending, and the quiz survives without it */
  await run('scene', async () => {
    localStorage.clear();
    const b = await edition('/new', CFG.real), f = await load('/new', CFG.real, 320);
    start(f);
    const cv = await until(() => top(f).querySelector('.svc canvas'), 'the scene');
    const box = () => cv.getBoundingClientRect(), painted = cv.getContext('2d').getImageData(cv.width >> 1, cv.height >> 1, 1, 1).data[3] > 0;
    const small = { w: box().width, h: box().height };
    const log = await answer(f, b.quiz, [true, false, true, true, true], 'click'); await score(f);
    const stg = top(f).querySelector('.svc'), W = f.contentWindow;
    const shots = {};
    for (const [name, n, t] of [['5of5', 5, 5], ['4of5', 4, 5], ['3of5', 3, 5], ['2of5', 2, 5], ['0of5', 0, 5], ['7of7', 7, 7], ['mid', 3, 7]]) {
      const host = D(f).createElement('div'); host.style.width = '320px'; D(f).body.append(host);
      const s = W.Service.mount(host, { total: t, seats: Array(n).fill('#009b37') });
      if (name !== 'mid') s.end(n); await sleep(250);
      shots[name] = host.querySelector('canvas').toDataURL(); s.destroy(); host.remove();
    }
    return { painted, small, seated: stg.dataset.seated, end: stg.dataset.end, endH: box().height, label: cv.getAttribute('aria-label'), fit: Math.max(...log.map(l => l.optBottom)), shots,
      tiers: [[5, 5], [4, 5], [3, 5], [2, 5], [1, 5], [0, 5], [7, 7], [6, 7], [5, 7], [4, 7], [1, 7], [0, 7]].map(([n, t]) => W.Service.tierOf(n, t)).join('') };
  });
  await run('fallback', async () => {
    localStorage.clear();
    const b = await edition('/new', CFG.real), f = await load('/new', CFG.real);
    f.contentWindow.Service = { mount() { throw new Error('scene broke'); } };
    start(f); await answer(f, b.quiz, b.quiz.map(() => true), 'click'); const sc = await score(f);
    return { score: sc.textContent, scene: !!top(f).querySelector('.svc'), day: state().days[CFG.real] };
  });

  await run('layout', async () => {
    const res = {};
    for (const w of [320, 360, 390]) {
      localStorage.clear();
      const b = await edition('/new', CFG.seven), f = await load('/new', CFG.seven, w);
      start(f);
      const opts = await until(() => { const o = [...top(f).querySelectorAll('.opt')]; return o.length === 4 ? o : null; }, 'options at ' + w);
      const s = top(f), h = e => e.getBoundingClientRect().height;
      const m = { overflow: s.scrollWidth - s.clientWidth, minOpt: Math.min(...opts.map(h)), close: h(s.querySelector('.close')) };
      const log = await answer(f, b.quiz, [true], 'click'); m.next = log[0].nextH;
      res[w] = m;
    }
    return res;
  });

  await fetch('/done', { method: 'POST', body: JSON.stringify(out) });
})();
