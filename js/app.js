const cartMap = new Map();

const WHATSAPP_NUMBER = '573122477439';

const cartList = document.getElementById('cart-items');
const cartCount = document.getElementById('cart-count');
const cartTotal = document.getElementById('cart-total');
const checkoutBtn = document.getElementById('checkout-btn');
const menuFilters = document.getElementById('menu-filters');
const menuSectionsContainer = document.getElementById('menu-sections');
const invoiceModal = document.getElementById('invoice-modal');
const invoiceList = document.getElementById('invoice-list');
const invoiceTotal = document.getElementById('invoice-total');
const invoiceCloseBtn = document.getElementById('invoice-close');
const invoiceConfirmBtn = document.getElementById('invoice-confirm');
const customModal = document.getElementById('custom-modal');
const customForm = document.getElementById('custom-form');
const customDishName = document.getElementById('custom-dish-name');
const customPriceGroup = document.getElementById('custom-price-group');
const customPriceOptions = document.getElementById('custom-price-options');
const customFishGroup = document.getElementById('custom-fish-group');
const customFishOptions = document.getElementById('custom-fish-options');
const customRiceGroup = document.getElementById('custom-rice-group');
const customStyleGroup = document.getElementById('custom-style-group');
const customQuickGroup = document.getElementById('custom-quick-group');
const customCloseBtn = document.getElementById('custom-close');
const customCancelBtn = document.getElementById('custom-cancel');
const customCutGroup = document.getElementById('custom-cut-group');
const cocoExtraNote = document.getElementById('coco-extra-note');
const introOverlay = document.getElementById('intro-overlay');
const introContinueBtn = document.getElementById('intro-continue');
const toastContainer = document.getElementById('toast-container');
const cartFloat = document.getElementById('cart-float');
const cartFloatCount = document.getElementById('cart-float-count');
const cartPanel = document.querySelector('.cart-panel');
const reserveBtn = document.getElementById('reserve-btn');
const reserveModal = document.getElementById('reserve-modal');
const reserveForm = document.getElementById('reserve-form');
const reserveCloseBtn = document.getElementById('reserve-close');
const reserveCancelBtn = document.getElementById('reserve-cancel');

let pendingDish = null;

const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

function formatCurrency(value) {
  return currencyFormatter.format(value);
}

function formatPriceTag(value) {
  return `$${Number(value).toLocaleString('es-CO')}`;
}

function formatPriceDisplay(item) {
  if (item.priceText) {
    return item.priceText;
  }
  if (Array.isArray(item.priceOptions) && item.priceOptions.length > 0) {
    return item.priceOptions.map((option) => formatPriceTag(option.price)).join(' / ');
  }
  return formatPriceTag(item.price);
}

function applyFilter(category) {
  const sections = menuSectionsContainer?.querySelectorAll('.menu-section') || [];
  sections.forEach((section) => {
    if (category === 'all' || section.dataset.category === category) {
      section.classList.remove('is-hidden');
    } else {
      section.classList.add('is-hidden');
    }
  });
}

