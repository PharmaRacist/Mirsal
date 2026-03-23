const Palette = (() => {
  let _port = null;
  let _lastMtime = 0;
  let _enabled = true;
  let _scheme = null;

  function applyTheme(scheme) {
    browser.theme.update({
      colors: {
        frame: scheme.surface_container_lowest,
        frame_inactive: scheme.surface_dim,
        tab_background_text: scheme.on_surface_variant,
        tab_text: scheme.on_surface,
        tab_selected: scheme.surface_container,
        tab_line: "transparent",
        tab_loading: scheme.primary,
        toolbar: scheme.surface_container,
        toolbar_text: scheme.on_surface,
        toolbar_top_separator: "transparent",
        toolbar_bottom_separator: "transparent",
        toolbar_vertical_separator: scheme.outline_variant,
        toolbar_field: scheme.surface_container_high,
        toolbar_field_text: scheme.on_surface,
        toolbar_field_border: "transparent",
        toolbar_field_focus: scheme.surface_container_highest,
        toolbar_field_text_focus: scheme.on_surface,
        toolbar_field_border_focus: scheme.primary,
        toolbar_field_highlight: scheme.primary_container,
        toolbar_field_highlight_text: scheme.on_primary_container,
        toolbar_field_separator: scheme.outline_variant,
        icons: scheme.on_surface_variant,
        icons_attention: scheme.primary,
        button_background_hover: scheme.surface_container_high,
        button_background_active: scheme.surface_container_highest,
        popup: scheme.surface_bright,
        popup_text: scheme.on_surface,
        popup_border: scheme.outline_variant,
        popup_highlight: scheme.secondary_container,
        popup_highlight_text: scheme.on_secondary_container,
        sidebar: scheme.surface_container_low,
        sidebar_text: scheme.on_surface,
        sidebar_border: scheme.outline_variant,
        sidebar_highlight: scheme.secondary_container,
        sidebar_highlight_text: scheme.on_secondary_container,
        bookmark_text: scheme.on_surface,
        ntp_background: scheme.surface,
        ntp_card_background: scheme.surface_container_low,
        ntp_text: scheme.on_surface,
      },
    });
  }

  function handleMessage(msg) {
    if (msg.type !== "palette_colors" || !msg.payload) return;
    _lastMtime = msg.mtime ?? _lastMtime;
    _scheme = msg.payload;
    if (_enabled) applyTheme(_scheme);
    Shade.applyScheme(_scheme);
  }

  function applyConfig(cfg) {
    _enabled = cfg["palette.enabled"];
    if (!_enabled) browser.theme.reset();
  }

  function connect() {
    _port = browser.runtime.connectNative("noon_mirsal");
    _port.onMessage.addListener(handleMessage);
    _port.onDisconnect.addListener(() => {
      _port = null;
      setTimeout(connect, 3000);
    });
    _port.postMessage({ type: "watch", payload: null });
  }

  function init() {
    browser.storage.local.get(CONFIG_DEFAULTS).then(applyConfig);
    browser.runtime.onMessage.addListener((msg) => {
      if (msg.type === "settings_updated") applyConfig(msg.settings);
      if (msg.type === "palette.request") return Promise.resolve(_scheme);
    });
    connect();
  }

  return { init };
})();
