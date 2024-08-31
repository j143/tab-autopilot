async function getHistoryGroups(tabs) {
    const tabUrls = tabs.map(tab => tab.url);
    const thirtyMinutesAgo = new Date().getTime() - 30 * 60 * 1000;
    
    const history = await chrome.history.search({
      text: '',
      startTime: thirtyMinutesAgo,
      maxResults: 1000
    });
  
    const urlToGroupMap = new Map();
  
    history.forEach(historyItem => {
      if (tabUrls.includes(historyItem.url)) {
        const groupKey = historyItem.referringVisitId || 'ungrouped';
        if (!urlToGroupMap.has(groupKey)) {
          urlToGroupMap.set(groupKey, []);
        }
        urlToGroupMap.get(groupKey).push(historyItem.url);
      }
    });
  
    return Array.from(urlToGroupMap.values())
      .filter(group => group.length > 1)
      .map(group => ({
        urls: group,
        title: getGroupTitle(group)
      }));
  }
  
  function getGroupTitle(urls) {
    // Implement logic to determine a suitable group title
    // This could be based on common keywords, the first URL, etc.
    return new URL(urls[0]).hostname;
  }
  