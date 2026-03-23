const NATIVE_HOST = "noon_mirsal";

function send(type, payload) {
  browser.runtime
    .sendNativeMessage(NATIVE_HOST, { type, payload })
    .then((response) => {
      if (response) console.log("Mirsal: response from host:", response);
    })
    .catch((err) =>
      console.error("Mirsal: native message failed —", err.message),
    );
}

Downloads.init(send);
