import { ThemeEvents, CartAddEvent, CartErrorEvent, VariantUpdateEvent } from '@theme/events';

class CustomInput extends HTMLElement {
  connectedCallback() {
    const input = this.querySelector('input, textarea');
    if (!input) return;

    const productDetails = this.closest('.product-details');
    if (!productDetails) return;

    const productForm = productDetails.querySelector('.shopify-product-form');
    if (!productForm) return;

    const formId = productForm.getAttribute('id');

    if (formId) {
      input.setAttribute('form', formId);
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

    this.calendar = this.querySelector('.ai-datepicker-calendar');
    this.monthYearDisplay = this.querySelector('.ai-datepicker-month-year');
    this.grid = this.querySelector('.ai-datepicker-grid');
    this.yearSelector = this.querySelector('.ai-datepicker-year-selector');
    this.prevButton = this.querySelector('[data-action="prev-month"]');
    this.nextButton = this.querySelector('[data-action="next-month"]');

    this.setupEventListeners();
    this.renderCalendar();

    // ✅ Add these lines to ensure clicks outside hide the calendar
    document.addEventListener('click', this.handleDocumentClick);
    document.addEventListener('keydown', this.handleKeyDown);
  }

  setupEventListeners() {
    this.input.addEventListener('focus', () => this.showCalendar());
    this.prevButton.addEventListener('click', () => this.previousMonth());
    this.nextButton.addEventListener('click', () => this.nextMonth());
    this.monthYearDisplay.addEventListener('click', () => this.toggleYearSelector()); // 👈 Add this
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

    // ✅ This closes the calendar only if the click was outside the entire <date-picker>
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

    // ✅ If input is empty and no selected date, select today
    if (!this.input.value && !this.selectedDate) {
      this.selectedDate = new Date(this.today);
      this.currentDate = new Date(this.today);
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
      const dayElement = document.createElement('div');
      dayElement.className = 'ai-datepicker-day';
      dayElement.textContent = date.getDate();
      dayElement.setAttribute('data-date', date.toISOString().split('T')[0]);

      if (date.getMonth() !== month) {
        dayElement.classList.add('other-month');
      }

      if (date < this.startDate) {
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

    for (let year = todayYear; year <= 2055; year++) { // 👈 starts from todayYear now
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
  }

  formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
}

customElements.define('date-picker', DatePicker);