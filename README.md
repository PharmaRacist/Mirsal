<p align="center">
  <img src="./addon/assets/banner.png" alt="./addon/assets/icons/96.svg" width="280" height="160">
</p>

<h1 align="center">Mirsal — مرسال</h1>

# Core Browser Extension for the Noon shell.
Mirsal intercepts some of browser's protocols to the integrated tools inside "Noon" 

## Current Capabilities

- Downloads interception

## TODO

- [ ] Color Sync - Omit pywalfox
- [ ] Further Ai slop communications
- [ ] universal ipc messanger

## Requirements

Mirsal requires the **noon-mirsald** to be installed on your system.

### Install the native host

```bash
    yay -S noon-mirsald --needed
```

## Privacy

Mirsal sends data only to the locally installed daemon on your
own machine via local Noon shell ipc. No data is sent to any remote server (source code at pharmaracist/mirsal).
for more info checkout:
https://github.com/pharmaracist/noon
