// background.js
let groupingThreshold = 4;
let groupingAlgorithm = 'domain'; // Default algorithm

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(['groupingThreshold', 'groupingAlgorithm'], (data) => {
    groupingThreshold = data.groupingThreshold || 4;
    groupingAlgorithm = data.groupingAlgorithm || 'domain';
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
  let ungroupedTabs = tabs.filter(tab => tab.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE);
  
  if (ungroupedTabs.length < groupingThreshold) return;

  let groups = {};

  ungroupedTabs.forEach((tab) => {
    let key = '';
    try {
      const url = new URL(tab.url);
      key = groupingAlgorithm === 'domain' ? url.hostname : getUrlDistance(url);
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
    if (tabIds.length > 1) {
      chrome.tabs.group({ tabIds }, (groupId) => {
        chrome.tabGroups.update(groupId, { title: key });
      });
    }
  });
}

function getUrlDistance(url) {
  // Placeholder for advanced grouping algorithm
  // This could be replaced with more sophisticated logic
  return url.pathname.split('/')[1] || url.hostname;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "groupTabs") {
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
      groupTabs(tabs);
      sendResponse({success: true});
    });
    return true;
  } else if (request.action === "updateSettings") {
    groupingThreshold = request.threshold;
    groupingAlgorithm = request.algorithm;
    chrome.storage.sync.set({ groupingThreshold, groupingAlgorithm });
    sendResponse({success: true});
    return true;
  }
});
