/* popup.js – runs in the extension popup */
const $ = (id) => document.getElementById(id);

const siteToggle   = $('siteToggle');
const siteStatus   = $('siteStatus');
const domainSpan   = $('domainName');

let currentTab, host;

/* ---------- init ---------- */
chrome.tabs.query({ active: true, currentWindow: true }).then(async ([tab]) => {
  currentTab = tab;
  
  // Handle special URLs (chrome://, about:, etc.) that can't be parsed
  try {
    const url = new URL(tab.url);
    host = url.hostname || 'local';
  } catch (e) {
    // For special pages like chrome:// or about:
    host = tab.url.split(':')[0] || 'special';
  }
  
  domainSpan.textContent = host;

  const { allowedDomains = [] } = await chrome.storage.local.get('allowedDomains');
  refreshSite(allowedDomains);
});

/* ---------- event handlers ---------- */
siteToggle.onchange = async () => {
  try {
    const { allowedDomains = [] } = await chrome.storage.local.get('allowedDomains');
    const list = siteToggle.checked
      ? [...new Set([...allowedDomains, host])]
      : allowedDomains.filter(d => d !== host);

    await chrome.storage.local.set({ allowedDomains: list });
    refreshSite(list);

    // tell content script on this tab to reload to apply changes
    if (currentTab?.id) {
      try { 
        const response = await chrome.tabs.sendMessage(currentTab.id, { 
          action: 'domain-updated', 
          allowed: list 
        });
        console.log('WebTeX: Message sent to content script, response:', response);
      } catch (e) { 
        // Content script might not be loaded on this page
        console.debug('WebTeX: Could not send message to tab', e);
        
        // Try to inject the content script if it's not loaded
        try {
          await chrome.scripting.executeScript({
            target: { tabId: currentTab.id },
            files: ['app.js']
          });
          console.log('WebTeX: Content script injected');
          
          // Try sending the message again
          setTimeout(async () => {
            try {
              await chrome.tabs.sendMessage(currentTab.id, { 
                action: 'domain-updated', 
                allowed: list 
              });
              console.log('WebTeX: Message sent after script injection');
            } catch (e2) {
              console.debug('WebTeX: Still could not send message after injection', e2);
            }
          }, 100);
        } catch (injectionError) {
          console.debug('WebTeX: Could not inject content script', injectionError);
        }
      }
    }
  } catch (error) {
    console.error('WebTeX: Error in popup toggle handler:', error);
  }
};

/* ---------- helpers ---------- */
function refreshSite (list) {
  const active = list.includes(host);
  siteToggle.checked      = active;
  siteStatus.textContent  = active ? 'ON' : 'OFF';
  siteStatus.className    = 'chip ' + (active ? 'on' : 'off');
}
