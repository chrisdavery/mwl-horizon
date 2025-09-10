import { morph } from '@theme/morph';
import { Component } from '@theme/component';
import { CartUpdateEvent, CartAddEvent, CartErrorEvent, ThemeEvents, VariantSelectedEvent, VariantUpdateEvent  } from '@theme/events';
import { DialogComponent, DialogCloseEvent } from '@theme/dialog';
import { mediaQueryLarge, isMobileBreakpoint, getIOSVersion } from '@theme/utilities';

export class QuickAddComponent extends Component {
  /** @type {AbortController | null} */
  #abortController = null;
  /** @type {Map<string, Element>} */
  #cachedContent = new Map();

  get productPageUrl() {
    const productCard = /** @type {import('./product-card').ProductCard | null} */ (this.closest('product-card'));
    const productLink = productCard?.getProductCardLink();

    if (!productLink?.href) return '';

    const url = new URL(productLink.href);

    if (url.searchParams.has('variant')) {
      return url.toString();
    }

    const selectedVariantId = this.#getSelectedVariantId();
    if (selectedVariantId) {
      url.searchParams.set('variant', selectedVariantId);
    }

    return url.toString();
  }

  /**
   * Gets the currently selected variant ID from the product card
   * @returns {string | null} The variant ID or null
   */
  #getSelectedVariantId() {
    const productCard = /** @type {import('./product-card').ProductCard | null} */ (this.closest('product-card'));
    return productCard?.getSelectedVariantId() || null;
  }

  connectedCallback() {
    super.connectedCallback();

    mediaQueryLarge.addEventListener('change', this.#closeQuickAddModal);
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    mediaQueryLarge.removeEventListener('change', this.#closeQuickAddModal);
    this.#abortController?.abort();
  }

  /**
   * Handles quick add button click
   * @param {Event} event - The click event
   */
  handleClick = async (event) => {
    event.preventDefault();

    const currentUrl = this.productPageUrl;

    var stopper = 0

    if (this.dataset.cardOverlay != undefined) {
      this.#cardOverlay(event)
      stopper = 1
    }
    if (stopper == 1) return;
    
    // Check if we have cached content for this URL
    let productGrid = this.#cachedContent.get(currentUrl);

    if (!productGrid) {
      this.classList.add('loading')
      // Fetch and cache the content
      const html = await this.fetchProductPage(currentUrl);
      if (html) {
        const gridElement = html.querySelector('[data-product-grid-content]');
        if (gridElement) {
          // Cache the cloned element to avoid modifying the original
          productGrid = /** @type {Element} */ (gridElement.cloneNode(true));
          this.#cachedContent.set(currentUrl, productGrid);
        }
      }
    }

    if (productGrid) {
      // Use a fresh clone from the cache
      const freshContent = /** @type {Element} */ (productGrid.cloneNode(true));
      await this.updateQuickAddModal(freshContent);
      this.classList.remove('loading')
    }

    this.#openQuickAddModal();
  };

  /**
 * Handles quick add button click
 * @param {Event} event - The click event
 */
  #cardOverlay = async (event) => {
    const currentUrl = this.productPageUrl;

    // Check if we have cached content for this URL
    let productGrid = this.#cachedContent.get(currentUrl);

    if (!productGrid) {
      this.classList.add('loading')

      // Fetch and cache the content
      const html = await this.fetchProductPage(currentUrl);
      if (html) {
        const gridElement = html.querySelector('[data-product-grid-content]');
        if (gridElement) {
          // Cache the cloned element to avoid modifying the original
          productGrid = /** @type {Element} */ (gridElement.cloneNode(true));
          this.#cachedContent.set(currentUrl, productGrid);
        }
      }

    }

    if (productGrid) {
      const freshContent = /** @type {Element} */ (productGrid.cloneNode(true));
      await this.injectElement(freshContent);
      this.classList.remove('loading')
    }
  }

  /**
 * Re-renders the variant picker.
 * @param {Element} productGrid - The product grid element
 */
  async injectElement(productGrid) {
    const modalContent = document.getElementById('quick-add-modal-content');

    if (!productGrid || !modalContent) return;
    const productDetails = productGrid.querySelector('.product-details');
    const productFormComponent = productGrid.querySelector('product-form-component');
    const productMedia = productGrid.querySelector('.product-information__media');
    const CardOptions = productGrid.querySelector('quick-overlay')

    if (!CardOptions || !productFormComponent || !productDetails || !productMedia) return;

    CardOptions.removeAttribute('hidden')

    if (isMobileBreakpoint()) {
      productGrid.appendChild(CardOptions);
      productGrid.appendChild(productFormComponent);
      productDetails.remove();
      productMedia.remove();
      modalContent.classList.add('mobile-modal-quick')
      // morph(modalContent, productGrid);
      
      why this freshcontent solved my issue? what was the problem with morph.js
      const freshContent = document.createDocumentFragment();
      for (const child of productGrid.children) {
        freshContent.appendChild(child.cloneNode(true));
      }
      modalContent.innerHTML = '';
      modalContent.appendChild(freshContent);

      this.#syncVariantSelection(modalContent);

      this.#openQuickAddModal();
    } else {
      /** @type {HTMLElement | null} */
      const btn = this.querySelector('.quick-add__button--choose');

      if (btn) {
        btn.style.opacity = '0';
        btn.style.visibility = 'hidden';
      }

      const productCard = /** @type {import('./product-card').ProductCard | null} */ (
        this.closest('product-card')
      );

      if (productCard && productCard.querySelector('quick-add-component')) {
        productCard.querySelector('quick-add-component')?.insertAdjacentElement('afterend', CardOptions);
      }
    }

  }

  /** @param {QuickAddDialog} dialogComponent */
  #stayVisibleUntilDialogCloses(dialogComponent) {
    this.toggleAttribute('stay-visible', true);

    dialogComponent.addEventListener(DialogCloseEvent.eventName, () => this.toggleAttribute('stay-visible', false), {
      once: true,
    });
  }

  #openQuickAddModal = () => {
    const dialogComponent = document.getElementById('quick-add-dialog');
    if (!(dialogComponent instanceof QuickAddDialog)) return;

    this.#stayVisibleUntilDialogCloses(dialogComponent);

    dialogComponent.showDialog();
  };

  #closeQuickAddModal = () => {
    const dialogComponent = document.getElementById('quick-add-dialog');
    if (!(dialogComponent instanceof QuickAddDialog)) return;

    dialogComponent.closeDialog();
  };

  /**
   * Fetches the product page content
   * @param {string} productPageUrl - The URL of the product page to fetch
   * @returns {Promise<Document | null>}
   */
  async fetchProductPage(productPageUrl) {
    if (!productPageUrl) return null;

    // We use this to abort the previous fetch request if it's still pending.
    this.#abortController?.abort();
    this.#abortController = new AbortController();

    try {
      const response = await fetch(productPageUrl, {
        signal: this.#abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch product page: HTTP error ${response.status}`);
      }

      const responseText = await response.text();
      const html = new DOMParser().parseFromString(responseText, 'text/html');

      return html;
    } catch (error) {
      if (error.name === 'AbortError') {
        return null;
      } else {
        throw error;
      }
    } finally {
      this.#abortController = null;
    }
  }

  /**
   * Re-renders the variant picker.
   * @param {Element} productGrid - The product grid element
   */
  async updateQuickAddModal(productGrid) {
    const modalContent = document.getElementById('quick-add-modal-content');

    if (!productGrid || !modalContent) return;

    if (isMobileBreakpoint()) {
      const productDetails = productGrid.querySelector('.product-details');
      if (!productDetails) return;
      const productFormComponent = productGrid.querySelector('product-form-component');
      const variantPicker = productGrid.querySelector('variant-picker');
      const productPrice = productGrid.querySelector('product-price');
      const productTitle = document.createElement('a');
      productTitle.textContent = this.dataset.productTitle || '';

      // Make product title as a link to the product page
      productTitle.href = this.productPageUrl;

      if (!productFormComponent || !variantPicker || !productPrice || !productTitle) return;

      const productHeader = document.createElement('div');
      productHeader.classList.add('product-header');

      productHeader.appendChild(productTitle);
      productHeader.appendChild(productPrice);
      productGrid.appendChild(productHeader);
      productGrid.appendChild(variantPicker);
      productGrid.appendChild(productFormComponent);
      productDetails.remove();
    }

    morph(modalContent, productGrid);

    this.#syncVariantSelection(modalContent);
  }

  /**
   * Syncs the variant selection from the product card to the modal
   * @param {Element} modalContent - The modal content element
   */
  #syncVariantSelection(modalContent) {
    const selectedVariantId = this.#getSelectedVariantId();
    if (!selectedVariantId) return;

    // Find and check the corresponding input in the modal
    const modalInputs = modalContent.querySelectorAll('input[type="radio"][data-variant-id]');
    for (const input of modalInputs) {
      if (input instanceof HTMLInputElement && input.dataset.variantId === selectedVariantId && !input.checked) {
        input.checked = true;
        input.dispatchEvent(new Event('change', { bubbles: true }));
        break;
      }
    }
  }
}

