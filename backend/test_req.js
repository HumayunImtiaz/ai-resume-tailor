async function run() {
  const res = await fetch('http://localhost:4000/api/test-ai', {
    method: 'POST',
    body: JSON.stringify({resumeText: 'I have 2 years of experience in Node.js, Express, and MongoDB. I built REST APIs and worked with React.', jobText: 'We need a backend developer with strong experience in Node.js, PostgreSQL, Docker, and AWS.'}),
    headers: {'Content-Type': 'application/json'}
  });
  console.log(await res.text());
}
run();
