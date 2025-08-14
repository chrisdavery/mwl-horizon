import { PriceChangeEvent } from '@theme/events';

class CustomInput extends HTMLElement {
  connectedCallback() {
    const input = this.querySelector('input, textarea, select');
    if (!input) return;

    const productDetails = this.closest('.product-details');
    if (!productDetails) return;

    const productForm = productDetails.querySelector('.shopify-product-form');
    if (!productForm) return;

    const formId = productForm.getAttribute('id');

    if (formId) {
      input.setAttribute('form', formId);
    }

    const errorMessage = this.querySelector('.error-message');
    if (errorMessage) {
      const hideError = () => this.classList.remove('has-error');
      input.addEventListener('input', hideError);
      input.addEventListener('change', hideError);
      input.addEventListener('select', hideError);
      input.addEventListener('focus', hideError); 
    }
  }
}

if (!customElements.get('custom-input')) {
  customElements.define('custom-input', CustomInput);
}


class DatePicker extends HTMLElement {
  constructor() {
    super();
    this.currentDate = new Date();
    this.selectedDate = null;
    this.today = new Date();
    this.today.setHours(0, 0, 0, 0);
    this.startDate = new Date(this.today);
    this.justOpened = false;

    this.handleDocumentClick = this.handleDocumentClick.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  connectedCallback() {
    this.input = this.querySelector('.custom-form__input');
    if (!this.input) return;

    const leadDays = parseInt(this.input.dataset.leadDate || "0", 10);
    this.startDate = new Date(this.today);
    this.startDate.setDate(this.startDate.getDate() + leadDays);
    // Set time to end of day to ensure full day is included
    this.startDate.setHours(23, 59, 59, 999);

    this.calendar = this.querySelector('.ai-datepicker-calendar');
    this.monthYearDisplay = this.querySelector('.ai-datepicker-month-year');
    this.grid = this.querySelector('.ai-datepicker-grid');
    this.yearSelector = this.querySelector('.ai-datepicker-year-selector');
    this.prevButton = this.querySelector('[data-action="prev-month"]');
    this.nextButton = this.querySelector('[data-action="next-month"]');

    this.setupEventListeners();
    this.renderCalendar();

    document.addEventListener('click', this.handleDocumentClick);
    document.addEventListener('keydown', this.handleKeyDown);
  }

  setupEventListeners() {
    this.input.addEventListener('focus', () => this.showCalendar());
    this.prevButton.addEventListener('click', () => this.previousMonth());
    this.nextButton.addEventListener('click', () => this.nextMonth());
    this.monthYearDisplay.addEventListener('click', () => this.toggleYearSelector());
  }

  disconnectedCallback() {
    document.removeEventListener('click', this.handleDocumentClick);
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  handleDocumentClick(e) {
    if (this.justOpened) {
      this.justOpened = false;
      return;
    }
    if (!this.contains(e.target)) {
      this.hideCalendar();
    }
  }

  handleKeyDown(e) {
    if (e.key === 'Escape' && this.calendar.classList.contains('active')) {
      this.hideCalendar();
      this.input.focus();
    }
  }

  toggleCalendar() {
    this.calendar.classList.contains('active') ? this.hideCalendar() : this.showCalendar();
  }

  showCalendar() {
    this.justOpened = true;

    if (!this.input.value && !this.selectedDate) {
      this.selectedDate = new Date(this.today);
      this.currentDate = new Date(this.today);
    }

    if (!this.hasAvailableDaysInMonth(this.currentDate)) {
      this.moveToNextAvailableMonth();
    }

    this.calendar.classList.add('active');
    this.renderCalendar();

    setTimeout(() => {
      this.justOpened = false;
    }, 0);
  }

  hideCalendar() {
    this.calendar.classList.remove('active');
    this.yearSelector.classList.add('hidden');
    this.grid.classList.remove('hidden');
  }

  previousMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.renderCalendar();
  }

  nextMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.renderCalendar();
  }

  renderCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    this.monthYearDisplay.textContent = new Date(year, month).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });

    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    [...this.grid.querySelectorAll('.ai-datepicker-day')].forEach(day => day.remove());
    const dayElements = [];

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      // Create comparison date at midnight
      const comparisonDate = new Date(date);
      comparisonDate.setHours(0, 0, 0, 0);
      
      const dayElement = document.createElement('div');
      dayElement.className = 'ai-datepicker-day';
      dayElement.textContent = date.getDate();
      dayElement.setAttribute('data-date', date.toISOString().split('T')[0]);

      if (date.getMonth() !== month) {
        dayElement.classList.add('other-month');
      }

      // Compare against normalized dates
      if (comparisonDate < this.startDate) {
        dayElement.classList.add('disabled');
      }

      if (date.toDateString() === this.today.toDateString()) {
        dayElement.classList.add('today');
      }

      if (this.selectedDate && date.toDateString() === this.selectedDate.toDateString()) {
        dayElement.classList.add('selected');
      }

      if (!dayElement.classList.contains('disabled') && !dayElement.classList.contains('other-month')) {
        dayElement.addEventListener('click', () => this.selectDate(date));
      }

      dayElements.push(dayElement);
    }

    const lastRow = dayElements.slice(35, 42);
    const hasCurrentMonthDayInLastRow = lastRow.some(el => !el.classList.contains('other-month'));

    for (let i = 0; i < 35; i++) {
      this.grid.appendChild(dayElements[i]);
    }

    if (hasCurrentMonthDayInLastRow) {
      for (let i = 35; i < 42; i++) {
        this.grid.appendChild(dayElements[i]);
      }
    }

    const prevMonthStart = new Date(year, month - 1, 1);
    const prevMonthEnd = new Date(year, month, 0);

    let hasValidDateInPrevMonth = false;
    for (let d = new Date(prevMonthStart); d <= prevMonthEnd; d.setDate(d.getDate() + 1)) {
      if (d >= this.startDate) {
        hasValidDateInPrevMonth = true;
        break;
      }
    }

    this.prevButton.disabled = !hasValidDateInPrevMonth;
  }

  hasAvailableDaysInMonth(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const checkDate = new Date(year, month, day);
      if (checkDate >= this.startDate) {
        return true;
      }
    }
    return false;
  }

  moveToNextAvailableMonth() {
    let nextMonth = new Date(this.currentDate);
    for (let i = 0; i < 12; i++) {
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      if (this.hasAvailableDaysInMonth(nextMonth)) {
        this.currentDate = new Date(nextMonth);
        return;
      }
    }
  }

  toggleYearSelector() {
    if (this.yearSelector.classList.contains('hidden')) {
      this.populateYearSelector();
      this.yearSelector.classList.remove('hidden');
      this.grid.classList.add('hidden');
    } else {
      this.yearSelector.classList.add('hidden');
      this.grid.classList.remove('hidden');
    }
  }

  populateYearSelector() {
    const currentCalendarYear = this.currentDate.getFullYear();
    const todayYear = this.today.getFullYear();
    this.yearSelector.innerHTML = '';

    for (let year = todayYear; year <= 2055; year++) {
      const yearSpan = document.createElement('span');
      yearSpan.textContent = year;
      yearSpan.classList.add('ai-datepicker-year');

      if (year === currentCalendarYear) {
        yearSpan.classList.add('selected');
      }

      yearSpan.addEventListener('click', () => {
        this.currentDate.setFullYear(year);
        this.toggleYearSelector();
        this.renderCalendar();
      });

      this.yearSelector.appendChild(yearSpan);
    }
  }

  selectDate(date) {
    this.selectedDate = new Date(date);
    this.input.value = this.formatDate(date);
    this.renderCalendar();
    this.hideCalendar();
    this.updatePriorityFeeItems(date);
  }

  formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  updatePriorityFeeItems(selectedDate) {
      const parentGroup = this.closest('.parent-group-datepicker');
      if (!parentGroup) return;

      const priorityFeeItems = Array.from(parentGroup.querySelectorAll('.priority-fee-item'));
      if (!priorityFeeItems.length) return;

      const daysDiff = Math.ceil((selectedDate - this.today) / (1000 * 60 * 60 * 24));

      // Clear all active classes
      priorityFeeItems.forEach(item => item.classList.remove('active'));

      // Get product form
      const productDetails = this.closest('.product-details');
      const productForm = productDetails?.querySelector('.shopify-product-form');

      // Remove any old hidden inputs
      if (productForm) {
        productForm.querySelectorAll('.priority-fee').forEach(input => input.remove());
      }

      // Skip if too far out
      if (daysDiff >= 180) return;

      // Sort thresholds
      const thresholds = priorityFeeItems
          .map(item => parseInt(item.dataset.leadDate))
          .sort((a, b) => a - b);

      for (let i = 0; i < thresholds.length; i++) {
          const minDays = thresholds[i];
          const maxDays = thresholds[i + 1] || Infinity;

          if (daysDiff >= minDays && daysDiff < maxDays) {
              const matchingItem = priorityFeeItems.find(
                  item => parseInt(item.dataset.leadDate) === minDays
              );

              if (matchingItem) {
                  matchingItem.classList.add('active');

                  const productId = matchingItem.dataset.productId;
                  if (productId && productForm) {
                      const hiddenInput = document.createElement('input');
                      hiddenInput.type = 'hidden';
                      hiddenInput.name = `addons[${productId}]`;
                      hiddenInput.value = productId; // ← same as dataset.productId
                      hiddenInput.classList.add('product-addon');
                      hiddenInput.classList.add('priority-fee');

                      if (matchingItem.dataset.variantPrice) {
                        hiddenInput.setAttribute('data-variant-price', matchingItem.dataset.variantPrice)
                      }

                      productForm.appendChild(hiddenInput);

                      document.dispatchEvent(new PriceChangeEvent());
                  }
              }
              break;
          }
      }
  }
}

