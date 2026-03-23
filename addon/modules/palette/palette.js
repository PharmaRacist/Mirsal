const Palette = (() => {
  let _send = null;

  function applyTheme(scheme) {
    browser.theme.update({
      colors: {
        frame: scheme.primary,
        toolbar: scheme.surface_container,
        toolbar_text: scheme.on_surface,
        tab_background_text: scheme.on_surface_variant,
        tab_selected: scheme.secondary_container,
        tab_line: scheme.primary,
        popup: scheme.surface_container_low,
        popup_text: scheme.on_surface,
        popup_border: scheme.outline_variant,
        popup_highlight: scheme.secondary_container,
        popup_highlight_text: scheme.on_secondary_container,
        sidebar: scheme.surface_container_low,
        sidebar_text: scheme.on_surface,
        sidebar_highlight: scheme.secondary_container,
        sidebar_highlight_text: scheme.on_secondary_container,
        sidebar_border: scheme.outline_variant,
        button_background_hover: scheme.surface_container_high,
        button_background_active: scheme.surface_container_highest,
        icons: scheme.on_surface_variant,
        icons_attention: scheme.primary,
      },
    });
  }

  function handleResponse(response) {
    if (response?.type === "palette_colors" && response.payload) {
      applyTheme(response.payload);
    }
  }

  function refresh() {
    _send("palette.get", null);
  }

  function init(sendFn, onResponse) {
    _send = sendFn;
    onResponse("palette_colors", handleResponse);
    refresh();
  }

  return { init, refresh };
})();
