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
    const ungroupedTabs = tabs.filter(tab => tab.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE);
    if (ungroupedTabs.length >= groupingThreshold) {
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
    if (tabIds.length >= 2) {  // Only group if there are at least 2 tabs
      chrome.tabs.group({ tabIds }, (groupId) => {
        chrome.tabGroups.update(groupId, { title: key });
      });
    }
  });
}

// Advanced grouping algorithm
function getAdvancedGroupKey(url) {
  // Design comments:
  // 1. We use a point system to determine similarity between URLs
  // 2. Points are awarded based on shared elements of the URL
  // 3. We prioritize the domain, then the path, then query parameters
  // 4. Special consideration is given to common subdomains (www, app, etc.)
  // 5. The algorithm aims to balance specificity with flexibility

  let key = '';
  const domainParts = url.hostname.split('.');
  const pathParts = url.pathname.split('/').filter(Boolean);
  
  // Start with the domain (most important)
  if (domainParts.length > 2 && !['www', 'app', 'api', 'm'].includes(domainParts[0])) {
    key += domainParts.slice(-3).join('.');
  } else {
    key += domainParts.slice(-2).join('.');
  }

  // Add first level of path if it exists
  if (pathParts.length > 0) {
    key += '/' + pathParts[0];
  }

  // Add a hash of deeper path elements
  if (pathParts.length > 1) {
    const pathHash = pathParts.slice(1).reduce((acc, part) => acc + part.length, 0);
    key += ':' + pathHash;
  }

  // Consider query parameters
  const params = Array.from(url.searchParams.keys());
  if (params.length > 0) {
    const paramHash = params.sort().join(',');
    key += '?' + paramHash;
  }

  return key;
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
