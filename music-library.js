(() => {
  "use strict";

  const root = document.getElementById("music-subgenres");
  if (!root) return;

  function make(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function isValidUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && url.hostname === "drive.google.com";
    } catch (_) {
      return false;
    }
  }

  function render(data) {
    if (!data || !Array.isArray(data.subgenres)) {
      throw new Error("Music library data has an unexpected structure.");
    }

    const fragment = document.createDocumentFragment();
    data.subgenres.forEach((subgenre) => {
      if (!subgenre || typeof subgenre.name !== "string" || !Array.isArray(subgenre.volumes)) {
        throw new Error("A subgenre entry is invalid.");
      }

      const details = make("details", "subgenre");
      const summary = make("summary", "", subgenre.name);
      details.appendChild(summary);

      const volumes = make("div", "volume-list");
      subgenre.volumes.forEach((volume) => {
        if (!volume || !Number.isInteger(volume.number) || volume.number < 1 || !isValidUrl(volume.url)) {
          throw new Error("A volume entry is invalid or has no valid Google Drive link.");
        }
        if (volume.tagline !== undefined && typeof volume.tagline !== "string") {
          throw new Error("A volume tagline must be text when provided.");
        }

        // The volume row itself links directly to its extended DJ mix.
        const link = make("a", "volume-link");
        link.href = volume.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.setAttribute("aria-label", `Open ${subgenre.name}, Vol. ${volume.number}${volume.tagline ? `: ${volume.tagline}` : ""} in Google Drive (opens in a new tab)`);

        const copy = make("span", "volume-link-copy");
        copy.appendChild(make("span", "volume-title", `Vol. ${volume.number}`));
        if (volume.tagline && volume.tagline.trim()) {
          copy.appendChild(make("span", "volume-tagline", volume.tagline.trim()));
        }
        link.appendChild(copy);
        const external = make("span", "volume-external", "↗");
        external.setAttribute("aria-hidden", "true");
        link.appendChild(external);
        volumes.appendChild(link);
      });

      if (subgenre.volumes.length) details.appendChild(volumes);
      fragment.appendChild(details);
    });

    root.replaceChildren(fragment);
  }

  fetch("music-library.json")
    .then((response) => {
      if (!response.ok) throw new Error(`Music library request failed (${response.status}).`);
      return response.json();
    })
    .then(render)
    .catch((error) => {
      console.error("Unable to load music library:", error);
      root.replaceChildren(make("p", "library-status", "The music library is temporarily unavailable."));
    });
})();
