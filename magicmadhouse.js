const fs = require('fs');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const readline = require('readline');

puppeteer.use(StealthPlugin());

const emails = fs.readFileSync('emails.txt', 'utf-8').split('\n').filter(Boolean);
const proxies = fs.readFileSync('proxy.txt', 'utf-8').split('\n').filter(Boolean);

let webhooks = [];
try {
  webhooks = fs.readFileSync('webhooks.txt', 'utf-8').split('\n').filter(Boolean);
} catch {
  console.log("📭 No webhooks.txt found — skipping Discord notifications.");
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = question => new Promise(resolve => rl.question(question, resolve));

(async () => {
  const mode = await ask('📦 What do you want to do?\n1️⃣  Start new tasks\n2️⃣  Retry from existing CSV\nEnter 1 or 2: ');
  let resultsFile = null;
  let useRetry = mode.trim() === '2';

  if (useRetry) {
    const retryFile = await ask('📁 Enter the filename of the CSV to retry (e.g., results_2025-05-21T18-00-00-000Z.csv): ');
    resultsFile = retryFile.trim();
    if (!fs.existsSync(resultsFile)) {
      console.log("❌ File not found. Exiting.");
      process.exit(1);
    }
  }

  const TARGET_URL = await ask('🔗 Enter Product URL: ');
  const delayInput = await ask('⏱ Enter delay between emails (ms): ');
  rl.close();
  const DELAY = parseInt(delayInput) || 2000;

  if (!useRetry) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    resultsFile = `results_${timestamp}.csv`;
    fs.writeFileSync(resultsFile, "Email,Proxy,Status,ProductURL,Timestamp\n");
  }

  proxies.sort(() => Math.random() - 0.5);
  const CONCURRENCY = 5;
  let index = 0;

  async function processEntry(email, proxyLine, webhookUrl) {
    const [host, port, username, password] = proxyLine.split(':');
    const proxyHost = `http://${host}:${port}`;
    const proxyAuth = username && password ? { username, password } : null;

    console.log(`\n\x1b[35m────────────────────────────────────────────\x1b[0m`);
    console.log(`📧  \x1b[1mEmail  :\x1b[0m ${email}`);
    console.log(`🌐  Proxy : \x1b[36m${proxyHost}\x1b[0m`);

    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [`--proxy-server=${proxyHost}`],
      });

      const page = await browser.newPage();
      if (proxyAuth) await page.authenticate(proxyAuth);

      await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
      const productImage = await page.$eval('meta[property="og:image"]', el => el.content).catch(() => null);

      await page.waitForSelector('a.klaviyo-lottery-trigger.klaviyo-bis-trigger', { timeout: 10000 });
      await page.click('a.klaviyo-lottery-trigger.klaviyo-bis-trigger');

      await page.waitForSelector('input[type="email"]', { timeout: 8000 });
      await page.type('input[type="email"]', email, { delay: 50 });
      await page.click('button[type="submit"]');

      await new Promise(res => setTimeout(res, DELAY));
      console.log(`✅  Status : \x1b[32m✔ SUCCESS\x1b[0m`);
      console.log(`\x1b[35m────────────────────────────────────────────\x1b[0m`);

      fs.appendFileSync(resultsFile, `${email},${proxyHost},SUCCESS,${TARGET_URL},${new Date().toISOString()}\n`);
      fs.appendFileSync("success.txt", `✅ SUCCESS: ${email} via ${proxyHost}\n`);

      if (webhookUrl) {
        const payload = {
          username: "Jattus AIO v1.1",
          avatar_url: "https://i.imgur.com/hsCA7SD.jpg",
          embeds: [{
            title: "🎯 Entry Submitted!",
            color: 0xff3131,
            description: `**Email:** \`${email}\`\n**Proxy:** \`${proxyHost}\``,
            footer: {
              text: "Jattus AIO v1.1 • MagicMadhouse",
              icon_url: "https://i.imgur.com/hsCA7SD.jpg"
            },
            timestamp: new Date().toISOString(),
            thumbnail: { url: productImage || "https://i.imgur.com/hsCA7SD.jpg" }
          }]
        };
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(err => console.log("❌ Discord webhook failed:", err.message));
      }

    } catch (err) {
      console.log(`❌  Status : \x1b[31m✖ FAILED\x1b[0m`);
      console.log(`\x1b[35m────────────────────────────────────────────\x1b[0m`);
      fs.appendFileSync(resultsFile, `${email},${proxyHost},FAILURE,${TARGET_URL},${new Date().toISOString()}\n`);
      fs.appendFileSync("failure.txt", `❌ FAILED: ${email}\n`);
    } finally {
      if (browser) await browser.close();
    }
  }

  async function runBatch() {
    while (index < emails.length) {
      const batch = [];
      for (let i = 0; i < CONCURRENCY && index < emails.length; i++, index++) {
        const email = emails[index];
        const proxyLine = proxies[index % proxies.length];
        const webhook = webhooks.length === 1 ? webhooks[0] : webhooks[index] || null;
        batch.push(processEntry(email, proxyLine, webhook));
      }
      await Promise.all(batch);
    }
  }

  
  if (!useRetry) {
    await runBatch();

    const failedEmails = fs.existsSync(resultsFile)
      ? fs.readFileSync(resultsFile, "utf-8")
          .split("\n")
          .filter(line => line.includes(",FAILURE,"))
          .map(line => line.split(",")[0])
      : [];

    if (failedEmails.length > 0) {
      const retryRl = readline.createInterface({ input: process.stdin, output: process.stdout });
      retryRl.question(`\n🔁 ${failedEmails.length} failed entries found. Retry them now? (yes/no): `, async (answer) => {
        retryRl.close();
        if (answer.toLowerCase().startsWith("y")) {
          for (let i = 0; i < failedEmails.length; i++) {
            const email = failedEmails[i];
            const proxyLine = proxies[i % proxies.length];
            const webhook = webhooks.length === 1 ? webhooks[0] : webhooks[i] || null;
            await processEntry(email, proxyLine, webhook);
          }
          console.log("\n✅ \x1b[32mRetry block completed.\x1b[0m");
        } else {
          console.log("\n🚫 Skipping retry.");
        }
      });
    }
  }


  const failedEmails = fs.existsSync(resultsFile)
    ? fs.readFileSync(resultsFile, "utf-8")
        .split("\n")
        .filter(line => line.includes(",FAILURE,"))
        .map(line => line.split(",")[0])
    : [];

  if (useRetry || (!useRetry && failedEmails.length > 0)) {
    console.log(`\n🔁 \x1b[33mRetrying ${failedEmails.length} failed entries...\x1b[0m`);
    for (let i = 0; i < failedEmails.length; i++) {
      const email = failedEmails[i];
      const proxyLine = proxies[i % proxies.length];
      const webhook = webhooks.length === 1 ? webhooks[0] : webhooks[i] || null;
      await processEntry(email, proxyLine, webhook);
    }
    console.log("\n✅ \x1b[32mRetry block completed.\x1b[0m");
  }
})();
