export class ImagesLoadMore extends HTMLElement {
  connectedCallback() {
    this.addEventListener("click", this.handleClick.bind(this));
  }

  handleClick() {
    const limit = parseInt(this.dataset.limit ?? "6", 10); // ✅ fallback to "6"
    const grid = this.closest(".media-gallery--grid")?.querySelector(".media-gallery__grid");
    if (!grid) return;

    const items = grid.querySelectorAll('li[ref="media[]"]');
    const isExpanded = this.classList.toggle("expanded");

    items.forEach((item, index) => {
      if (index >= limit) {
        item.classList.toggle("hidden", !isExpanded);
      }
    });

    this.querySelector(".show-more")?.classList.toggle("hidden", isExpanded);
    this.querySelector(".show-less")?.classList.toggle("hidden", !isExpanded);
  }
}

if (!customElements.get("imagesload-more")) {
  customElements.define("imagesload-more", ImagesLoadMore);
}
