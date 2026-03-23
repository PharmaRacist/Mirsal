(function () {
  const VARS_ID = "mirsal-shade-vars";
  let _scheme = null;
  let _observer = null;
  let _dimMedia = true;
  let _mediaBrightness = 85;

  function luminance(r, g, b) {
    const ch = [r, g, b].map((c) => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  }

  function parseRgb(str) {
    const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!m) return null;
    return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])];
  }

  function bgForLuminance(lum) {
    if (lum > 0.85) return _scheme.surface_container_lowest;
    if (lum > 0.65) return _scheme.surface_container_low;
    if (lum > 0.4) return _scheme.surface_container;
    if (lum > 0.15) return _scheme.surface_container_high;
    if (lum > 0.03) return _scheme.surface_container_highest;
    return null;
  }

  function fgForLuminance(lum) {
    if (lum > 0.7) return _scheme.on_surface;
    if (lum > 0.35) return _scheme.on_surface_variant;
    if (lum > 0.1) return _scheme.outline;
    return _scheme.on_surface;
  }

  function isTransparent(str) {
    return !str || str === "transparent" || str === "rgba(0, 0, 0, 0)";
  }

  function recolorEl(el) {
    if (!_scheme) return;
    const tag = el.tagName;
    if (tag === "IMG" || tag === "VIDEO" || tag === "CANVAS") return;

    const cs = getComputedStyle(el);

    const bgStr = cs.backgroundColor;
    if (!isTransparent(bgStr)) {
      const rgb = parseRgb(bgStr);
      if (rgb) {
        const mapped = bgForLuminance(luminance(...rgb));
        if (mapped)
          el.style.setProperty("background-color", mapped, "important");
      }
    }

    const fgStr = cs.color;
    if (!isTransparent(fgStr)) {
      const rgb = parseRgb(fgStr);
      if (rgb) {
        const mapped = fgForLuminance(luminance(...rgb));
        if (mapped) el.style.setProperty("color", mapped, "important");
      }
    }
  }

  function recolorAll() {
    document.querySelectorAll("*").forEach(recolorEl);
  }

  function injectVars() {
    let el = document.getElementById(VARS_ID);
    if (!el) {
      el = document.createElement("style");
      el.id = VARS_ID;
      document.documentElement.appendChild(el);
    }
    const mediaBrightness = _dimMedia ? _mediaBrightness / 100 : 1;
    el.textContent = `
      :root { color-scheme: dark !important; }

      html, body {
        background-color: ${_scheme.surface} !important;
        color:            ${_scheme.on_surface} !important;
      }

      a         { color: ${_scheme.primary} !important; }
      a:visited { color: ${_scheme.tertiary} !important; }
      a:hover   { color: ${_scheme.primary_fixed_dim} !important; }

      input, textarea, select {
        background-color: ${_scheme.surface_container_high} !important;
        color:            ${_scheme.on_surface} !important;
        border-color:     ${_scheme.outline_variant} !important;
        caret-color:      ${_scheme.primary} !important;
        accent-color:     ${_scheme.primary} !important;
      }

      input:focus, textarea:focus, select:focus {
        background-color: ${_scheme.surface_container_highest} !important;
        border-color:     ${_scheme.primary} !important;
        outline-color:    ${_scheme.primary} !important;
      }

      input::placeholder, textarea::placeholder {
        color:   ${_scheme.on_surface_variant} !important;
        opacity: 1 !important;
      }

      ::selection {
        background-color: ${_scheme.primary_container} !important;
        color:            ${_scheme.on_primary_container} !important;
      }

      img, video, picture {
        filter: brightness(${mediaBrightness}) !important;
      }

      img:hover, video:hover {
        filter: brightness(1) !important;
      }

      * {
        scrollbar-color: ${_scheme.outline_variant} ${_scheme.surface_container_low} !important;
        scrollbar-width: thin !important;
      }

      ::-webkit-scrollbar {
        width:            8px !important;
        height:           8px !important;
        background-color: ${_scheme.surface_container_low} !important;
      }

      ::-webkit-scrollbar-thumb {
        background-color: ${_scheme.outline_variant} !important;
        border-radius:    4px !important;
      }

      ::-webkit-scrollbar-thumb:hover {
        background-color: ${_scheme.outline} !important;
      }
    `;
  }

  function observe() {
    _observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeType !== 1) continue;
          recolorEl(node);
          node.querySelectorAll("*").forEach(recolorEl);
        }
      }
    });
    _observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  function enable(scheme) {
    _scheme = scheme;
    injectVars();
    recolorAll();
    if (!_observer) observe();
  }

  function disable() {
    _scheme = null;
    document.getElementById(VARS_ID)?.remove();
    if (_observer) {
      _observer.disconnect();
      _observer = null;
    }
    document.querySelectorAll("*").forEach((el) => {
      el.style.removeProperty("background-color");
      el.style.removeProperty("color");
    });
  }

  browser.runtime.onMessage.addListener((msg) => {
    if (msg.type !== "shade_update") return;
    _dimMedia = msg.dimMedia ?? true;
    _mediaBrightness = msg.mediaBrightness ?? 85;
    if (msg.enabled) enable(msg.scheme);
    else disable();
  });
})();
