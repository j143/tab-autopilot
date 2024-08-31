document.addEventListener('DOMContentLoaded', () => {
    const currentThresholdSpan = document.getElementById('currentThreshold');
    const groupNowButton = document.getElementById('groupNow');
    const openOptionsButton = document.getElementById('openOptions');
  
    // Display current threshold
    chrome.storage.sync.get('groupingThreshold', (data) => {
      currentThresholdSpan.textContent = data.groupingThreshold || 15;
    });
  
    // Group tabs now
    groupNowButton.addEventListener('click', () => {
      chrome.runtime.sendMessage({action: "groupTabs"}, (response) => {
        console.log(response);
        if (response.success) {
          alert('Tabs grouped successfully!');
        } else {
          alert('Error grouping tabs. Please try again.');
        }
      });
    });
  
    // Open options page
    openOptionsButton.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
  });
