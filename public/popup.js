// WebTex popup toggle logic
const toggle = document.getElementById('toggle');

// Load state
chrome.storage.sync.get({webtexEnabled: true}, data => {
  toggle.checked = !!data.webtexEnabled;
});

toggle.addEventListener('change', () => {
  chrome.storage.sync.set({webtexEnabled: toggle.checked});
});
