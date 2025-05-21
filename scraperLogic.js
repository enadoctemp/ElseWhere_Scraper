// scraperLogic.js

const jsdom = require("jsdom");
const { JSDOM } = jsdom;

/**
 * Extract meaningful text data from HTML string
 * @param {string} html
 * @returns {string[]} array of extracted text snippets
 */
function extractDataFromHtml(html) {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // Example: grab all text inside <p> tags
  const paragraphs = [...document.querySelectorAll("p")];
  const texts = paragraphs.map(p => p.textContent.trim()).filter(Boolean);
  return texts;
}

module.exports = { extractDataFromHtml };
