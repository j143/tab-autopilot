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
  let currentGroup = [];
  let currentDomain = '';

  tabs.forEach((tab, index) => {
    if (tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
      // Skip tabs that are already grouped
      if (currentGroup.length > 1) {
        createGroup(currentGroup, currentDomain);
      }
      currentGroup = [];
      currentDomain = '';
    } else {
      const domain = new URL(tab.url).hostname;
      if (domain === currentDomain) {
        currentGroup.push(tab.id);
      } else {
        if (currentGroup.length > 1) {
          createGroup(currentGroup, currentDomain);
        }
        currentGroup = [tab.id];
        currentDomain = domain;
      }
    }

    // Handle the last group
    if (index === tabs.length - 1 && currentGroup.length > 1) {
      createGroup(currentGroup, currentDomain);
    }
  });
}

function createGroup(tabIds, domain) {
  chrome.tabs.group({ tabIds }, (groupId) => {
    chrome.tabGroups.update(groupId, { title: domain });
  });
}

// Update the message listener to return a proper response
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "groupTabs") {
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
      groupTabs(tabs);
      sendResponse({success: true});
    });
    return true;  // Indicates we will send a response asynchronously
  }
});
