import { analyzeMatch } from './src/services/ai.service';
import fs from 'fs';
import util from 'util';

const logFile = fs.createWriteStream('logs.txt', { flags: 'w' });
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

console.log = function(...args) {
  logFile.write(util.format(...args) + '\n');
  originalConsoleLog.apply(console, args);
};

console.error = function(...args) {
  logFile.write(util.format(...args) + '\n');
  originalConsoleError.apply(console, args);
};

async function run() {
  console.log("Staring test...");
  const res = await analyzeMatch('I have 2 years of experience in Node.js, Express, and MongoDB.', 'We need a backend developer with experience in Node.js and PostgreSQL.');
  console.log(JSON.stringify(res, null, 2));
  logFile.end();
}
run();
