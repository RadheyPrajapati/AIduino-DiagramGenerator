const { chromium } = require("playwright");

// 🔥 MAIN FUNCTION
async function diagramGenerator(projectUrl, code, jsonData) {

  // ✅ Validate JSON
  if (!jsonData) {
    throw new Error("diagram_json missing");
  }

  if (typeof jsonData === "string") {
    try {
      jsonData = JSON.parse(jsonData);
    } catch (e) {
      throw new Error("Invalid JSON: " + e.message);
    }
  }

  // 🚀 Launch browser (DEPLOY SAFE)
  const browser = await chromium.launch({
    headless: true, // required for cloud
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(projectUrl, { waitUntil: "domcontentloaded" });

  // open file tab
  async function openFile(name) {
    await page.getByText(name).first().click();
  }

  // set editor content (Monaco)
  async function setEditor(content) {
    await page.waitForSelector(".monaco-editor");

    await page.evaluate((text) => {
      const editor = window.monaco?.editor?.getEditors?.()[0];
      if (editor) editor.setValue(text);
    }, content);
  }

  // save → save copy → get URL
  async function saveAndGetUrl() {
    await page.getByRole("button", { name: /save/i }).first().click();

    await page.waitForSelector('text=/save a copy/i');

    await page.getByRole("button", { name: /save copy/i }).last().click();

    // wait for new project URL
    await page.waitForURL(/projects\/\d+/);

    return page.url();
  }

  // ---- EXECUTION ----
  await openFile("sketch.ino");
  await setEditor(code);

  await openFile("diagram.json");
  await setEditor(JSON.stringify(jsonData, null, 2));

  const newUrl = await saveAndGetUrl();

  // ✅ close browser
  await browser.close();

  return newUrl;
}

module.exports = { diagramGenerator };