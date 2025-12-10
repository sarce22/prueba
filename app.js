const cartMap = new Map();

const WHATSAPP_NUMBER = '573122477439';

const cartList = document.getElementById('cart-items');
const cartCount = document.getElementById('cart-count');
const cartTotal = document.getElementById('cart-total');
const checkoutBtn = document.getElementById('checkout-btn');
const addButtons = document.querySelectorAll('.add-to-cart');
const filterButtons = document.querySelectorAll('.filter-btn');
const menuSections = document.querySelectorAll('.menu-section');
const invoiceModal = document.getElementById('invoice-modal');
const invoiceList = document.getElementById('invoice-list');
const invoiceTotal = document.getElementById('invoice-total');
const invoiceCloseBtn = document.getElementById('invoice-close');
const invoiceConfirmBtn = document.getElementById('invoice-confirm');
const customModal = document.getElementById('custom-modal');
const customForm = document.getElementById('custom-form');
const customDishName = document.getElementById('custom-dish-name');
const customRiceGroup = document.getElementById('custom-rice-group');
const customStyleGroup = document.getElementById('custom-style-group');
const customCloseBtn = document.getElementById('custom-close');
const customCancelBtn = document.getElementById('custom-cancel');
const customCutGroup = document.getElementById('custom-cut-group');
const cocoExtraNote = document.getElementById('coco-extra-note');
const introOverlay = document.getElementById('intro-overlay');
const introContinueBtn = document.getElementById('intro-continue');
const toastContainer = document.getElementById('toast-container');

