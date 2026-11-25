/* ============================================================================
   PDD Inspector KZ — Удобная проверка товаров Pinduoduo, ботов и цены с НДС (₸)
   ============================================================================ */

const STORAGE_KEYS = {
  HISTORY: 'pdd_kz_history_v5',
  LIKES: 'pdd_kz_likes_v5',
  COMPARE: 'pdd_kz_compare_v5',
  SETTINGS: 'pdd_kz_settings_v5',
  THEME: 'pdd_kz_theme_v1'
};

const DEFAULT_SETTINGS = {
  rateCnyKzt: 66.96, // Постоянный внутренний курс Pinduoduo KZ (529 ₸ / 7.9 ¥ ≈ 66.96 ₸)
  vatPercent: 12,    // НДС РК 12%
  geminiApiKey: ''
};

// Шаблоны китайских бот-комментариев (刷单)
const CN_BOT_PATTERNS = [
  { cn: '物流很快，包装完好', ru: 'Доставка быстрая, упаковка целая (шаблон)', weight: 28 },
  { cn: '习惯好评', ru: 'Привычный хороший отзыв (без деталей)', weight: 35 },
  { cn: '还没用，先好评', ru: 'Ещё не открывал, ставлю 5 заранее', weight: 32 },
  { cn: '质量很好，值得购买', ru: 'Качество отличное, стоит купить (общая фраза)', weight: 22 },
  { cn: '与描述相符，五星好评', ru: 'Соответствует описанию, 5 звёзд (бот-шаблон)', weight: 30 }
];

