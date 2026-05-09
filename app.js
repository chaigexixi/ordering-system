// ========== 菜单数据 ==========
const menuData = [
  { id: 1, name: '红烧肉', category: '热菜', price: 48, desc: '肥而不腻，入口即化', emoji: '🍖', color: '#c0392b', badge: '招牌' },
  { id: 2, name: '糖醋里脊', category: '热菜', price: 42, desc: '外酥里嫩，酸甜可口', emoji: '🍯', color: '#e67e22', badge: '人气' },
  { id: 3, name: '宫保鸡丁', category: '热菜', price: 38, desc: '鸡肉滑嫩，花生香脆', emoji: '🍗', color: '#f39c12', badge: '' },
  { id: 4, name: '鱼香肉丝', category: '热菜', price: 36, desc: '酸甜微辣，下饭神器', emoji: '🥩', color: '#d35400', badge: '' },
  { id: 5, name: '麻婆豆腐', category: '热菜', price: 28, desc: '麻辣鲜香，嫩滑入味', emoji: '🧈', color: '#c0392b', badge: '火爆' },
  { id: 6, name: '清炒时蔬', category: '热菜', price: 22, desc: '当季鲜蔬，清淡爽口', emoji: '🥬', color: '#27ae60', badge: '' },

  { id: 7, name: '凉拌黄瓜', category: '凉菜', price: 16, desc: '清脆爽口，蒜香十足', emoji: '🥒', color: '#2ecc71', badge: '' },
  { id: 8, name: '口水鸡', category: '凉菜', price: 32, desc: '麻辣鲜香，鸡肉嫩滑', emoji: '🐔', color: '#e74c3c', badge: '人气' },
  { id: 9, name: '皮蛋豆腐', category: '凉菜', price: 18, desc: '经典搭配，清凉爽口', emoji: '🥚', color: '#95a5a6', badge: '' },

  { id: 10, name: '蛋炒饭', category: '主食', price: 18, desc: '粒粒分明，蛋香浓郁', emoji: '🍚', color: '#f1c40f', badge: '' },
  { id: 11, name: '牛肉面', category: '主食', price: 28, desc: '汤浓肉香，面条筋道', emoji: '🍜', color: '#e67e22', badge: '人气' },
  { id: 12, name: '手工水饺', category: '主食', price: 26, desc: '皮薄馅大，鲜美多汁', emoji: '🥟', color: '#ecf0f1', badge: '' },
  { id: 13, name: '白米饭', category: '主食', price: 3, desc: '东北五常大米，粒粒香糯', emoji: '🍙', color: '#fafafa', badge: '' },

  { id: 14, name: '酸辣汤', category: '汤品', price: 20, desc: '酸辣开胃，暖身暖心', emoji: '🥣', color: '#e67e22', badge: '' },
  { id: 15, name: '番茄蛋花汤', category: '汤品', price: 18, desc: '鲜美可口，老少皆宜', emoji: '🍅', color: '#e74c3c', badge: '' },
  { id: 16, name: '紫菜蛋花汤', category: '汤品', price: 15, desc: '清淡鲜美，解腻佳品', emoji: '🍲', color: '#9b59b6', badge: '' },

  { id: 17, name: '冰镇可乐', category: '饮品', price: 8, desc: '经典快乐水，加冰更爽', emoji: '🥤', color: '#333', badge: '' },
  { id: 18, name: '酸梅汤', category: '饮品', price: 12, desc: '生津止渴，酸甜解暑', emoji: '🫖', color: '#8b4513', badge: '' },
  { id: 19, name: '龙井绿茶', category: '饮品', price: 15, desc: '明前龙井，清香回甘', emoji: '🍵', color: '#27ae60', badge: '' },
  { id: 20, name: '鲜榨橙汁', category: '饮品', price: 18, desc: '现榨鲜橙，维C满满', emoji: '🍊', color: '#f39c12', badge: '' },
];

// ========== Socket.IO ==========
const socket = io();

// ========== 状态 ==========
const cart = new Map();
let activeCategory = '全部';
let searchKeyword = '';

