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