function renderCart() {
  cartList.innerHTML = '';

  if (cartMap.size === 0) {
    cartList.innerHTML = '<li class="cart-empty">Aún no tienes platos agregados.</li>';
    cartCount.textContent = '0 platos';
    cartTotal.textContent = '$0';
    checkoutBtn.disabled = true;
    if (cartFloat && cartFloatCount) {
      cartFloatCount.textContent = '0';
      cartFloat.classList.add('is-hidden');
    }
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
  if (cartFloat && cartFloatCount) {
    cartFloatCount.textContent = `${totalItems}`;
    cartFloat.classList.toggle('is-hidden', totalItems === 0);
  }
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
  const category = triggerButton?.dataset.category || '';
  const isCeviche = category === 'ceviches';
  const isBeverage = category === 'bebidas';
  const isAdicional = category === 'adicionales';
  const noRice = triggerButton?.dataset.noRice === 'true' || isCeviche || isBeverage;
  const noStyle = triggerButton?.dataset.noStyle === 'true' || isCeviche || isBeverage;
  let priceOptions = null;
  let fishOptions = null;
  if (triggerButton?.dataset.priceOptions) {
    try {
      priceOptions = JSON.parse(triggerButton.dataset.priceOptions);
    } catch (error) {
      priceOptions = null;
    }
  }
  if (triggerButton?.dataset.fishOptions) {
    try {
      fishOptions = JSON.parse(triggerButton.dataset.fishOptions);
    } catch (error) {
      fishOptions = null;
    }
  }
  pendingDish = {
    name,
    price,
    triggerButton,
    cocoExtra,
    noRice,
    noStyle,
    priceOptions,
    fishOptions,
    category,
  };
  customDishName.textContent = name;
  customForm.reset();
  if (customPriceGroup && customPriceOptions) {
    customPriceOptions.innerHTML = '';
    if (Array.isArray(priceOptions) && priceOptions.length > 0) {
      customPriceGroup.classList.remove('is-hidden');
      priceOptions.forEach((option, index) => {
        const label = document.createElement('label');
        const optionLabel = option.label || `Opción ${index + 1}`;
        label.innerHTML = `
          <input type="radio" name="custom-price" value="${option.price}" ${index === 0 ? 'checked' : ''} />
          ${optionLabel} <span class="option-extra">(${formatCurrency(option.price)})</span>
        `;
        customPriceOptions.appendChild(label);
      });
    } else {
      customPriceGroup.classList.add('is-hidden');
    }
  }
  if (customFishGroup && customFishOptions) {
    customFishOptions.innerHTML = '';
    if (Array.isArray(fishOptions) && fishOptions.length > 0) {
      customFishGroup.classList.remove('is-hidden');
      fishOptions.forEach((option, index) => {
        const label = document.createElement('label');
        const optionLabel = option || `Opción ${index + 1}`;
        label.innerHTML = `
          <input type="radio" name="custom-fish" value="${optionLabel}" ${index === 0 ? 'checked' : ''} />
          ${optionLabel}
        `;
        customFishOptions.appendChild(label);
      });
    } else {
      customFishGroup.classList.add('is-hidden');
    }
  }
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
  if (customQuickGroup) {
    const optionLabels = isCeviche
      ? ['Sin aji', 'Sin cebolla']
      : isBeverage
        ? ['Sin hielo', 'Sin azucar']
        : isAdicional
          ? []
        : ['Sin ensalada', 'Sin patacones', 'Extra limón'];
    const optionRows = Array.from(customQuickGroup.querySelectorAll('.quick-option-row'));
    optionRows.forEach((row, index) => {
      const input = row.querySelector('.quick-option');
      const label = row.querySelector('.quick-label');
      if (!input || !label) {
        return;
      }
      if (optionLabels[index]) {
        row.classList.remove('is-hidden');
        label.textContent = optionLabels[index];
        input.dataset.option = optionLabels[index];
        input.checked = false;
      } else {
        row.classList.add('is-hidden');
        input.checked = false;
        input.dataset.option = '';
      }
    });
    customQuickGroup.classList.toggle('is-hidden', optionLabels.length === 0);
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

function isValidReservationTime(timeValue) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(timeValue);
  if (!match) {
    return false;
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return false;
  }
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return false;
  }
  return hours < 12 || (hours === 12 && minutes <= 30);
}

function openReserveModal() {
  if (!reserveModal || !reserveForm) {
    return;
  }
  reserveForm.reset();
  reserveModal.classList.add('is-open');
  reserveModal.setAttribute('aria-hidden', 'false');
}

function closeReserveModal() {
  if (!reserveModal) {
    return;
  }
  reserveModal.classList.remove('is-open');
  reserveModal.setAttribute('aria-hidden', 'true');
}

function renderFilters(categories) {
  if (!menuFilters) {
    return;
  }
  menuFilters.innerHTML = '';
  const allButton = document.createElement('button');
  allButton.className = 'filter-btn active';
  allButton.type = 'button';
  allButton.dataset.filter = 'all';
  allButton.textContent = 'Todo';
  menuFilters.appendChild(allButton);

  categories.forEach((category) => {
    const button = document.createElement('button');
    button.className = 'filter-btn';
    button.type = 'button';
    button.dataset.filter = category.id;
    button.textContent = category.label || category.title || category.id;
    menuFilters.appendChild(button);
  });
}

function createDishCard(item, categoryId) {
  const priceDisplay = formatPriceDisplay(item);
  const hasPriceOptions = Array.isArray(item.priceOptions) && item.priceOptions.length > 0;
  const hasNumericPrice = typeof item.price === 'number' && !Number.isNaN(item.price);
  const hasWhatsappMessage = Boolean(item.whatsappMessage);
  const li = document.createElement('li');
  li.className = 'dish-card';
  li.innerHTML = `
    <article class="dish-card-inner">
      <div class="dish-media">
        <img
          src="${item.image}"
          alt="${item.imageAlt || item.name}"
          class="dish-image"
        />
      </div>
      <div class="dish-content">
        <div class="dish-header">
          <h3>${item.name}</h3>
          <span class="price-tag">${priceDisplay}</span>
        </div>
        <p class="dish-description">
          ${item.description || ''}
        </p>
        <button class="add-to-cart" ${hasWhatsappMessage || hasPriceOptions || hasNumericPrice ? '' : 'disabled'}>
          ${hasWhatsappMessage ? 'Consultar por WhatsApp' : hasPriceOptions || hasNumericPrice ? 'Añadir al pedido' : 'Consultar precio'}
        </button>
      </div>
    </article>
  `;
  const button = li.querySelector('.add-to-cart');
  if (button) {
    button.dataset.dish = item.name;
    button.dataset.category = categoryId;
    if (hasWhatsappMessage) {
      button.dataset.whatsappMessage = item.whatsappMessage;
    }
    if (hasPriceOptions) {
      button.dataset.priceOptions = JSON.stringify(item.priceOptions);
      button.dataset.price = String(item.priceOptions[0].price);
    } else if (hasNumericPrice) {
      button.dataset.price = String(item.price);
    }
    if (item.directAdd) {
      button.dataset.directAdd = 'true';
    }
    if (item.fishOptions) {
      button.dataset.fishOptions = JSON.stringify(item.fishOptions);
    }
    if (item.cocoExtra) {
      button.dataset.cocoExtra = String(item.cocoExtra);
    }
    if (item.noRice) {
      button.dataset.noRice = 'true';
    }
    if (item.noStyle) {
      button.dataset.noStyle = 'true';
    }
  }
  return li;
}

function renderMenuSections(categories) {
  if (!menuSectionsContainer) {
    return;
  }
  menuSectionsContainer.innerHTML = '';
  categories.forEach((category) => {
    const section = document.createElement('section');
    section.className = 'menu-section';
    section.dataset.category = category.id;

    section.innerHTML = `
      <div class="section-header">
        <p class="eyebrow">${category.eyebrow || ''}</p>
        <h2>${category.title || category.label || ''}</h2>
        <p class="description">
          ${category.description || ''}
        </p>
      </div>
      <ul class="dish-list"></ul>
    `;

    const list = section.querySelector('.dish-list');
    (category.items || []).forEach((item) => {
      list.appendChild(createDishCard(item, category.id));
    });
    menuSectionsContainer.appendChild(section);
  });
}

async function loadMenu() {
  if (!menuSectionsContainer) {
    return;
  }
  try {
    const response = await fetch('productos.json', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('No se pudo cargar productos.json');
    }
    const data = await response.json();
    const categories = Array.isArray(data.categories) ? data.categories : [];
    renderFilters(categories);
    renderMenuSections(categories);
    applyFilter('all');
  } catch (error) {
    menuSectionsContainer.innerHTML = '<p class="menu-empty">No pudimos cargar la carta.</p>';
  }
}

menuFilters?.addEventListener('click', (event) => {
  const button = event.target.closest('.filter-btn');
  if (!button || !menuFilters) {
    return;
  }
  const category = button.dataset.filter || 'all';
  menuFilters.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.classList.toggle('active', btn === button);
  });
  applyFilter(category);
});

