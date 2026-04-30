const { chromium } = require("playwright");

async function diagramGenerator(projectUrl, code, jsonData) {
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

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(projectUrl, { waitUntil: "domcontentloaded" });

  // Open file
  async function openFile(name) {
    await page.getByText(name).first().click();
  }

  // Set Monaco editor safely
  async function setEditor(content) {
    await page.waitForSelector(".monaco-editor");

    await page.evaluate((text) => {
      const editors = window.monaco?.editor?.getEditors?.();
      if (editors && editors.length > 0) {
        editors[0].setValue(text);
      }
    }, content);
  }

  // ✅ FIXED SAVE FUNCTION (NO networkidle)
  async function saveAndGetUrl() {
    const oldUrl = page.url();

    await page.getByRole("button", { name: /save/i }).first().click();

    await page.waitForSelector('text=/save a copy/i', { timeout: 10000 });

    await page.getByRole("button", { name: /save copy/i }).last().click();

    // IMPORTANT: Wokwi is async → wait fixed time instead of networkidle
    await page.waitForTimeout(3000);

    // Try detecting URL change (optional)
    try {
      await page.waitForFunction(
        (old) => window.location.href !== old,
        oldUrl,
        { timeout: 10000 }
      );
    } catch (e) {
      // ignore — Wokwi sometimes doesn't change URL
    }

    return page.url();
  }

  // ---------------- EXECUTION ----------------

  await openFile("sketch.ino");
  await setEditor(code);

  await openFile("diagram.json");
  await setEditor(JSON.stringify(jsonData, null, 2));

  const newUrl = await saveAndGetUrl();

  await browser.close();

  return newUrl;
R}

module.exports = { diagramGenerator };



