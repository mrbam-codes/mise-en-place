"""Build kimchi.js from the four approved Kimchi art fragments in tools/kimchi/,
plus Charlee (the second cat), drawn as a head-and-shoulders bust in each of the four styles.

Each fragment is one <style> scoped to #sNN, one <div class="hero" id="sNN">, and an
optional IIFE script. This turns each into data plus a run(root, K) function so the page
can mount one Kimchi at a time, pause him when he is off-screen or the tab is hidden,
and stop him when his sheet closes. The page CSP allows only script files from 'self',
so the fragments' inline scripts cannot be used as they are.

Fixes applied here (from the 8 Nov 2026 review):
- s06 opens on the finished sculpture, not mid-assembly.
- s08 loses its #s08t= test hook.
- s09's per-frame lighting filter is replaced by a cheap one-blur bevel.
- every requestAnimationFrame/setTimeout loop goes through K.raf/K.st, which pause off-screen.

Run: python3 tools/build_kimchi.py   (writes kimchi.js at the repo root)
"""
import json, re, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "tools" / "kimchi"
IDS = ["s02", "s06", "s08", "s09"]
# Charlee: cNN is drawn to sit beside Kimchi's sNN. Her scene is only the 182x156 bust.
PALS = ["c02", "c06", "c08", "c09"]

# Where Kimchi's head and shoulders sit in each 420x360 scene: x, y, w, h (w:h = 7:6)
CROP = {"s02": [226, 58, 182, 156], "s06": [222, 38, 182, 156], "s08": [198, 40, 182, 156], "s09": [184, 88, 182, 156]}
for _p in PALS:
    CROP[_p] = [0, 0, 182, 156]
SIZE = {fid: [420, 360] for fid in IDS}
SIZE.update({fid: [182, 156] for fid in PALS})


def sub1(s, old, new):
    assert s.count(old) == 1, (old, s.count(old))
    return s.replace(old, new)


def convert(fid):
    raw = (SRC / f"{fid}.html").read_text(encoding="utf-8")
    css = "\n".join(re.findall(r"<style>(.*?)</style>", raw, re.S)).strip()
    scripts = re.findall(r"<script>(.*?)</script>", raw, re.S)
    html = re.sub(r"<style>.*?</style>|<script>.*?</script>", "", raw, flags=re.S).strip()
    js = scripts[0].strip() if scripts else ""

    if fid == "s06":
        js = sub1(js, "var T0=performance.now()-350", "var T0=performance.now()-3000")
        js = sub1(js, "frame(.35);requestAnimationFrame(loop);", "frame(3);requestAnimationFrame(loop);")
    if fid == "s08":
        js, n = re.subn(r"var m=/s08t=\(\[\\d\.\]\+\)/\.exec\(location\.hash\);\s*if\(m\)\{frame\(\+m\[1\]\);return\}", "", js)
        assert n == 1, "s08 hook not found"
    if fid == "s09":
        start = html.index('<filter id="s09_clay"')
        end = html.index("</filter>", start) + len("</filter>")
        html = html[:start] + (
            '<filter id="s09_clay" filterUnits="userSpaceOnUse" x="-200" y="-200" width="800" height="700" color-interpolation-filters="sRGB">'
            '<feGaussianBlur in="SourceAlpha" stdDeviation="3" result="b"/>'
            '<feOffset in="b" dx="3" dy="4" result="o"/>'
            '<feComposite in="SourceAlpha" in2="o" operator="out" result="edge"/>'
            '<feFlood flood-color="#fffaf3" flood-opacity=".7"/><feComposite in2="edge" operator="in" result="hl"/>'
            '<feOffset in="b" dx="-3" dy="-4" result="o2"/>'
            '<feComposite in="SourceAlpha" in2="o2" operator="out" result="edge2"/>'
            '<feFlood flood-color="#7a5a3c" flood-opacity=".22"/><feComposite in2="edge2" operator="in" result="sh"/>'
            '<feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="hl"/><feMergeNode in="sh"/></feMerge>'
            "</filter>") + html[end:]

    if js:
        js = re.sub(r"""document\.getElementById\((['"])%s\1\)""" % fid, "root", js)
        assert "getElementById" not in js, fid
        assert "location.hash" not in js, fid
        js = re.sub(r"\brequestAnimationFrame\(", "K.raf(", js)
        js = re.sub(r"(?<![\w.])setTimeout\(", "K.st(", js)
        js = re.sub(r"\bwindow\.matchMedia\(", "matchMedia(", js)
        js = js.replace("window.matchMedia&&", "").replace("matchMedia('(prefers-reduced-motion: reduce)').matches", "K.reduce").replace('matchMedia("(prefers-reduced-motion: reduce)").matches', "K.reduce")
        # the fragment is an IIFE; call its inner function body with root and K in scope
        m = re.match(r"\(function\(\)\{(.*)\}\)\(\);?\s*$", js, re.S)
        assert m, fid
        js = "function(root,K){" + m.group(1) + "}"
    else:
        js = "null"
    assert f'id="{fid}"' in html
    # the page already styles .hero (the opening animation); keep Kimchi out of it
    html = html.replace('class="hero"', 'class="khero"')
    css = css.replace(".hero", ".khero")
    assert 'class="hero"' not in html
    return css, html, js


