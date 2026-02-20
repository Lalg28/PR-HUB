export function openOrFocusTab(url: string) {
  chrome.tabs.query({ url: url + "*" }, (tabs) => {
    if (tabs.length > 0 && tabs[0].id != null) {
      chrome.tabs.update(tabs[0].id, { active: true });
      chrome.windows.update(tabs[0].windowId!, { focused: true });
    } else {
      chrome.tabs.create({ url });
    }
  });
}
