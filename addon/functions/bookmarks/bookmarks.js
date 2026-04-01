const Bookmarks = (() => {
  const NATIVE_HOST = "noon_mirsal";

  async function sync() {
    console.log("Mirsal bookmarks: sync triggered");
    let tree;
    try {
      tree = await browser.bookmarks.getTree();
    } catch (e) {
      console.error("Mirsal bookmarks: getTree failed", e);
      return;
    }

    const bookmarks = [];
    function walk(nodes) {
      for (const node of nodes) {
        if (node.url)
          bookmarks.push({ id: node.id, title: node.title, url: node.url });
        if (node.children) walk(node.children);
      }
    }
    walk(tree);

    console.log("Mirsal bookmarks: sending", bookmarks.length, "bookmarks");
    try {
      const response = await browser.runtime.sendNativeMessage(NATIVE_HOST, {
        type: "bookmarks.sync",
        payload: bookmarks,
      });
      if (response.status === "ok") {
        console.log("Mirsal bookmarks: sync ok");
      } else {
        console.error("Mirsal bookmarks: daemon error", response.error);
      }
    } catch (e) {
      console.error("Mirsal bookmarks: sendNativeMessage failed", e);
    }
  }

  function init() {
    console.log("Mirsal bookmarks: init");
    sync();
    browser.bookmarks.onCreated.addListener(sync);
    browser.bookmarks.onRemoved.addListener(sync);
    browser.bookmarks.onChanged.addListener(sync);
    browser.bookmarks.onMoved.addListener(sync);
  }

  function destroy() {
    browser.bookmarks.onCreated.removeListener(sync);
    browser.bookmarks.onRemoved.removeListener(sync);
    browser.bookmarks.onChanged.removeListener(sync);
    browser.bookmarks.onMoved.removeListener(sync);
  }

  return { init, destroy };
})();
