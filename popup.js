document.getElementById('startBtn').addEventListener('click', () => {
  const query = document.getElementById('query').value.trim();
  const output = document.getElementById('output');

  if (!query) {
    output.textContent = 'Please enter a search query.';
    return;
  }

  output.textContent = 'Starting scrape...';

  chrome.runtime.sendMessage({ type: 'scrape', query }, response => {
    if (response.error) {
      output.textContent = `Error: ${response.error}`;
    } else {
      output.textContent = response?.summary || 'Scrape complete.';
    }
  });
});

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get('lastQuery', data => {
    if (data.lastQuery) {
      document.getElementById('query').value = data.lastQuery;
    }
  });
});
