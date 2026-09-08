# Vicinae Zellij Extension

Control and manage Zellij terminal multiplexer sessions and layouts from Vicinae.

## Features

- List and manage active Zellij sessions
- List and open Zellij layouts
- Open sessions/layouts in your preferred terminal application
- Support for Alacritty, Ghostty, and GNOME Terminal

## Requirements

- [Vicinae](https://docs.vicinae.com) launcher
- Zellij must be installed on your system
- One of the supported terminal applications
- [Node.js](https://nodejs.org) and npm (only needed to build from source)

## Installation

This extension isn't yet published to the Vicinae extension store, so install it from source:

```bash
git clone https://github.com/brpaz/vicinae-zellij.git
cd vicinae-zellij
npm install
npm run build
```

`npm run build` compiles the extension and installs it directly into
`~/.local/share/vicinae/extensions/zellij`. Restart Vicinae (or reload
extensions) and the `List Sessions` / `List Layouts` commands will be
available in the launcher.

To keep the extension up to date, pull the latest changes and rebuild:

```bash
git pull
npm run build
```

## Configuration

You can configure which terminal application to use in the extension preferences.

## License

MIT
