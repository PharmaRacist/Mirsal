const NATIVE_HOST = "noon_mirsal";

const _handlers = {};

function onResponse(type, handler) {
  _handlers[type] = handler;
}

function send(type, payload) {
  browser.runtime
    .sendNativeMessage(NATIVE_HOST, { type, payload })
    .then((response) => {
      if (!response) return;
      const handler = _handlers[response.type];
      if (handler) handler(response);
      else console.log("Mirsal: unhandled response:", response);
    })
    .catch((err) =>
      console.error("Mirsal: native message failed —", err.message),
    );
}

Downloads.init(send);
Palette.init(send, onResponse);
