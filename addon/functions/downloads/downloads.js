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

  function getHeader(headers, name) {
    return (
      headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())
        ?.value ?? null
    );
  }

  function isDownload(details) {
    const disposition =
      getHeader(details.responseHeaders, "content-disposition") ?? "";
    if (/attachment/i.test(disposition)) return true;

    const mime = (getHeader(details.responseHeaders, "content-type") ?? "")
      .split(";")[0]
      .trim()
      .toLowerCase();

    const DOWNLOAD_MIMES = [
      "application/octet-stream",
      "application/x-msdownload",
      "application/x-binary",
      "application/macbinary",
      "application/x-tar",
      "application/x-gzip",
      "application/x-bzip2",
      "application/x-xz",
      "application/x-7z-compressed",
      "application/zip",
      "application/x-rar-compressed",
      "application/vnd.rar",
      "application/x-iso9660-image",
      "application/x-apple-diskimage",
      "application/vnd.android.package-archive",
      "application/x-rpm",
      "application/x-debian-package",
      "application/x-executable",
      "application/x-sharedlib",
      "application/x-msdos-program",
      "application/x-dosexec",
    ];

    return DOWNLOAD_MIMES.includes(mime);
  }

  function parseFilename(details) {
    const disposition =
      getHeader(details.responseHeaders, "content-disposition") ?? "";

    const utf8Match = disposition.match(/filename\*=UTF-8''([^;\r\n]+)/i);
    if (utf8Match) {
      try {
        return decodeURIComponent(utf8Match[1].trim());
      } catch {}
    }

    const quotedMatch = disposition.match(/filename="([^"]+)"/i);
    if (quotedMatch) return quotedMatch[1].trim();

    const plainMatch = disposition.match(/filename=([^;\r\n]+)/i);
    if (plainMatch) return plainMatch[1].trim();

    try {
      const u = new URL(details.url);
      const last = u.pathname.split("/").filter(Boolean).pop();
      if (last) return decodeURIComponent(last);
    } catch {}

    return "";
  }

  async function recordHistory(host) {
    const stored = await browser.storage.local.get("downloads.history");
    const history = stored["downloads.history"] ?? {};
    history[host] = (history[host] ?? 0) + 1;
    browser.storage.local.set({ "downloads.history": history });
  }

  function onHeadersReceived(details) {
    if (!_enabled) return {};

    const IGNORED_TYPES = [
      "stylesheet",
      "image",
      "font",
      "media",
      "websocket",
      "csp_report",
      "ping",
    ];
    if (IGNORED_TYPES.includes(details.type)) return {};

    if (!isDownload(details)) return {};

    const host = getHost(details.url);
    const referer =
      getHeader(details.responseHeaders, "referer") ??
      getHeader(details.requestHeaders, "referer") ??
      "";
    const origin = getHeader(details.requestHeaders, "origin") ?? "";
    const effectiveHost = origin ? getHost(origin) : host;

    if (_blacklist.includes(host) || _blacklist.includes(effectiveHost))
      return {};

    recordHistory(effectiveHost);

    const mime = (
      getHeader(details.responseHeaders, "content-type") ??
      "application/octet-stream"
    )
      .split(";")[0]
      .trim();
    const contentLength = getHeader(details.responseHeaders, "content-length");
    const filename = parseFilename(details);

    _send(
      "downloads.add",
      JSON.stringify({
        id: details.requestId,
        url: details.url,
        filename,
        mime,
        fileSize: contentLength ? parseInt(contentLength, 10) : -1,
        referrer: referer,
        headers: {
          Referer: referer,
          Origin: origin,
        },
      }),
    );

    return { cancel: true };
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

    browser.webRequest.onHeadersReceived.addListener(
      onHeadersReceived,
      { urls: ["<all_urls>"] },
      ["blocking", "responseHeaders"],
    );

    browser.runtime.onMessage.addListener((msg) => {
      if (msg.type === "settings_updated") applyConfig(msg.settings);
      if (msg.type === "blacklist_updated") _blacklist = msg.blacklist ?? [];
    });
  }

  function destroy() {
    browser.webRequest.onHeadersReceived.removeListener(onHeadersReceived);
    _send = null;
  }

  return { init, destroy };
})();