parts = []
for fid in IDS + PALS:
    css, html, js = convert(fid)
    parts.append(f'{json.dumps(fid)}:{{css:{json.dumps(css)},html:{json.dumps(html)},crop:{json.dumps(CROP[fid])},size:{json.dumps(SIZE[fid])},run:{js}}}')

out = """/* Kimchi, a Birman kitten: four approved art styles (sNN), and Charlee, a brown
   tabby, as a bust in each of the same four styles (cNN).
   GENERATED by tools/build_kimchi.py from tools/kimchi/*.html. Do not edit by hand.
   Static asset owned by main: the daily routine never writes this file.
   One scene runs at a time, unless a second is mounted with keep (Charlee beside
   Kimchi in the reward); each pauses off-screen, when the tab is hidden, and
   stops when its sheet closes. Honours prefers-reduced-motion. */
(function(){
'use strict';
var ART={%s};
var STYLES=%s,live=null,extra=[],reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
function end(c){if(!c)return;c.dead=true;if(c.io)c.io.disconnect();if(c.sync)document.removeEventListener('visibilitychange',c.sync);if(live===c)live=null}
function stop(){end(live);extra.forEach(end);extra=[]}
/* keep: mount beside the live scene instead of replacing it */
function mount(host,id,keep){
  if(!keep)stop();var a=ART[id];if(!a)return null;
  if(!document.getElementById('kcss-'+id)){var st=document.createElement('style');st.id='kcss-'+id;st.textContent=a.css;document.head.append(st)}
  host.innerHTML=a.html;var root=host.querySelector('#'+id);
  var c={dead:false,paused:false,q:[],reduce:reduce,host:host};
  function gone(){if(!c.dead&&!host.isConnected)end(c);return c.dead}
  c.raf=function(fn){if(gone())return 0;if(c.paused){c.q.push(['r',fn]);return 0}return requestAnimationFrame(function(t){if(gone())return;if(c.paused){c.q.push(['r',fn]);return}fn(t)})};
  c.st=function(fn,ms){if(gone())return 0;if(c.paused){c.q.push(['t',fn,ms]);return 0}return setTimeout(function(){if(gone())return;if(c.paused){c.q.push(['t',fn,ms]);return}fn()},ms)};
  function setPaused(p){if(c.dead||p===c.paused)return;c.paused=p;host.classList.toggle('kpaused',p);if(!p){var q=c.q;c.q=[];q.forEach(function(x){x[0]==='r'?c.raf(x[1]):c.st(x[1],x[2])})}}
  var vis=true;function sync(){setPaused(!vis||document.hidden)}
  if('IntersectionObserver' in window){c.io=new IntersectionObserver(function(es){vis=es[es.length-1].isIntersecting;sync()});c.io.observe(host)}
  c.sync=sync;document.addEventListener('visibilitychange',sync);
  if(keep)extra.push(c);else live=c;
  if(a.run)try{a.run(root,c)}catch(e){}
  return c}
/* a small head-and-shoulders window onto the full scene */
function cameo(host,id,w,keep){var a=ART[id];if(!a)return null;var cr=a.crop,s=w/cr[2],inner=document.createElement('div');
  inner.className='kscene';inner.style.cssText='position:absolute;left:'+(-cr[0]*s)+'px;top:'+(-cr[1]*s)+'px;width:'+(a.size[0]*s)+'px;height:'+(a.size[1]*s)+'px';
  host.style.width=w+'px';host.style.height=Math.round(w*cr[3]/cr[2])+'px';host.textContent='';host.append(inner);return mount(inner,id,keep)}
var forDay=function(day){return STYLES[((day||1)-1)%%STYLES.length]};
window.KIMCHI={STYLES:STYLES,mount:mount,cameo:cameo,stop:stop,forDay:forDay,cameoFor:function(day){return STYLES[(day||1)%%STYLES.length]},
  /* Charlee's art in the same style as a Kimchi style id, or null */
  pal:function(id){var p='c'+String(id).slice(1);return ART[p]?p:null}};
})();
""" % (",\n".join(parts), json.dumps(IDS))
(ROOT / "kimchi.js").write_text(out, encoding="utf-8")
print(f"kimchi.js: {len(out):,} bytes")
