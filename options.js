// options.js
document.addEventListener('DOMContentLoaded', () => {
    const thresholdInput = document.getElementById('threshold');
    const saveButton = document.getElementById('save');
  
    chrome.storage.sync.get('groupingThreshold', (data) => {
      thresholdInput.value = data.groupingThreshold || 15;
    });
  
    saveButton.addEventListener('click', () => {
      const newThreshold = parseInt(thresholdInput.value);
      if (newThreshold >= 2 && newThreshold <= 100) {
        chrome.storage.sync.set({ groupingThreshold: newThreshold }, () => {
          alert('Settings saved!');
        });
      } else {
        alert('Please enter a number between 2 and 100.');
      }
    });
  });
