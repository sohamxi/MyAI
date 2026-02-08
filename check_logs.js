import fs from "fs";
const logs = fs.readdirSync("/root/.openclaw/logs").sort().reverse();
console.log("Checking log file:", logs[0]);
// Read the last 200 lines of the latest log file to check for success/failure
const content = fs.readFileSync(`/root/.openclaw/logs/${logs[0]}`, "utf8");
const lines = content.split("\n").slice(-200);
lines.forEach((l) => console.log(l));
