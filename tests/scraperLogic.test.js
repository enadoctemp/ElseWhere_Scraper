// tests/scraperLogic.test.js
const { extractDataFromHtml } = require("../scraperLogic");

test("extractDataFromHtml returns text from paragraphs", () => {
  const sampleHtml = `
    <html>
      <body>
        <p>Hello World</p>
        <p>Test paragraph</p>
      </body>
    </html>
  `;
  const result = extractDataFromHtml(sampleHtml);
  expect(result).toEqual(["Hello World", "Test paragraph"]);
});
