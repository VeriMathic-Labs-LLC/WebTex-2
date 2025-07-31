/*  src/background.js  – compiled → build/background.js */
chrome.runtime.onInstalled.addListener(() => {
	// Initialize with empty allowed domains list (OFF by default)
	chrome.storage.local.set({ allowedDomains: [] });
});
