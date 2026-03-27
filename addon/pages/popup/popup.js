const faviconEl = document.getElementById("site-favicon");
const hostEl = document.getElementById("site-host");
const interceptBtn = document.getElementById("intercept-toggle");
const interceptIcon = document.getElementById("intercept-icon");
const statusIcon = document.getElementById("status-icon");
const statusText = document.getElementById("status-text");
const settingsBtn = document.getElementById("open-settings");

const TOGGLES = {
  "downloads.enabled": document.getElementById("downloads-enabled"),
  "palette.enabled": document.getElementById("palette-enabled"),
  "shade.enabled": document.getElementById("shade-enabled"),
};

let _host = null;

function faviconUrl(host) {
  return `https://www.google.com/s2/favicons?domain=${host}&sz=32`;
}

function setIntercepting(intercepting) {
  if (intercepting) {
    interceptBtn.classList.remove("blocked");
    interceptIcon.textContent = "download";
    statusIcon.classList.remove("blocked");
    statusIcon.textContent = "check_circle";
    statusText.textContent = "Intercepting downloads";
  } else {
    interceptBtn.classList.add("blocked");
    interceptIcon.textContent = "file_download_off";
    statusIcon.classList.add("blocked");
    statusIcon.textContent = "block";
    statusText.textContent = "Using Firefox downloads";
  }
}

function load() {
  browser.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
    try {
      _host = new URL(tab.url).hostname;
    } catch {
      _host = null;
    }

    if (
      !_host ||
      tab.url.startsWith("about:") ||
      tab.url.startsWith("moz-extension:")
    ) {
      hostEl.textContent = "No site";
      interceptBtn.disabled = true;
      faviconEl.style.display = "none";
    } else {
      hostEl.textContent = _host;
      faviconEl.src = faviconUrl(_host);
      faviconEl.onerror = () => {
        const fb = document.createElement("div");
        fb.className = "site-favicon-fallback";
        fb.textContent = _host[0];
        faviconEl.replaceWith(fb);
      };
    }

    browser.storage.local
      .get([...Object.keys(CONFIG_DEFAULTS), "downloads.blacklist"])
      .then((stored) => {
        const blacklist = stored["downloads.blacklist"] ?? [];
        for (const [key, el] of Object.entries(TOGGLES)) {
          el.checked = stored[key] ?? CONFIG_DEFAULTS[key];
        }
        if (_host) setIntercepting(!blacklist.includes(_host));
      });
  });
}

interceptBtn.addEventListener("click", () => {
  if (!_host) return;
  browser.storage.local.get("downloads.blacklist").then((stored) => {
    const bl = stored["downloads.blacklist"] ?? [];
    const isBlacklisted = bl.includes(_host);
    const updated = isBlacklisted
      ? bl.filter((h) => h !== _host)
      : [...new Set([...bl, _host])];
    browser.storage.local.set({ "downloads.blacklist": updated }).then(() => {
      browser.runtime.sendMessage({
        type: "blacklist_updated",
        blacklist: updated,
      });
      setIntercepting(isBlacklisted);
    });
  });
});

for (const [key, el] of Object.entries(TOGGLES)) {
  el.addEventListener("change", () => {
    const value = el.checked;
    browser.storage.local.set({ [key]: value }).then(() => {
      browser.runtime.sendMessage({
        type: "settings_updated",
        settings: { [key]: value },
      });
    });
  });

  const row = el.closest(".control-row");
  row.addEventListener("click", (e) => {
    if (e.target.closest(".toggle")) return;
    el.checked = !el.checked;
    el.dispatchEvent(new Event("change"));
  });
}

settingsBtn.addEventListener("click", () => {
  browser.runtime.openOptionsPage();
});

load();
