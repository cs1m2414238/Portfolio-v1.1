(() => {
  const reference = document.querySelector("#stats-panel-section h2");
  const headings = [...document.querySelectorAll("main > .section:not(.hero):not(#stats-panel-section) h2")];
  const contactColumn = document.querySelector("#contact .contact-info");
  if (!reference || !headings.length) return;

  let frame;
  function alignHeadings() {
    const referenceLeft = reference.getBoundingClientRect().left;
    headings.forEach(heading => heading.style.setProperty("--section-heading-offset", "0px"));
    if (contactColumn) contactColumn.style.setProperty("--contact-column-offset", "0px");

    const offsets = headings.map(heading => {
      const section = heading.closest("section");
      const scale = parseFloat(getComputedStyle(section).zoom) || 1;
      return (referenceLeft - heading.getBoundingClientRect().left) / scale;
    });

    headings.forEach((heading, index) => {
      if (contactColumn && contactColumn.contains(heading)) {
        contactColumn.style.setProperty("--contact-column-offset", `${offsets[index]}px`);
      } else {
        heading.style.setProperty("--section-heading-offset", `${offsets[index]}px`);
      }
    });
  }

  function scheduleAlignment() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(alignHeadings);
  }

  window.addEventListener("resize", scheduleAlignment);
  window.addEventListener("load", scheduleAlignment, { once: true });
  if (document.fonts) document.fonts.ready.then(scheduleAlignment);
  scheduleAlignment();
})();