customElements.define('date-picker', DatePicker);

class CustomSelect extends HTMLElement {
  connectedCallback() {
    const select = this.querySelector("select");
    if (!select) return;

    this.select = select;
    this.render();
    this.bindEvents();
  }

  render() {
    this.wrapper = document.createElement("div");
    this.wrapper.className = "custom-select";

    this.display = document.createElement("div");
    this.display.className = "cs-display";
    this.display.textContent = ""; // always blank initially
    this.wrapper.appendChild(this.display);

    this.menu = document.createElement("div");
    this.menu.className = "cs-menu";
    this.populateMenu();
    this.wrapper.appendChild(this.menu);

    this.appendChild(this.wrapper);
    this.closest('.custom-select-wrapper')?.classList.remove('hidden')
  }

  populateMenu() {
    this.optionEls = []; // store references

    Array.from(this.select.options)
      .filter(opt => opt.value.trim() !== "") // skip empty placeholder
      .forEach(opt => {
        const optionEl = document.createElement("div");
        optionEl.className = "cs-option";
        optionEl.textContent = opt.text;

        optionEl.addEventListener("click", e => {
          e.stopPropagation(); // prevents wrapper click from firing
          this.onOptionSelect(opt, optionEl);
        });

        this.menu.appendChild(optionEl);
        this.optionEls.push(optionEl);
      });
  }

  bindEvents() {
    // Click anywhere in wrapper to toggle menu
    this.wrapper.addEventListener("click", () => this.toggleMenu());

    // Close menu when clicking outside
    document.addEventListener("click", e => {
      if (!this.wrapper.contains(e.target)) this.closeMenu();
    });
  }

  toggleMenu() {
    this.menu.classList.toggle("open");
  }

  closeMenu() {
    this.menu.classList.remove("open");
  }

  onOptionSelect(opt, optionEl) {
    // set native select value
    this.select.value = opt.value;

    this.showhideOpts(opt)
    // dispatch events
    this.select.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    this.select.dispatchEvent(new Event("change", { bubbles: true, composed: true }));

    // update display text
    this.display.textContent = opt.text;

    // highlight selected
    this.optionEls.forEach(el => el.classList.remove("selected"));
    optionEl.classList.add("selected");

    // toggle has-value on the custom element
    if (opt.value.trim() !== "") {
      this.classList.add("has-value");
    } else {
      this.classList.remove("has-value");
    }

    this.closeMenu();
  }

  /**
   * @param {any} value
   * @param {any} opt
   */
  showhideOpts(opt) {
    const { optionName } = this.dataset;
    if (!this.closest('.dropdown-details')) return;

    document.querySelectorAll(`custom-select[data-show-name="${optionName}"]`).forEach(el => {
      const dropdown = el.closest('.dropdown-details');
      const select = dropdown?.querySelector('select');
      const field = el.closest('.custom-dropdown--field');

      const shouldShow = el.dataset.showValue && opt.value === el.dataset.showValue;

      dropdown?.classList.toggle('hidden', !shouldShow);
      select?.toggleAttribute('required', shouldShow);

      if (shouldShow) {
        field?.classList.remove('has-error');
      }
    });
  }
}

