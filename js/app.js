/* ============================================================
 * M·KIOSK 主逻辑
 * 屏幕流：欢迎 → 点餐(菜单/购物车/AI) → 结算 → 制作中 → 出餐
 * 依赖（classic script，按序加载）：menu-data.js / ai.js / voice.js
 * ============================================================ */
(function () {
  'use strict';

  const $  = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  const state = {
    screen: 'welcome',
    cat: MENU_CATEGORIES[0].id,
    cart: [],            // line: {key,id,name,emoji,unit,opts:{g:{k,n,p}},qty}
    advice: null,
    receipt: null,       // 出餐后小票快照
    payment: '微信支付',
  };

  /* ---------------- 工具 ---------------- */
  const fmt = n => '¥' + (Math.round(n * 10) / 10).toString().replace(/\.0$/, '');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const itemById = id => MENU_ITEMS.find(i => i.id === id);

  const GRADS = [
    'linear-gradient(140deg,#FFD98A,#FF9F43)',
    'linear-gradient(140deg,#FF9A8B,#D93A2B)',
    'linear-gradient(140deg,#FFE9C7,#F2C14E)',
    'linear-gradient(140deg,#D8A47F,#8A5A33)',
    'linear-gradient(140deg,#B8E6C1,#4E9F68)',
    'linear-gradient(140deg,#E8C6F2,#9A5FBF)',
    'linear-gradient(140deg,#9FB8F2,#4A6BC9)',
    'linear-gradient(140deg,#FFF3B0,#EED23B)',
  ];
  function gradOf(id) {
    let h = 0; for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return GRADS[h % GRADS.length];
  }

  let toastTimer = null;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('on'), 2200);
  }

  /* ---------------- 屏幕切换 ---------------- */
  function go(name) {
    state.screen = name;
    $$('.screen').forEach(s => s.classList.toggle('active', s.id === 'screen-' + name));
    $('#topbar').classList.toggle('compact', name !== 'menu');
    if (name === 'welcome') Voice.stop();
  }

  /* ---------------- 菜单渲染 ---------------- */
  function renderRail() {
    $('#rail').innerHTML = MENU_CATEGORIES.map(c =>
      `<button data-cat="${c.id}" class="${c.id === state.cat ? 'active' : ''}">
         <span class="e">${c.emoji}</span><span>${c.name}</span>
       </button>`).join('');
  }

  function tagsHTML(item) {
    return (item.tags || []).map(t =>
      `<span class="tag ${TAG_CLASSES[t] || ''}">${t}</span>`).join('');
  }

  function cardHTML(item) {
    return `<article class="pcard" data-item="${item.id}">
      <div class="art" style="background:${gradOf(item.id)}">
        <div class="tags">${tagsHTML(item)}</div>
        <span class="emo">${item.emoji}</span>
      </div>
      <div class="pname">${esc(item.name)}</div>
      <div class="pdesc">${esc(item.desc)}</div>
      <div class="prow">
        <div><span class="price">${fmt(item.price)}</span><span class="kcal">/ 约${item.kcal}kcal</span></div>
        <button class="add-btn" data-add="${item.id}" aria-label="加入购物车">＋</button>
      </div>
    </article>`;
  }

  function renderGrid() {
    const items = MENU_ITEMS.filter(i => i.cat === state.cat);
    const cat = MENU_CATEGORIES.find(c => c.id === state.cat);
    $('#menu-title').innerHTML = `${cat.emoji} ${cat.name} <small>${items.length} 件 · 点击卡片可定制</small>`;
    $('#grid').innerHTML = items.map(cardHTML).join('');
  }

  function selectCat(id) {
    state.cat = id;
    renderRail(); renderGrid();
    Voice.sfx('tap');
    $('#menu-main').scrollTop = 0;
  }

  /* ---------------- 定制弹窗 ---------------- */
  const dm = { item: null, sel: {}, qty: 1 };

  function defaultOpts(item) {
    const sel = {};
    (OPTION_GROUPS[item.opts] || []).forEach(g => { sel[g.key] = g.options[0]; });
    return sel;
  }

  function unitPrice(item, opts) {
    let p = item.price;
    Object.values(opts || {}).forEach(o => { p += (o && o.p) || 0; });
    return Math.round(p * 10) / 10;
  }

  function openDetail(id) {
    dm.item = itemById(id);
    dm.qty = 1;
    dm.sel = defaultOpts(dm.item);
    renderDetail();
    $('#modal-detail').classList.add('on');
    Voice.sfx('tap');
  }

  function renderDetail() {
    const it = dm.item;
    const groups = (OPTION_GROUPS[it.opts] || []).map(g => `
      <div class="og">
        <label>${g.name}</label>
        <div class="og-chips">${g.options.map(o => `
          <button class="opt-chip ${dm.sel[g.key] && dm.sel[g.key].k === o.k ? 'on' : ''}"
                  data-g="${g.key}" data-k="${o.k}">${o.n}${o.p ? ` +${o.p}` : ''}</button>`).join('')}
        </div>
      </div>`).join('');
    const unit = unitPrice(it, dm.sel);
    $('#dm-body').innerHTML = `
      <div class="dm-art" style="background:${gradOf(it.id)}"><span class="emo">${it.emoji}</span>
        <div class="tags">${tagsHTML(it)}</div>
      </div>
      <div class="dm-head">
        <div><div class="dm-name">${esc(it.name)}</div><div class="dm-desc">${esc(it.desc)}</div>
        <div class="dm-meta">约 ${it.kcal} kcal · 供能占比仅供娱乐</div></div>
        <div class="dm-price">${fmt(unit)}</div>
      </div>
      ${groups}`;
    $('#dm-qty').textContent = dm.qty;
    $('#dm-total').textContent = fmt(unit * dm.qty);
  }

  function detailAdd() {
    addToCart(dm.item, dm.sel, dm.qty);
    closeModal('#modal-detail');
    toast(`已加入 ${dm.item.name} ×${dm.qty}`);
  }

  function closeModal(sel) { $(sel).classList.remove('on'); }

  /* ---------------- 购物车 ---------------- */
  const optKey = opts => Object.keys(opts || {}).sort().map(k => opts[k].k).join('|');

  function addToCart(item, opts, qty) {
    const key = item.id + '::' + optKey(opts);
    let line = state.cart.find(l => l.key === key);
    if (line) line.qty += qty;
    else state.cart.push({ key, id: item.id, name: item.name, emoji: item.emoji, unit: unitPrice(item, opts), opts: JSON.parse(JSON.stringify(opts || {})), qty });
    Voice.sfx('add');
    renderCart();
    refreshAdviceSoon();
    const badge = $('#cart-badge');
    badge.classList.remove('pulse'); void badge.offsetWidth; badge.classList.add('pulse');
  }

  const lineUnit = l => l.unit;
  const cartTotal = () => state.cart.reduce((s, l) => s + l.unit * l.qty, 0);
  const cartCount = () => state.cart.reduce((s, l) => s + l.qty, 0);
  const cartKcal  = () => state.cart.reduce((s, l) => s + itemById(l.id).kcal * l.qty, 0);

  function lineHTML(l) {
    const osum = Object.values(l.opts || {}).map(o => o.n).join(' · ');
    return `<div class="cline" data-key="${esc(l.key)}">
      <div class="e" style="background:${gradOf(l.id)}">${l.emoji}</div>
      <div class="cinfo">
        <b>${esc(l.name)}</b>
        ${osum ? `<small>${esc(osum)}</small>` : ''}
        <span class="cprice">${fmt(l.unit)}</span>
      </div>
      <div class="stepper">
        <button data-dec aria-label="减少">−</button><b>${l.qty}</b><button data-inc aria-label="增加">＋</button>
      </div>
    </div>`;
  }

  function renderCart() {
    const box = $('#cart-items');
    box.innerHTML = state.cart.length
      ? state.cart.map(lineHTML).join('')
      : `<div class="cart-empty"><div class="big">🛒</div>购物车空空如也<br><small>问问 AI 店长「小镁」，或点菜单卡片</small></div>`;

    const n = cartCount();
    $('#cart-badge').textContent = n;
    $('#cart-badge').classList.toggle('zero', n === 0);
    const total = cartTotal();
    $('#cart-total').textContent = fmt(total);
    $('#cart-kcal').textContent = n ? '约 ' + Math.round(cartKcal()) + ' kcal' : '';
    $('#mbar-total').textContent = fmt(total);
    $('#mbar-count').textContent = n ? `已选 ${n} 件` : '购物车是空的';
    $('#checkout-btn').disabled = n === 0;
    $('#mbar-view').disabled = n === 0;
  }

  function cartClick(e) {
    const lineEl = e.target.closest('.cline');
    if (!lineEl) {
      if (e.target.closest('#cart-clear')) {
        state.cart = []; Voice.sfx('remove'); renderCart(); refreshAdviceSoon();
      }
      return;
    }
    const line = state.cart.find(l => l.key === lineEl.dataset.key);
    if (!line) return;
    if (e.target.closest('[data-inc]')) { line.qty++; Voice.sfx('add'); }
    else if (e.target.closest('[data-dec]')) {
      line.qty--; Voice.sfx('remove');
      if (line.qty <= 0) state.cart = state.cart.filter(l => l !== line);
    } else return;
    renderCart(); refreshAdviceSoon();
  }

  /* ---------------- AI 店长 ---------------- */
  function adviceCtx() {
    const now = new Date();
    return {
      hour: now.getHours(), dow: now.getDay(), date: now,
      cart: state.cart.map(l => ({ item: itemById(l.id), qty: l.qty })),
      total: cartTotal(), kcal: Math.round(cartKcal()), count: cartCount(),
    };
  }

  let typeTimer = null, adviceTimer = null;

  function refreshAdviceSoon() {
    clearTimeout(adviceTimer);
    adviceTimer = setTimeout(showAdvice, 900);
  }

  function showAdvice() {
    const a = AI.next(adviceCtx());
    state.advice = a;
    const el = $('#ai-text');
    clearInterval(typeTimer);
    el.textContent = '';
    let i = 0;
    typeTimer = setInterval(() => {
      i += 2;
      el.textContent = a.text.slice(0, i);
      if (i >= a.text.length) clearInterval(typeTimer);
    }, 24);
    el.onclick = () => { clearInterval(typeTimer); el.textContent = a.text; };
    $('#ai-add').style.display = a.items && a.items.length ? '' : 'none';
  }

  function aiAdd() {
    if (!state.advice || !state.advice.items) return;
    let added = 0;
    state.advice.items.forEach(id => {
      const it = itemById(id); if (!it) return;
      addToCart(it, defaultOpts(it), 1); added++;
    });
    toast(added ? `已按小镁的建议加入 ${added} 件` : '该建议无需加购');
    refreshAdviceSoon();
  }

  /* ---------------- 结算 ---------------- */
  function openCheckout() {
    if (!state.cart.length) return;
    const rows = state.cart.map(l => {
      const osum = Object.values(l.opts || {}).map(o => o.n).join(' · ');
      return `<div class="ck-line"><span>${l.emoji} ${esc(l.name)}${osum ? `<i>(${esc(osum)})</i>` : ''} ×${l.qty}</span><b>${fmt(l.unit * l.qty)}</b></div>`;
    }).join('');
    const kcal = Math.round(cartKcal());
    $('#ck-body').innerHTML = `
      <div class="ck-lines">${rows}</div>
      <div class="ck-note">合计约 ${kcal} kcal · 演示环境，不会真实扣款</div>`;
    $('#ck-total').textContent = fmt(cartTotal());
    $('#modal-checkout').classList.add('on');
    Voice.sfx('tap');
  }

  function pay() {
    if (!state.cart.length) return;
    closeModal('#modal-checkout');
    state.receipt = { no: 'M' + String(Date.now()).slice(-4), lines: state.cart.slice(), total: cartTotal(), payment: state.payment };
    startMaking();
  }

  /* ---------------- 制作中 ---------------- */
  const MAKING_STEPS = [
    { name: '已接单', emoji: '🧾',  wait: 1200, say: null },
    { name: '烹饪中', emoji: '🔥',  wait: 3400, say: null },
    { name: '打包中', emoji: '🥡',  wait: 1900, say: null },
    { name: '已出餐', emoji: '🛎️', wait: 800,  say: null },
  ];
  let makingTimers = [];

  function startMaking() {
    state.cart = [];
    renderCart();
    go('making');
    $('#mk-no').textContent = state.receipt.no;
    const bar = $('#mk-bar');
    bar.style.transition = 'none'; bar.style.width = '0%';
    void bar.offsetWidth;
    Voice.speak(`订单 ${state.receipt.no.split('').join(' ')} 已确认，正在为您制作，请稍候`);
    Voice.sfx('success');

    const stepsEl = $('#mk-steps');
    stepsEl.innerHTML = MAKING_STEPS.map((s, i) => `
      <div class="step ${i === 0 ? 'doing' : ''}" data-i="${i}">
        <div class="ico">${s.emoji}</div><div class="nm">${s.name}</div>
      </div>${i < MAKING_STEPS.length - 1 ? '<div class="step-line"></div>' : ''}`).join('');
    $('#mk-fill').classList.remove('on');

    let t = 260;
    const total = MAKING_STEPS.reduce((s, x) => s + x.wait, 0);
    bar.style.transition = `width ${total + 400}ms linear`;
    requestAnimationFrame(() => { bar.style.width = '100%'; });

    MAKING_STEPS.forEach((s, i) => {
      makingTimers.push(setTimeout(() => {
        stepsEl.querySelectorAll('.step').forEach((el, j) => {
          el.classList.toggle('done', j < i);
          el.classList.toggle('doing', j === i);
        });
        stepsEl.querySelectorAll('.step-line').forEach((el, j) => el.classList.toggle('done', j < i));
        if (i === 1) $('#mk-fill').classList.add('on');   // 烹饪：咖啡开始注满
        if (i === 3) Voice.sfx('ding');
      }, t));
      t += s.wait;
    });
    makingTimers.push(setTimeout(showDone, t + 500));
  }

  /* ---------------- 出餐完成 ---------------- */
  function showDone() {
    const r = state.receipt;
    $('#done-no').textContent = r.no;
    $('#done-body').innerHTML = r.lines.map(l => {
      const osum = Object.values(l.opts || {}).map(o => o.n).join(' · ');
      return `<div class="ck-line"><span>${l.emoji} ${esc(l.name)}${osum ? `<i>(${esc(osum)})</i>` : ''} ×${l.qty}</span><b>${fmt(l.unit * l.qty)}</b></div>`;
    }).join('') + `<div class="ck-line total"><span>合计（${esc(r.payment)}）</span><b>${fmt(r.total)}</b></div>`;
    go('done');
    Voice.speak(`您的订单已出餐，取餐号 ${r.no.split('').join(' ')}，感谢光临，欢迎再来`);
    confetti();
  }

  function confetti() {
    const EMO = ['🎉', '🍟', '🍔', '☕', '🎈', '✨', '🥤', '🍦'];
    for (let i = 0; i < 26; i++) {
      const s = document.createElement('span');
      s.className = 'cf';
      s.textContent = EMO[i % EMO.length];
      s.style.left = Math.random() * 100 + 'vw';
      s.style.animationDelay = (Math.random() * 1.4) + 's';
      s.style.fontSize = (16 + Math.random() * 16) + 'px';
      s.style.animationDuration = (2.2 + Math.random() * 1.6) + 's';
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 4200);
    }
  }

  /* ---------------- 顶栏 ---------------- */
  function renderSound() {
    const b = $('#sound-btn');
    b.textContent = Voice.enabled ? '🔊 声音开' : '🔇 静音';
    b.classList.toggle('on', Voice.enabled);
    b.setAttribute('aria-pressed', Voice.enabled);
  }

  function tickClock() {
    const d = new Date();
    const p = x => String(x).padStart(2, '0');
    $('#clock').textContent = `${p(d.getHours())}:${p(d.getMinutes())}`;
    const h = d.getHours();
    const greet = h < 5 ? '夜深了，注意休息' : h < 10 ? '早上好，元气早餐时间' : h < 14 ? '午市高峰，手慢无' : h < 17 ? '下午茶治愈时刻' : h < 22 ? '晚上好，犒劳一整天' : '深夜食堂，为奋斗续航';
    $('#greet').textContent = greet;
    $('#welcome-greet').textContent = greet;
  }

  /* ---------------- 事件绑定 ---------------- */
  function bind() {
    $('#start-btn').addEventListener('click', () => { Voice.sfx('tap'); go('menu'); showAdvice(); });

    $('#rail').addEventListener('click', e => {
      const b = e.target.closest('[data-cat]');
      if (b) selectCat(b.dataset.cat);
    });

    $('#grid').addEventListener('click', e => {
      const add = e.target.closest('[data-add]');
      if (add) {
        const it = itemById(add.dataset.add);
        if (OPTION_GROUPS[it.opts]) openDetail(it.id);
        else { addToCart(it, {}, 1); toast(`已加入 ${it.name}`); }
        return;
      }
      const card = e.target.closest('[data-item]');
      if (card) openDetail(card.dataset.item);
    });

    /* 定制弹窗 */
    $('#dm-body').addEventListener('click', e => {
      const chip = e.target.closest('.opt-chip');
      if (chip) {
        const g = chip.dataset.g;
        const group = (OPTION_GROUPS[dm.item.opts] || []).find(x => x.key === g);
        dm.sel[g] = group.options.find(o => o.k === chip.dataset.k);
        Voice.sfx('tap'); renderDetail();
      }
    });
    $('#dm-minus').addEventListener('click', () => { dm.qty = Math.max(1, dm.qty - 1); Voice.sfx('tap'); renderDetail(); });
    $('#dm-plus').addEventListener('click', () => { dm.qty = Math.min(20, dm.qty + 1); Voice.sfx('tap'); renderDetail(); });
    $('#dm-add').addEventListener('click', detailAdd);
    $('#modal-detail').addEventListener('click', e => { if (e.target.id === 'modal-detail') closeModal('#modal-detail'); });

    /* 购物车（桌面右栏 = 移动端底部抽屉，同一份 DOM） */
    $('#cart-panel').addEventListener('click', cartClick);
    $('#checkout-btn').addEventListener('click', openCheckout);

    /* 移动端底栏 / 抽屉 */
    $('#mbar-view').addEventListener('click', () => $('#cart-panel').classList.add('open'));
    $('#ai-fab').addEventListener('click', () => {
      $('#cart-panel').classList.add('open');
      setTimeout(showAdvice, 350);
    });
    $('#sheet-close').addEventListener('click', () => $('#cart-panel').classList.remove('open'));

    /* AI 动作 */
    $('#ai-add').addEventListener('click', aiAdd);
    $('#ai-next').addEventListener('click', () => { Voice.sfx('tap'); showAdvice(); });
    $('#ai-speak').addEventListener('click', () => {
      if (!state.advice) return;
      if (!Voice.enabled) toast('当前静音 · 本次手动朗读');
      Voice.speak(state.advice.text, true);
    });

    /* 结算弹窗 */
    $$('#pay-chips .pay-chip').forEach(ch => ch.addEventListener('click', () => {
      $$('#pay-chips .pay-chip').forEach(x => x.classList.remove('on'));
      ch.classList.add('on');
      state.payment = ch.dataset.pay;
      Voice.sfx('tap');
    }));
    $('#ck-pay').addEventListener('click', pay);
    $('#ck-cancel').addEventListener('click', () => closeModal('#modal-checkout'));
    $('#modal-checkout').addEventListener('click', e => { if (e.target.id === 'modal-checkout') closeModal('#modal-checkout'); });

    /* 出餐后 */
    $('#done-again').addEventListener('click', () => { Voice.sfx('tap'); go('menu'); showAdvice(); });
    $('#done-home').addEventListener('click', () => { Voice.sfx('tap'); go('welcome'); });

    /* 声音开关 */
    $('#sound-btn').addEventListener('click', () => {
      const on = Voice.toggle();
      renderSound();
      toast(on ? '🔊 语音播报已开启' : '🔇 已静音（AI 建议仍可用「朗读」按钮手动播报）');
    });

    /* Esc 关闭弹层 */
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        closeModal('#modal-detail'); closeModal('#modal-checkout');
        $('#cart-panel').classList.remove('open');
      }
    });
  }

  /* ---------------- 启动 ---------------- */
  function init() {
    renderRail(); renderGrid(); renderCart(); renderSound(); tickClock();
    setInterval(tickClock, 1000);
    bind();
    go('welcome');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