// ========== DOM ==========
const categoryNav = document.getElementById('categoryNav');
const menuContainer = document.getElementById('menuContainer');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const cartPanel = document.getElementById('cartPanel');
const cartOverlay = document.getElementById('cartOverlay');
const cartItems = document.getElementById('cartItems');
const cartFooter = document.getElementById('cartFooter');
const cartTotal = document.getElementById('cartTotal');
const cartBadge = document.getElementById('cartBadge');
const btnSubmit = document.getElementById('btnSubmit');
const cartToggle = document.getElementById('cartToggle');
const cartClose = document.getElementById('cartClose');
const modalOverlay = document.getElementById('modalOverlay');
const modalOrder = document.getElementById('modalOrder');
const btnOk = document.getElementById('btnOk');
const toast = document.getElementById('toast');
const toastMsg = document.getElementById('toastMsg');

// ========== 初始化 ==========
function init() {
  renderCategories();
  applyFilters();
  bindEvents();
}

// ========== 分类 ==========
function renderCategories() {
  const categories = ['全部', ...new Set(menuData.map(d => d.category))];
  categoryNav.innerHTML = categories.map(cat =>
    `<button class="category-btn${cat === activeCategory ? ' active' : ''}" data-category="${cat}">${cat === '全部' ? '🔥 ' : ''}${cat}</button>`
  ).join('');
}

// ========== 搜索 + 分类过滤 ==========
function applyFilters() {
  let dishes = menuData;

  if (activeCategory !== '全部') {
    dishes = dishes.filter(d => d.category === activeCategory);
  }

  if (searchKeyword) {
    const kw = searchKeyword.toLowerCase();
    dishes = dishes.filter(d =>
      d.name.toLowerCase().includes(kw) ||
      d.desc.toLowerCase().includes(kw) ||
      d.category.toLowerCase().includes(kw)
    );
  }

  if (dishes.length === 0) {
    menuContainer.innerHTML = '';
    emptyState.style.display = 'block';
    if (searchKeyword) {
      emptyState.querySelector('p').textContent = `没有找到「${searchKeyword}」相关菜品`;
    } else {
      emptyState.querySelector('p').textContent = '该分类暂无菜品';
    }
  } else {
    emptyState.style.display = 'none';
    renderMenu(dishes);
  }
}

