<p align="center">
  <img src="./addon/assets/banner.svg" alt="./addon/assets/icons/96.svg" width="840" height="560">
</p>

<h1 align="center">Mirsal — مرسال</h1>

# Core Browser Extension for the Noon shell.
Mirsal intercepts some of browser's protocols to the integrated tools inside "Noon" 

## Current Capabilities
- [X] Downloads interception
- [X] Color Sync - Omit pywalfox
- [X] Page colors override - Omit DarkReader
- [ ] Minimal New tab page

## TODO
- [ ] Further Ai slop communications
- [ ] universal ipc messanger

## Requirements

- Mirsal requires the **noon-mirsald** to be installed on your system.

```bash
    yay -S noon-mirsald --needed
```

- Copy matugen's template from examples/firefox.json to your matugen configs.
- Add this snippet to matugen's config.toml 

``` toml 
    [templates.mirsal]
    input_path = '~/.config/matugen/templates/applications/firefox.json'
    output_path = '~/.cache/noon/user/generated/colors/firefox.json'
    post_hook = 'python /usr/lib/noon-mirsal/mirsald pull-palette'
```


## Privacy

Mirsal sends data only to the locally installed daemon on your
own machine via local Noon shell ipc. No data is sent to any remote server - source code at https://github.com/pharmaracist/noon
