/* ============================================================
 * AI 店长「小镁」—— 本地建议引擎
 *
 * 设计为可替换适配层：对外只暴露 AI.next(ctx) => { id, text, items }
 * ctx = { hour, dow, date, cart:[{item,qty}], total, kcal, count }
 * 接入真实 LLM / 麦当劳官方 MCP 时，把 next() 换成工具调用即可，
 * 返回结构不变，UI 与语音层无需改动。
 * ============================================================ */

const AI = (function () {
  'use strict';

  const has = (cart, id) => cart.some(c => c.item.id === id);
  const countOf = (cart, id) => cart.reduce((s, c) => s + (c.item.id === id ? c.qty : 0), 0);
  const inCat = (cart, cat) => cart.some(c => c.item.cat === cat);

  /* 规则库：when(ctx) 命中才有资格；weight 越大越常被抽中。
   * make(ctx) 返回 { text, items:[itemId] }，items 供「一键加入」。 */
  const RULES = [
    /* ---- 1024 程序员节彩蛋（10/20-10/31 高权重）---- */
    {
      id: 'festival1024', weight: 6,
      when: c => c.date.getMonth() === 9 && c.date.getDate() >= 20 && c.date.getDate() <= 31,
      make: () => ({
        text: '🎉 1024 程序员节快乐！巨无霸 + 大薯 + 零度可乐，快乐三件套已为你配齐，Bug 退散！',
        items: ['m4'],
      }),
    },
    /* ---- 早餐时段 ---- */
    {
      id: 'breakfast', weight: 5,
      when: c => c.count === 0 && c.hour >= 5 && c.hour < 10,
      make: () => ({
        text: '早上好！猪柳蛋麦满分 + 鲜煮咖啡，蛋白质和咖啡因一次到位，今天也是高效的一天 ☕',
        items: ['k1', 'k5'],
      }),
    },
    /* ---- 午餐 ---- */
    {
      id: 'lunch', weight: 4,
      when: c => c.count === 0 && c.hour >= 10 && c.hour < 14,
      make: () => ({
        text: '午市到啦！板烧鸡腿堡套餐配餐饮料可免费换零度可乐，均衡又不困 💪',
        items: ['m3'],
      }),
    },
    /* ---- 下午茶 ---- */
    {
      id: 'tea', weight: 4,
      when: c => c.count === 0 && c.hour >= 14 && c.hour < 17,
      make: () => ({
        text: '下午 3 点的黄金时刻 ☕ 拿铁 + 草莓圣代，甜苦平衡，赶走下午的困意。',
        items: ['c1', 't1'],
      }),
    },
    /* ---- 晚餐 ---- */
    {
      id: 'dinner', weight: 4,
      when: c => c.count === 0 && c.hour >= 17 && c.hour < 22,
      make: () => ({
        text: '晚餐推荐麦辣鸡腿堡套餐 🌶️ 中薯升级大薯只要 3 元，加量不加价的快乐。',
        items: ['m2'],
      }),
    },
    /* ---- 深夜 ---- */
    {
      id: 'latenight', weight: 5,
      when: c => c.count === 0 && (c.hour >= 22 || c.hour < 5),
      make: () => ({
        text: '深夜食堂模式 🌙 麦辣鸡翅 + 麦乐鸡拼一盘，配零度可乐，犒劳还在奋斗的你。',
        items: ['s2', 's3', 'd2'],
      }),
    },
    /* ---- 购物车：点了辣的没配饮料 → 解辣 ---- */
    {
      id: 'spicy-need-drink', weight: 7,
      when: c => c.count > 0 && c.cart.some(x => (x.item.tags || []).includes('辣')) && !inCat(c.cart, 'drink') && !inCat(c.cart, 'coffee'),
      make: () => ({
        text: '检测到辣度超标 🌶️➡️🧊 零度可乐是解辣经典搭档，0 糖 0 负担，要不要来一杯？',
        items: ['d2'],
      }),
    },
    /* ---- 购物车：没有饮品 ---- */
    {
      id: 'need-drink', weight: 5,
      when: c => c.count > 0 && !inCat(c.cart, 'drink') && !inCat(c.cart, 'coffee'),
      make: () => ({
        text: '这单还差一杯就完整了～冰鲜柠檬水是真柠檬片泡的，酸甜解腻 🍋',
        items: ['d4'],
      }),
    },
    /* ---- 购物车：热量爆表 ---- */
    {
      id: 'kcal-warning', weight: 6,
      when: c => c.kcal >= 1000,
      make: c => ({
        text: `这单热量已经 ${c.kcal} kcal 啦 😅 建议加份蔬菜色拉找补一下，或者下顿吃轻一点～`,
        items: ['s5'],
      }),
    },
    /* ---- 购物车：有咖啡没甜品 → 甜苦平衡 ---- */
    {
      id: 'coffee-dessert', weight: 5,
      when: c => inCat(c.cart, 'coffee') && !inCat(c.cart, 'dessert') && c.count < 5,
      make: () => ({
        text: '咖啡配甜品才是完整下午茶 ☕🍰 圆筒冰淇淋 6 块 5，甜苦平衡的秘密。',
        items: ['t2'],
      }),
    },
    /* ---- 购物车：缺主食只买了小食 ---- */
    {
      id: 'need-main', weight: 6,
      when: c => c.count > 0 && !inCat(c.cart, 'burger') && !inCat(c.cart, 'sign') && !inCat(c.cart, 'breakfast'),
      make: () => ({
        text: '光吃小食容易饿哦～双层吉士汉堡 15 块 5，小身材大满足，凑成一顿正餐 🍔',
        items: ['b4'],
      }),
    },
    /* ---- 单笔较高 → 拆单建议 ---- */
    {
      id: 'big-order', weight: 4,
      when: c => c.total >= 80,
      make: c => ({
        text: `这单已经 ${Math.round(c.total)} 元啦，够两餐的量了 😄 不如打包一半当宵夜？`,
        items: [],
      }),
    },
    /* ---- 周五快乐 ---- */
    {
      id: 'friday', weight: 3,
      when: c => c.dow === 5 && c.count > 0,
      make: () => ({
        text: '周五了！给自己加个鸡腿 🍗 麦乐鸡 5 块装，四种形状集齐好运，周末快乐！',
        items: ['s3'],
      }),
    },
    /* ---- 兜底：人气王 ---- */
    {
      id: 'populer', weight: 3,
      when: c => c.count === 0,
      make: () => ({
        text: '不知道吃什么？跟我念：薯条配柠檬水，人间值得 🍟🍋 人气王组合闭眼入。',
        items: ['s1', 'd4'],
      }),
    },
    {
      id: 'new-item', weight: 3,
      when: c => c.count === 0,
      make: () => ({
        text: '尝鲜频道：不素之霸厚牛堡 🥩 安格斯厚牛饼新上市，肉食动物都说好。',
        items: ['b6'],
      }),
    },
  ];

  let lastId = '';

  function next(ctx) {
    const eligible = RULES.filter(r => {
      try { return r.when(ctx); } catch (e) { return false; }
    });
    if (!eligible.length) {
      return { id: 'welcome', text: '欢迎光临 M·KIOSK！点任何餐品前，都可以先听听我的建议哦 🤖', items: [] };
    }
    /* 加权随机，且尽量避免与上一条重复 */
    let pool = eligible.filter(r => r.id !== lastId);
    if (!pool.length) pool = eligible;
    const sum = pool.reduce((s, r) => s + r.weight, 0);
    let roll = Math.random() * sum, picked = pool[0];
    for (const r of pool) { roll -= r.weight; if (roll <= 0) { picked = r; break; } }
    lastId = picked.id;
    const out = picked.make(ctx) || {};
    return { id: picked.id, text: out.text || '', items: out.items || [] };
  }

  return { next, botName: '小镁' };
})();
