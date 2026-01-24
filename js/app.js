const cartMap = new Map();

const WHATSAPP_NUMBER = '573122477439';
const PACKAGING_FEE = 2000;

const cartList = document.getElementById('cart-items');
const cartCount = document.getElementById('cart-count');
const cartTotal = document.getElementById('cart-total');
const checkoutBtn = document.getElementById('checkout-btn');
const menuFilters = document.getElementById('menu-filters');
const menuSectionsContainer = document.getElementById('menu-sections');
const menuSkeleton = document.getElementById('menu-skeleton');
const featuredList = document.getElementById('featured-list');
const featuredSection = document.getElementById('featured');
const invoiceModal = document.getElementById('invoice-modal');
const invoiceList = document.getElementById('invoice-list');
const invoiceTotal = document.getElementById('invoice-total');
const invoiceCloseBtn = document.getElementById('invoice-close');
const invoiceConfirmBtn = document.getElementById('invoice-confirm');
const customerModal = document.getElementById('customer-modal');
const customerForm = document.getElementById('customer-form');
const customerCloseBtn = document.getElementById('customer-close');
const customerCancelBtn = document.getElementById('customer-cancel');
const customModal = document.getElementById('custom-modal');
const customForm = document.getElementById('custom-form');
const customDishName = document.getElementById('custom-dish-name');
const customPriceGroup = document.getElementById('custom-price-group');
const customPriceSelect = document.getElementById('custom-price-select');
const customProteinGroup = document.getElementById('custom-protein-group');
const customProteinSelect = document.getElementById('custom-protein-select');
const customSideGroup = document.getElementById('custom-side-group');
const customStyleGroup = document.getElementById('custom-style-group');
const customQuickGroup = document.getElementById('custom-quick-group');
const customCloseBtn = document.getElementById('custom-close');
const customCancelBtn = document.getElementById('custom-cancel');
const introOverlay = document.getElementById('intro-overlay');
const introContinueBtn = document.getElementById('intro-continue');
const toastContainer = document.getElementById('toast-container');
const cartFloat = document.getElementById('cart-float');
const cartFloatCount = document.getElementById('cart-float-count');
const cartPanel = document.querySelector('.cart-panel');
const scrollTopBtn = document.getElementById('scroll-top');
const reserveBtn = document.getElementById('reserve-btn');
const heroCta = document.getElementById('hero-cta');
const mobileCta = document.getElementById('mobile-cta');
const mobileCtaTotal = document.getElementById('mobile-cta-total');
const mobileCtaBtn = document.getElementById('mobile-cta-btn');
const reserveModal = document.getElementById('reserve-modal');
const reserveForm = document.getElementById('reserve-form');
const reserveCloseBtn = document.getElementById('reserve-close');
const reserveCancelBtn = document.getElementById('reserve-cancel');

let pendingDish = null;
let priceChoices = null;
let proteinChoices = null;
let activeCategory = 'all';
let menuData = null;

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

function addPackagingFee(value) {
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return value;
  }
  return numericValue + PACKAGING_FEE;
}

function getAdjustedPrice(value) {
  return Number(addPackagingFee(value));
}

function formatPriceDisplay(item) {
  if (item.priceText) {
    return item.priceText;
  }
  if (Array.isArray(item.priceOptions) && item.priceOptions.length > 0) {
    return item.priceOptions.map((option) => formatPriceTag(addPackagingFee(option.price))).join(' / ');
  }
  return formatPriceTag(addPackagingFee(item.price));
}

function applyFilter(category) {
  const normalized = (category || 'all').toString().trim().toLowerCase();
  const sections = menuSectionsContainer?.querySelectorAll('.menu-section') || [];
  sections.forEach((section) => {
    if (normalized === 'all' || section.dataset.category === normalized) {
      section.classList.remove('is-hidden');
    } else {
      section.classList.add('is-hidden');
    }
  });
  if (window.AOS) {
    requestAnimationFrame(() => {
      AOS.refreshHard();
    });
  }
}

