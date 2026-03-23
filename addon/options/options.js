const DEFAULTS = {
  "shade.enabled": true,
  "shade.dimMedia": true,
  "shade.mediaBrightness": 85,
  "palette.enabled": true,
  "palette.pollInterval": 5,
  "downloads.enabled": true,
};

function injectPaletteVars(scheme) {
  let el = document.getElementById("mirsal-palette-vars");
  if (!el) {
    el = document.createElement("style");
    el.id = "mirsal-palette-vars";
    document.head.appendChild(el);
  }
  el.textContent = `:root {
    --c-surface:                ${scheme.surface};
    --c-surface-dim:            ${scheme.surface_dim};
    --c-surface-bright:         ${scheme.surface_bright};
    --c-surface-container-low:  ${scheme.surface_container_low};
    --c-surface-container:      ${scheme.surface_container};
    --c-surface-container-high: ${scheme.surface_container_high};
    --c-on-surface:             ${scheme.on_surface};
    --c-on-surface-variant:     ${scheme.on_surface_variant};
    --c-primary:                ${scheme.primary};
    --c-primary-container:      ${scheme.primary_container};
    --c-on-primary-container:   ${scheme.on_primary_container};
    --c-secondary-container:    ${scheme.secondary_container};
    --c-on-secondary-container: ${scheme.on_secondary_container};
    --c-outline:                ${scheme.outline};
    --c-outline-variant:        ${scheme.outline_variant};
  }`;
}

function showStatus(msg) {
  const el = document.getElementById("status");
  el.textContent = msg;
  setTimeout(() => {
    el.textContent = "";
  }, 2000);
}

function save() {
  const settings = {
    "shade.enabled": document.getElementById("shade-enabled").checked,
    "shade.dimMedia": document.getElementById("shade-dim-media").checked,
    "shade.mediaBrightness": parseInt(
      document.getElementById("shade-media-brightness").value,
    ),
    "palette.enabled": document.getElementById("palette-enabled").checked,
    "palette.pollInterval": parseInt(
      document.getElementById("palette-poll-interval").value,
    ),
    "downloads.enabled": document.getElementById("downloads-enabled").checked,
  };
  browser.storage.local.set(settings).then(() => {
    browser.runtime.sendMessage({ type: "settings_updated", settings });
    showStatus("saved");
  });
}

function load() {
  browser.storage.local.get(DEFAULTS).then((s) => {
    document.getElementById("shade-enabled").checked = s["shade.enabled"];
    document.getElementById("shade-dim-media").checked = s["shade.dimMedia"];
    document.getElementById("shade-media-brightness").value =
      s["shade.mediaBrightness"];
    document.getElementById("shade-media-brightness-value").textContent =
      s["shade.mediaBrightness"] + "%";
    document.getElementById("palette-enabled").checked = s["palette.enabled"];
    document.getElementById("palette-poll-interval").value =
      s["palette.pollInterval"];
    document.getElementById("palette-poll-interval-value").textContent =
      s["palette.pollInterval"] + "s";
    document.getElementById("downloads-enabled").checked =
      s["downloads.enabled"];
  });

  browser.runtime.sendMessage({ type: "palette.request" }).then((scheme) => {
    if (scheme) injectPaletteVars(scheme);
  });
}

document
  .getElementById("shade-media-brightness")
  .addEventListener("input", (e) => {
    document.getElementById("shade-media-brightness-value").textContent =
      e.target.value + "%";
  });

document
  .getElementById("palette-poll-interval")
  .addEventListener("input", (e) => {
    document.getElementById("palette-poll-interval-value").textContent =
      e.target.value + "s";
  });

document.querySelectorAll("input").forEach((el) => {
  el.addEventListener("change", save);
});

load();
