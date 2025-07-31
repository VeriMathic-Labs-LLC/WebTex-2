/* popup.js – runs in the extension popup */
const $ = (id) => document.getElementById(id);

const siteToggle = $("siteToggle");
const siteStatus = $("siteStatus");
const domainSpan = $("domainName");

let currentTab, host;

// Add visual feedback for toggle actions
function showToggleStatus(message, isSuccess = true) {
	const statusEl = document.createElement("div");
	statusEl.textContent = message;
	statusEl.style.cssText = `
    position: fixed; top: 10px; left: 10px; right: 10px;
    padding: 8px; border-radius: 4px; z-index: 1000;
    background: ${isSuccess ? "#d4edda" : "#f8d7da"};
    color: ${isSuccess ? "#155724" : "#721c24"};
    border: 1px solid ${isSuccess ? "#c3e6cb" : "#f5c6cb"};
    font-size: 12px; text-align: center;
  `;
	document.body.appendChild(statusEl);
	setTimeout(() => statusEl.remove(), 2000);
}

/* ---------- init ---------- */
chrome.tabs.query({ active: true, currentWindow: true }).then(async ([tab]) => {
	currentTab = tab;

	// Handle special URLs (chrome://, about:, etc.) that can't be parsed
	try {
		const url = new URL(tab.url);
		host = url.hostname || "local";
	} catch (_e) {
		// For special pages like chrome:// or about:
		host = tab.url.split(":")[0] || "special";
	}

	domainSpan.textContent = host;

	const { allowedDomains = [] } = await chrome.storage.local.get("allowedDomains");
	refreshSite(allowedDomains);
});

/* ---------- event handlers ---------- */
siteToggle.onchange = async () => {
	try {
		const { allowedDomains = [] } = await chrome.storage.local.get("allowedDomains");
		const list = siteToggle.checked
			? [...new Set([...allowedDomains, host])]
			: allowedDomains.filter((d) => d !== host);

		await chrome.storage.local.set({ allowedDomains: list });
		refreshSite(list);

		const action = siteToggle.checked ? "enabled" : "disabled";
		showToggleStatus(`WebTeX ${action} for ${host}`);

		// tell content script on this tab to reload to apply changes
		if (currentTab?.id) {
			try {
				const response = await chrome.tabs.sendMessage(currentTab.id, {
					action: "domain-updated",
					allowed: list,
				});
				console.log("WebTeX: Message sent to content script, response:", response);
				if (response?.success) {
					showToggleStatus(`WebTeX ${action} successfully`);
				}
			} catch (e) {
				// Content script might not be loaded on this page
				console.debug("WebTeX: Could not send message to tab", e);
				showToggleStatus("Injecting WebTeX content script...", true);

				// Try to inject the content script if it's not loaded
				try {
					await chrome.scripting.executeScript({
						target: { tabId: currentTab.id },
						files: ["app.js"],
					});
					console.log("WebTeX: Content script injected");

					// Try sending the message again
					setTimeout(async () => {
						try {
							const _response = await chrome.tabs.sendMessage(currentTab.id, {
								action: "domain-updated",
								allowed: list,
							});
							console.log("WebTeX: Message sent after script injection");
							showToggleStatus(`WebTeX ${action} after injection`);
						} catch (e2) {
							console.debug("WebTeX: Still could not send message after injection", e2);
							showToggleStatus("WebTeX injection failed - try refreshing the page", false);
						}
					}, 100);
				} catch (injectionError) {
					console.debug("WebTeX: Could not inject content script", injectionError);
				}
			}
		}
	} catch (error) {
		console.error("WebTeX: Error in popup toggle handler:", error);
	}
};

/* ---------- helpers ---------- */
function refreshSite(list) {
	const active = list.includes(host);
	siteToggle.checked = active;
	siteStatus.textContent = active ? "ON" : "OFF";
	siteStatus.className = `chip ${active ? "on" : "off"}`;
}
