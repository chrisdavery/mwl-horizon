class HeaderArrows extends HTMLElement {
  constructor() {
    super();
    this.prevBtn = null;
    this.nextBtn = null;
    this.slideshow = null;
  }

  connectedCallback() {
    this.prevBtn = this.querySelector('button[ref="previous"]');
    this.nextBtn = this.querySelector('button[ref="next"]');
    const parentSection =  this.closest('.shopify-block') || this.closest('.section');

    if (!parentSection) return;

    this.slideshow = parentSection.querySelector('slideshow-component');
    if (!this.slideshow) return;

    // Permanently disable built-in controls
    this.disableBuiltInControls();

    // Initialize button states
    this.updateButtonStates();

    // Add click handlers
    this.prevBtn?.addEventListener('click', (e) => this.handlePrevClick(e));
    this.nextBtn?.addEventListener('click', (e) => this.handleNextClick(e));

    // Listen to slideshow events
    this.slideshow.addEventListener('slideshow-select', (e) => {
      this.updateButtonStates();
    });

    // Also listen to scroll events in case slides change via dragging
    this.slideshow.refs.scroller.addEventListener('scroll', () => {
      this.updateButtonStates();
    }, { passive: true });
  }

  disableBuiltInControls() {
    const builtInControls = this.slideshow.querySelectorAll('slideshow-arrows .slideshow-control');
    builtInControls.forEach(control => {
      control.setAttribute('disabled', '');
      control.style.opacity = '0'
      control.style.visibility = 'hidden'
    });
  }

  handlePrevClick(e) {
    e.preventDefault();
    if (this.slideshow.previous) {
      this.slideshow.previous(e);
    } else {
      this.slideshow.dispatchEvent(new CustomEvent('previous', { bubbles: true }));
    }
  }

  handleNextClick(e) {
    e.preventDefault();
    if (this.slideshow.next) {
      this.slideshow.next(e);
    } else {
      this.slideshow.dispatchEvent(new CustomEvent('next', { bubbles: true }));
    }
  }

  updateButtonStates() {
    if (!this.slideshow) return;

    // Use the slideshow's own properties to determine state
    const isPrevDisabled = !this.slideshow.infinite && this.slideshow.atStart;
    const isNextDisabled = !this.slideshow.infinite && this.slideshow.atEnd;

    if (this.prevBtn) {
      this.prevBtn.disabled = isPrevDisabled;
      this.prevBtn.toggleAttribute('aria-disabled', isPrevDisabled);
    }

    if (this.nextBtn) {
      this.nextBtn.disabled = isNextDisabled;
      this.nextBtn.toggleAttribute('aria-disabled', isNextDisabled);
    }
  }
}

customElements.define('header-arrows', HeaderArrows);