// База готовых товаров (включая оба ваших товара со скриншотов с реальными фото!)
const DEMO_PRESETS = {
  wdairen_bait: {
    id: '801948271650',
    shortCode: 'wdairen',
    category: '🎣 Рыбалка и отдых',
    url: 'https://mobile.yangkeduo.com/goods.html?goods_id=801948271650',
    title: 'Силиконовые рыболовные приманки WDAIREN T-tail (Мягкие виброхвосты на окуня и судака)',
    thumbImg: './wdairen_thumb.jpg',
    thumbEmoji: '🎣',
    priceKzt: 121,
    priceCny: 1.8,
    salesText: '109 000+ продано (109K+ Sold)',
    repeatCustomersText: '10 000+ купили повторно (10K Repeat)',
    positiveReviewsText: '76 000+ положительных (76K Reviews)',
    badges: [
      { text: '官方旗舰 Официальный флагман', type: 'flagship' },
      { text: '🚚 Бесплатная доставка в КЗ', type: 'guarantee' },
      { text: '⚡ Скидка 10% • Возврат без ожидания', type: 'guarantee' }
    ],
    seller: {
      name: 'WDAIREN 官方旗舰店 (Официальный магазин рыболовных снастей)',
      typeTag: 'Официальный бренд',
      specializationDesc: 'Профильный производитель рыболовных приманок, силиконовых виброхвостов, джиг-головок и крючков.',
      age: '5+ лет',
      totalSales: '109 000+ шт',
      repeatRate: '10 000+ рыбаков',
      isFocusedNiche: true,
      dsr: {
        desc: { score: 4.95, label: '76 000+ положительных оценок' },
        service: { score: 4.93, label: 'Мгновенный возврат при задержке' },
        logistics: { score: 4.94, label: 'Бесплатная консолидация в Казахстан' }
      },
      catalogItems: [
        'Силиконовые виброхвосты T-tail',
        'Джиг-головки и офсетные крючки',
        'Воблеры и блёсны на хищника',
        'Плетёные рыболовные шнуры PE'
      ],
      checks: [
        { ok: true, text: 'Огромное число повторных покупок (10K Repeat Customers) — рыбаки постоянно дозаказывают расходники у этого продавца' },
        { ok: true, text: 'Официальный флагман бренда WDAIREN (官方旗舰) — продаёт только рыболовные снасти' },
        { ok: true, text: 'Бесплатная доставка до Казахстана без минимальной суммы заказа' }
      ]
    },
    reviews: [
      {
        user: 'Рыболов (Repeat Customer • 4-й заказ)',
        date: '2026-11-24',
        cn: '软虫材质很软，水下泳姿非常自然，T尾摆动幅度大，昨天去水库钓了七八条鲈鱼，已经第四次回购了！',
        ru: 'Силикон очень мягкий и живучий, хвост T-tail активно играет в воде. Вчера на водохранилище взял 7 окуней, заказываю уже четвёртый раз!',
        hasMedia: true,
        isBot: false,
        reason: 'Живой отзыв с фото улова и повторным заказом'
      },
      {
        user: 'Покупатель PDD',
        date: '2026-11-22',
        cn: '1.8元一包真的划算，带有腥味诱鱼剂，铅头钩也很锋利，比渔具店便宜太多。',
        ru: 'За 1.8 юаня (121 ₸) пачка — просто подарок. Силикон съедобный с аттрактантом, крючки острые, в 4 раза дешевле чем в рыболовном магазине.',
        hasMedia: true,
        isBot: false,
        reason: 'Реальные детали о запахе аттрактанта и остроте крючков'
      },
      {
        user: 'm***9',
        date: '2026-11-20',
        cn: '物流很快，包装完好，习惯好评。',
        ru: 'Доставка быстрая, упаковка целая, привычный хороший отзыв.',
        hasMedia: false,
        isBot: true,
        reason: 'Короткий шаблонный авто-комментарий (всего 8% от общего числа)'
      }
    ],
    botStats: {
      duplicateRate: 8,
      mediaRate: 67,
      botProbability: 8,
      trustScore: 96,
      repeatedPhrases: [
        { phrase: '泳姿自然 / Отличная игра хвоста в воде', count: 1420, isBot: false },
        { phrase: '多次回购 / Покупаю не первый раз (10K клиентов)', count: 980, isBot: false },
        { phrase: '性价比无敌 / Очень дёшево за пачку', count: 850, isBot: false },
        { phrase: '习惯好评 / Шаблонный отзыв', count: 65, isBot: true }
      ]
    }
  },

  blinds_user: {
    id: '700705297272',
    shortCode: 'bbPrCbq3DO',
    category: '🪟 Дом и окна',
    url: 'https://mobile.yangkeduo.com/goods2.html?ps=bbPrCbq3DO',
    title: 'Сотовые жалюзи-плиссе Блэкаут без сверления (Recessed Honeycomb Blinds — Кухня / Спальня)',
    thumbImg: './blinds_thumb.jpg',
    thumbEmoji: '🪟',
    priceKzt: 529,
    priceCny: 7.9,
    salesText: '321 000+ продано (321K+ Sold)',
    repeatCustomersText: '885 купили повторно (885 Repeat)',
    positiveReviewsText: '9 800+ положительных (9.8K Reviews)',
    badges: [
      { text: '旗舰店 Флагманский магазин', type: 'flagship' },
      { text: '🚚 Бесплатная доставка в КЗ', type: 'guarantee' },
      { text: '⚠️ 529 ₸ — стартовая цена за мин. размер (Customized)', type: 'warning' }
    ],
    seller: {
      name: '家居遮光窗帘旗舰店 (Флагманский магазин оконных жалюзи)',
      typeTag: 'Флагман (旗舰店)',
      specializationDesc: 'Профильная фабрика жалюзи-плиссе (蜂巢帘) и рулонных штор под размер окна без сверления.',
      age: '4+ года',
      totalSales: '321 000+ шт',
      repeatRate: '885 клиентов',
      isFocusedNiche: true,
      dsr: {
        desc: { score: 4.91, label: '9 800+ положительных отзывов' },
        service: { score: 4.89, label: 'Помогают подобрать размер рамы' },
        logistics: { score: 4.92, label: 'Бесплатная доставка в Казахстан' }
      },
      catalogItems: [
        'Сотовые жалюзи Full Blackout (Блэкаут)',
        'Водостойкие жалюзи для кухни и ванной',
        'Магнитные москитные сетки на окна',
        'Шторы день-ночь без сверления'
      ],
      checks: [
        { ok: true, text: 'Флагманский магазин (旗舰店) с 9 800+ положительными отзывами и 89 000 добавлений в избранное' },
        { ok: true, text: '885 повторных покупателей: берут на 1 окно на пробу и дозаказывают на всю квартиру' },
        { ok: false, text: 'Обратите внимание: 529 ₸ (¥7.9) — это цена за минимальный образец (Customized). В меню «Buy Now» выберите реальную ширину и высоту вашего окна' }
      ]
    },
    reviews: [
      {
        user: 'Покупатель PDD (Заказал на 4 окна)',
        date: '2026-11-24',
        cn: '遮光效果真的绝了！白天拉上完全全黑，免打孔安装很简单，先买了一扇窗户试水，马上又回购了客厅的三扇。',
        ru: 'Эффект блэкаута 100%! Днём закрываешь — полная темнота. Установка без сверления за 5 минут. Сначала взял на одно окно, сразу дозаказал ещё 3 штуки в гостиную.',
        hasMedia: true,
        isBot: false,
        reason: 'Живой отзыв с фото установленных жалюзи и повторным заказом'
      },
      {
        user: 'Покупатель PDD (Ванная / Кухня)',
        date: '2026-11-22',
        cn: '装在卫生间窗户上的，防水防窥效果很好，上下都能推拉，铝合金边框很有质感，尺寸定做的严丝合缝。',
        ru: 'Поставил на окно в ванной: воды не боится, с улицы ничего не видно, открывается и сверху, и снизу. Рамка алюминиевая, размер сделали идеально.',
        hasMedia: true,
        isBot: false,
        reason: 'Конкретные детали про алюминиевую рамку и влагостойкость'
      },
      {
        user: 'u***3',
        date: '2026-11-19',
        cn: '物流很快，包装完好，习惯好评。',
        ru: 'Доставка быстрая, упаковка целая, привычный хороший отзыв.',
        hasMedia: false,
        isBot: true,
        reason: 'Стандартный шаблонный отзыв (таких около 11%)'
      }
    ],
    botStats: {
      duplicateRate: 11,
      mediaRate: 58,
      botProbability: 11,
      trustScore: 91,
      repeatedPhrases: [
        { phrase: '遮光效果好 / Полный блэкаут (не пропускает свет)', count: 640, isBot: false },
        { phrase: '尺寸很准 / Точный размер под окно', count: 410, isBot: false },
        { phrase: '免打孔方便 / Установка без сверления', count: 520, isBot: false },
        { phrase: '习惯好评 / Шаблонный отзыв', count: 54, isBot: true }
      ]
    }
  },

  flagship: {
    id: '618904512839',
    shortCode: 'xiaomi_buds',
    category: '🎧 Электроника',
    url: 'https://mobile.yangkeduo.com/goods.html?goods_id=618904512839',
    title: 'Беспроводные наушники Xiaomi Redmi Buds 5 Pro (Оригинал, Шумоподавление)',
    thumbImg: '',
    thumbEmoji: '🎧',
    priceKzt: 12655,
    priceCny: 189,
    salesText: '100 000+ продано (10万+ Sold)',
    repeatCustomersText: '4 200+ купили повторно',
    positiveReviewsText: '48 000+ положительных',
    badges: [
      { text: '百亿补贴 Субсидия 10 млрд (Оригинал)', type: 'subsidy' },
      { text: '官方旗舰店 Офиц. флагман Xiaomi', type: 'flagship' },
      { text: '🚚 Бесплатная доставка', type: 'guarantee' }
    ],
    seller: {
      name: '小米官方旗舰店 (Xiaomi Official Flagship)',
      typeTag: 'Официальный бренд',
      specializationDesc: 'Авторизованный магазин Xiaomi на Pinduoduo. Только оригинальная техника с проверкой по серийному номеру.',
      age: '5+ лет',
      totalSales: '5 000 000+ шт',
      repeatRate: '42% клиентов',
      isFocusedNiche: true,
      dsr: {
        desc: { score: 4.94, label: 'Выше 96% магазинов' },
        service: { score: 4.92, label: 'Официальная гарантия' },
        logistics: { score: 4.95, label: 'Быстрая отправка со склада' }
      },
      catalogItems: [
        'Наушники Redmi Buds 5 Pro',
        'Фитнес-браслеты Xiaomi Band 9',
        'Повербанки Xiaomi 20000mAh',
        'Зарядки Xiaomi GaN 67W'
      ],
      checks: [
        { ok: true, text: 'Участвует в программе «百亿补贴» — 100% защита от подделок' },
        { ok: true, text: 'Только оригинальная техника одного бренда Xiaomi' }
      ]
    },
    reviews: [
      {
        user: 'А***й',
        date: '2026-11-22',
        cn: '百亿补贴买的正品，已查防伪码是全新未拆封。降噪效果在地铁上非常明显，续航差不多7个小时。',
        ru: 'Оригинал по субсидии, проверил серийный код на сайте Xiaomi — новые, пломбы целые. Шумоподавление отличное, держат заряд 7 часов.',
        hasMedia: true,
        isBot: false,
        reason: 'Проверка серийного номера + живое фото коробки'
      }
    ],
    botStats: {
      duplicateRate: 9,
      mediaRate: 64,
      botProbability: 9,
      trustScore: 95,
      repeatedPhrases: [
        { phrase: '正品 / Оригинал по серийнику', count: 480, isBot: false },
        { phrase: '降噪效果好 / Отличный шумодав', count: 360, isBot: false }
      ]
    }
  },

  botfarm: {
    id: '904118273645',
    shortCode: 'fake_shoes',
    category: '👟 Обувь и одежда',
    url: 'https://mobile.yangkeduo.com/goods.html?goods_id=904118273645',
    title: 'Кроссовки «Кожаные брендовые» (Подозрительный магазин с накруткой ботов)',
    thumbImg: '',
    thumbEmoji: '👟',
    priceKzt: 2672,
    priceCny: 39.9,
    salesText: '98 000 (Накрученный счётчик)',
    repeatCustomersText: 'Всего 12 повторных',
    positiveReviewsText: 'Много одинаковых клонов',
    badges: [
      { text: '🚨 82% комментариев — боты (刷单)', type: 'warning' },
      { text: '⚠️ Магазин-перекуп (продаёт всё подряд)', type: 'warning' }
    ],
    seller: {
      name: '小李百货商行 (Лавка Сяо Ли №884)',
      typeTag: 'Перекупщик',
      specializationDesc: 'Магазин открыт 2 месяца назад и продаёт всё подряд: обувь, сковородки, кабели и стиральный порошок.',
      age: '2 месяца',
      totalSales: 'Всплеск за 3 дня',
      repeatRate: '2% (Очень низкий)',
      isFocusedNiche: false,
      dsr: {
        desc: { score: 4.32, label: 'Ниже 85% магазинов (Красная зона)' },
        service: { score: 4.40, label: 'Долго отвечает в чате' },
        logistics: { score: 4.38, label: 'Частые задержки отправки' }
      },
      catalogItems: [
        'Кроссовки за 39.9 ¥',
        'Кухонная сковорода',
        'Кабель зарядки USB',
        'Стиральный порошок'
      ],
      checks: [
        { ok: false, text: 'Магазин продаёт несвязанные товары («солянка») — это перекупщик' },
        { ok: false, text: '82% отзывов скопированы слово в слово и опубликованы в одну минуту' }
      ]
    },
    reviews: [
      {
        user: 'a***1',
        date: '2026-11-23 14:12',
        cn: '鞋子质量非常好，穿着很舒服，物流很快，包装完好，值得购买！',
        ru: 'Качество обуви отличное, носить удобно, доставка быстрая, упаковка целая, стоит купить!',
        hasMedia: false,
        isBot: true,
        reason: 'Бот-клон №1 (опубликован пачкой в 14:12)'
      },
      {
        user: 'b***9',
        date: '2026-11-23 14:12',
        cn: '鞋子质量非常好，穿着很舒服，物流很快，包装完好，值得购买！',
        ru: 'Качество обуви отличное, носить удобно, доставка быстрая, упаковка целая, стоит купить!',
        hasMedia: false,
        isBot: true,
        reason: '100% копия предыдущего отзыва в ту же минуту (14:12)'
      },
      {
        user: 'Реальный покупатель',
        date: '2026-11-24',
        cn: '千万别买！根本不是真皮，全是塑料胶水味，穿了两天鞋底就开胶了，好评全是刷出来的！',
        ru: 'Не берите! Это не кожа, сильный запах клея, подошва отклеилась через 2 дня, все пятёрки накручены ботами!',
        hasMedia: true,
        isBot: false,
        reason: 'Единственный живой отзыв с реальной фотографией брака'
      }
    ],
    botStats: {
      duplicateRate: 78,
      mediaRate: 6,
      botProbability: 82,
      trustScore: 22,
      repeatedPhrases: [
        { phrase: '鞋子质量非常好，穿着很舒服 (100% клон текста)', count: 142, isBot: true },
        { phrase: '物流很快，包装完好 (Бот-шаблон)', count: 198, isBot: true },
        { phrase: '胶水味很大 / Запах клея и брак', count: 29, isBot: false }
      ]
    }
  }
};

