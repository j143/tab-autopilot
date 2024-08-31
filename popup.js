document.addEventListener('DOMContentLoaded', () => {
  const currentThresholdSpan = document.getElementById('currentThreshold');
  const currentAlgorithmSpan = document.getElementById('currentAlgorithm');
  const groupNowButton = document.getElementById('groupNow');
  const openOptionsButton = document.getElementById('openOptions');

  chrome.storage.sync.get(['groupingThreshold', 'groupingAlgorithm'], (data) => {
    currentThresholdSpan.textContent = data.groupingThreshold || 4;
    currentAlgorithmSpan.textContent = data.groupingAlgorithm === 'advanced' ? 'Advanced' : 'Domain';
  });

  groupNowButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({action: "groupTabs"}, (response) => {
      if (response && response.success) {
        alert('Tabs grouped successfully!');
      } else {
        alert('Error grouping tabs. Please try again.');
      }
    });
  });

  openOptionsButton.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
});
