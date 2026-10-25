/* ============================================================
 * M·KIOSK 菜单数据
 * 价格 / 热量为拟真演示数据，非官方实时数据（接入官方 MCP 后可替换为实时接口）
 * ============================================================ */

/* 分类（rail 顺序即展示顺序） */
const MENU_CATEGORIES = [
  { id: 'sign',      name: '招牌',   emoji: '⭐' },
  { id: 'burger',    name: '汉堡',   emoji: '🍔' },
  { id: 'side',      name: '小食',   emoji: '🍟' },
  { id: 'coffee',    name: '麦咖啡', emoji: '☕' },
  { id: 'drink',     name: '饮品',   emoji: '🥤' },
  { id: 'dessert',   name: '甜品',   emoji: '🍦' },
  { id: 'breakfast', name: '早餐',   emoji: '🌅' },
];

/* 菜单项
 * id / cat / name / emoji / price(元) / kcal / desc / tags(人气·新品·辣·轻食·0糖·限定)
 * opts: OPTION_GROUPS 的 key，null 表示无定制 */
const MENU_ITEMS = [
  /* ---- 招牌套餐 ---- */
  { id: 'm1', cat: 'sign', name: '巨无霸套餐',       emoji: '🍔', price: 43.0, kcal: 1080, desc: '巨无霸 + 中薯条 + 中杯可乐，黄金三角缺一不可', tags: ['人气'], opts: 'set' },
  { id: 'm2', cat: 'sign', name: '麦辣鸡腿堡套餐',   emoji: '🌶️', price: 41.0, kcal: 1150, desc: '辣得过瘾的鸡腿堡 + 中薯 + 中可，重口味首选',     tags: ['人气', '辣'], opts: 'set' },
  { id: 'm3', cat: 'sign', name: '板烧鸡腿堡套餐',   emoji: '🍗', price: 44.0, kcal: 990,  desc: '滑嫩板烧腿排 + 中薯 + 零度可乐，均衡之选',       tags: ['推荐'], opts: 'set' },
  { id: 'm4', cat: 'sign', name: '1024 程序员快乐三件套', emoji: '🎉', price: 40.9, kcal: 1180, desc: '巨无霸 + 大薯条 + 零度可乐，写码续航天花板（1024 限定）', tags: ['限定'], opts: 'set' },

  /* ---- 汉堡 ---- */
  { id: 'b1', cat: 'burger', name: '巨无霸',         emoji: '🍔', price: 25.5, kcal: 550, desc: '两块牛肉饼 + 特调酱料，1968 年至今的传奇', tags: ['人气'], opts: 'burger' },
  { id: 'b2', cat: 'burger', name: '麦辣鸡腿堡',     emoji: '🌶️', price: 24.5, kcal: 560, desc: '整块鸡腿肉，外酥里嫩，辣度在线',           tags: ['人气', '辣'], opts: 'burger' },
  { id: 'b3', cat: 'burger', name: '板烧鸡腿堡',     emoji: '🍗', price: 26.5, kcal: 430, desc: '滑嫩多汁的板烧腿排，酱汁不抢戏',           tags: [], opts: 'burger' },
  { id: 'b4', cat: 'burger', name: '双层吉士汉堡',   emoji: '🧀', price: 15.5, kcal: 450, desc: '双层牛肉 + 双层吉士，小身材大满足',         tags: [], opts: 'burger' },
  { id: 'b5', cat: 'burger', name: '麦香鱼',         emoji: '🐟', price: 15.0, kcal: 340, desc: '深海鳕鱼排 + 塔塔酱，清淡温柔派',           tags: [], opts: 'burger' },
  { id: 'b6', cat: 'burger', name: '不素之霸厚牛堡', emoji: '🥩', price: 31.0, kcal: 590, desc: '安格斯厚牛肉饼，肉食动物的答案',           tags: ['新品'], opts: 'burger' },

  /* ---- 小食 ---- */
  { id: 's1', cat: 'side', name: '薯条',          emoji: '🍟', price: 13.5, kcal: 330, desc: '金黄酥脆，世界级经典小食没有之一',     tags: ['人气'], opts: 'fries' },
  { id: 's2', cat: 'side', name: '麦辣鸡翅(2块)', emoji: '🍗', price: 12.5, kcal: 260, desc: '表皮焦香爆汁，辣味直冲天灵盖',         tags: ['辣'], opts: null },
  { id: 's3', cat: 'side', name: '麦乐鸡(5块)',   emoji: '🍖', price: 12.0, kcal: 250, desc: '四种形状一次集齐，蘸酱自由搭配',       tags: ['人气'], opts: 'sauce' },
  { id: 's4', cat: 'side', name: '香脆苹果派',    emoji: '🥧', price: 8.5,  kcal: 230, desc: '酥皮滚烫，苹果馅酸甜流心，小心烫嘴',   tags: [], opts: null },
  { id: 's5', cat: 'side', name: '蔬菜色拉',      emoji: '🥗', price: 15.0, kcal: 110, desc: '轻松无负担，给放纵的一餐留点余地',     tags: ['轻食'], opts: null },

  /* ---- 麦咖啡 McCafé ---- */
  { id: 'c1', cat: 'coffee', name: '拿铁',       emoji: '🥛', price: 21.0, kcal: 180, desc: '意式浓缩 + 丝滑牛奶，奶咖界的六边形战士', tags: ['人气'], opts: 'coffee' },
  { id: 'c2', cat: 'coffee', name: '卡布奇诺',   emoji: '☕', price: 21.0, kcal: 140, desc: '绵密奶泡盖满杯口，先甜后苦刚刚好',       tags: [], opts: 'coffee' },
  { id: 'c3', cat: 'coffee', name: '美式咖啡',   emoji: '☕', price: 16.0, kcal: 10,  desc: '纯粹咖啡因补给，续命刚需',               tags: ['0糖'], opts: 'coffee' },
  { id: 'c4', cat: 'coffee', name: '焦糖玛奇朵', emoji: '🍯', price: 23.0, kcal: 250, desc: '焦糖淋面 + 香草奶香，下午茶的甜',         tags: ['新品'], opts: 'coffee' },
  { id: 'c5', cat: 'coffee', name: '比利时黑巧摩卡', emoji: '🍫', price: 24.0, kcal: 300, desc: '黑巧融化在浓缩里，微苦不腻的奢华',   tags: [], opts: 'coffee' },

  /* ---- 饮品 ---- */
  { id: 'd1', cat: 'drink', name: '可口可乐(中杯)', emoji: '🥤', price: 11.0, kcal: 200, desc: '经典快乐水，气泡上头',     tags: ['人气'], opts: 'drink' },
  { id: 'd2', cat: 'drink', name: '零度可口可乐',   emoji: '🥤', price: 11.5, kcal: 0,   desc: '快乐不减，糖分为零',       tags: ['0糖'], opts: 'drink' },
  { id: 'd3', cat: 'drink', name: '阳光橙汁',       emoji: '🍊', price: 13.5, kcal: 150, desc: '阳光榨出来的维 C 炸弹',   tags: [], opts: 'drink' },
  { id: 'd4', cat: 'drink', name: '冰鲜柠檬水',     emoji: '🍋', price: 12.0, kcal: 80,  desc: '真柠檬片在手，酸甜透心凉', tags: ['人气'], opts: 'drink' },

  /* ---- 甜品 ---- */
  { id: 't1', cat: 'dessert', name: '草莓圣代',       emoji: '🍓', price: 13.0, kcal: 280, desc: '草莓酱淋出粉红心情',       tags: ['人气'], opts: null },
  { id: 't2', cat: 'dessert', name: '圆筒冰淇淋',     emoji: '🍦', price: 6.5,  kcal: 150, desc: '几块钱买到的纯粹快乐',     tags: [], opts: null },
  { id: 't3', cat: 'dessert', name: '巧克力圣代',     emoji: '🍫', price: 13.0, kcal: 300, desc: '浓郁巧克力酱，甜党狂喜',   tags: [], opts: null },
  { id: 't4', cat: 'dessert', name: '奥利奥麦旋风',   emoji: '🍨', price: 15.5, kcal: 340, desc: '饼干碎拌进冰淇淋，一勺一重奏', tags: ['人气'], opts: null },

  /* ---- 早餐(10:30 前) ---- */
  { id: 'k1', cat: 'breakfast', name: '猪柳蛋麦满分', emoji: '🍳', price: 16.0, kcal: 380, desc: '炒蛋 + 猪柳 + 吉士，早八人的救赎',     tags: ['人气'], opts: null },
  { id: 'k2', cat: 'breakfast', name: '吉士蛋麦满分', emoji: '🧇', price: 13.5, kcal: 310, desc: '松软麦满分裹着滑蛋，轻盈开局',         tags: [], opts: null },
  { id: 'k3', cat: 'breakfast', name: '脆薯饼',       emoji: '🥔', price: 6.5,  kcal: 150, desc: '外脆内糯，早餐锦上添花',               tags: [], opts: null },
  { id: 'k4', cat: 'breakfast', name: '热香饼(2块)',  emoji: '🥞', price: 13.0, kcal: 350, desc: '淋枫糖浆的美式早晨',                   tags: [], opts: null },
  { id: 'k5', cat: 'breakfast', name: '鲜煮咖啡',     emoji: '☕', price: 12.0, kcal: 10,  desc: '现煮醒神，开启高效一天',               tags: [], opts: 'coffeeHot' },
];

