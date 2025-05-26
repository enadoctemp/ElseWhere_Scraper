// Improved: Added error handling for tab creation and script execution

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'scrape') {
    const query = request.query.trim();
    if (!query) {
      sendResponse({ error: 'Empty query' });
      return;
    }

    const queryId = generateId();
    scrapingSessions[queryId] = {
      query,
      results: [],
      expectedCount: 0,
      completedCount: 0
    };

    const encodedQuery = encodeURIComponent(query);
    const urls = [
      `https://www.google.com/search?q=${encodedQuery}`,
      `https://www.bing.com/search?q=${encodedQuery}`,
      `https://duckduckgo.com/?q=${encodedQuery}`,
      `https://onion.live/search?q=${encodedQuery}`,
      `https://ahmia.fi/search/?q=${encodedQuery}`
    ];

    scrapingSessions[queryId].expectedCount = urls.length;

    urls.forEach((url, index) => {
      chrome.tabs.create({ url, active: false }, tab => {
        if (chrome.runtime.lastError) {
          console.error('Failed to create tab:', chrome.runtime.lastError.message);
          return;
        }
        setTimeout(() => {
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (qid) => {
              const text = document.body.innerText || '';
              chrome.runtime.sendMessage({ type: 'data', content: text, queryId: qid });
            },
            args: [queryId]
          }, () => {
            if (chrome.runtime.lastError) {
              console.error('Failed to execute script:', chrome.runtime.lastError.message);
            }
          });
        }, 5000 * (index + 1)); // stagger scraping
      });
    });

    sendResponse({ summary: 'Scraping started across multiple tabs.', queryId });
  }

  else if (request.type === 'data') {
    const { queryId, content } = request;
    if (!scrapingSessions[queryId]) {
      console.warn('Received data for unknown session', queryId);
      return;
    }

    scrapingSessions[queryId].results.push(content);
    scrapingSessions[queryId].completedCount++;

    if (scrapingSessions[queryId].completedCount === scrapingSessions[queryId].expectedCount) {
      const mergedData = scrapingSessions[queryId].results.join('\n\n---\n\n');
      chrome.storage.local.set({ [`scrapeResult_${queryId}`]: mergedData }, () => {
        console.log(`Scrape results for queryId ${queryId} saved.`);
        chrome.runtime.sendMessage({ type: 'scrapeComplete', queryId, dataLength: mergedData.length });
      });
    }
  }

  else if (request.type === 'exportData') {
    const { queryId } = request;
    chrome.storage.local.get([`scrapeResult_${queryId}`], (result) => {
      const data = result[`scrapeResult_${queryId}`] || '';
      sendResponse({ data });
    });
    return true;
  }
});