let pendingDish = null;

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
        ${item.options ? `<p class="cart-item-options">${item.options}</p>` : ''}
        <p class="cart-item-price">${item.quantity} × ${formatCurrency(item.price)} · <strong>${formatCurrency(lineTotal)}</strong></p>
      </div>
      <div class="cart-item-actions">
        <button class="qty-btn" data-action="decrement" data-key="${item.key}" aria-label="Restar ${item.name}">−</button>
        <span class="qty-count">${item.quantity}</span>
        <button class="qty-btn" data-action="increment" data-key="${item.key}" aria-label="Sumar ${item.name}">+</button>
      </div>
    `;

    cartList.appendChild(li);
  });

  cartCount.textContent = `${totalItems} ${totalItems === 1 ? 'plato' : 'platos'}`;
  cartTotal.textContent = formatCurrency(totalPrice);
  checkoutBtn.disabled = false;
}

function addToCart(name, price, options) {
  const optionLabel = options && options.length > 0 ? options : 'Preparación estándar';
  const key = `${name}::${optionLabel}`;
  const existing = cartMap.get(key) || { key, name, price, options: optionLabel, quantity: 0 };
  existing.quantity += 1;
  cartMap.set(key, existing);
  renderCart();
  showToast(`${name} agregado al carrito`);
}

addButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const dish = button.dataset.dish;
    const price = Number(button.dataset.price);
    if (!dish || Number.isNaN(price)) {
      return;
    }
    openCustomizationModal(dish, price, button);
  });
});

cartList.addEventListener('click', (event) => {
  const button = event.target.closest('.qty-btn');
  if (!button) {
    return;
  }

  const key = button.dataset.key;
  const action = button.dataset.action;
  const item = cartMap.get(key);

  if (!key || !item) {
    return;
  }

  if (action === 'increment') {
    item.quantity += 1;
  } else if (action === 'decrement') {
    item.quantity -= 1;
    if (item.quantity <= 0) {
      cartMap.delete(key);
    }
  }

  if (cartMap.has(key)) {
    cartMap.set(key, item);
  }

  renderCart();
});

function openCustomizationModal(name, price, triggerButton) {
  if (!customModal || !customForm) {
    addToCart(name, price);
    return;
  }
  const cocoExtra = Number(triggerButton?.dataset.cocoExtra || 0);
  const noRice = triggerButton?.dataset.noRice === 'true';
  const noStyle = triggerButton?.dataset.noStyle === 'true';
  pendingDish = { name, price, triggerButton, cocoExtra, noRice, noStyle };
  customDishName.textContent = name;
  customForm.reset();
  const defaultRice = customForm.querySelector('input[name="custom-rice"][value="blanco"]');
  if (defaultRice) {
    defaultRice.checked = true;
  }
  if (customStyleGroup) {
    customStyleGroup.classList.toggle('is-hidden', noStyle);
    if (noStyle) {
      const styleInput = customForm.querySelector('input[name="custom-style"]:checked');
      if (styleInput) {
        styleInput.checked = false;
      }
    } else {
      const defaultStyle = customForm.querySelector('input[name="custom-style"][value="frito"]');
      if (defaultStyle) {
        defaultStyle.checked = true;
      }
    }
  }
  if (customRiceGroup) {
    customRiceGroup.classList.toggle('is-hidden', noRice);
  }
  if (cocoExtraNote) {
    if (cocoExtra > 0 && !noRice) {
      cocoExtraNote.textContent = `(+ ${formatCurrency(cocoExtra)})`;
      cocoExtraNote.style.display = 'inline';
    } else {
      cocoExtraNote.style.display = 'none';
    }
  }
  if (customCutGroup) {
    const shouldShowCut = name.toLowerCase() === 'bocachico';
    customCutGroup.classList.toggle('is-hidden', !shouldShowCut);
    const defaultCut = customForm.querySelector('input[name="custom-cut"][value="centro"]');
    if (!shouldShowCut && defaultCut) {
      defaultCut.checked = true;
    }
  }
  customModal.classList.add('is-open');
  customModal.setAttribute('aria-hidden', 'false');
}

function closeCustomizationModal() {
  if (!customModal) {
    return;
  }
  customModal.classList.remove('is-open');
  customModal.setAttribute('aria-hidden', 'true');
  pendingDish = null;
}

function buildWhatsappMessage() {
  if (cartMap.size === 0) {
    return null;
  }
  let total = 0;
  const lines = Array.from(cartMap.values()).map((item) => {
    const lineTotal = item.price * item.quantity;
    total += lineTotal;
    let optionsText = '';
    if (item.options) {
      optionsText = ` (${item.options.replace(/•/g, ' | ')})`;
    }
    return `• ${item.quantity} × ${item.name}${optionsText} - ${formatCurrency(lineTotal)}`;
  });

  return `Hola, quiero hacer un pedido:\n${lines.join('\n')}\nTotal: ${formatCurrency(total)}`;
}

function showToast(message) {
  if (!toastContainer) {
    return;
  }
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

function applyFilter(category) {
  menuSections.forEach((section) => {
    if (category === 'all' || section.dataset.category === category) {
      section.classList.remove('is-hidden');
    } else {
      section.classList.add('is-hidden');
    }
  });
}

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const category = button.dataset.filter || 'all';
    filterButtons.forEach((btn) => btn.classList.toggle('active', btn === button));
    applyFilter(category);
  });
});

customCloseBtn?.addEventListener('click', closeCustomizationModal);
customCancelBtn?.addEventListener('click', closeCustomizationModal);

customModal?.addEventListener('click', (event) => {
  if (event.target === customModal) {
    closeCustomizationModal();
  }
});

introContinueBtn?.addEventListener('click', () => {
  if (!introOverlay) {
    return;
  }
  introOverlay.classList.add('is-hidden');
  introOverlay.setAttribute('aria-hidden', 'true');
  setTimeout(() => introOverlay.remove(), 350);
});

customForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!pendingDish) {
    return;
  }
  const formData = new FormData(customForm);
  const { name, price, triggerButton, cocoExtra = 0, noRice = false, noStyle = false } = pendingDish;
  let finalPrice = price;
  const options = [];
  let style = 'frito';
  if (!pendingDish?.noStyle) {
    style = formData.get('custom-style') || 'frito';
    options.push(style === 'sudado' ? 'Preparación: Sudado' : 'Preparación: Frito');
  }
  let rice = formData.get('custom-rice') || 'blanco';
  if (!noRice) {
    if (rice === 'coco') {
      const riceLabel = cocoExtra > 0 ? `Arroz con coco (+ ${formatCurrency(cocoExtra)})` : 'Arroz con coco';
      options.push(riceLabel);
    } else {
      options.push('Arroz blanco');
    }
  } else {
    rice = 'blanco';
  }
  if (formData.get('custom-no-salad')) {
    options.push('Sin ensalada');
  }
  if (formData.get('custom-no-patacones')) {
    options.push('Sin patacones');
  }
  if (formData.get('custom-extra-limon')) {
    options.push('Extra limón');
  }
  const notes = formData.get('custom-notes')?.toString().trim();
  if (notes) {
    options.push(`Nota: ${notes}`);
  }
  if (customCutGroup && !customCutGroup.classList.contains('is-hidden')) {
    const cut = formData.get('custom-cut');
    if (cut) {
      const cutLabel = {
        cabeza: 'Cabeza',
        centro: 'Centro',
        cola: 'Cola',
      }[cut] || cut;
      options.push(`Parte preferida: ${cutLabel}`);
    }
  }

  if (!noRice && rice === 'coco' && cocoExtra > 0) {
    finalPrice += cocoExtra;
  }
  addToCart(name, finalPrice, options.join(' • '));
  if (triggerButton) {
    triggerButton.classList.add('added');
    setTimeout(() => triggerButton.classList.remove('added'), 400);
  }
  closeCustomizationModal();
});

function openInvoiceModal() {
  if (!invoiceModal) {
    return;
  }
  const items = Array.from(cartMap.values());
  invoiceList.innerHTML = '';
  let total = 0;

  items.forEach((item) => {
    const lineTotal = item.price * item.quantity;
    total += lineTotal;
    const li = document.createElement('li');
    li.className = 'invoice-item';
    li.innerHTML = `
      <div class="invoice-item-details">
        <span>${item.quantity} × ${item.name}</span>
        ${item.options ? `<p class="invoice-item-options">${item.options}</p>` : ''}
      </div>
      <strong>${formatCurrency(lineTotal)}</strong>
    `;
    invoiceList.appendChild(li);
  });

  invoiceTotal.textContent = formatCurrency(total);
  invoiceModal.classList.add('is-open');
  invoiceModal.setAttribute('aria-hidden', 'false');
}

function closeInvoiceModal() {
  if (!invoiceModal) {
    return;
  }
  invoiceModal.classList.remove('is-open');
  invoiceModal.setAttribute('aria-hidden', 'true');
}

checkoutBtn.addEventListener('click', () => {
  if (cartMap.size === 0) {
    return;
  }
  openInvoiceModal();
});

invoiceCloseBtn?.addEventListener('click', closeInvoiceModal);

invoiceModal?.addEventListener('click', (event) => {
  if (event.target === invoiceModal) {
    closeInvoiceModal();
  }
});

invoiceConfirmBtn?.addEventListener('click', () => {
  const message = buildWhatsappMessage();
  if (!message) {
    return;
  }
  const whatsappURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(whatsappURL, '_blank');
  cartMap.clear();
  renderCart();
  closeInvoiceModal();
});

applyFilter('all');
renderCart();