function renderCart() {
  cartList.innerHTML = '';

  if (cartMap.size === 0) {
    cartList.innerHTML = '<li class="cart-empty">Aún no tienes productos agregados.</li>';
    cartCount.textContent = '0 productos';
    cartTotal.textContent = '$0';
    if (mobileCtaTotal) {
      mobileCtaTotal.textContent = '$0';
    }
    if (mobileCta) {
      mobileCta.classList.add('is-hidden');
    }
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
    const unitPrice = getAdjustedPrice(item.basePrice);
    const lineTotal = unitPrice * item.quantity;
    totalItems += item.quantity;
    totalPrice += lineTotal;

    const li = document.createElement('li');
    li.className = 'cart-item';

    li.innerHTML = `
      <div>
        <p class="cart-item-name">${item.name}</p>
        ${item.options ? `<p class="cart-item-options">${item.options}</p>` : ''}
        <p class="cart-item-price">${item.quantity} × ${formatCurrency(unitPrice)} · <strong>${formatCurrency(lineTotal)}</strong></p>
      </div>
      <div class="cart-item-actions">
        <button class="qty-btn" data-action="decrement" data-key="${item.key}" aria-label="Restar ${item.name}">−</button>
        <span class="qty-count">${item.quantity}</span>
        <button class="qty-btn" data-action="increment" data-key="${item.key}" aria-label="Sumar ${item.name}">+</button>
      </div>
    `;

    cartList.appendChild(li);
  });

  cartCount.textContent = `${totalItems} ${totalItems === 1 ? 'producto' : 'productos'}`;
  cartTotal.textContent = formatCurrency(totalPrice);
  if (mobileCtaTotal) {
    mobileCtaTotal.textContent = formatCurrency(totalPrice);
  }
  if (mobileCta) {
    mobileCta.classList.remove('is-hidden');
  }
  checkoutBtn.disabled = false;
  if (cartFloat && cartFloatCount) {
    cartFloatCount.textContent = `${totalItems}`;
    cartFloat.classList.toggle('is-hidden', totalItems === 0);
  }
}

