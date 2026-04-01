const faviconEl = document.getElementById("site-favicon");
const hostEl = document.getElementById("site-host");
const downloadsToggle = document.getElementById("downloads-toggle");
const downloadsIcon = document.getElementById("downloads-icon");
const downloadsStatusIcon = document.getElementById("downloads-status-icon");
const shadeToggle = document.getElementById("shade-toggle");
const shadeIcon = document.getElementById("shade-icon");
const shadeStatusIcon = document.getElementById("shade-status-icon");
const shadeStatusText = document.getElementById("shade-status-text");
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

function setDownloads(intercepting) {
  if (intercepting) {
    downloadsToggle.classList.remove("off");
    downloadsIcon.textContent = "download";
    downloadsStatusIcon.classList.remove("off");
    downloadsStatusIcon.textContent = "check_circle";
  } else {
    downloadsToggle.classList.add("off");
    downloadsIcon.textContent = "file_download_off";
    downloadsStatusIcon.classList.add("off");
    downloadsStatusIcon.textContent = "block";
  }
}

function setShade(active) {
  if (active) {
    shadeToggle.classList.remove("off");
    shadeIcon.textContent = "contrast";
    shadeStatusIcon.classList.remove("off");
    shadeStatusIcon.textContent = "check_circle";
  } else {
    shadeToggle.classList.add("off");
    shadeIcon.textContent = "contrast";
    shadeStatusIcon.classList.add("off");
    shadeStatusIcon.textContent = "block";
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
      downloadsToggle.disabled = true;
      shadeToggle.disabled = true;
      faviconEl.style.display = "none";
    } else {
      hostEl.textContent = _host;
      faviconEl.src = faviconUrl(_host);
      faviconEl.onerror = () => {
        const fb = document.createElement("div");
        fb.className = "site-favicon-fallback";
        fb.textContent = _host[0];
        faviconEl.closest(".favicon-wrap").replaceChildren(fb);
      };
    }

    browser.storage.local
      .get([
        ...Object.keys(CONFIG_DEFAULTS),
        "downloads.blacklist",
        "shade.whitelist",
      ])
      .then((stored) => {
        const blacklist = stored["downloads.blacklist"] ?? [];
        const whitelist = stored["shade.whitelist"] ?? [];

        for (const [key, el] of Object.entries(TOGGLES)) {
          el.checked = stored[key] ?? CONFIG_DEFAULTS[key];
        }

        if (_host) {
          setDownloads(!blacklist.includes(_host));
          setShade(whitelist.includes(_host));
        }
      });
  });
}

downloadsToggle.addEventListener("click", () => {
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
      setDownloads(isBlacklisted);
    });
  });
});

shadeToggle.addEventListener("click", () => {
  if (!_host) return;
  browser.storage.local.get("shade.whitelist").then((stored) => {
    const wl = stored["shade.whitelist"] ?? [];
    const isWhitelisted = wl.includes(_host);
    const updated = isWhitelisted
      ? wl.filter((h) => h !== _host)
      : [...new Set([...wl, _host])];
    browser.storage.local.set({ "shade.whitelist": updated }).then(() => {
      browser.runtime.sendMessage({
        type: "whitelist_updated",
        whitelist: updated,
      });
      setShade(!isWhitelisted);
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
