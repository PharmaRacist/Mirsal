const Shade = (() => {
  let _scheme = null;
  let _enabled = true;
  let _dimMedia = true;
  let _mediaBrightness = 85;
  let _whitelist = [];

  function isAllowed(url) {
    if (!url) return false;
    try {
      return _whitelist.includes(new URL(url).hostname);
    } catch {
      return false;
    }
  }

  function sendToTab(tab) {
    const allowed = isAllowed(tab.url);
    browser.tabs
      .sendMessage(tab.id, {
        type: "shade_update",
        scheme: _scheme,
        enabled: _enabled && allowed,
        dimMedia: _dimMedia,
        mediaBrightness: _mediaBrightness,
      })
      .catch(() => {});
  }

  function broadcast() {
    browser.tabs.query({}).then((tabs) => {
      for (const tab of tabs) sendToTab(tab);
    });
  }

  function applyScheme(scheme) {
    _scheme = scheme;
    broadcast();
  }

  function applyConfig(cfg) {
    const wasEnabled = _enabled;
    _enabled = cfg["shade.enabled"] ?? _enabled;
    _dimMedia = cfg["shade.dimMedia"] ?? _dimMedia;
    _mediaBrightness = cfg["shade.mediaBrightness"] ?? _mediaBrightness;
    _whitelist = cfg["shade.whitelist"] ?? _whitelist;
    if (wasEnabled !== _enabled || _enabled) broadcast();
  }

  function init() {
    browser.storage.local.get(Object.keys(CONFIG_DEFAULTS)).then((stored) => {
      applyConfig(Object.assign({}, CONFIG_DEFAULTS, stored));
    });
    browser.runtime.onMessage.addListener((msg) => {
      if (msg.type === "settings_updated") applyConfig(msg.settings);
      if (msg.type === "whitelist_updated") {
        _whitelist = msg.whitelist ?? [];
        broadcast();
      }
    });
    browser.tabs.onUpdated.addListener((tabId, info, tab) => {
      if (info.status === "complete") sendToTab(tab);
    });
  }

  return { init, applyScheme };
})();
