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

  async function getTabOrigin() {
    const [tab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab?.url) return null;
    try {
      return new URL(tab.url).origin;
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

    const host = getHost(item.url);
    const tabOrigin = await getTabOrigin();
    const effectiveHost = tabOrigin ? getHost(tabOrigin) : host;

    if (_blacklist.includes(host) || _blacklist.includes(effectiveHost)) return;

    recordHistory(effectiveHost);

    _send(
      "downloads.add",
      JSON.stringify({
        id: item.id,
        url: item.url,
        filename: item.filename ?? "",
        mime: item.mime ?? "application/octet-stream",
        fileSize: item.fileSize ?? -1,
        referrer: item.referrer ?? "",
        headers: {
          Referer: item.referrer || tabOrigin || "",
          Origin: tabOrigin || "",
        },
      }),
    );
  }

  function onChanged(delta) {
    if (!_enabled) return;
    _send(
      "downloads.changed",
      JSON.stringify({
        id: delta.id,
        filename: delta.filename,
        totalBytes: delta.totalBytes,
        bytesReceived: delta.bytesReceived,
        state: delta.state,
        paused: delta.paused,
        error: delta.error,
        mime: delta.mime,
      }),
    );
  }

  function onErased(id) {
    if (!_enabled) return;
    _send("downloads.erased", JSON.stringify({ id }));
  }

  function applyConfig(cfg) {
    _enabled = cfg["downloads.enabled"] ?? _enabled;
    _blacklist = cfg["downloads.blacklist"] ?? _blacklist;
  }

  function init(send) {
    _send = send;
    browser.storage.local
      .get([...Object.keys(CONFIG_DEFAULTS), "downloads.blacklist"])
      .then((stored) =>
        applyConfig(Object.assign({}, CONFIG_DEFAULTS, stored)),
      );

    browser.downloads.onCreated.addListener(onCreated);
    browser.downloads.onChanged.addListener(onChanged);
    browser.downloads.onErased.addListener(onErased);

    browser.runtime.onMessage.addListener((msg) => {
      if (msg.type === "settings_updated") applyConfig(msg.settings);
      if (msg.type === "blacklist_updated") _blacklist = msg.blacklist ?? [];
      if (msg.type === "downloads.pause") browser.downloads.pause(msg.id);
      if (msg.type === "downloads.resume") browser.downloads.resume(msg.id);
      if (msg.type === "downloads.cancel") browser.downloads.cancel(msg.id);
      if (msg.type === "downloads.open") browser.downloads.open(msg.id);
      if (msg.type === "downloads.show") browser.downloads.show(msg.id);
    });
  }

  function destroy() {
    browser.downloads.onCreated.removeListener(onCreated);
    browser.downloads.onChanged.removeListener(onChanged);
    browser.downloads.onErased.removeListener(onErased);
    _send = null;
  }

  return { init, destroy };
})();
