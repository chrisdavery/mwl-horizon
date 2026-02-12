class ReadMore extends HTMLElement {
  constructor() {
    super();
    this.classList.remove("hidden");

    const limit = parseInt(this.dataset.limit ?? "185");
    const text = (this.textContent ?? "").trim();

    if (text.length <= limit || text.length - limit < 20) return;

    const fullText = text;
    const truncatedText = text.slice(0, limit).trim() + "...";

    // Clear the element
    this.innerHTML = "";

    // Text container
    const textSpan = document.createElement("span");
    textSpan.textContent = truncatedText + " ";
    this.appendChild(textSpan);

    // Link
    const link = document.createElement("a");
    link.href = "javascript:void(0)";
    link.textContent = this.dataset.moreLabel || "Read more";
    link.classList.add("read-more-desc");
    this.appendChild(link);

    let expanded = false;

    link.addEventListener("click", () => {
      expanded = !expanded;

      if (expanded) {
        textSpan.textContent = fullText + " ";
        link.textContent = this.dataset.lessLabel || "Read less";
        link.style.display = "block"; // add display block again
      } else {
        textSpan.textContent = truncatedText + " ";
        link.textContent = this.dataset.moreLabel || "Read more";
        link.style.display = ""; // remove display block
      }
    });
  }
}

customElements.define("read-more", ReadMore);