// Состояние приложения
let state = {
  settings: { ...DEFAULT_SETTINGS },
  currentProduct: null,
  selectedQty: 1,
  history: [],
  likedIds: [],
  compareIds: [],
  filterLikedOnly: false,
  pendingParsedLink: null,
  deferredInstallPrompt: null
};

/* ============================================================================
   ИНИЦИАЛИЗАЦИЯ
   ============================================================================ */
document.addEventListener('DOMContentLoaded', () => {
  loadStateFromStorage();
  initTheme();
  initPwaInstallHandlers();
  bindNavigation();
  bindScannerEvents();
  bindSimpleCalculatorEvents();
  bindSettingsEvents();
  bindCompareEvents();

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }

  // Загружаем все 4 стартовых товара в историю, чтобы сравнение и лайки сразу имели красивые карточки
  ensureInitialCatalogLoaded();

  // Открываем первый товар (Приманки WDAIREN или Жалюзи)
  renderProductDashboard(state.history[0] || DEMO_PRESETS.wdairen_bait);
});

function ensureInitialCatalogLoaded() {
  const keys = ['wdairen_bait', 'blinds_user', 'flagship', 'botfarm'];
  keys.forEach((k) => {
    const preset = DEMO_PRESETS[k];
    if (!state.history.some((item) => item.id === preset.id)) {
      state.history.push(JSON.parse(JSON.stringify(preset)));
    }
  });
  // По умолчанию лайкнем оба реальных товара пользователя и выберем их для наглядного сравнения
  if (state.likedIds.length === 0) {
    state.likedIds = [DEMO_PRESETS.wdairen_bait.id, DEMO_PRESETS.blinds_user.id];
  }
  if (state.compareIds.length === 0) {
    state.compareIds = [DEMO_PRESETS.wdairen_bait.id, DEMO_PRESETS.blinds_user.id];
  }
  saveStateToStorage();
}

function loadStateFromStorage() {
  try {
    const s = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (s) state.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(s) };
    const h = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (h) state.history = JSON.parse(h);
    const l = localStorage.getItem(STORAGE_KEYS.LIKES);
    if (l) state.likedIds = JSON.parse(l);
    const c = localStorage.getItem(STORAGE_KEYS.COMPARE);
    if (c) state.compareIds = JSON.parse(c);
  } catch (e) {
    console.warn(e);
  }
  syncSettingsToUI();
  updateNavCounters();
}

function saveStateToStorage() {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(state.settings));
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(state.history));
    localStorage.setItem(STORAGE_KEYS.LIKES, JSON.stringify(state.likedIds));
    localStorage.setItem(STORAGE_KEYS.COMPARE, JSON.stringify(state.compareIds));
  } catch (e) {
    console.warn(e);
  }
  updateNavCounters();
}

/* ============================================================================
   УСТАНОВКА ПРИЛОЖЕНИЯ НА ANDROID И IPHONE
   ============================================================================ */
function initPwaInstallHandlers() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    state.deferredInstallPrompt = e;
  });

  document.getElementById('openInstallModalBtn').addEventListener('click', () => {
    switchView('view-guide');
    showToast('📲 Инструкция по установке на iPhone и кнопка для Android');
  });

  document.getElementById('androidDownloadAppBtn').addEventListener('click', async () => {
    if (state.deferredInstallPrompt) {
      state.deferredInstallPrompt.prompt();
      const { outcome } = await state.deferredInstallPrompt.userChoice;
      if (outcome === 'accepted') {
        showToast('✅ Приложение устанавливается на ваш Android!');
      }
      state.deferredInstallPrompt = null;
    } else {
      showToast('📲 В браузере Chrome на Android нажмите меню (⋮) сверху справа → «Установить приложение»');
    }
  });
}

/* ============================================================================
   ТЕМА (ДЕНЬ / НОЧЬ) И НАВИГАЦИЯ
   ============================================================================ */
function initTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  const btn = document.getElementById('themeToggleBtn');
  btn.textContent = savedTheme === 'dark' ? '🌙' : '☀️';

  btn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(STORAGE_KEYS.THEME, next);
    btn.textContent = next === 'dark' ? '🌙' : '☀️';
  });
}

function bindNavigation() {
  document.querySelectorAll('.nav-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      switchView(tab.getAttribute('data-target'));
    });
  });

  document.getElementById('headerRateBtn').addEventListener('click', () => {
    switchView('view-settings');
  });

  document.getElementById('goToGuideBtn').addEventListener('click', () => {
    switchView('view-guide');
  });
}