if (!customElements.get('quick-add-component')) {
  customElements.define('quick-add-component', QuickAddComponent);
}

class QuickAddDialog extends DialogComponent {
  #abortController = new AbortController();

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener(ThemeEvents.cartUpdate, this.handleCartUpdate, { signal: this.#abortController.signal });
    this.addEventListener(ThemeEvents.variantUpdate, this.#updateProductTitleLink);

    this.addEventListener(DialogCloseEvent.eventName, this.#handleDialogClose);
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    this.#abortController.abort();
    this.removeEventListener(DialogCloseEvent.eventName, this.#handleDialogClose);
  }

  /**
   * Closes the dialog
   * @param {CartUpdateEvent} event - The cart update event
   */
  handleCartUpdate = (event) => {
    if (event.detail.data.didError) return;
    this.closeDialog();
  };

  #updateProductTitleLink = (/** @type {CustomEvent} */ event) => {
    const anchorElement = /** @type {HTMLAnchorElement} */ (
      event.detail.data.html?.querySelector('.view-product-title a')
    );
    const viewMoreDetailsLink = /** @type {HTMLAnchorElement} */ (this.querySelector('.view-product-title a'));
    const mobileProductTitle = /** @type {HTMLAnchorElement} */ (this.querySelector('.product-header a'));

    if (!anchorElement) return;

    if (viewMoreDetailsLink) viewMoreDetailsLink.href = anchorElement.href;
    if (mobileProductTitle) mobileProductTitle.href = anchorElement.href;
  };

  #handleDialogClose = () => {
    const iosVersion = getIOSVersion();
    /**
     * This is a patch to solve an issue with the UI freezing when the dialog is closed.
     * To reproduce it, use iOS 16.0.
     */
    if (!iosVersion || iosVersion.major >= 17 || (iosVersion.major === 16 && iosVersion.minor >= 4)) return;

    requestAnimationFrame(() => {
      /** @type {HTMLElement | null} */
      const grid = document.querySelector('#ResultsList [product-grid-view]');
      if (grid) {
        const currentWidth = grid.getBoundingClientRect().width;
        grid.style.width = `${currentWidth - 1}px`;
        requestAnimationFrame(() => {
          grid.style.width = '';
        });
      }
    });
  };
}

if (!customElements.get('quick-add-dialog')) {
  customElements.define('quick-add-dialog', QuickAddDialog);
}


/**
 *
 * @extends {Component}
 */
class QuickOverlay extends Component {
  #abortController = new AbortController();
  /** @type {string | undefined} */
  #pendingRequestUrl;;

  productCard = /** @type {import('./product-card').ProductCard | null} */ (
    this.closest('product-card')
  );

  /** @type {HTMLScriptElement | null} */
  variantData = this.querySelector('script[type="application/json"]');

  /** @type {{ id: string; options: string[]; available: boolean }[]} */
  variants = this.variantData
    ? JSON.parse(this.variantData.textContent || '[]')
    : [];

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('click', this.#handleVariantUpdate);
    this.#buttonStatus();
    this.addEventListener('mouseleave', this.statusClose);
    this.addEventListener(ThemeEvents.cartUpdate, this.handleCartUpdate, { signal: this.#abortController.signal });
    this.productCard?.addEventListener('mouseleave', this.#closeOverlay);
    // this.addEventListener(ThemeEvents.variantUpdate, this.#onVariantUpdate, { signal: this.#abortController.signal });
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    this.#abortController.abort();
    this.removeEventListener('mouseleave', this.statusClose);
    this.productCard?.removeEventListener('mouseleave', this.#closeOverlay);
  }

  
  /**
   * Handles the mouseout event.
   */
  #closeOverlay = () => {
    if (this.productCard) {
      /** @type {HTMLElement | null} */
      const btn = this.productCard.querySelector('.quick-add__button--choose');

      if (!btn && this.hasAttribute('hidden')) return;

      this.setAttribute('hidden','')

      if (btn) {
        btn.style.removeProperty('opacity');
        btn.style.removeProperty('visibility');
      }
    }
  }

  /**
   * Closes the dialog
   * @param {CartUpdateEvent} event - The cart update event
   */
  handleCartUpdate = (event) => {
    if (event.detail.data.didError) return;
    this.#closeOverlay();
  };


  /**
   * @param {VariantUpdateEvent} event
   */
  #onVariantUpdate = (event) => {
    console.log(event)
  };
  
  /**
   * Handles quick add button click
   * @param {MouseEvent} event - The click event
   */
  #handleVariantUpdate = (event) => {
    event.preventDefault();

    /** @type {HTMLElement | null} */
    const target = event.target instanceof HTMLElement ? event.target : null;
    if (!target) return;

    /** @type {string | undefined} */
    const optionName = target.dataset?.value;
    /** @type {string | undefined} */
    const productId = this.dataset?.productId;
    if (!optionName) return;


    if (!this.variantData?.textContent) return;


    /** @type {{ id: string; options: string[]; available: boolean } | undefined} */
    const variantFound = this.variants.find(
      (v) => v.options.some((opt) => opt === optionName)
    );

    if (this.closest('.quick-add-modal') && variantFound) {
      this.fetchUpdatedSection(this.buildRequestUrl(variantFound.id), variantFound.id);
      this.dispatchEvent(new VariantSelectedEvent({ id: variantFound.id ?? '' }));
    }

    if (this.closest('.quick-add-modal')) return;

    if (variantFound && variantFound.available) {
      const formData = new FormData();
      formData.append('id', variantFound.id);
      formData.append('quantity', '1');

      // Collect section IDs
      const cartItemsComponents = document.querySelectorAll('cart-items-component');
      /** @type {string[]} */
      const cartItemComponentsSectionIds = [];
      cartItemsComponents.forEach((item) => {
        if (item instanceof HTMLElement && item.dataset.sectionId) {
          cartItemComponentsSectionIds.push(item.dataset.sectionId);
        }
      });

      if (cartItemComponentsSectionIds.length > 0) {
        formData.append('sections', cartItemComponentsSectionIds.join(','));
      }

      fetch(Theme.routes.cart_add_url, {
        method: 'POST',
        body: formData,
      })
        .then((response) => response.json())
        .then((response) => {
          if (response.status) {
            this.dispatchEvent(
              new CartErrorEvent(variantFound.id.toString() || '', response.message, response.description, response.errors)
            );
            this.dispatchEvent(
              new CartAddEvent({}, this.id, {
                didError: true,
                source: 'product-form-component',
                itemCount: Number(formData.get('quantity')) || 1,
                productId: productId,
              })
            );
          } else {
            
            this.#closeOverlay();

            this.dispatchEvent(
              new CartAddEvent({}, variantFound.id.toString(), {
                source: 'product-form-component',
                itemCount: Number(formData.get('quantity')) || 1,
                productId: productId,
                sections: response.sections,
              })
            );
          }
        })
        .catch((error) => {
          this.dispatchEvent(
            new CartErrorEvent(
              productId || '',
              error?.message || '',
              error?.description || '',
              error?.errors || undefined
            )
          );
        });
    }
  };

  /**
   * Fetches the updated section.
   * @param {string} requestUrl - The request URL.
   * @param {number} variantId - The variant id
   */
  fetchUpdatedSection(requestUrl, variantId) {
    // We use this to abort the previous fetch request if it's still pending.
    this.#abortController?.abort(); 
    this.#abortController = new AbortController();

    fetch(requestUrl, { signal: this.#abortController.signal })
      .then((response) => response.text())
      .then((responseText) => {
        this.#pendingRequestUrl = undefined;
        const html = new DOMParser().parseFromString(responseText, 'text/html');

        const textContent = html.querySelector(`variant-picker script[type="application/json"]`)?.textContent;
        if (!textContent) return;
        const target = this.closest('.shopify-section, dialog, product-card');

        // We grab the variant object from the response and dispatch an event with it.
        this.dispatchEvent(
          new VariantUpdateEvent(JSON.parse(textContent), variantId.toString(), {
            html,
            productId: this.dataset.productId ?? '',
            newProduct: { id: this.dataset.productId ?? '', url: this.dataset.productUrl ?? '' },
          })
        );
      })
      .catch((error) => {
          if (error.name === 'AbortError') { 
            console.warn('Fetch aborted by user'); 
          } else {
            console.error(error); 
          }
      });
  }

    /**
   * Builds the request URL.
   * @param {string} selectedOption - The selected option.
   * @returns {string} The request URL.
   */
  buildRequestUrl(selectedOption) {
    // this productUrl and pendingRequestUrl will be useful for the support of combined listing. It is used when a user changes variant quickly and those products are using separate URLs (combined listing).
    // We create a new URL and abort the previous fetch request if it's still pending.
    let productUrl = this.dataset.productUrl;
    this.#pendingRequestUrl = productUrl;
    const params = [];

    params.push(`variant=${selectedOption}`);

    return `${productUrl}?${params.join('&')}`;
  }

  #buttonStatus() {
      if (!this.variantData?.textContent) return;

      this.querySelectorAll('.option-button').forEach(button => {
        const value = button.dataset.value
        const variantFound = this.variants.find(
          (v) => v.options.some((opt) => opt === value)
        );

        if (variantFound) {
          if (variantFound.available == false) {
            button.classList.add('disabled')
            button.classList.add('oos-button')
          }

          button.addEventListener('mouseover', () => {
            this.statusMessage(variantFound);
          });

          if (this.closest('.quick-add-modal')) {
            button.addEventListener('click', () => {
              this.statusMessageModal(variantFound, button);
            });
          }
        }
      })
  }
  /**
   * @param {{ id: string, options: string[], available: boolean } | undefined} variant
   */
  statusMessage(variant) {
    const message = this.querySelector('.message-button-below')

    if (!variant) return;

    if (!variant.available) {
        if (message) {
          message.classList.add('active')
          message.innerHTML = Theme.quick_add.out_of_stock_html
        }
    } else {
      message.innerHTML = Theme.quick_add.available_now
    }
  }

  /**
   * @param {{ id: string, options: string[], available: boolean } | undefined} variant
   * @param {Element} button
   */
  statusMessageModal(variant,button) {
    const parent = button.closest('.option-set-item')

    if (!parent) return;

    const messageInline = parent.querySelector('.message-button-inline')

    if (!messageInline) return;
    
    this.statusClose()

    if (!variant) return;
    if (!variant.available) {
          messageInline.classList.add('active')
          messageInline.innerHTML = Theme.quick_add.out_of_stock_html
    } else {
      messageInline.innerHTML = Theme.quick_add.available_now
    }
  }

  statusClose() {
    const message = this.querySelector('.message-button-below')
    if (message) {
      message.classList.remove('active')
      message.innerHTML = ''
    }

    const messageInline = this.querySelectorAll('.message-button-inline')
    messageInline.forEach(m => {
      m.classList.remove('active')
      m.innerHTML = ''
    })
  }
}

if (!customElements.get('quick-overlay')) {
  customElements.define('quick-overlay', QuickOverlay);
}