/* 定制模板：options 数组第一项为默认项；p 为加价(元) */
const OPTION_GROUPS = {
  burger: [
    { key: 'onion',  name: '洋葱', options: [ { k: 'norm',  n: '正常', p: 0 }, { k: 'none', n: '不要洋葱', p: 0 } ] },
    { key: 'extra',  name: '加料', options: [ { k: 'none',   n: '不加', p: 0 }, { k: 'cheese', n: '+芝士片', p: 2 }, { k: 'bacon',  n: '+培根', p: 3 } ] },
  ],
  fries: [
    { key: 'size',  name: '份量', options: [ { k: 'm', n: '中份', p: 0 }, { k: 'l', n: '大份', p: 3 } ] },
    { key: 'sauce', name: '蘸酱', options: [ { k: 'ketchup', n: '番茄酱', p: 0 }, { k: 'sour', n: '酸甜酱', p: 0 }, { k: 'none', n: '不要酱', p: 0 } ] },
  ],
  sauce: [
    { key: 'sauce', name: '蘸酱', options: [ { k: 'ketchup', n: '番茄酱', p: 0 }, { k: 'sour', n: '酸甜酱', p: 0 }, { k: 'curry', n: '咖喱酱', p: 0 } ] },
  ],
  drink: [
    { key: 'size', name: '杯型', options: [ { k: 'm', n: '中杯', p: 0 }, { k: 'l', n: '大杯', p: 2 } ] },
    { key: 'ice',  name: '冰量', options: [ { k: 'norm', n: '正常冰', p: 0 }, { k: 'less', n: '少冰', p: 0 }, { k: 'none', n: '去冰', p: 0 } ] },
  ],
  coffee: [
    { key: 'size',  name: '杯型', options: [ { k: 'm', n: '中杯', p: 0 }, { k: 'l', n: '大杯', p: 3 } ] },
    { key: 'sugar', name: '糖度', options: [ { k: 'std', n: '标准糖', p: 0 }, { k: 'half', n: '半糖', p: 0 }, { k: 'none', n: '无糖', p: 0 } ] },
    { key: 'temp',  name: '温度', options: [ { k: 'hot', n: '热', p: 0 }, { k: 'ice', n: '冰', p: 0 } ] },
  ],
  coffeeHot: [
    { key: 'temp', name: '温度', options: [ { k: 'hot', n: '热', p: 0 }, { k: 'ice', n: '冰', p: 0 } ] },
  ],
  set: [
    { key: 'drink', name: '配餐饮料', options: [ { k: 'cola',  n: '中杯可乐', p: 0 }, { k: 'zero',  n: '零度可乐', p: 0 }, { k: 'oj',    n: '阳光橙汁', p: 2 }, { k: 'lem',   n: '冰鲜柠檬水', p: 2 } ] },
    { key: 'side',  name: '小食升级', options: [ { k: 'fries', n: '中薯条', p: 0 }, { k: 'lfries', n: '大薯条', p: 3 }, { k: 'nugget', n: '麦乐鸡5块', p: 4 } ] },
  ],
};

/* 标签 → 徽章配色 class（style.css 内定义） */
const TAG_CLASSES = { '人气': 'hot', '新品': 'new', '辣': 'spicy', '轻食': 'lite', '0糖': 'zero', '限定': 'limited', '推荐': 'reco' };