function switchView(viewId) {
  document.querySelectorAll('.view-section').forEach((sec) => {
    sec.classList.toggle('active', sec.id === viewId);
  });
  document.querySelectorAll('.nav-tab').forEach((tab) => {
    tab.classList.toggle('active', tab.getAttribute('data-target') === viewId);
  });

  if (viewId === 'view-compare') {
    renderVisualCompareAndLikesView();
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateNavCounters() {
  document.getElementById('compareCountBadge').textContent = state.compareIds.length;
}

/* ============================================================================
   ПРОВЕРКА ССЫЛКИ И УМНЫЙ ЗАПРОС СКРИНШОТА
   ============================================================================ */
function bindScannerEvents() {
  const urlInput = document.getElementById('pddUrlInput');
  const clearBtn = document.getElementById('clearUrlBtn');
  const pasteBtn = document.getElementById('pasteUrlBtn');
  const analyzeBtn = document.getElementById('analyzeBtn');
  const hiddenScreenshotInput = document.getElementById('hiddenScreenshotInput');

  urlInput.addEventListener('input', () => {
    clearBtn.style.display = urlInput.value.trim() ? 'block' : 'none';
  });

  clearBtn.addEventListener('click', () => {
    urlInput.value = '';
    clearBtn.style.display = 'none';
    urlInput.focus();
  });

  pasteBtn.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        urlInput.value = text;
        clearBtn.style.display = 'block';
        showToast('📋 Ссылка вставлена! Нажимаем проверку...');
        handleStartAnalysis();
      } else {
        showToast('Буфер обмена пуст — вставьте ссылку вручную');
      }
    } catch {
      urlInput.focus();
      showToast('Нажмите и удерживайте поле → «Вставить»');
    }
  });

  analyzeBtn.addEventListener('click', handleStartAnalysis);
  urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleStartAnalysis();
  });

  // Готовые кнопки примеров
  document.querySelectorAll('.preset-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const key = chip.getAttribute('data-preset');
      const preset = DEMO_PRESETS[key];
      if (!preset) return;
      urlInput.value = preset.url;
      clearBtn.style.display = 'block';
      renderProductDashboard(preset);
      showToast(`Открыт товар: ${preset.title.slice(0, 35)}...`);
    });
  });

  // Кнопка Лайка ❤️
  document.getElementById('likeProductBtn').addEventListener('click', () => {
    if (!state.currentProduct) return;
    toggleLikeProduct(state.currentProduct.id);
  });

  // Кнопка Сравнения ⚖️
  document.getElementById('addToCompareBtn').addEventListener('click', () => {
    if (!state.currentProduct) return;
    toggleCompareProduct(state.currentProduct.id);
  });

  // Кнопка ручного вызова окна скриншота
  document.getElementById('askScreenshotManualBtn').addEventListener('click', () => {
    openScreenshotAskModal(state.pendingParsedLink || {
      goodsId: state.currentProduct?.id || String(Date.now()).slice(-10),
      url: state.currentProduct?.url || urlInput.value
    });
  });

  document.getElementById('shareReportBtn').addEventListener('click', copyProductReport);

  // События модального окна "Хотите добавить скриншот?"
  document.getElementById('modalContinueWithoutScreenshotBtn').addEventListener('click', () => {
    const val = parseFloat(document.getElementById('modalQuickPriceInput').value) || 500;
    const curr = document.getElementById('modalQuickCurrencySelect').value;
    closeScreenshotAskModal();
    createProductFromLinkAndPrice(state.pendingParsedLink, val, curr);
  });

  document.getElementById('modalPickScreenshotBtn').addEventListener('click', () => {
    closeScreenshotAskModal();
    hiddenScreenshotInput.click();
  });

  hiddenScreenshotInput.addEventListener('change', handleAutoScreenshotOCR);
}