customElements.define("custom-select", CustomSelect);

document.addEventListener('price:change', e => {
  const priceEl = document.querySelector('.add-to-cart-price');
  const symbol = priceEl.dataset.symbol;
  const currency = priceEl.dataset.currency || 'AUD';

  if (priceEl) {
    priceEl.textContent = symbol + ' ' + formatMoney(e.detail.total.toString(), currency) + ' ' + currency;
  }
});

document.addEventListener('change', e => {
  if (e.target instanceof HTMLElement && e.target.matches('.product-addon')) {
    document.dispatchEvent(new PriceChangeEvent());
  }
});

/**
 * Formats money, replicating Shopify's `money` liquid filter behavior.
 * @param {number} moneyValue - Money value in cents (e.g., 12345 = $123.45)
 * @param {string} currency - Currency code (e.g., "USD", "EUR")
 * @param {string} template - Money format template (default: "{{amount}}")
 * @returns {string} The formatted money value
 */
function formatMoney(moneyValue, currency, template = '{{amount}}') {
  const upperCurrency = currency.toUpperCase();
  const basePrecision = CURRENCY_DECIMALS[upperCurrency] ?? DEFAULT_CURRENCY_DECIMALS;

  return template.replace(/{{\s*(\w+)\s*}}/g, (_, placeholder) => {
    let thousandsSeparator = ',';
    let decimalSeparator = '.';
    let precision = basePrecision;

    switch (placeholder) {
      case 'currency':
        return currency;
      case 'amount_no_decimals':
        precision = 0;
        break;
      case 'amount_with_comma_separator':
        thousandsSeparator = '.';
        decimalSeparator = ',';
        break;
      case 'amount_no_decimals_with_comma_separator':
        thousandsSeparator = '.';
        precision = 0;
        break;
      case 'amount_no_decimals_with_space_separator':
        thousandsSeparator = ' ';
        precision = 0;
        break;
      case 'amount_with_space_separator':
        thousandsSeparator = ' ';
        decimalSeparator = ',';
        break;
      case 'amount_with_period_and_space_separator':
        thousandsSeparator = ' ';
        decimalSeparator = '.';
        break;
      case 'amount_with_apostrophe_separator':
        thousandsSeparator = "'";
        decimalSeparator = '.';
        break;
      // default: 'amount'
    }

    return formatCents(moneyValue, thousandsSeparator, decimalSeparator, precision);
  });
}

/**
 * Formats money in cents
 * @param {number} moneyValue - The money value in cents
 * @param {string} thousandsSeparator - The thousands separator
 * @param {string} decimalSeparator - The decimal separator
 * @param {number} precision - The precision
 * @returns {string} The formatted money value
 */
function formatCents(moneyValue, thousandsSeparator, decimalSeparator, precision) {
  const roundedNumber = (moneyValue / 100).toFixed(precision);

  let [a, b] = roundedNumber.split('.');
  if (!a) a = '0';
  if (!b) b = '';

  // Add thousands separator
  a = a.replace(/\d(?=(\d\d\d)+(?!\d))/g, digit => digit + thousandsSeparator);

  return precision <= 0 ? a : a + decimalSeparator + b.padEnd(precision, '0');
}


/**
 * Default currency decimals used in most currenies
 * @constant {number}
 */
const DEFAULT_CURRENCY_DECIMALS = 2;

/**
 * Decimal precision for currencies that have a non-default precision
 * @type {Record<string, number>}
 */
const CURRENCY_DECIMALS = {
  BHD: 3,
  BIF: 0,
  BYR: 0,
  CLF: 4,
  CLP: 0,
  DJF: 0,
  GNF: 0,
  IQD: 3,
  ISK: 0,
  JOD: 3,
  JPY: 0,
  KMF: 0,
  KRW: 0,
  KWD: 3,
  LYD: 3,
  MRO: 5,
  OMR: 3,
  PYG: 0,
  RWF: 0,
  TND: 3,
  UGX: 0,
  UYI: 0,
  UYW: 4,
  VND: 0,
  VUV: 0,
  XAF: 0,
  XAG: 0,
  XAU: 0,
  XBA: 0,
  XBB: 0,
  XBC: 0,
  XBD: 0,
  XDR: 0,
  XOF: 0,
  XPD: 0,
  XPF: 0,
  XPT: 0,
  XSU: 0,
  XTS: 0,
  XUA: 0,
};