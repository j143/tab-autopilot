// options.js
document.addEventListener('DOMContentLoaded', () => {
  const thresholdInput = document.getElementById('threshold');
  const algorithmSelect = document.getElementById('algorithm');
  const saveButton = document.getElementById('save');

  chrome.storage.sync.get(['groupingThreshold', 'groupingAlgorithm'], (data) => {
    thresholdInput.value = data.groupingThreshold || 4;
    algorithmSelect.value = data.groupingAlgorithm || 'domain';
  });

  saveButton.addEventListener('click', () => {
    const newThreshold = parseInt(thresholdInput.value);
    const newAlgorithm = algorithmSelect.value;
    if (newThreshold >= 2 && newThreshold <= 100) {
      chrome.runtime.sendMessage({
        action: "updateSettings",
        threshold: newThreshold,
        algorithm: newAlgorithm
      }, (response) => {
        if (response && response.success) {
          alert('Settings saved successfully!');
        } else {
          alert('Error saving settings. Please try again.');
        }
      });
    } else {
      alert('Please enter a number between 2 and 100 for the threshold.');
    }
  });
});
