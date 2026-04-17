# Game Overlay Notes

An always-on-top transparent overlay for taking notes while gaming, built with Electron, React, and TypeScript.

## Features

- **Voice-to-text** — Record audio and transcribe via Whisper (runs locally, no internet required)
- **View/Edit modes** — Edit mode for normal interaction; View mode passes mouse clicks through to the game
- **Global hotkeys** — Toggle modes and trigger actions without leaving your game
- **System tray** — Show/hide the overlay and switch modes from the tray
- **Persistent storage** — Notes saved locally to `userData/notes.json`

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

```bash
npm install
```

### Download Whisper Model

```bash
npm run download-model
```

### Development

```bash
npm run dev
```

### Build

```bash
# For Windows
npm run build:win
```

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Typecheck + build
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix lint issues
npm run typecheck    # Type-check all processes
npm test             # Run all tests
```
