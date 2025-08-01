class ReadMore extends HTMLElement {
  constructor() {
    super();

    this.classList.remove('hidden')
    
    const limit = parseInt(this.dataset.limit ?? "185");
    const text = (this.textContent ?? "").trim();

    if (text.length <= limit || text.length - limit < 20) return;

    const fullText = text;
    const truncatedText = text.slice(0, limit).trim() + "... ";

    this.textContent = truncatedText;

    const link = document.createElement("a");
    link.href = "javascript:void(0)";
    link.textContent = this.dataset.label;
    link.style.cursor = "pointer";
    link.classList.add('read-more-desc')

    link.addEventListener("click", () => {
      this.textContent = fullText;
    });

    this.appendChild(link);
  }
}

customElements.define("read-more", ReadMore);