# WebTex MathJax Migration Summary

## Overview

This project is a **MathJax-based version** of the original WebTex Chrome extension. The original WebTex used KaTeX for math rendering, while this version uses MathJax 3.2.2.

## Key Differences from Original WebTex

### Math Engine
- **Original**: KaTeX (faster, lighter, but less feature-rich)
- **This Version**: MathJax 3.2.2 (more comprehensive LaTeX support, better accessibility)

### Features Added/Improved

#### 1. **Enhanced MathJax Configuration**
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
    processHtmlClass: 'webtex-process',
    enableMenu: false
  },
  svg: {
    fontCache: 'global',
    scale: 1,
    minScale: .5,
    mtextInheritFont: true
  }
}
```

#### 2. **SPA Navigation Support**
- Detects navigation in single-page applications
- Monitors URL changes, history API calls, and DOM changes
- Automatically re-renders math on navigation
- Handles both traditional and programmatic navigation

#### 3. **Improved Error Handling**
- Graceful handling of malformed LaTeX
- Non-blocking rendering with timeouts
- Better error recovery and logging
- Continues rendering other expressions even if some fail

#### 4. **Enhanced CSS Support**
- Dark mode support with `prefers-color-scheme`
- Better accessibility with ARIA attributes
- Responsive design for MathJax elements
- CSS classes for fine-grained control (`webtex-ignore`, `webtex-process`)

#### 5. **Robust Math Element Restoration**
- When extension is disabled, restores original LaTeX text
- Handles both inline and display math correctly
- Preserves original delimiters when possible

## Technical Improvements

### Performance Optimizations
- Debounced rendering to prevent excessive re-renders
- Mutation observer with intelligent filtering
- Ripple detection to ignore UI framework animations
- Non-blocking rendering with `setTimeout`

### Navigation Detection
```javascript
// Multiple detection methods:
1. Link click monitoring
2. History API override (pushState/replaceState)
3. Popstate event handling
4. DOM content hash monitoring
5. Periodic content change detection
```

### Error Recovery
- Restores original LaTeX when extension is disabled
- Handles MathJax annotation extraction
- Graceful fallback for missing elements
- Comprehensive error logging

## Testing

### Test Files Created
1. **`test-comprehensive.html`** - Full-featured test with various LaTeX expressions
2. **`test-mathjax.html`** - Basic MathJax functionality verification
3. **`test-toggle.html`** - Extension toggle functionality test

### Test Coverage
- Basic inline and display math
- Complex mathematical expressions
- Mixed content scenarios
- Edge cases and special characters
- Performance with multiple expressions
- Dark mode compatibility
- Error handling verification

## Installation & Usage

### Build Process
```bash
npm install
npm run build
```

### Extension Installation
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `build` folder
4. The extension icon will appear in the toolbar

### Usage
1. Click the WebTex icon to open the popup
2. Toggle the switch to enable/disable for the current domain
3. LaTeX expressions will be automatically rendered
4. Works on local files (`file://`) and enabled web domains

## Configuration Options

### CSS Classes for Control
- `webtex-ignore` - Exclude elements from math rendering
- `webtex-process` - Specifically include elements in math rendering

### MathJax Configuration
The MathJax configuration can be customized in `src/app.js` to:
- Add more LaTeX packages
- Change delimiters
- Modify rendering options
- Adjust SVG settings

## Browser Compatibility

- ✅ Chrome 88+
- ✅ Chromium-based browsers (Edge, Brave, etc.)
- ❌ Firefox (different extension API)

## Advantages of MathJax over KaTeX

1. **More Comprehensive LaTeX Support**
   - Better handling of complex environments
   - More LaTeX packages available
   - Better Unicode support

2. **Better Accessibility**
   - Built-in screen reader support
   - Semantic markup generation
   - ARIA attributes

3. **More Flexible Configuration**
   - Extensive customization options
   - Multiple output formats (SVG, CHTML)
   - Better error handling

4. **Better Error Recovery**
   - Graceful handling of malformed LaTeX
   - Detailed error messages
   - Partial rendering support

## File Structure

```
WebTex-2/
├── src/
│   ├── app.js          # Main content script with MathJax integration
│   ├── app.css         # Styling for MathJax elements
│   └── background.js   # Extension background script
├── public/
│   ├── manifest.json   # Extension manifest
│   ├── popup.html      # Extension popup UI
│   ├── popup.js        # Popup functionality
│   └── icons/          # Extension icons
├── config/
│   └── webpack.config.js # Build configuration
├── build/              # Built extension files
└── test-*.html         # Test files for verification
```

## Conclusion

This MathJax version of WebTex provides a more robust and feature-rich alternative to the original KaTeX version. It includes better navigation support, improved error handling, and enhanced accessibility features while maintaining the same user-friendly interface and domain-specific control.

The extension is ready for use and includes comprehensive testing to ensure reliability across different scenarios and LaTeX expressions. 