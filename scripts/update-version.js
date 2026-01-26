import { readFileSync, writeFileSync } from "fs";

const packageJsonPath = "./package.json";
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

const now = new Date();
const month = String(now.getMonth() + 1).padStart(2, "0");
const day = String(now.getDate()).padStart(2, "0");
const hours = String(now.getHours()).padStart(2, "0");
const minutes = String(now.getMinutes()).padStart(2, "0");

const newVersion = `1.${month}.${day}.${hours}${minutes}`;

packageJson.version = newVersion;

writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n");

console.log(`Version updated to ${newVersion}`);
