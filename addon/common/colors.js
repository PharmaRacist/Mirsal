function injectPaletteVars(scheme) {
  let el = document.getElementById("paltte-colors");
  if (!el) {
    el = document.createElement("style");
    el.id = "paltte-colors";
    document.head.appendChild(el);
  }
  el.textContent = `:root {
    --c-surface:                   ${scheme.surface};
    --c-surface-dim:               ${scheme.surface_dim};
    --c-surface-bright:            ${scheme.surface_bright};
    --c-surface-container-lowest:  ${scheme.surface_container_lowest};
    --c-surface-container-low:     ${scheme.surface_container_low};
    --c-surface-container:         ${scheme.surface_container};
    --c-surface-container-high:    ${scheme.surface_container_high};
    --c-surface-container-highest: ${scheme.surface_container_highest};
    --c-on-surface:                ${scheme.on_surface};
    --c-on-surface-variant:        ${scheme.on_surface_variant};
    --c-primary:                   ${scheme.primary};
    --c-primary-container:         ${scheme.primary_container};
    --c-on-primary:                ${scheme.on_primary};
    --c-on-primary-container:      ${scheme.on_primary_container};
    --c-secondary:                 ${scheme.secondary};
    --c-secondary-container:       ${scheme.secondary_container};
    --c-on-secondary:              ${scheme.on_secondary};
    --c-on-secondary-container:    ${scheme.on_secondary_container};
    --c-tertiary:                  ${scheme.tertiary};
    --c-tertiary-container:        ${scheme.tertiary_container};
    --c-on-tertiary:               ${scheme.on_tertiary};
    --c-on-tertiary-container:     ${scheme.on_tertiary_container};
    --c-error:                     ${scheme.error};
    --c-error-container:           ${scheme.error_container};
    --c-on-error:                  ${scheme.on_error};
    --c-on-error-container:        ${scheme.on_error_container};
    --c-outline:                   ${scheme.outline};
    --c-outline-variant:           ${scheme.outline_variant};
    --c-inverse-surface:           ${scheme.inverse_surface};
    --c-inverse-on-surface:        ${scheme.inverse_on_surface};
    --c-inverse-primary:           ${scheme.inverse_primary};
    --c-scrim:                     ${scheme.scrim};
    --c-shadow:                    ${scheme.shadow};
  }`;
}

function watchPalette() {
  browser.storage.local.get("palette.scheme").then((r) => {
    if (r["palette.scheme"]) injectPaletteVars(r["palette.scheme"]);
  });
  browser.storage.onChanged.addListener((changes) => {
    if (changes["palette.scheme"]?.newValue) {
      injectPaletteVars(changes["palette.scheme"].newValue);
    }
  });
}

watchPalette();
