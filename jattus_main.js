const readline = require('readline');
const { exec } = require('child_process');

function printBanner() {
  console.clear();
  console.log(`
\x1b[35m
     ____.       __    __                    _____  .___________          ________  
    |    |____ _/  |__/  |_ __ __  ______   /  _  \ |   \_____  \   ___  _\_____  \ 
    |    \__  \\   __\   __\  |  \/  ___/  /  /_\  \|   |/   |   \  \  \/ //  ____/ 
/\__|    |/ __ \|  |  |  | |  |  /\___ \  /    |    \   /    |    \  \   //       \ 
\________(____  /__|  |__| |____//____  > \____|__  /___\_______  /   \_/ \_______ \
              \/                      \/          \/            \/                \/
                      \x1b[36mJattus AIO v2.0\x1b[0m
  `);
  console.log("📦  Multi-Store Entry Bot for CollectorsEdge + MagicMadhouse");
  console.log("───────────────────────────────────────────────\n");
}

function mainMenu() {
  printBanner();
  console.log("1️⃣  MagicMadhouse (MMH)");
  console.log("2️⃣  CollectorsEdge");
  console.log("3️⃣  Exit");
  rl.question("\n👉  Select a module to begin (1/2/3): ", async (choice) => {
    if (choice === "1") {
      run("magicmadhouse.js");
    } else if (choice === "2") {
      collectorsEdgeMenu();
    } else {
      console.log("\n👋 Exiting Jattus AIO.");
      process.exit(0);
    }
  });
}

function collectorsEdgeMenu() {
  console.clear();
  console.log("🧩  CollectorsEdge Module");
  console.log("────────────────────────────");
  console.log("1. Start tasks from tasks.csv");
  console.log("2. Generate Random UK Addresses");
  console.log("3. Back to Main Menu");
  rl.question("\n👉  Choose an option (1/2/3): ", (answer) => {
    if (answer === "1") run("collectorsedge_tasks_autoname.js");
    else if (answer === "2") run("generate_addresses.js");
    else mainMenu();
  });
}

function run(script) {
  console.log(`\n🚀 Running ${script}...\n`);
  const child = exec(`node ${script}`);
  child.stdout.pipe(process.stdout);
  child.stderr.pipe(process.stderr);
  child.on("exit", () => {
    console.log("\n🏁 Script finished. Returning to main menu...");
    setTimeout(mainMenu, 2000);
  });
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

mainMenu();
