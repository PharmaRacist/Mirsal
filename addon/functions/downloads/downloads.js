const Downloads = (() => {
  let _send = null;
  let _enabled = true;
  let _blacklist = [];

  const _pendingHeaders = new Map();

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

  async function getActiveTabInfo() {
    const [tab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab?.url) return { host: null, origin: null };
    try {
      const u = new URL(tab.url);
      return { host: u.hostname, origin: u.origin };
    } catch {
      return { host: null, origin: null };
    }
  }

  async function recordHistory(host) {
    const stored = await browser.storage.local.get("downloads.history");
    const history = stored["downloads.history"] ?? {};
    history[host] = (history[host] ?? 0) + 1;
    browser.storage.local.set({ "downloads.history": history });
  }
  const _headerWaiters = new Map();

  function onBeforeSendHeaders(details) {
    const cookie = details.requestHeaders?.find(
      (h) => h.name.toLowerCase() === "cookie",
    )?.value;
    const headers = cookie ? { Cookie: cookie } : {};

    if (_headerWaiters.has(details.url)) {
      _headerWaiters.get(details.url)(headers);
      return;
    }

    if (cookie) {
      _pendingHeaders.set(details.url, headers);
      setTimeout(() => _pendingHeaders.delete(details.url), 30_000);
    }
  }

  async function onCreated(item) {
    if (!_enabled) return;
    if (item.url.startsWith("blob:") || item.url.startsWith("data:")) return;

    const { host: tabHost, origin: tabOrigin } = await getActiveTabInfo();
    const downloadHost = getHost(item.url);
    const effectiveHost = tabHost ?? downloadHost;

    if (isBlacklisted(effectiveHost) || isBlacklisted(downloadHost)) return;

    // Wait up to 2s for onBeforeSendHeaders to fire for this URL
    const capturedHeaders = await new Promise((resolve) => {
      if (_pendingHeaders.has(item.url)) {
        resolve(_pendingHeaders.get(item.url));
        _pendingHeaders.delete(item.url);
        return;
      }
      const timeout = setTimeout(() => {
        off();
        resolve({});
      }, 2000);
      function off() {
        clearTimeout(timeout);
        _headerWaiters.delete(item.url);
      }
      _headerWaiters.set(item.url, (headers) => {
        off();
        resolve(headers);
      });
    });

    try {
      await browser.downloads.cancel(item.id);
      await browser.downloads.erase({ id: item.id });
    } catch (e) {
      console.error("Mirsal downloads: failed to cancel browser download —", e);
      return;
    }

    recordHistory(effectiveHost);

    const meta = {
      url: item.url,
      filename: item.filename ?? "",
      mime: item.mime ?? "application/octet-stream",
      fileSize: item.fileSize ?? -1,
      headers: {
        Referer: item.referrer || tabOrigin || "",
        Origin: tabOrigin || "",
        ...capturedHeaders,
      },
    };

    _send("downloads.add", JSON.stringify(meta));
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

    browser.webRequest.onBeforeSendHeaders.addListener(
      onBeforeSendHeaders,
      { urls: ["<all_urls>"] },
      ["requestHeaders"],
    );

    browser.downloads.onCreated.addListener(onCreated);

    browser.runtime.onMessage.addListener((msg) => {
      if (msg.type === "settings_updated") applyConfig(msg.settings);
      if (msg.type === "blacklist_updated") _blacklist = msg.blacklist ?? [];
      if (msg.type === "downloads.kio_failed")
        browser.downloads.download({ url: msg.url });
    });
  }

  function destroy() {
    browser.webRequest.onBeforeSendHeaders.removeListener(onBeforeSendHeaders);
    browser.downloads.onCreated.removeListener(onCreated);
    _send = null;
  }

  return { init, destroy };
})();
