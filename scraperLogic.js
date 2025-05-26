const jsdom = require("jsdom");
const { JSDOM } = jsdom;

/**
 * Extract meaningful text data from HTML string
 * @param {string} html
 * @returns {string[]} array of extracted text snippets
 */
function extractDataFromHtml(html) {
  if (!html || typeof html !== 'string') {
    throw new Error('Invalid HTML input');
  }

  const dom = new JSDOM(html);
  const document = dom.window.document;

  const paragraphs = [...document.querySelectorAll("p")];
  if (paragraphs.length === 0) {
    return ['No paragraphs found'];
  }

  const texts = paragraphs.map(p => p.textContent.trim()).filter(Boolean);
  return texts;
}

module.exports = { extractDataFromHtml };