// ========== 渲染菜单 ==========
function renderMenu(dishes) {
  menuContainer.innerHTML = dishes.map(dish => {
    const qty = cart.has(dish.id) ? cart.get(dish.id).qty : 0;
    const addedClass = qty > 0 ? ' added' : '';
    return `
      <div class="dish-card${addedClass}" data-id="${dish.id}">
        <div class="dish-visual" style="background:${dish.color}15">
          <span class="dish-emoji">${dish.emoji}</span>
          ${dish.badge ? `<span class="dish-badge">${dish.badge}</span>` : ''}
        </div>
        <div class="dish-body">
          <div class="dish-name">${dish.name}</div>
          <div class="dish-desc">${dish.desc}</div>
          <div class="dish-footer">
            <span class="dish-price"><span class="dish-price-symbol">¥</span>${dish.price}</span>
            <div class="qty-ctrl">
              <button class="qty-btn" data-action="minus" data-id="${dish.id}" ${qty === 0 ? 'disabled' : ''}>−</button>
              <span class="qty-value">${qty}</span>
              <button class="qty-btn" data-action="plus" data-id="${dish.id}">+</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ========== 渲染购物车 ==========
function renderCart() {
  const entries = Array.from(cart.values());

  if (entries.length === 0) {
    cartItems.innerHTML = `
      <div class="cart-empty-state">
        <span class="cart-empty-icon">🍜</span>
        <p>购物车空空的</p>
        <span>快去挑选美食吧～</span>
      </div>
    `;
    cartFooter.style.display = 'none';
    btnSubmit.disabled = true;
  } else {
    let total = 0;
    cartItems.innerHTML = entries.map(item => {
      const subtotal = item.price * item.qty;
      total += subtotal;
      return `
        <div class="cart-item">
          <div class="cart-item-thumb" style="background:${item.color}18">${item.emoji}</div>
          <div class="cart-item-info">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-meta">¥${item.price} / 份</div>
          </div>
          <div class="qty-ctrl">
            <button class="qty-btn" data-action="minus" data-id="${item.id}">−</button>
            <span class="qty-value">${item.qty}</span>
            <button class="qty-btn" data-action="plus" data-id="${item.id}">+</button>
          </div>
          <span class="cart-item-total">¥${subtotal}</span>
        </div>
      `;
    }).join('');
    cartFooter.style.display = 'block';
    cartTotal.textContent = `¥${total}`;
    btnSubmit.disabled = false;
  }

  const totalCount = entries.reduce((s, i) => s + i.qty, 0);
  cartBadge.textContent = totalCount;
}

// ========== 事件 ==========
function bindEvents() {
  // 分类
  categoryNav.addEventListener('click', e => {
    const btn = e.target.closest('.category-btn');
    if (!btn) return;
    activeCategory = btn.dataset.category;
    renderCategories();
    applyFilters();
  });

  // 搜索
  searchInput.addEventListener('input', () => {
    searchKeyword = searchInput.value.trim();
    applyFilters();
  });

  // 菜单 & 购物车 加减按钮（事件委托到 body）
  document.body.addEventListener('click', e => {
    const btn = e.target.closest('.qty-btn');
    if (!btn) return;

    const id = parseInt(btn.dataset.id);
    const action = btn.dataset.action;
    const dish = menuData.find(d => d.id === id);
    if (!dish) return;

    if (action === 'minus') {
      changeQty(id, -1);
    } else {
      changeQty(id, 1);
      if (cart.has(id) && cart.get(id).qty === 1) {
        showToast(`已添加 ${dish.name}`);
      }
    }
  });

  // 购物车开关
  cartToggle.addEventListener('click', openCart);
  cartClose.addEventListener('click', closeCart);
  cartOverlay.addEventListener('click', closeCart);

  // 下单
  btnSubmit.addEventListener('click', submitOrder);

  // 弹窗
  btnOk.addEventListener('click', () => modalOverlay.classList.remove('show'));
  modalOverlay.addEventListener('click', e => {
    if (e.target === modalOverlay) modalOverlay.classList.remove('show');
  });
}

// ========== 购物车开关 ==========
function openCart() {
  cartPanel.classList.add('open');
  cartOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  cartPanel.classList.remove('open');
  cartOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

// ========== 修改数量 ==========
function changeQty(id, delta) {
  const dish = menuData.find(d => d.id === id);
  if (!dish) return;

  if (cart.has(id)) {
    const item = cart.get(id);
    item.qty += delta;
    if (item.qty <= 0) {
      cart.delete(id);
    }
  } else if (delta > 0) {
    cart.set(id, { ...dish, qty: 1 });
  }

  applyFilters();
  renderCart();

  // 购物车角标弹跳动画
  cartBadge.classList.remove('pop');
  void cartBadge.offsetWidth;
  cartBadge.classList.add('pop');
}

// ========== Toast ==========
let toastTimer;
function showToast(msg) {
  clearTimeout(toastTimer);
  toastMsg.textContent = msg;
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1500);
}

// ========== 下单 ==========
function submitOrder() {
  if (cart.size === 0) return;

  const items = Array.from(cart.values()).map(i => ({
    name: i.name,
    emoji: i.emoji,
    price: i.price,
    qty: i.qty,
    color: i.color,
  }));
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const itemCount = items.reduce((s, i) => s + i.qty, 0);

  // 发给后端
  socket.emit('submit-order', {
    table: document.getElementById('tableSelect').value,
    items,
    total,
    itemCount,
  });

  // 本地弹窗
  modalOrder.innerHTML = items.map(i =>
    `<div class="receipt-row"><span>${i.emoji} ${i.name} ×${i.qty}</span><span>¥${i.price * i.qty}</span></div>`
  ).join('') + `
    <div class="receipt-divider"></div>
    <div class="receipt-total"><span>合计</span><span>¥${total}</span></div>
    <div style="text-align:center;margin-top:12px;font-size:12px;color:#bfae96">
      🕐 厨房已收到订单，预计 20-30 分钟上菜
    </div>
  `;

  modalOverlay.classList.add('show');
  closeCart();

  cart.clear();
  applyFilters();
  renderCart();
}

// ========== 启动 ==========
init();
