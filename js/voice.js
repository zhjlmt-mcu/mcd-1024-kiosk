/* ============================================================
 * Voice —— 语音朗读 + 交互音效
 *
 * ① 朗读：Web Speech API (speechSynthesis)，中文优先
 * ② 音效：WebAudio 振荡器合成，无外部音频文件
 * ③ 默认静音！用户点右上角 🔊 后才开启，并记忆到 localStorage
 *    —— 浏览器自动播放策略也要求必须有用户手势，静音默认正好合规
 * 改默认行为：把 DEFAULT_ON 改为 true 即可（不推荐，见 README）
 * ============================================================ */

const Voice = (function () {
  'use strict';

  const DEFAULT_ON = false;                 // 默认静音
  const LS_KEY = 'mckiosk.sound';
  let enabled = false;
  try { enabled = DEFAULT_ON || localStorage.getItem(LS_KEY) === 'on'; } catch (e) { /* file:// 或隐私模式 */ }

  let zhVoice = null;
  function pickVoice() {
    if (!('speechSynthesis' in window)) return;
    const vs = speechSynthesis.getVoices();
    zhVoice = vs.find(v => /zh[-_]CN/i.test(v.lang)) ||
              vs.find(v => /^zh/i.test(v.lang)) ||
              vs.find(v => /Chinese/i.test(v.name)) || null;
  }
  if ('speechSynthesis' in window) {
    pickVoice();
    speechSynthesis.onvoiceschanged = pickVoice;
  }

  /* ---------- 朗读 ----------
   * force=true 时无视静音开关（供「朗读」按钮等显式用户手势使用） */
  function speak(text, force) {
    if (!text) return;
    if (!('speechSynthesis' in window)) return;
    if (!enabled && !force) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text.replace(/\s+/g, ' '));
      u.lang = 'zh-CN';
      if (zhVoice) u.voice = zhVoice;
      u.rate = 1.05; u.pitch = 1.05; u.volume = 1.0;
      speechSynthesis.speak(u);
    } catch (e) { /* 无声环境忽略 */ }
  }

  function stop() {
    if ('speechSynthesis' in window) { try { speechSynthesis.cancel(); } catch (e) {} }
  }

  /* ---------- 音效（WebAudio 合成） ---------- */
  let actx = null;
  function ac() {
    if (!actx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      actx = new AC();
    }
    if (actx.state === 'suspended') actx.resume();
    return actx;
  }
  function tone(freq, t0, dur, type, gainV) {
    const a = ac(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type || 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, a.currentTime + t0);
    g.gain.exponentialRampToValueAtTime(gainV || 0.12, a.currentTime + t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + t0 + dur);
    o.connect(g); g.connect(a.destination);
    o.start(a.currentTime + t0); o.stop(a.currentTime + t0 + dur + 0.05);
  }
  const SFX = {
    tap:     () => tone(880, 0, 0.07, 'sine', 0.08),
    add:     () => { tone(660, 0, 0.08, 'sine', 0.10); tone(990, 0.07, 0.10, 'sine', 0.10); },
    remove:  () => tone(330, 0, 0.10, 'triangle', 0.08),
    success: () => { tone(523, 0, 0.12, 'sine', 0.10); tone(659, 0.10, 0.12, 'sine', 0.10); tone(784, 0.20, 0.20, 'sine', 0.12); },
    ding:    () => { tone(1318, 0, 0.35, 'sine', 0.12); tone(1760, 0.02, 0.35, 'sine', 0.06); },
  };
  function sfx(kind) {
    if (!enabled) return;
    try { (SFX[kind] || SFX.tap)(); } catch (e) {}
  }

  /* ---------- 开关 ---------- */
  function toggle() {
    enabled = !enabled;
    try { localStorage.setItem(LS_KEY, enabled ? 'on' : 'off'); } catch (e) {}
    if (enabled) { speak('语音播报已开启'); sfx('success'); }
    else stop();
    return enabled;
  }

  return {
    speak, stop, sfx, toggle,
    get enabled() { return enabled; },
  };
})();
