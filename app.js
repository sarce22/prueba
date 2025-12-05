const cartMap = new Map();

const cartList = document.getElementById('cart-items');
const cartCount = document.getElementById('cart-count');
const cartTotal = document.getElementById('cart-total');
const checkoutBtn = document.getElementById('checkout-btn');
const addButtons = document.querySelectorAll('.add-to-cart');

const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

function formatCurrency(value) {
  return currencyFormatter.format(value);
}

function renderCart() {
  cartList.innerHTML = '';

  if (cartMap.size === 0) {
    cartList.innerHTML = '<li class="cart-empty">Aún no tienes platos agregados.</li>';
    cartCount.textContent = '0 platos';
    cartTotal.textContent = '$0';
    checkoutBtn.disabled = true;
    return;
  }

  let totalItems = 0;
  let totalPrice = 0;

  cartMap.forEach((item) => {
    const lineTotal = item.price * item.quantity;
    totalItems += item.quantity;
    totalPrice += lineTotal;

    const li = document.createElement('li');
    li.className = 'cart-item';

    li.innerHTML = `
      <div>
        <p class="cart-item-name">${item.name}</p>
        <p class="cart-item-price">${item.quantity} × ${formatCurrency(item.price)} · <strong>${formatCurrency(lineTotal)}</strong></p>
      </div>
      <div class="cart-item-actions">
        <button class="qty-btn" data-action="decrement" data-dish="${item.name}" aria-label="Restar ${item.name}">−</button>
        <span class="qty-count">${item.quantity}</span>
        <button class="qty-btn" data-action="increment" data-dish="${item.name}" aria-label="Sumar ${item.name}">+</button>
      </div>
    `;

    cartList.appendChild(li);
  });

  cartCount.textContent = `${totalItems} ${totalItems === 1 ? 'plato' : 'platos'}`;
  cartTotal.textContent = formatCurrency(totalPrice);
  checkoutBtn.disabled = false;
}

function addToCart(name, price) {
  const existing = cartMap.get(name) || { name, price, quantity: 0 };
  existing.quantity += 1;
  cartMap.set(name, existing);
  renderCart();
}

addButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const dish = button.dataset.dish;
    const price = Number(button.dataset.price);
    if (!dish || Number.isNaN(price)) {
      return;
    }
    addToCart(dish, price);
    button.classList.add('added');
    setTimeout(() => button.classList.remove('added'), 400);
  });
});

cartList.addEventListener('click', (event) => {
  const button = event.target.closest('.qty-btn');
  if (!button) {
    return;
  }

  const dish = button.dataset.dish;
  const action = button.dataset.action;
  const item = cartMap.get(dish);

  if (!dish || !item) {
    return;
  }

  if (action === 'increment') {
    item.quantity += 1;
  } else if (action === 'decrement') {
    item.quantity -= 1;
    if (item.quantity <= 0) {
      cartMap.delete(dish);
    }
  }

  if (cartMap.has(dish)) {
    cartMap.set(dish, item);
  }

  renderCart();
});

checkoutBtn.addEventListener('click', () => {
  if (cartMap.size === 0) {
    return;
  }

  const summary = Array.from(cartMap.values())
    .map((item) => `${item.quantity} × ${item.name}`)
    .join('\n');

  alert(`Tu pedido:\n${summary}\nTotal: ${cartTotal.textContent}`);
});

renderCart();