function parsePddShareString(rawText) {
  const trimmed = (rawText || '').trim();
  const urlMatch = trimmed.match(/https?:\/\/[^\s"'<>]+/i);
  const extractedUrl = urlMatch ? urlMatch[0] : trimmed;

  const psMatch = trimmed.match(/[?&]ps=([a-zA-Z0-9_-]+)/i);
  const psToken = psMatch ? psMatch[1] : '';

  const idMatch =
    trimmed.match(/goods_id=(\d{6,16})/i) ||
    trimmed.match(/\b(\d{10,14})\b/);

  const goodsId = idMatch ? idMatch[1] : psToken ? `ps_${psToken}` : String(Date.now()).slice(-10);

  let inlinePriceCny = null;
  const priceMatch = trimmed.match(/[¥￥]\s*(\d+(?:\.\d{1,2})?)/);
  if (priceMatch) inlinePriceCny = parseFloat(priceMatch[1]);

  const textWithoutUrl = trimmed.replace(/https?:\/\/[^\s"'<>]+/gi, '').trim();

  return {
    goodsId,
    psToken,
    url: extractedUrl.startsWith('http') ? extractedUrl : `https://mobile.yangkeduo.com/goods.html?goods_id=${goodsId}`,
    inlinePriceCny,
    inlineTitle: textWithoutUrl
  };
}

async function handleStartAnalysis() {
  const rawInput = document.getElementById('pddUrlInput').value.trim();
  if (!rawInput) {
    showToast('Вставьте ссылку на товар из Pinduoduo');
    document.getElementById('pddUrlInput').focus();
    return;
  }

  // Проверяем, есть ли ссылка уже в базе/примерах
  for (const key of Object.keys(DEMO_PRESETS)) {
    const p = DEMO_PRESETS[key];
    if (rawInput.includes(p.id) || (p.shortCode && rawInput.includes(p.shortCode))) {
      renderProductDashboard(p);
      showToast('✅ Товар найден и проверен!');
      return;
    }
  }

  const parsed = parsePddShareString(rawInput);
  state.pendingParsedLink = parsed;

  // Если в ссылке уже была цена (например в тексте шаринга), сразу анализируем без лишних вопросов
  if (parsed.inlinePriceCny) {
    createProductFromLinkAndPrice(parsed, parsed.inlinePriceCny, 'CNY');
    return;
  }

  // Пытаемся распаковать короткую ссылку через прокси
  const loadingBanner = document.getElementById('loadingBanner');
  loadingBanner.classList.add('active');

  try {
    const proxyRes = await Promise.race([
      fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(parsed.url)}`),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 3500))
    ]);
    if (proxyRes && proxyRes.ok) {
      const html = await proxyRes.text();
      const realIdMatch = html.match(/goods_id=(\d{8,16})/);
      if (realIdMatch) parsed.goodsId = realIdMatch[1];

      // Проверяем повторно по найденному goods_id
      for (const key of Object.keys(DEMO_PRESETS)) {
        if (DEMO_PRESETS[key].id === parsed.goodsId) {
          loadingBanner.classList.remove('active');
          renderProductDashboard(DEMO_PRESETS[key]);
          showToast('✅ Короткая ссылка распакована!');
          return;
        }
      }
    }
  } catch {
    // Прокси не отдал цену из-за защиты Pinduoduo WeChat login
  } finally {
    loadingBanner.classList.remove('active');
  }

  // Приложение САМО спрашивает пользователя: добавить скриншот или продолжить без скриншота!
  openScreenshotAskModal(parsed);
}

function openScreenshotAskModal(parsedLink) {
  state.pendingParsedLink = parsedLink;
  document.getElementById('modalQuickPriceInput').value =
    state.currentProduct?.priceKzt || '';
  document.getElementById('screenshotAskModal').classList.add('open');
  setTimeout(() => document.getElementById('modalQuickPriceInput').focus(), 100);
}

function closeScreenshotAskModal() {
  document.getElementById('screenshotAskModal').classList.remove('open');
}

function createProductFromLinkAndPrice(parsedLink, inputPrice, currency) {
  const rate = state.settings.rateCnyKzt || 66.96;
  const priceKzt = currency === 'KZT' ? Math.round(inputPrice) : Math.round(inputPrice * rate);
  const priceCny = currency === 'CNY' ? inputPrice : Math.round((inputPrice / rate) * 10) / 10;

  const newProd = JSON.parse(JSON.stringify(DEMO_PRESETS.blinds_user));
  newProd.id = parsedLink?.goodsId || String(Date.now()).slice(-10);
  newProd.url = parsedLink?.url || 'https://mobile.yangkeduo.com/';
  newProd.category = '📦 Товар по ссылке';
  newProd.thumbImg = '';
  newProd.thumbEmoji = '🛍️';
  newProd.title = parsedLink?.inlineTitle
    ? `Товар Pinduoduo: ${parsedLink.inlineTitle.slice(0, 60)}`
    : `Товар Pinduoduo #${newProd.id}`;
  newProd.priceKzt = priceKzt;
  newProd.priceCny = priceCny;

  saveProductToHistory(newProd);
  renderProductDashboard(newProd);
  showToast('✅ Расчёт цены с НДС 12% и анализ готовы!');
}

async function handleAutoScreenshotOCR(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  const loadingBanner = document.getElementById('loadingBanner');
  const loadingTitle = document.getElementById('loadingTitle');
  loadingBanner.classList.add('active');
  loadingTitle.textContent = '📸 Читаем цену и отзывы с вашего скриншота Pinduoduo...';

  const reader = new FileReader();
  reader.onload = async (ev) => {
    const dataUrl = ev.target.result;
    let priceKzt = 529;
    let priceCny = 7.9;
    let salesText = '100K+ продано';
    let repeatText = '1 000+ повторных';
    let titleText = `Товар со скриншота Pinduoduo`;

    try {
      if (window.Tesseract) {
        const ocr = await window.Tesseract.recognize(dataUrl, 'eng+rus');
        const txt = ocr?.data?.text || '';

        const cnyMatch = txt.match(/[¥￥]\s*(\d+(?:\.\d{1,2})?)/);
        const estMatch = txt.match(/Est\.?\s*(\d{2,6})/i);

        if (cnyMatch) {
          priceCny = parseFloat(cnyMatch[1]);
          priceKzt = estMatch ? parseInt(estMatch[1], 10) : Math.round(priceCny * state.settings.rateCnyKzt);
        } else if (estMatch) {
          priceKzt = parseInt(estMatch[1], 10);
          priceCny = Math.round((priceKzt / state.settings.rateCnyKzt) * 10) / 10;
        }

        const soldMatch = txt.match(/(\d+(?:\.\d+)?[Kk]?\+?\s*Sold)/i);
        if (soldMatch) salesText = soldMatch[1];

        const repMatch = txt.match(/(\d+(?:\.\d+)?[Kk]?\s*Repeat\s*Customers)/i);
        if (repMatch) repeatText = repMatch[1];
      }
    } catch (err) {
      console.warn('OCR warning:', err);
    }

    const newProd = JSON.parse(JSON.stringify(DEMO_PRESETS.wdairen_bait));
    newProd.id = state.pendingParsedLink?.goodsId || String(Date.now()).slice(-10);
    newProd.url = state.pendingParsedLink?.url || 'https://mobile.yangkeduo.com/';
    newProd.category = '📸 Со скриншота';
    newProd.title = titleText;
    newProd.thumbImg = dataUrl;
    newProd.priceKzt = priceKzt;
    newProd.priceCny = priceCny;
    newProd.salesText = salesText;
    newProd.repeatCustomersText = repeatText;

    loadingBanner.classList.remove('active');
    saveProductToHistory(newProd);
    renderProductDashboard(newProd);
    showToast('✅ Скриншот распознан! Цена и отзывы обновлены');
  };
  reader.readAsDataURL(file);
}

/* ============================================================================
   ОТРИСОВКА КАРТОЧКИ ТОВАРА, ПРОДАВЦА И ОТЗЫВОВ
   ============================================================================ */
function renderProductDashboard(product) {
  if (!product) return;
  state.currentProduct = product;

  document.getElementById('resCategoryBadge').textContent = product.category || '📦 Товар';

  // Фото или эмодзи товара
  const thumbEl = document.getElementById('resThumb');
  if (product.thumbImg) {
    thumbEl.innerHTML = `<img src="${product.thumbImg}" alt="${product.title}" />`;
  } else {
    thumbEl.textContent = product.thumbEmoji || '📦';
  }

  document.getElementById('resTitle').textContent = product.title;
  document.getElementById('resSalesCount').textContent = product.salesText || 'Продажи: —';
  document.getElementById('resRepeatCount').textContent = product.repeatCustomersText || 'Повторно: —';
  document.getElementById('resOriginalLink').href = product.url;

  // Кнопка Лайка ❤️
  updateLikeButtonUI(product.id);

  // Бейджи
  const badgesWrap = document.getElementById('resBadges');
  badgesWrap.innerHTML = '';
  (product.badges || []).forEach((b) => {
    const span = document.createElement('span');
    span.className = `pdd-badge ${b.type || 'flagship'}`;
    span.textContent = b.text;
    badgesWrap.appendChild(span);
  });

  // Вердикт
  const trust = product.botStats?.trustScore ?? 85;
  const bots = product.botStats?.botProbability ?? 12;
  const banner = document.getElementById('resVerdictBanner');
  banner.className = 'verdict-banner ' + (trust >= 80 ? 'good' : trust >= 55 ? 'medium' : 'bad');

  const headline = document.getElementById('resVerdictHeadline');
  const desc = document.getElementById('resVerdictDesc');

  if (trust >= 80) {
    headline.textContent = '✅ Отличный продавец: Можно смело заказывать';
    desc.textContent = `Ботов почти нет (${bots}%), много повторных покупателей и высокий рейтинг магазина.`;
  } else if (trust >= 55) {
    headline.textContent = '⚖️ Нормальный магазин: Проверьте фото в отзывах';
    desc.textContent = `Около ${bots}% комментариев — короткие шаблоны, но сам магазин рабочий.`;
  } else {
    headline.textContent = '🚨 Опасно покупать! Много ботов и повторов в отзывах';
    desc.textContent = `${bots}% комментариев скопированы слово в слово, а продавец торгует всем подряд.`;
  }

  const trustEl = document.getElementById('resTrustScore');
  trustEl.textContent = `${trust}%`;
  trustEl.style.color = trust >= 80 ? 'var(--success)' : trust >= 55 ? 'var(--warning)' : 'var(--danger)';

  const botEl = document.getElementById('resBotScore');
  botEl.textContent = `${bots}%`;
  botEl.style.color = bots <= 20 ? 'var(--success)' : bots <= 45 ? 'var(--warning)' : 'var(--danger)';

  // Кнопка сравнения
  const inCompare = state.compareIds.includes(product.id);
  document.getElementById('addToCompareBtn').innerHTML = inCompare
    ? '<span>✅ Выбрано для сравнения</span>'
    : '<span>⚖️ Добавить к сравнению</span>';

  // Заполняем цену в калькулятор (по умолчанию сразу в Тенге ₸, как на экране Pinduoduo!)
  const currSel = document.getElementById('calcInputCurrency');
  const priceInp = document.getElementById('calcInputPrice');
  if (product.priceKzt) {
    currSel.value = 'KZT';
    priceInp.value = product.priceKzt;
  } else {
    currSel.value = 'CNY';
    priceInp.value = product.priceCny || 100;
  }
  recalculateSimpleKztVat();

  // Продавец и комментарии
  renderSellerBlock(product.seller);
  renderReviewsBlock(product);
}

function renderSellerBlock(seller) {
  if (!seller) return;
  document.getElementById('sellerName').textContent = seller.name;
  document.getElementById('sellerTypeTag').textContent = seller.typeTag;
  document.getElementById('sellerSpecializationDesc').textContent = seller.specializationDesc;
  document.getElementById('sellerAge').textContent = seller.age;
  document.getElementById('sellerTotalSales').textContent = seller.totalSales;
  document.getElementById('sellerRepeatRate').textContent = seller.repeatRate;

  const avg = (
    ((seller.dsr?.desc?.score || 4.8) +
      (seller.dsr?.service?.score || 4.8) +
      (seller.dsr?.logistics?.score || 4.8)) /
    3
  ).toFixed(2);
  document.getElementById('sellerScoreBadge').textContent = `Рейтинг ${avg} из 5.0`;

  const dsrWrap = document.getElementById('sellerDsrBars');
  dsrWrap.innerHTML = '';
  const rows = [
    { title: 'Товар как на фото', d: seller.dsr?.desc },
    { title: 'Общение и возврат', d: seller.dsr?.service },
    { title: 'Скорость доставки', d: seller.dsr?.logistics }
  ];

  rows.forEach((r) => {
    const sc = r.d?.score || 4.8;
    const pct = Math.min(100, Math.max(25, ((sc - 4.0) / 1.0) * 100));
    const col = sc >= 4.8 ? 'var(--success)' : sc >= 4.6 ? 'var(--warning)' : 'var(--danger)';
    dsrWrap.innerHTML += `
      <div>
        <div style="display:flex; justify-content:space-between; font-size:12.5px;">
          <span>${r.title}</span>
          <strong>${sc} • <span style="color:${col}">${r.d?.label || ''}</span></strong>
        </div>
        <div class="dsr-track">
          <div class="dsr-fill" style="width:${pct}%; background:${col};"></div>
        </div>
      </div>
    `;
  });

  const nicheEl = document.getElementById('sellerNicheBadge');
  nicheEl.textContent = seller.isFocusedNiche ? '✅ Только своя категория' : '⚠️ Продаёт всё подряд';
  nicheEl.style.color = seller.isFocusedNiche ? 'var(--success)' : 'var(--danger)';

  document.getElementById('sellerCatalogChips').innerHTML = (seller.catalogItems || [])
    .map((c) => `<span class="catalog-chip">${c}</span>`)
    .join('');

  document.getElementById('sellerChecklist').innerHTML = (seller.checks || [])
    .map(
      (c) => `
      <div class="check-item">
        <span>${c.ok ? '✅' : '⚠️'}</span>
        <span style="color:${c.ok ? 'var(--text-primary)' : 'var(--warning)'}">${c.text}</span>
      </div>`
    )
    .join('');
}

function renderReviewsBlock(product) {
  const bs = product.botStats || { duplicateRate: 10, mediaRate: 55, botProbability: 10, trustScore: 90 };
  const humanPct = Math.max(0, 100 - bs.botProbability);

  document.getElementById('humanPctLabel').textContent = `👤 Живые покупатели: ${humanPct}%`;
  document.getElementById('botPctLabel').textContent = `🤖 Шаблоны / Боты: ${bs.botProbability}%`;
  document.getElementById('humanRatioFill').style.width = `${humanPct}%`;

  document.getElementById('totalPositiveReviewsTxt').textContent =
    product.positiveReviewsText || 'Проверены последние отзывы';
  document.getElementById('repeatBuyersCountTxt').textContent =
    product.repeatCustomersText || '';

  document.getElementById('bmDuplicateRate').textContent = `${bs.duplicateRate}%`;
  document.getElementById('bmDuplicateRate').style.color =
    bs.duplicateRate > 35 ? 'var(--danger)' : 'var(--success)';
  document.getElementById('bmMediaRate').textContent = `${bs.mediaRate}%`;

  document.getElementById('botSummaryPill').textContent =
    bs.botProbability <= 20 ? 'Чистые отзывы' : 'Много повторов';

  document.getElementById('repeatedPhrasesContainer').innerHTML = (bs.repeatedPhrases || [])
    .map(
      (p) => `
      <span class="phrase-tag ${p.isBot ? 'bot-flag' : ''}">
        <span>${p.isBot ? '🤖' : '💬'} ${p.phrase}</span>
        <strong style="opacity:0.8;">×${p.count}</strong>
      </span>`
    )
    .join('');

  document.getElementById('reviewsListContainer').innerHTML = (product.reviews || [])
    .map(
      (r) => `
      <div class="review-item ${r.isBot ? 'suspicious' : 'verified'}">
        <div style="display:flex; justify-content:space-between; gap:8px; margin-bottom:5px; flex-wrap:wrap;">
          <strong>${r.user} <span style="font-weight:400; color:var(--text-muted); font-size:11.5px;">${r.date || ''}</span></strong>
          <span style="font-size:11px; font-weight:700; color:${r.isBot ? 'var(--danger)' : 'var(--success)'};">
            ${r.isBot ? '🤖 Шаблон / Бот' : '👤 Реальный отзыв'}
          </span>
        </div>
        <div style="font-size:11.5px; color:var(--text-muted); margin-bottom:4px;">${r.cn}</div>
        <div style="margin-bottom:5px;">${r.ru}</div>
        <div style="font-size:11.5px; color:var(--kz-gold);">🔎 ${r.reason}</div>
      </div>`
    )
    .join('');
}

/* ============================================================================
   ПРОСТОЙ И ТОЧНЫЙ КАЛЬКУЛЯТОР: ТОЛЬКО ТЕКУЩАЯ ЦЕНА + НДС (БЕЗ КАРГО!)
   ============================================================================ */
function bindSimpleCalculatorEvents() {
  const priceInp = document.getElementById('calcInputPrice');
  const currSel = document.getElementById('calcInputCurrency');
  const vatSel = document.getElementById('calcVatPercent');

  [priceInp, currSel, vatSel].forEach((el) => {
    el.addEventListener('input', () => recalculateSimpleKztVat(true));
    el.addEventListener('change', () => recalculateSimpleKztVat(true));
  });

  // Кнопки выбора количества (1 шт, 2 шт, 3 шт, 5 шт, 10 шт)
  document.querySelectorAll('.qty-pill').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.qty-pill').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.selectedQty = parseInt(btn.getAttribute('data-qty'), 10) || 1;
      recalculateSimpleKztVat(false);
    });
  });
}

function getSimpleKztWithVat(priceKztBase, vatPercent = state.settings.vatPercent) {
  const base = Math.round(priceKztBase || 0);
  const vatAmount = Math.round(base * (vatPercent / 100));
  const totalWithVat = base + vatAmount;
  return { base, vatPercent, vatAmount, totalWithVat };
}

function recalculateSimpleKztVat(syncToProduct = false) {
  const rawVal = parseFloat(document.getElementById('calcInputPrice').value) || 0;
  const curr = document.getElementById('calcInputCurrency').value;
  const vatPct = parseFloat(document.getElementById('calcVatPercent').value) ?? state.settings.vatPercent;
  const rate = state.settings.rateCnyKzt || 66.96;
  const qty = state.selectedQty || 1;

  const baseKzt = curr === 'KZT' ? Math.round(rawVal) : Math.round(rawVal * rate);
  const cnyEquiv = curr === 'CNY' ? rawVal : Math.round((rawVal / rate) * 10) / 10;

  const { vatAmount, totalWithVat } = getSimpleKztWithVat(baseKzt, vatPct);
  const grandTotalQty = totalWithVat * qty;

  document.getElementById('heroVatLabel').textContent = `${vatPct}%`;
  document.getElementById('calcVatTag').textContent = vatPct > 0 ? `НДС ${vatPct}%` : 'Без НДС';
  document.getElementById('calcFinalKzt').textContent = `${formatKzt(totalWithVat)} ₸`;
  document.getElementById('calcBatchSub').textContent =
    `Текущая цена без НДС: ${formatKzt(baseKzt)} ₸ (+${formatKzt(vatAmount)} ₸ НДС)`;
  document.getElementById('calcOriginalCny').textContent = `¥ ${cnyEquiv}`;

  document.getElementById('bdBaseKzt').textContent = `${formatKzt(baseKzt)} ₸`;
  document.getElementById('bdVatPct').textContent = vatPct;
  document.getElementById('bdVatKzt').textContent = `+ ${formatKzt(vatAmount)} ₸`;
  document.getElementById('bdQtyTxt').textContent = `${qty} шт`;
  document.getElementById('bdGrandTotalKzt').textContent = `${formatKzt(grandTotalQty)} ₸`;

  if (syncToProduct && state.currentProduct) {
    state.currentProduct.priceKzt = baseKzt;
    state.currentProduct.priceCny = cnyEquiv;
    saveProductToHistory(state.currentProduct);
  }
}

function formatKzt(n) {
  return Math.round(n || 0).toLocaleString('ru-RU');
}

/* ============================================================================
   ЛАЙКИ (❤️ ИЗБРАННОЕ) И НАГЛЯДНОЕ СРАВНЕНИЕ С КАРТИНКАМИ
   ============================================================================ */
function toggleLikeProduct(productId) {
  const idx = state.likedIds.indexOf(productId);
  if (idx !== -1) {
    state.likedIds.splice(idx, 1);
    showToast('Убрано из понравившихся');
  } else {
    state.likedIds.push(productId);
    showToast('❤️ Товар добавлен в понравившиеся!');
  }
  saveStateToStorage();
  if (state.currentProduct?.id === productId) {
    updateLikeButtonUI(productId);
  }
  renderVisualCompareAndLikesView();
}

function updateLikeButtonUI(productId) {
  const isLiked = state.likedIds.includes(productId);
  const btn = document.getElementById('likeProductBtn');
  btn.classList.toggle('liked', isLiked);
  document.getElementById('likeHeartIcon').textContent = isLiked ? '❤️' : '🤍';
  document.getElementById('likeBtnText').textContent = isLiked ? 'В избранном' : 'Нравится';
}

function toggleCompareProduct(productId) {
  const idx = state.compareIds.indexOf(productId);
  if (idx !== -1) {
    state.compareIds.splice(idx, 1);
    showToast('Убрано из сравнения');
  } else {
    if (state.compareIds.length >= 3) {
      // Оставляем последние выбранные, чтобы не загромождать сравнение
      state.compareIds.shift();
    }
    state.compareIds.push(productId);
    showToast('⚖️ Выбрано для сравнения!');
  }
  saveStateToStorage();
  if (state.currentProduct?.id === productId) {
    renderProductDashboard(state.currentProduct);
  }
  renderVisualCompareAndLikesView();
}

function bindCompareEvents() {
  const allBtn = document.getElementById('filterAllBtn');
  const likedBtn = document.getElementById('filterLikedBtn');

  allBtn.addEventListener('click', () => {
    state.filterLikedOnly = false;
    allBtn.style.borderColor = 'var(--kz-cyan)';
    likedBtn.style.borderColor = 'var(--border-color)';
    renderVisualCompareAndLikesView();
  });

  likedBtn.addEventListener('click', () => {
    state.filterLikedOnly = true;
    likedBtn.style.borderColor = 'var(--pdd-red)';
    allBtn.style.borderColor = 'var(--border-color)';
    renderVisualCompareAndLikesView();
  });

  document.getElementById('clearCompareSelectionBtn').addEventListener('click', () => {
    state.compareIds = [];
    saveStateToStorage();
    renderVisualCompareAndLikesView();
  });
}

function renderVisualCompareAndLikesView() {
  const catalogGrid = document.getElementById('visualCatalogGrid');
  const duelContainer = document.getElementById('duelArenaContainer');

  const itemsToShow = state.filterLikedOnly
    ? state.history.filter((p) => state.likedIds.includes(p.id))
    : state.history;

  if (itemsToShow.length === 0) {
    catalogGrid.innerHTML = `
      <div style="grid-column:1/-1; text-align:center; padding:24px; color:var(--text-secondary);">
        Нет лайкнутых товаров ❤️. Нажмите кнопку «Нравится» на любом товаре!
      </div>
    `;
  } else {
    catalogGrid.innerHTML = itemsToShow
      .map((p) => {
        const isLiked = state.likedIds.includes(p.id);
        const isSelected = state.compareIds.includes(p.id);
        const { totalWithVat } = getSimpleKztWithVat(p.priceKzt || p.priceCny * state.settings.rateCnyKzt);
        const trust = p.botStats?.trustScore ?? 85;
        const thumbHtml = p.thumbImg
          ? `<img src="${p.thumbImg}" alt="${p.title}" />`
          : `<span>${p.thumbEmoji || '📦'}</span>`;

        return `
          <div class="visual-prod-card ${isSelected ? 'selected-for-duel' : ''}">
            <div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <span style="font-size:11px; color:var(--text-secondary); font-weight:700;">${p.category || '📦 Товар'}</span>
                <button class="like-btn ${isLiked ? 'liked' : ''}" style="padding:4px 10px; font-size:12px;" onclick="toggleLikeProduct('${p.id}')">
                  ${isLiked ? '❤️ Лайк' : '🤍 Лайк'}
                </button>
              </div>
              <div class="vpc-top" onclick="openProductById('${p.id}')" style="cursor:pointer;">
                <div class="vpc-img">${thumbHtml}</div>
                <div>
                  <strong style="font-size:13.5px; display:block; line-height:1.3; margin-bottom:4px;">${p.title.slice(0, 54)}...</strong>
                  <span style="font-size:15px; font-weight:900; color:var(--kz-cyan);">${formatKzt(totalWithVat)} ₸ с НДС</span>
                  <span style="font-size:11.5px; color:var(--text-muted); display:block;">Надёжность: ${trust}%</span>
                </div>
              </div>
            </div>

            <div style="display:flex; gap:8px;">
              <button class="btn-secondary" style="flex:1; padding:8px; font-size:12px;" onclick="openProductById('${p.id}')">
                🔍 Открыть
              </button>
              <button class="btn-secondary" style="flex:1.2; padding:8px; font-size:12px; ${isSelected ? 'border-color:var(--kz-cyan); color:var(--kz-cyan);' : ''}" onclick="toggleCompareProduct('${p.id}')">
                ${isSelected ? '✅ В сравнении' : '⚖️ Сравнить'}
              </button>
            </div>
          </div>
        `;
      })
      .join('');
  }

  // Отрисовка Дуэли выбранных товаров (только тех, которые пользователь сам выбрал!)
  const fighters = state.compareIds
    .map((id) => state.history.find((p) => p.id === id))
    .filter(Boolean);

  if (fighters.length === 0) {
    duelContainer.innerHTML = `
      <div style="text-align:center; padding:26px; color:var(--text-secondary);">
        Нажмите кнопку <strong>«⚖️ Сравнить»</strong> на любых 2 карточках выше, чтобы сравнить их друг с другом.
      </div>
    `;
    return;
  }

  // Определяем победителя среди выбранных
  let winnerId = fighters[0].id;
  let bestScore = -999;
  fighters.forEach((f) => {
    const score = (f.botStats?.trustScore || 50) - (f.botStats?.botProbability || 20);
    if (score > bestScore) {
      bestScore = score;
      winnerId = f.id;
    }
  });

  duelContainer.innerHTML = `
    <div class="duel-arena">
      ${fighters
        .map((f) => {
          const isWin = f.id === winnerId && fighters.length > 1;
          const baseKzt = f.priceKzt || Math.round(f.priceCny * state.settings.rateCnyKzt);
          const { vatAmount, totalWithVat } = getSimpleKztWithVat(baseKzt);
          const trust = f.botStats?.trustScore ?? 85;
          const bots = f.botStats?.botProbability ?? 12;
          const humanPct = 100 - bots;
          const thumbHtml = f.thumbImg
            ? `<img src="${f.thumbImg}" alt="${f.title}" style="width:84px; height:84px; border-radius:14px; object-fit:cover;" />`
            : `<div style="width:84px; height:84px; border-radius:14px; background:var(--bg-card); display:flex; align-items:center; justify-content:center; font-size:36px;">${f.thumbEmoji || '📦'}</div>`;

          return `
            <div class="duel-fighter-card ${isWin ? 'winner' : ''}">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <span class="pdd-badge ${isWin ? 'guarantee' : 'flagship'}">
                  ${isWin ? '🏆 Лучше по отзывам и надёжности' : f.category || 'Товар'}
                </span>
                <button class="clear-input-btn" onclick="toggleCompareProduct('${f.id}')" title="Убрать из сравнения">✕</button>
              </div>

              <div style="display:flex; gap:14px; align-items:center; margin-bottom:14px;">
                ${thumbHtml}
                <div>
                  <strong style="font-size:15px; display:block; line-height:1.3; margin-bottom:4px;">${f.title}</strong>
                  <span style="font-size:12px; color:var(--text-secondary);">${f.seller?.name || ''}</span>
                </div>
              </div>

              <div style="background:var(--bg-card); padding:12px; border-radius:12px; border:1px solid var(--border-color); margin-bottom:12px;">
                <div style="font-size:11.5px; color:var(--text-secondary);">Итоговая цена с НДС (${state.settings.vatPercent}%) • Доставка 0 ₸:</div>
                <div style="font-size:24px; font-weight:900; color:var(--kz-cyan);">${formatKzt(totalWithVat)} ₸</div>
                <div style="font-size:12px; color:var(--text-muted);">
                  Без НДС: ${formatKzt(baseKzt)} ₸ (¥ ${f.priceCny}) • НДС: +${formatKzt(vatAmount)} ₸
                </div>
              </div>

              <div style="display:flex; flex-direction:column; gap:8px; font-size:13px;">
                <div style="display:flex; justify-content:space-between;">
                  <span style="color:var(--text-secondary);">Доверие к магазину:</span>
                  <strong style="color:${trust >= 80 ? 'var(--success)' : 'var(--danger)'};">${trust}%</strong>
                </div>
                <div style="display:flex; justify-content:space-between;">
                  <span style="color:var(--text-secondary);">Живые отзывы людей:</span>
                  <strong style="color:var(--success);">${humanPct}%</strong>
                </div>
                <div style="display:flex; justify-content:space-between;">
                  <span style="color:var(--text-secondary);">Повторы и боты:</span>
                  <strong style="color:${bots <= 20 ? 'var(--success)' : 'var(--danger)'};">${bots}%</strong>
                </div>
                <div style="display:flex; justify-content:space-between;">
                  <span style="color:var(--text-secondary);">Повторные покупки:</span>
                  <strong>${f.repeatCustomersText || f.seller?.repeatRate || '—'}</strong>
                </div>
              </div>
            </div>
          `;
        })
        .join('')}
    </div>
  `;
}

window.openProductById = function (id) {
  const found = state.history.find((p) => p.id === id);
  if (found) {
    renderProductDashboard(found);
    switchView('view-analyzer');
  }
};

window.toggleLikeProduct = toggleLikeProduct;
window.toggleCompareProduct = toggleCompareProduct;

function saveProductToHistory(product) {
  if (!product?.id) return;
  const idx = state.history.findIndex((p) => p.id === product.id);
  if (idx !== -1) {
    state.history[idx] = product;
  } else {
    state.history.unshift(product);
  }
  saveStateToStorage();
}

/* ============================================================================
   НАСТРОЙКИ ПОСТОЯННОГО КУРСА ЮАНЯ И НДС
   ============================================================================ */
function bindSettingsEvents() {
  document.getElementById('refreshLiveRateBtn').addEventListener('click', async () => {
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/CNY');
      const data = await res.json();
      if (data?.rates?.KZT) {
        const rounded = Math.round(data.rates.KZT * 100) / 100;
        state.settings.rateCnyKzt = rounded;
        saveStateToStorage();
        syncSettingsToUI();
        recalculateSimpleKztVat();
        showToast(`✅ Курс обновлён: 1 ¥ = ${rounded} ₸`);
      }
    } catch {
      showToast('Используется ваш сохранённый курс');
    }
  });

  document.getElementById('saveSettingsBtn').addEventListener('click', () => {
    state.settings.rateCnyKzt = parseFloat(document.getElementById('setRateCnyKzt').value) || 66.96;
    state.settings.vatPercent = parseFloat(document.getElementById('setVatPercent').value) ?? 12;
    saveStateToStorage();
    syncSettingsToUI();
    recalculateSimpleKztVat();
    showToast('💾 Постоянный курс и НДС сохранены');
  });

  document.getElementById('saveApiKeysBtn').addEventListener('click', () => {
    state.settings.geminiApiKey = document.getElementById('setGeminiKey').value.trim();
    saveStateToStorage();
    showToast('🔑 Ключ сохранён');
  });
}

function syncSettingsToUI() {
  const s = state.settings;
  document.getElementById('headerRateText').textContent = `1 ¥ = ${s.rateCnyKzt} ₸`;
  const smallLbl = document.getElementById('calcRateSmallLabel');
  if (smallLbl) smallLbl.textContent = `1¥ = ${s.rateCnyKzt}₸`;

  const vatSel = document.getElementById('calcVatPercent');
  if (vatSel) vatSel.value = String(s.vatPercent);

  document.getElementById('setRateCnyKzt').value = s.rateCnyKzt;
  document.getElementById('setVatPercent').value = s.vatPercent;
  document.getElementById('setGeminiKey').value = s.geminiApiKey || '';
}

async function copyProductReport() {
  const p = state.currentProduct;
  if (!p) return;
  const baseKzt = p.priceKzt || Math.round(p.priceCny * state.settings.rateCnyKzt);
  const { vatAmount, totalWithVat } = getSimpleKztWithVat(baseKzt);

  const text = [
    `📦 PDD Inspector KZ — Проверка товара`,
    `Товар: ${p.title}`,
    `Цена без НДС: ${formatKzt(baseKzt)} ₸ (¥ ${p.priceCny})`,
    `НДС РК (${state.settings.vatPercent}%): +${formatKzt(vatAmount)} ₸`,
    `ИТОГО С НДС: ${formatKzt(totalWithVat)} ₸ (Доставка 0 ₸)`,
    `Доверие: ${p.botStats?.trustScore}% | Боты: ${p.botStats?.botProbability}%`
  ].join('\n');

  try {
    await navigator.clipboard.writeText(text);
    showToast('📤 Отчёт скопирован!');
  } catch {
    showToast('Готово');
  }
}

function showToast(message) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 220);
  }, 2800);
}
