const Downloads = (() => {
  let _send = null;
  let _enabled = true;
  let _blacklist = [];

  function getHost(url) {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  }

  function isBlacklisted(host) {
    return _blacklist.includes(host);
  }

  async function getActiveTabHost() {
    const [tab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab?.url) return null;
    try {
      return new URL(tab.url).hostname;
    } catch {
      return null;
    }
  }

  async function recordHistory(host) {
    const stored = await browser.storage.local.get("downloads.history");
    const history = stored["downloads.history"] ?? {};
    history[host] = (history[host] ?? 0) + 1;
    browser.storage.local.set({ "downloads.history": history });
  }

  async function onCreated(item) {
    if (!_enabled) return;

    const tabHost = await getActiveTabHost();
    const downloadHost = getHost(item.url);
    const effectiveHost = tabHost ?? downloadHost;

    if (isBlacklisted(effectiveHost) || isBlacklisted(downloadHost)) return;

    try {
      await browser.downloads.cancel(item.id);
      await browser.downloads.erase({ id: item.id });
    } catch (e) {
      console.error("Mirsal downloads: failed to cancel browser download —", e);
      return;
    }

    recordHistory(effectiveHost);
    _send("downloads.add", {
      url: item.url,
      filename: item.filename ?? "",
      mime: item.mime ?? "",
      referrer: item.referrer ?? "",
      fileSize: item.fileSize ?? -1,
    });
  }

  function applyConfig(cfg) {
    _enabled = cfg["downloads.enabled"] ?? _enabled;
    _blacklist = cfg["downloads.blacklist"] ?? _blacklist;
  }

  function init(send) {
    _send = send;
    browser.storage.local
      .get([...Object.keys(CONFIG_DEFAULTS), "downloads.blacklist"])
      .then((stored) => {
        applyConfig(Object.assign({}, CONFIG_DEFAULTS, stored));
      });
    browser.downloads.onCreated.addListener(onCreated);
    browser.runtime.onMessage.addListener((msg) => {
      if (msg.type === "settings_updated") applyConfig(msg.settings);
      if (msg.type === "blacklist_updated") _blacklist = msg.blacklist ?? [];
    });
  }

  function destroy() {
    browser.downloads.onCreated.removeListener(onCreated);
    _send = null;
  }

  return { init, destroy };
})();
