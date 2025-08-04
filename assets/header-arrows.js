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
    const parentSection = this.closest('.section');

    if (!parentSection) return;

    this.slideshow = parentSection.querySelector('slideshow-component');
    if (!this.slideshow) return;

    // Initialize button states
    this.updateButtonStates();

    // Add click handlers
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', (e) => this.handlePrevClick(e));
    }
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', (e) => this.handleNextClick(e));
    }

    // Update buttons when slideshow changes (optional)
    this.slideshow.addEventListener('slideshow-select', () => this.updateButtonStates());
  }

  handlePrevClick(e) {
    e.preventDefault();
    if (this.slideshow.previous) {
      this.slideshow.previous(e);
    } else {
      this.slideshow.dispatchEvent(new CustomEvent('previous', { bubbles: true }));
    }
    this.updateButtonStates(); // Update immediately after click
  }

  handleNextClick(e) {
    e.preventDefault();
    if (this.slideshow.next) {
      this.slideshow.next(e);
    } else {
      this.slideshow.dispatchEvent(new CustomEvent('next', { bubbles: true }));
    }
    this.updateButtonStates(); // Update immediately after click
  }

  updateButtonStates() {
    if (!this.slideshow) return;

    // Disable "Previous" if on first slide (and not infinite)
    if (this.prevBtn) {
      this.prevBtn.disabled = !this.slideshow.infinite && this.slideshow.atStart;
    }

    // Disable "Next" if on last slide (and not infinite)
    if (this.nextBtn) {
      this.nextBtn.disabled = !this.slideshow.infinite && this.slideshow.atEnd;
    }
  }
}

customElements.define('header-arrows', HeaderArrows);