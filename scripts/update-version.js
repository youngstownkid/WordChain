import { readFileSync, writeFileSync } from "fs";

const packageJsonPath = "./package.json";
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

const now = new Date();
const month = String(now.getMonth() + 1);
const day = String(now.getDate());
const hours = String(now.getHours());
const minutes = String(now.getMinutes());

const newVersion = `${month}.${day}.${hours}${minutes}`;

packageJson.version = newVersion;

writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n");

console.log(`Version updated to ${newVersion}`);
