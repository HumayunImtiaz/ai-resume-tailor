const { analyzeMatch } = require('./dist/services/ai.service');

async function run() {
  console.log("Running...");
  const res = await analyzeMatch('I have 2 years of experience in Node.js, Express, and MongoDB.', 'We need a backend developer with experience in Node.js and PostgreSQL.');
  console.log(JSON.stringify(res, null, 2));
}
run();
