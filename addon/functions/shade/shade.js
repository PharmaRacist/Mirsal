const Shade = (() => {
  let _scheme = null;
  let _enabled = true;
  let _dimMedia = true;
  let _mediaBrightness = 85;

  function sendToTab(tabId) {
    browser.tabs
      .sendMessage(tabId, {
        type: "shade_update",
        scheme: _scheme,
        enabled: _enabled,
        dimMedia: _dimMedia,
        mediaBrightness: _mediaBrightness,
      })
      .catch(() => {});
  }

  function broadcast() {
    browser.tabs.query({}).then((tabs) => {
      for (const tab of tabs) sendToTab(tab.id);
    });
  }

  function applyScheme(scheme) {
    _scheme = scheme;
    broadcast();
  }

  function applyConfig(cfg) {
    const wasEnabled = _enabled;
    _enabled = cfg["shade.enabled"];
    _dimMedia = cfg["shade.dimMedia"];
    _mediaBrightness = cfg["shade.mediaBrightness"];
    if (wasEnabled !== _enabled || _enabled) broadcast();
  }

  function init() {
    browser.storage.local.get(CONFIG_DEFAULTS).then(applyConfig);

    browser.runtime.onMessage.addListener((msg) => {
      if (msg.type === "settings_updated") applyConfig(msg.settings);
    });

    browser.tabs.onUpdated.addListener((tabId, info) => {
      if (info.status === "complete") sendToTab(tabId);
    });
  }

  return { init, applyScheme };
})();