menuSectionsContainer?.addEventListener('click', (event) => {
  const button = event.target.closest('.add-to-cart');
  if (!button || button.disabled) {
    return;
  }
  if (button.dataset.whatsappMessage) {
    const message = button.dataset.whatsappMessage;
    const whatsappURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(whatsappURL, '_blank');
    return;
  }
  const dish = button.dataset.dish;
  const price = Number(button.dataset.price);
  if (!dish || Number.isNaN(price)) {
    return;
  }
  if (button.dataset.directAdd === 'true') {
    addToCart(dish, price);
    return;
  }
  openCustomizationModal(dish, price, button);
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

reserveBtn?.addEventListener('click', openReserveModal);
reserveCloseBtn?.addEventListener('click', closeReserveModal);
reserveCancelBtn?.addEventListener('click', closeReserveModal);

reserveModal?.addEventListener('click', (event) => {
  if (event.target === reserveModal) {
    closeReserveModal();
  }
});

reserveForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(reserveForm);
  const day = formData.get('reserve-day')?.toString().trim();
  const time = formData.get('reserve-time')?.toString().trim();
  const people = formData.get('reserve-people')?.toString().trim();
  if (!day || !time || !people) {
    return;
  }
  if (!isValidReservationTime(time)) {
    window.alert('Hora inválida. La hora máxima de reservas es 12:30.');
    return;
  }
  const message = `Hola, quiero reservar una mesa. Día: ${day}, hora: ${time}, personas: ${people}.`;
  const whatsappURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(whatsappURL, '_blank');
  closeReserveModal();
});

cartFloat?.addEventListener('click', () => {
  if (!cartPanel) {
    return;
  }
  cartPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

customForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!pendingDish) {
    return;
  }
  const formData = new FormData(customForm);
  const {
    name,
    price,
    priceOptions,
    fishOptions,
    triggerButton,
    cocoExtra = 0,
    noRice = false,
    noStyle = false,
  } = pendingDish;
  let finalPrice = price;
  const options = [];
  if (Array.isArray(priceOptions) && priceOptions.length > 0) {
    const selectedPrice = Number(formData.get('custom-price'));
    if (!Number.isNaN(selectedPrice)) {
      finalPrice = selectedPrice;
      const selectedOption = priceOptions.find((option) => Number(option.price) === selectedPrice);
      if (selectedOption?.label) {
        options.push(`Tamaño: ${selectedOption.label}`);
      }
    }
  }
  if (Array.isArray(fishOptions) && fishOptions.length > 0) {
    const selectedFish = formData.get('custom-fish');
    if (selectedFish) {
      options.push(`Pescado: ${selectedFish}`);
    }
  }
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
  if (customQuickGroup) {
    customQuickGroup.querySelectorAll('.quick-option').forEach((input) => {
      if (input.checked) {
        const label = input.dataset.option?.trim();
        if (label) {
          options.push(label);
        }
      }
    });
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

loadMenu();
renderCart();
