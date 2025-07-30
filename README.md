# <img src="public/icons/icon_48.png" width="45" align="left"> WebTex (MathJax Version)

A Chrome extension that renders LaTeX math expressions on websites that don't support it by injecting MathJax. This is the MathJax-based version of the original WebTex extension (which used KaTeX).

## Features

- **Domain-Specific Control**: Enable/disable LaTeX rendering per website
- **Automatic LaTeX Rendering**: Automatically detects and renders LaTeX math expressions on enabled sites
- **Multiple LaTeX Formats**: Supports both inline (`$...$`, `\(...\)`) and display (`$$...$$`, `\[...\]`) math
- **Beautiful UI**: Modern gradient design with smooth animations and visual feedback
- **Non-Destructive**: Works alongside existing content without breaking page functionality
- **Performance Optimized**: Uses MathJax SVG renderer for crisp, scalable math rendering
- **SPA Navigation Support**: Automatically re-renders math on single-page application navigation
- **Robust Error Handling**: Graceful handling of malformed LaTeX and rendering errors
- **Dark Mode Support**: Automatically adapts to system dark mode preferences

## Supported LaTeX Formats

### Inline Math
- `$E = mc^2$` - Dollar sign delimiters
- `\(E = mc^2\)` - Parentheses delimiters

### Display Math
- `$$\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}$$` - Double dollar signs
- `\[\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}\]` - Bracket delimiters

## Installation

### From Source
1. Clone this repository
2. Install dependencies: `npm install`
3. Build the extension: `npm run build`
4. Open Chrome and go to `chrome://extensions/`
5. Enable "Developer mode"
6. Click "Load unpacked" and select the `build` folder

### Development
- Run `npm run watch` for development with auto-rebuild
- Run `npm run build` for production build

## Usage

1. **Enable for Specific Sites**: Click the WebTex icon in your Chrome toolbar
2. **Toggle Per Domain**: Use the toggle switch to enable/disable MathJax for the current website
3. **Visual Feedback**: The extension badge shows "ON" (green) when enabled and "OFF" (red) when disabled
4. **Automatic Rendering**: Once enabled for a site, LaTeX expressions will be automatically rendered
5. **Domain Management**: Each website is controlled independently - enable only the sites you need

## Technical Details

- **Manifest Version**: 3 (latest Chrome extension standard)
- **Math Engine**: MathJax 3.2.2 with SVG renderer
- **Content Script**: Injects MathJax configuration and script into web pages
- **Storage**: Uses Chrome's local storage for domain-specific settings
- **Permissions**: Requires storage and tabs permissions for functionality
- **UI**: Modern gradient design with smooth animations and responsive layout
- **Navigation Detection**: Monitors for SPA navigation and DOM changes
- **Error Recovery**: Restores original LaTeX when extension is disabled

## Configuration

The extension can be customized by modifying the MathJax configuration in `src/app.js`:

```javascript
window.MathJax = {
  tex: {
    inlineMath: [['$', '$'], ['\\(', '\\)']],
    displayMath: [['$$', '$$'], ['\\[', '\\]']],
    processEscapes: true,
    processEnvironments: true,
    packages: ['base', 'ams', 'noerrors', 'noundefined']
  },
  options: {
    skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
    ignoreHtmlClass: 'webtex-ignore',
    processHtmlClass: 'webtex-process'
  },
  svg: {
    fontCache: 'global',
    scale: 1,
    minScale: .5
  }
  // ... other options
};
```

### CSS Classes for Control

- Add `webtex-ignore` class to elements you want to exclude from math rendering
- Add `webtex-process` class to elements you specifically want to include in math rendering

## Browser Compatibility

- Chrome 88+
- Chromium-based browsers (Edge, Brave, etc.)
- Not compatible with Firefox (different extension API)

## Testing

Use the included test files to verify the extension is working:

- `test-comprehensive.html` - Comprehensive test with various LaTeX expressions
- `test-mathjax.html` - Basic MathJax functionality test
- `test-toggle.html` - Extension toggle functionality test

Open these files in your browser with the extension enabled to test functionality.

## Contributing

Suggestions and pull requests are welcome! Please ensure your code follows the existing style and includes appropriate tests.

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

This project was bootstrapped with [Chrome Extension CLI](https://github.com/dutiyesh/chrome-extension-cli)

