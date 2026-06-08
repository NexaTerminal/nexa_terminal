process.stdout.write('Starting test...\n');
const mods = [
  'express', 'cors', 'mongodb', 'passport', 'path', 'cookie-parser',
  './config/settingsManager', './middleware/security', './middleware/validation',
  './middleware/auth', './routes/autoDocuments'
];

let i = 0;
function testNext() {
  if (i >= mods.length) { process.stdout.write('All OK!\n'); process.exit(0); return; }
  const mod = mods[i++];
  process.stdout.write('Loading: ' + mod + '\n');
  try { require(mod); process.stdout.write('OK: ' + mod + '\n'); } 
  catch(e) { process.stdout.write('ERR: ' + mod + ': ' + e.message + '\n'); }
  testNext();
}
testNext();
