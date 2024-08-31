// background.js
let groupingThreshold = 15;

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get('groupingThreshold', (data) => {
    if (data.groupingThreshold === undefined) {
      chrome.storage.sync.set({ groupingThreshold: 15 });
    } else {
      groupingThreshold = data.groupingThreshold;
    }
  });
});

chrome.tabs.onCreated.addListener(checkAndGroupTabs);

function checkAndGroupTabs() {
  chrome.tabs.query({ currentWindow: true }, (tabs) => {
    if (tabs.length >= groupingThreshold) {
      groupTabs(tabs);
    }
  });
}

function groupTabs(tabs) {
  const urlGroups = {};

  tabs.forEach((tab) => {
    const domain = new URL(tab.url).hostname;
    if (!urlGroups[domain]) {
      urlGroups[domain] = [];
    }
    urlGroups[domain].push(tab.id);
  });

  Object.entries(urlGroups).forEach(([domain, tabIds]) => {
    if (tabIds.length > 1) {
      chrome.tabs.group({ tabIds }, (groupId) => {
        chrome.tabGroups.update(groupId, { title: domain });
      });
    }
  });
}
