/*  src/background.js  – compiled → build/background.js */
chrome.runtime.onInstalled.addListener((details) => {
	// Only initialize on fresh install, not on updates
	if (details.reason === "install") {
		// Initialize with empty allowed domains list (OFF by default)
		chrome.storage.local.set({ allowedDomains: [] });
	}
});
