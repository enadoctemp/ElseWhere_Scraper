// Store ongoing scraping sessions by queryId
const scrapingSessions = {};

// Helper: generate unique IDs
function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

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
        setTimeout(() => {
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (qid) => {
              // Extract text content
              const text = document.body.innerText || '';
              chrome.runtime.sendMessage({ type: 'data', content: text, queryId: qid });
            },
            args: [queryId]
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

    // Save content to session results
    scrapingSessions[queryId].results.push(content);
    scrapingSessions[queryId].completedCount++;

    // When all tabs finished scraping
    if (scrapingSessions[queryId].completedCount === scrapingSessions[queryId].expectedCount) {
      // Merge results (simple concatenation, can be improved)
      const mergedData = scrapingSessions[queryId].results.join('\n\n---\n\n');

      // Save merged results to local storage
      chrome.storage.local.set({ [`scrapeResult_${queryId}`]: mergedData }, () => {
        console.log(`Scrape results for queryId ${queryId} saved.`);

        // Optionally notify UI or other parts
        chrome.runtime.sendMessage({ type: 'scrapeComplete', queryId, dataLength: mergedData.length });

        // Cleanup session data if desired
        // delete scrapingSessions[queryId];
      });
    }
  }

  else if (request.type === 'exportData') {
    const { queryId } = request;
    chrome.storage.local.get([`scrapeResult_${queryId}`], (result) => {
      const data = result[`scrapeResult_${queryId}`] || '';
      sendResponse({ data });
    });
    // Return true to keep sendResponse async
    return true;
  }
});
