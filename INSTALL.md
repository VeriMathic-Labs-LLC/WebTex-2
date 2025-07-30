# WebTex Installation Guide

## Quick Installation

1. **Build the Extension**
   ```bash
   npm install
   npm run build
   ```

2. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `build` folder from this project

3. **Test the Extension**
   - Open the `test.html` file in your browser
   - Click the WebTex icon in your Chrome toolbar
   - Toggle the extension on
   - Refresh the page to see LaTeX rendering

## Development

For development with auto-rebuild:
```bash
npm run watch
```

## Features

- ✅ Renders inline LaTeX: `$E = mc^2$` and `\(E = mc^2\)`
- ✅ Renders display LaTeX: `$$\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}$$`
- ✅ Easy toggle on/off per site
- ✅ Visual badge indicator (ON/OFF)
- ✅ Non-destructive injection
- ✅ Works on any website

## Troubleshooting

If LaTeX doesn't render:
1. Check that the extension is enabled (badge shows "ON")
2. Refresh the page after enabling
3. Check browser console for any errors
4. Ensure the page doesn't have strict CSP blocking script injection

## Browser Compatibility

- Chrome 88+
- Chromium-based browsers (Edge, Brave, etc.)
- Not compatible with Firefox (different extension API) 