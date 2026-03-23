const Downloads = (() => {
  let _send = null;
  let _enabled = true;

  async function onCreated(item) {
    if (!_enabled) return;
    try {
      await browser.downloads.cancel(item.id);
      await browser.downloads.erase({ id: item.id });
    } catch (e) {
      console.error("Mirsal downloads: failed to cancel browser download —", e);
      return;
    }
    _send("downloads.add", {
      url: item.url,
      filename: item.filename ?? "",
      mime: item.mime ?? "",
      referrer: item.referrer ?? "",
      fileSize: item.fileSize ?? -1,
    });
  }

  function applyConfig(cfg) {
    _enabled = cfg["downloads.enabled"];
  }

  function init(send) {
    _send = send;
    browser.storage.local.get(CONFIG_DEFAULTS).then(applyConfig);
    browser.downloads.onCreated.addListener(onCreated);
    browser.runtime.onMessage.addListener((msg) => {
      if (msg.type === "settings_updated") applyConfig(msg.settings);
    });
  }

  function destroy() {
    browser.downloads.onCreated.removeListener(onCreated);
    _send = null;
  }

  return { init, destroy };
})();
