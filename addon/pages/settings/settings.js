const ELEMENTS = {
  "shade.enabled": { id: "shade-enabled", type: "checkbox" },
  "shade.dimMedia": { id: "shade-dim-media", type: "checkbox" },
  "shade.mediaBrightness": {
    id: "shade-media-brightness",
    type: "range",
    suffix: "%",
    display: "shade-media-brightness-value",
  },
  "palette.enabled": { id: "palette-enabled", type: "checkbox" },
  "palette.pollInterval": {
    id: "palette-poll-interval",
    type: "range",
    suffix: "s",
    display: "palette-poll-interval-value",
  },
  "downloads.enabled": { id: "downloads-enabled", type: "checkbox" },
};

function showStatus(msg) {
  const el = document.getElementById("status");
  el.textContent = msg;
  setTimeout(() => {
    el.textContent = "";
  }, 2000);
}

function save() {
  const settings = {};
  for (const [key, meta] of Object.entries(ELEMENTS)) {
    const el = document.getElementById(meta.id);
    settings[key] = meta.type === "checkbox" ? el.checked : parseInt(el.value);
  }
  browser.storage.local.set(settings).then(() => {
    browser.runtime.sendMessage({ type: "settings_updated", settings });
    showStatus("saved");
  });
}

function load() {
  browser.storage.local.get(DEFAULTS).then((s) => {
    for (const [key, meta] of Object.entries(ELEMENTS)) {
      const el = document.getElementById(meta.id);
      if (meta.type === "checkbox") {
        el.checked = s[key];
      } else {
        el.value = s[key];
        if (meta.display) {
          document.getElementById(meta.display).textContent =
            s[key] + meta.suffix;
        }
      }
    }
  });
}

for (const [key, meta] of Object.entries(ELEMENTS)) {
  const el = document.getElementById(meta.id);
  if (meta.type === "range") {
    el.addEventListener("input", (e) => {
      if (meta.display) {
        document.getElementById(meta.display).textContent =
          e.target.value + meta.suffix;
      }
    });
  }
  el.addEventListener("change", save);
}

load();
