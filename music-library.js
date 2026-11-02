(() => {
  "use strict";

  const root = document.getElementById("music-subgenres");
  if (!root) return;

  const PLATFORM_HOSTS = {
    "google-drive": ["drive.google.com"],
    youtube: ["youtube.com", "www.youtube.com", "youtu.be"]
  };

  function make(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function isValidPlatformUrl(platform, value) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" &&
        Array.isArray(PLATFORM_HOSTS[platform]) &&
        PLATFORM_HOSTS[platform].includes(url.hostname);
    } catch (_) {
      return false;
    }
  }

  function addPlatformIcon(link, platform) {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");

    svg.setAttribute("viewBox", "0 0 48 48");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");

    if (platform === "google-drive") {
      const paths = [
        ["M16.2 5h10.1L42 32.2H31.9z", "#00832D"],
        ["M16.2 5 1 32.2h10.1L26.3 5z", "#0066DA"],
        ["M1 32.2h31L26.9 42H6.5z", "#2684FC"],
        ["M32 32.2h10L36.5 42H26.9z", "#FFBA00"],
        ["M11.1 32.2h20.8L26.9 42H6.5z", "#00AC47"]
      ];

      paths.forEach(([d, fill]) => {
        const path = document.createElementNS(ns, "path");
        path.setAttribute("d", d);
        path.setAttribute("fill", fill);
        svg.appendChild(path);
      });

    } else if (platform === "youtube") {
      const body = document.createElementNS(ns, "path");

      body.setAttribute(
        "d",
        "M46.9 14.2a6 6 0 0 0-4.2-4.2C39 9 24 9 24 9s-15 0-18.7 1A6 6 0 0 0 1.1 14.2 62 62 0 0 0 0 24a62 62 0 0 0 1.1 9.8 6 6 0 0 0 4.2 4.2C9 39 24 39 24 39s15 0 18.7-1a6 6 0 0 0 4.2-4.2A62 62 0 0 0 48 24a62 62 0 0 0-1.1-9.8Z"
      );

      body.setAttribute("fill", "#FF0033");

      const play = document.createElementNS(ns, "path");
      play.setAttribute("d", "m19 31 13-7-13-7z");
      play.setAttribute("fill", "#fff");

      svg.append(body, play);
    }

    link.appendChild(svg);
  }

  function addStyles() {
    if (document.getElementById("music-library-platform-styles")) return;

    const style = make("style");
    style.id = "music-library-platform-styles";

    style.textContent = `
      #music-subgenres .volume-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
      }

      #music-subgenres .volume-link-copy {
        min-width: 0;
        flex: 1 1 auto;
      }

      #music-subgenres .volume-platform-links {
        display: flex;
        flex: 0 0 auto;
        align-items: center;
        gap: 0.65rem;
      }

      #music-subgenres .volume-platform-link {
        display: inline-flex;
        width: 2.25rem;
        height: 2.25rem;
        align-items: center;
        justify-content: center;
        border-radius: 0.5rem;
        transition: background-color 150ms ease, transform 150ms ease;
      }

      #music-subgenres .volume-platform-link:hover {
        background: rgba(127, 127, 127, 0.14);
        transform: translateY(-1px);
      }

      #music-subgenres .volume-platform-link:focus-visible {
        outline: 2px solid currentColor;
        outline-offset: 2px;
      }

      #music-subgenres .volume-platform-link svg {
        display: block;
        width: 1.55rem;
        height: 1.55rem;
      }

      @media (max-width: 420px) {
        #music-subgenres .volume-row {
          gap: 0.6rem;
        }

        #music-subgenres .volume-platform-links {
          gap: 0.35rem;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function render(data) {
    if (!data || !Array.isArray(data.subgenres)) {
      throw new Error("Music library data has an unexpected structure.");
    }

    addStyles();

    const fragment = document.createDocumentFragment();

    data.subgenres.forEach((subgenre) => {
      if (
        !subgenre ||
        typeof subgenre.name !== "string" ||
        !Array.isArray(subgenre.volumes)
      ) {
        throw new Error("A subgenre entry is invalid.");
      }

      const details = make("details", "subgenre");
      details.appendChild(make("summary", "", subgenre.name));

      const volumes = make("div", "volume-list");

      subgenre.volumes.forEach((volume) => {
        if (
          !volume ||
          !Number.isInteger(volume.number) ||
          volume.number < 1
        ) {
          throw new Error("A volume entry is invalid.");
        }

        if (
          volume.tagline !== undefined &&
          typeof volume.tagline !== "string"
        ) {
          throw new Error("A volume tagline must be text when provided.");
        }

        // Support both the original single-link format
        // and the new multiple-platform format.

        const links = Array.isArray(volume.links)
          ? volume.links
          : (
              volume.url
                ? [{ platform: "google-drive", url: volume.url }]
                : []
            );

        if (
          !links.length ||
          links.some((item) =>
            !item ||
            !isValidPlatformUrl(item.platform, item.url)
          )
        ) {
          throw new Error(
            "A volume entry must contain at least one valid platform link."
          );
        }

        const row = make("div", "volume-link volume-row");

        const copy = make("span", "volume-link-copy");

        copy.appendChild(
          make("span", "volume-title", `Vol. ${volume.number}`)
        );

        if (volume.tagline && volume.tagline.trim()) {
          copy.appendChild(
            make("span", "volume-tagline", volume.tagline.trim())
          );
        }

        row.appendChild(copy);

        // Platform icons are displayed horizontally.

        const platformLinks = make("div", "volume-platform-links");

        links.forEach((item) => {
          const platformName =
            item.platform === "google-drive"
              ? "Google Drive"
              : "YouTube";

          const platformLink = make("a", "volume-platform-link");

          platformLink.href = item.url;
          platformLink.target = "_blank";
          platformLink.rel = "noopener noreferrer";

          platformLink.title = `Open ${platformName}`;

          platformLink.setAttribute(
            "aria-label",
            `Open ${subgenre.name}, Vol. ${volume.number} on ${platformName} (opens in a new tab)`
          );

          addPlatformIcon(platformLink, item.platform);

          platformLinks.appendChild(platformLink);
        });

        row.appendChild(platformLinks);
        volumes.appendChild(row);
      });

      if (subgenre.volumes.length) {
        details.appendChild(volumes);
      }

      fragment.appendChild(details);
    });

    root.replaceChildren(fragment);
  }

  // Load the music library data.

  fetch("music-library.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error(
          `Music library request failed (${response.status}).`
        );
      }

      return response.json();
    })
    .then(render)
    .catch((error) => {
      console.error("Unable to load music library:", error);

      root.replaceChildren(
        make(
          "p",
          "library-status",
          "The music library is temporarily unavailable."
        )
      );
    });

})();