function addToCart(name, basePrice, options) {
  const optionLabel = options && options.length > 0 ? options : 'Personalización estándar';
  const key = `${name}::${optionLabel}`;
  const existing = cartMap.get(key) || { key, name, basePrice, options: optionLabel, quantity: 0 };
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
  const category = triggerButton?.dataset.category || '';
  const isBeverage = category === 'bebidas';
  const isSushi = category === 'sushi';
  const noSide = triggerButton?.dataset.noSide === 'true' || isBeverage || isSushi;
  const noStyle = triggerButton?.dataset.noStyle === 'true' || isBeverage || isSushi;
  let priceOptions = null;
  let proteinOptions = null;
  if (triggerButton?.dataset.priceOptions) {
    try {
      priceOptions = JSON.parse(triggerButton.dataset.priceOptions);
    } catch (error) {
      priceOptions = null;
    }
  }
  if (triggerButton?.dataset.proteinOptions) {
    try {
      proteinOptions = JSON.parse(triggerButton.dataset.proteinOptions);
    } catch (error) {
      proteinOptions = null;
    }
  }
  pendingDish = {
    name,
    price,
    triggerButton,
    noSide,
    noStyle,
    priceOptions,
    proteinOptions,
    category,
  };
  customDishName.textContent = name;
  customForm.reset();
  if (customPriceGroup && customPriceSelect) {
    customPriceSelect.innerHTML = '';
    if (Array.isArray(priceOptions) && priceOptions.length > 0) {
      customPriceGroup.classList.remove('is-hidden');
      priceOptions.forEach((option) => {
        const optionLabel = option.label || 'Opción';
        const optionPrice = addPackagingFee(option.price);
        const opt = document.createElement('option');
        opt.value = String(option.price);
        opt.textContent = `${optionLabel} (${formatCurrency(optionPrice)})`;
        customPriceSelect.appendChild(opt);
      });
      if (window.Choices) {
        if (priceChoices) {
          priceChoices.destroy();
        }
        priceChoices = new Choices(customPriceSelect, {
          searchEnabled: false,
          itemSelectText: '',
        });
      }
    } else {
      customPriceGroup.classList.add('is-hidden');
      if (priceChoices) {
        priceChoices.destroy();
        priceChoices = null;
      }
    }
  }
  if (customProteinGroup && customProteinSelect) {
    customProteinSelect.innerHTML = '';
    if (Array.isArray(proteinOptions) && proteinOptions.length > 0) {
      customProteinGroup.classList.remove('is-hidden');
      proteinOptions.forEach((option) => {
        const opt = document.createElement('option');
        opt.value = option;
        opt.textContent = option;
        customProteinSelect.appendChild(opt);
      });
      if (window.Choices) {
        if (proteinChoices) {
          proteinChoices.destroy();
        }
        proteinChoices = new Choices(customProteinSelect, {
          searchEnabled: false,
          itemSelectText: '',
        });
      }
    } else {
      customProteinGroup.classList.add('is-hidden');
      if (proteinChoices) {
        proteinChoices.destroy();
        proteinChoices = null;
      }
    }
  }
  const defaultSide = customForm.querySelector('input[name="custom-side"][value="papas"]');
  if (defaultSide) {
    defaultSide.checked = true;
  }
  if (customStyleGroup) {
    customStyleGroup.classList.toggle('is-hidden', noStyle);
    if (noStyle) {
      const styleInput = customForm.querySelector('input[name="custom-style"]:checked');
      if (styleInput) {
        styleInput.checked = false;
      }
    } else {
      const defaultStyle = customForm.querySelector('input[name="custom-style"][value="jugosa"]');
      if (defaultStyle) {
        defaultStyle.checked = true;
      }
    }
  }
  if (customSideGroup) {
    customSideGroup.classList.toggle('is-hidden', noSide);
  }
  if (customQuickGroup) {
    const quickOptionsByCategory = {
      hamburguesas: ['Sin cebolla', 'Sin tomate', 'Extra queso'],
      perros: ['Sin cebolla', 'Sin papitas', 'Extra queso'],
      salchipapas: ['Sin salsas', 'Extra queso', 'Extra tocineta'],
      arepas: ['Sin queso', 'Sin salsa', 'Extra aguacate'],
      empanadas: ['Sin aji', 'Extra limon'],
      sushi: ['Sin ajonjoli', 'Extra soya', 'Extra wasabi'],
      bebidas: ['Sin hielo', 'Sin azucar'],
    };
    const optionLabels = quickOptionsByCategory[category] || [];
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

function buildWhatsappMessage(customer) {
  if (cartMap.size === 0) {
    return null;
  }
  let total = 0;
  const lines = Array.from(cartMap.values()).map((item) => {
    const unitPrice = getAdjustedPrice(item.basePrice);
    const lineTotal = unitPrice * item.quantity;
    total += lineTotal;
    let optionsText = '';
    if (item.options) {
      optionsText = ` (${item.options.replace(/•/g, ' | ')})`;
    }
    return `• ${item.quantity} × ${item.name}${optionsText} - ${formatCurrency(lineTotal)}`;
  });

  const customerLines = customer
    ? [
        `Nombre: ${customer.name}`,
        `Celular: ${customer.phone}`,
        `Direccion: ${customer.address}`,
      ]
    : [];
  return `Hola, quiero hacer un pedido:\n${customerLines.join('\n')}\n${lines.join('\n')}\nTotal: ${formatCurrency(total)}`;
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
    button.dataset.filter = String(category.id || '').trim().toLowerCase();
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
  li.dataset.aos = 'fade-up';
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
    if (item.proteinOptions) {
      button.dataset.proteinOptions = JSON.stringify(item.proteinOptions);
    }
    if (item.noSide) {
      button.dataset.noSide = 'true';
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
  let hasAny = false;
  categories.forEach((category) => {
    const section = document.createElement('section');
    section.className = 'menu-section';
    section.dataset.category = String(category.id || '').trim().toLowerCase();

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
    hasAny = true;
  });
  if (window.AOS) {
    AOS.refreshHard();
  }
}

function renderFeatured(categories) {
  if (!featuredList || !featuredSection) {
    return;
  }
  const allItems = categories.flatMap((category) =>
    (category.items || []).map((item) => ({
      item,
      categoryId: category.id,
    }))
  );
  const featuredItems = allItems.filter(({ item }) => item.featured);
  if (featuredItems.length < 3) {
    const existing = new Set(featuredItems.map(({ item }) => item.name));
    allItems.forEach((entry) => {
      if (featuredItems.length >= 4) {
        return;
      }
      if (!existing.has(entry.item.name)) {
        featuredItems.push(entry);
        existing.add(entry.item.name);
      }
    });
  }
  featuredList.innerHTML = '';
  if (featuredItems.length === 0) {
    featuredSection.classList.add('is-hidden');
    return;
  }
  featuredSection.classList.remove('is-hidden');
  featuredItems.slice(0, 3).forEach(({ item, categoryId }) => {
    featuredList.appendChild(createDishCard(item, categoryId));
  });
}

function renderSkeleton() {
  if (!menuSkeleton) {
    return;
  }
  const skeletonSections = Array.from({ length: 2 }, () => `
    <div class="skeleton-section">
      <div class="skeleton-header">
        <span class="skeleton-line short"></span>
        <span class="skeleton-line medium"></span>
        <span class="skeleton-line long"></span>
      </div>
      <div class="skeleton-grid">
        ${Array.from({ length: 4 }, () => `
          <div class="skeleton-card">
            <div class="skeleton-media"></div>
            <div class="skeleton-body">
              <span class="skeleton-line medium"></span>
              <span class="skeleton-line long"></span>
              <span class="skeleton-pill"></span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
  menuSkeleton.innerHTML = skeletonSections;
}

function setSkeletonVisible(isVisible) {
  if (!menuSkeleton || !menuSectionsContainer) {
    return;
  }
  menuSkeleton.classList.toggle('is-visible', isVisible);
  menuSkeleton.setAttribute('aria-hidden', isVisible ? 'false' : 'true');
  menuSectionsContainer.style.display = isVisible ? 'none' : '';
}

async function loadMenu() {
  if (!menuSectionsContainer) {
    return;
  }
  renderSkeleton();
  setSkeletonVisible(true);
  try {
    const response = await fetch('productos.json', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('No se pudo cargar productos.json');
    }
    const data = await response.json();
    const categories = Array.isArray(data.categories) ? data.categories : [];
    menuData = categories;
    renderFilters(menuData);
    renderFeatured(menuData);
    renderMenuSections(menuData);
    applyFilter('all');
    setSkeletonVisible(false);
  } catch (error) {
    menuSectionsContainer.innerHTML = '<p class="menu-empty">No pudimos cargar la carta.</p>';
    setSkeletonVisible(false);
  }
}

menuFilters?.addEventListener('click', (event) => {
  const button = event.target.closest('.filter-btn');
  if (!button || !menuFilters) {
    return;
  }
  const category = (button.dataset.filter || 'all').toString().trim().toLowerCase();
  activeCategory = category;
  menuFilters.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.classList.toggle('active', btn === button);
  });
  applyFilter(category);
});

function handleAddToCartClick(event) {
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
}

menuSectionsContainer?.addEventListener('click', handleAddToCartClick);
featuredList?.addEventListener('click', handleAddToCartClick);

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

heroCta?.addEventListener('click', () => {
  const target = document.getElementById('menu-filters');
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
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

function updateScrollTopButton() {
  if (!scrollTopBtn) {
    return;
  }
  scrollTopBtn.classList.toggle('is-visible', window.scrollY > 400);
}

scrollTopBtn?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

window.addEventListener('scroll', updateScrollTopButton, { passive: true });
updateScrollTopButton();

if (cartFloat && cartPanel && 'IntersectionObserver' in window) {
  const cartObserver = new IntersectionObserver(
    (entries) => {
      const isVisible = entries.some((entry) => entry.isIntersecting);
      cartFloat.classList.toggle('is-hidden', isVisible || cartMap.size === 0);
    },
    { threshold: 0.2 }
  );
  cartObserver.observe(cartPanel);
}

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
    proteinOptions,
    triggerButton,
    noSide = false,
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
  if (Array.isArray(proteinOptions) && proteinOptions.length > 0) {
    const selectedProtein = formData.get('custom-protein');
    if (selectedProtein) {
      options.push(`Relleno: ${selectedProtein}`);
    }
  }
  let style = 'jugosa';
  if (!pendingDish?.noStyle) {
    style = formData.get('custom-style') || 'jugosa';
    const styleLabel = style === 'bien' ? 'Bien cocida' : 'Jugosa';
    options.push(`Punto: ${styleLabel}`);
  }
  const side = formData.get('custom-side') || 'papas';
  if (!noSide) {
    const sideLabel = side === 'ensalada' ? 'Ensalada fresca' : 'Papas francesas';
    options.push(`Acompañamiento: ${sideLabel}`);
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
    const unitPrice = getAdjustedPrice(item.basePrice);
    const lineTotal = unitPrice * item.quantity;
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

function openCustomerModal() {
  if (!customerModal || !customerForm) {
    return;
  }
  customerForm.reset();
  customerModal.classList.add('is-open');
  customerModal.setAttribute('aria-hidden', 'false');
}

function closeCustomerModal() {
  if (!customerModal) {
    return;
  }
  customerModal.classList.remove('is-open');
  customerModal.setAttribute('aria-hidden', 'true');
}

checkoutBtn.addEventListener('click', () => {
  if (cartMap.size === 0) {
    return;
  }
  openInvoiceModal();
});

mobileCtaBtn?.addEventListener('click', () => {
  if (cartMap.size === 0) {
    showToast('Agrega productos antes de continuar.');
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
  if (cartMap.size === 0) {
    return;
  }
  closeInvoiceModal();
  openCustomerModal();
});

customerCloseBtn?.addEventListener('click', closeCustomerModal);
customerCancelBtn?.addEventListener('click', closeCustomerModal);

customerModal?.addEventListener('click', (event) => {
  if (event.target === customerModal) {
    closeCustomerModal();
  }
});

customerForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!customerForm) {
    return;
  }
  const formData = new FormData(customerForm);
  const name = formData.get('customer-name')?.toString().trim();
  const phone = formData.get('customer-phone')?.toString().trim();
  const address = formData.get('customer-address')?.toString().trim();
  if (!name || !phone || !address) {
    showToast('Completa todos los datos para continuar.');
    return;
  }
  const message = buildWhatsappMessage({ name, phone, address });
  if (!message) {
    return;
  }
  const whatsappURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(whatsappURL, '_blank');
  cartMap.clear();
  renderCart();
  closeCustomerModal();
});

loadMenu();
renderCart();

if (window.AOS) {
  AOS.init({
    duration: 500,
    easing: 'ease-out',
    once: true,
  });
}

if (typeof L !== 'undefined') {
  const armeniaCoords = [4.5339, -75.6811];
  const map = L.map('map', {
    center: armeniaCoords,
    zoom: 13,
    zoomControl: false,
  });
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
  }).addTo(map);
  L.control.zoom({ position: 'bottomright' }).addTo(map);
  const markerIcon = L.divIcon({
    className: '',
    html: '<div class="map-marker" aria-hidden="true"></div>',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
  L.marker(armeniaCoords, { icon: markerIcon })
    .addTo(map)
    .bindPopup('Sabores y Velocidad');
}
