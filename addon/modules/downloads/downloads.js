const Downloads = (() => {
  let _send = null;

  async function onCreated(item) {
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

  function init(send) {
    _send = send;
    browser.downloads.onCreated.addListener(onCreated);
  }

  function destroy() {
    browser.downloads.onCreated.removeListener(onCreated);
    _send = null;
  }

  return { init, destroy };
})();
