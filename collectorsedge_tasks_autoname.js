
const fs = require('fs');
const puppeteer = require('puppeteer');
const csv = require('csv-parser');
const fetch = (...args) => import('node-fetch').then(mod => mod.default(...args));

const webhook = JSON.parse(fs.readFileSync('webhooks.txt', 'utf-8'))[0];
const productUrl = "https://collectorsedge.co.uk/collections/sv8-5-prismatic-evolutions/products/pokemon-tcg-prismatic-evolutions-super-premium-collection";
const output = [];

(async () => {
  const tasks = [];
  fs.createReadStream('tasks.csv')
    .pipe(csv())
    .on('data', (data) => tasks.push(data))
    .on('end', async () => {
      console.log(`📦 Loaded ${tasks.length} tasks from tasks.csv`);

      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();

      for (let task of tasks) {
        const { firstName, lastName, email, address, city, postcode } = task;
        let success = false;
        let retries = 0;

        while (!success && retries < 3) {
          try {
            await page.goto(productUrl, { waitUntil: 'domcontentloaded' });
            const formEmbed = await page.waitForSelector('form-embed', { timeout: 10000 });
            const shadowRoot = await formEmbed.evaluateHandle(el => el.shadowRoot);

            const typeInShadow = async (selector, value) => {
              const elHandle = await shadowRoot.$(selector);
              if (!elHandle) throw new Error(`Missing selector: ${selector}`);
              await elHandle.type(value);
            };

            await typeInShadow('input[data-testid="field-first_name"]', firstName);
            await typeInShadow('input[data-testid="field-last_name"]', lastName);
            await typeInShadow('input[data-testid="field-email"]', email);
            await typeInShadow('input[data-testid="field-custom#address"]', address);
            await typeInShadow('input[data-testid="field-custom#city"]', city);
            await typeInShadow('input[data-testid="field-custom#postcode"]', postcode);

            const submitBtn = await shadowRoot.$('button[type="submit"]');
            await submitBtn.click();
            await new Promise(res => setTimeout(res, 2000));

            console.log(`✅ Submitted — ${email}`);
            output.push({ email, status: "SUCCESS" });
            success = true;

            if (webhook) {
              await fetch(webhook, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  username: "Jattus AIO v2.0",
                  avatar_url: "https://i.imgur.com/hsCA7SD.jpeg",
                  embeds: [{
                    title: "🎯 Collector's Edge Entry Submitted",
                    color: 65280,
                    description: `**Email:** ${email}\n**Proxy:** Headless`,
                    footer: {
                      text: "Jattus AIO v2.0 • Collector's Edge",
                      icon_url: "https://i.imgur.com/hsCA7SD.jpeg"
                    },
                    timestamp: new Date().toISOString()
                  }]
                })
              }).catch(() => {});
            }
          } catch (err) {
            retries++;
            if (retries === 3) {
              console.log(`❌ FAILURE — ${email} — ${err.message}`);
              output.push({ email, status: "FAILED", reason: err.message });
            }
          }
        }
      }

      fs.writeFileSync('collectorsedge_results_20250526_182720.csv', "email,status,reason\n" + output.map(e =>
        `${e.email},${e.status},${e.reason || ''}`
      ).join("\n"));
      await browser.close();
    });
})();
