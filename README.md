# Mirsal — مرسال

Universal browser-to-shell bridge for the Noon shell.

Mirsal intercepts browser downloads and forwards them to the Noon download
manager running on your system, giving you a unified download experience
managed from your desktop shell.

## Requirements

Mirsal requires the **Mirsal native host** to be installed on your system.
The extension alone cannot communicate with Noon without it.

### Install the native host

```bash
git clone https://github.com/noon-shell/mirsal-host
cd mirsal-host
build_libs ./native
```

This installs:
- `/usr/local/bin/mirsal` — the native messaging binary
- `~/.mozilla/native-messaging-hosts/noon_mirsal.json` — the Firefox host manifest

## How it works

```
Firefox download event
    → Mirsal intercept the browser download
    → sends { url, filename, mime, referrer } to mirsald 
    → native host forwards to Noon via IPC
    → Noon adds it to DownloadModel and manages the transfer via KIO
```

## Message format

Every message from the extension to the native host follows:

```json
{
    "type": "downloads.add",
    "payload": {
        "url":      "https://example.com/file.zip",
        "filename": "/home/user/Downloads/file.zip",
        "mime":     "application/zip",
        "referrer": "https://example.com",
        "fileSize": 10485760
    }
}
```

## Modules

| Module      | Status | Description                        |
|-------------|--------|------------------------------------|
| `downloads` | ✓      | Intercepts and forwards downloads  |

## Privacy

Mirsal sends data only to the locally installed native host binary on your
own machine via local Noon shell ipc. No data is sent to any remote server.
for more info checkout:
https://github.com/pharmaracist/noon
