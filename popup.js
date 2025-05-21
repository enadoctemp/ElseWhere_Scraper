document.getElementById('startBtn').addEventListener('click', () => {
  const query = document.getElementById('query').value.trim();
  const output = document.getElementById('output');
  const spinner = document.getElementById('spinner');

  if (!query) {
    output.textContent = 'Please enter a search query.';
    return;
  }

  output.textContent = '';
  spinner.style.display = 'block';

  // Send query to background for scraping
  chrome.runtime.sendMessage({ type: 'scrape', query }, response => {
    spinner.style.display = 'none';
    output.textContent = response?.summary || 'Scrape complete.';

    // Save the last query for future reference
    chrome.storage.local.set({ lastQuery: query });
  });
});

// Optional: Load last query on popup open
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get('lastQuery', data => {
    if (data.lastQuery) {
      document.getElementById('query').value = data.lastQuery;
    }
  });
});
