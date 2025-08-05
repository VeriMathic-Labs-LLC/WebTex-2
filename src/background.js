/*  src/background.js  – compiled → build/background.js */

import { domainMatches } from "./domain-utils.js";

// Track which tabs have content scripts injected
const injectedTabs = new Set();

// Initialize extension
chrome.runtime.onInstalled.addListener((details) => {
	// Only initialize on fresh install, not on updates
	if (details.reason === "install") {
		// Initialize with empty allowed domains list (OFF by default)
		chrome.storage.local.set({ allowedDomains: [] });
	}
});

// Handle tab updates to inject content scripts on allowed domains
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
	// Only proceed if the page is complete and has a URL
	if (changeInfo.status !== "complete" || !tab.url) return;

	try {
		const url = new URL(tab.url);
		const { allowedDomains = [] } = await chrome.storage.local.get("allowedDomains");

		// Check if this domain should have WebTeX enabled
		const shouldInject =
			url.protocol === "file:" ||
			allowedDomains.some((domain) => domainMatches(url.hostname, domain)) ||
			url.pathname.includes("test-comprehensive.html") ||
			url.pathname.includes("test-simple.html");

		// Inject or remove content script based on domain status
		if (shouldInject && !injectedTabs.has(tabId)) {
			await chrome.scripting.executeScript({
				target: { tabId: tabId },
				files: ["app.js"],
			});
			injectedTabs.add(tabId);
			console.log(`WebTeX: Injected content script on ${url.hostname}`);
		} else if (!shouldInject && injectedTabs.has(tabId)) {
			// Note: We can't easily remove content scripts, but we can send a message to disable
			try {
				await chrome.tabs.sendMessage(tabId, { action: "disable-website" });
			} catch (_e) {
				// Tab might not be accessible or content script not ready
			}
			injectedTabs.delete(tabId);
			console.log(`WebTeX: Disabled on ${url.hostname}`);
		}
	} catch (error) {
		console.error("WebTeX: Error handling tab update:", error);
	}
});

// Handle tab removal to clean up tracking
chrome.tabs.onRemoved.addListener((tabId) => {
	injectedTabs.delete(tabId);
});

// Handle domain list updates
chrome.storage.onChanged.addListener(async (changes, namespace) => {
	if (namespace === "local" && changes.allowedDomains) {
		const newAllowedDomains = changes.allowedDomains.newValue || [];

		// Check all current tabs and update injection status
		const tabs = await chrome.tabs.query({});

		for (const tab of tabs) {
			if (!tab.url) continue;

			try {
				const url = new URL(tab.url);
				const shouldInject =
					url.protocol === "file:" ||
					newAllowedDomains.some((domain) => domainMatches(url.hostname, domain)) ||
					url.pathname.includes("test-comprehensive.html") ||
					url.pathname.includes("test-simple.html");

				if (shouldInject && !injectedTabs.has(tab.id)) {
					await chrome.scripting.executeScript({
						target: { tabId: tab.id },
						files: ["app.js"],
					});
					injectedTabs.add(tab.id);
					console.log(`WebTeX: Injected content script on ${url.hostname} after domain update`);
				} else if (!shouldInject && injectedTabs.has(tab.id)) {
					try {
						await chrome.tabs.sendMessage(tab.id, { action: "disable-website" });
					} catch (_e) {
						// Tab might not be accessible
					}
					injectedTabs.delete(tab.id);
					console.log(`WebTeX: Disabled on ${url.hostname} after domain update`);
				}
			} catch (error) {
				console.error("WebTeX: Error updating tab after domain change:", error);
			}
		}
	}
});
