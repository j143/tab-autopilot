// background.js
importScripts('history.js');

let groupingThreshold = 4;
let groupingAlgorithm = 'history'; // Default to history-based grouping

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(['groupingThreshold', 'groupingAlgorithm'], (data) => {
    groupingThreshold = data.groupingThreshold || 4;
    groupingAlgorithm = data.groupingAlgorithm || 'history';
  });
});

chrome.tabs.onCreated.addListener(checkAndGroupTabs);

async function checkAndGroupTabs() {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const ungroupedTabs = tabs.filter(tab => tab.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE);
  
  if (ungroupedTabs.length >= groupingThreshold) {
    if (groupingAlgorithm === 'history') {
      await groupTabsByHistory(ungroupedTabs);
    } else {
      groupTabsByDomainOrAdvanced(ungroupedTabs);
    }
  }
}

async function groupTabsByHistory(tabs) {
  const historyGroups = await getHistoryGroups(tabs);
  
  for (const group of historyGroups) {
    const tabIds = tabs
      .filter(tab => group.urls.includes(tab.url))
      .map(tab => tab.id);
    
    if (tabIds.length >= 2) {
      const groupId = await chrome.tabs.group({ tabIds });
      await chrome.tabGroups.update(groupId, { title: group.title });
    }
  }
}

function groupTabsByDomainOrAdvanced(tabs) {
  // Existing grouping logic (domain or advanced)
  let groups = {};

  tabs.forEach((tab) => {
    let key = '';
    try {
      const url = new URL(tab.url);
      key = groupingAlgorithm === 'domain' ? url.hostname : getAdvancedGroupKey(url);
    } catch (error) {
      console.error('Invalid URL:', tab.url);
      key = 'other';
    }

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(tab.id);
  });

  Object.entries(groups).forEach(([key, tabIds]) => {
    if (tabIds.length >= 2) {
      chrome.tabs.group({ tabIds }, (groupId) => {
        chrome.tabGroups.update(groupId, { title: key });
      });
    }
  });
}

// Existing getAdvancedGroupKey function remains the same

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "groupTabs") {
    checkAndGroupTabs().then(() => sendResponse({success: true}));
    return true;
  } else if (request.action === "updateSettings") {
    groupingThreshold = request.threshold;
    groupingAlgorithm = request.algorithm;
    chrome.storage.sync.set({ groupingThreshold, groupingAlgorithm });
    sendResponse({success: true});
    return true;
  }
});
