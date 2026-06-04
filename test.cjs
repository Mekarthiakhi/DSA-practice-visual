const fs = require('fs');

const code = `
function main() {
  const text = "Hello World";
  let reversed = "";
  for (let i = text.length - 1; i >= 0; i--) {
    reversed += text[i];
  }
  return reversed;
}
console.log(main());
`;

// Simulate jsInterpreter logic
const lines = code.split('\n');
const out = [];
const captureStr = 'try{__v__.text=text;__v__.reversed=reversed;__v__.i=i;}catch{}';

for (let i = 0; i < lines.length; i++) {
  const raw = lines[i];
  const trimmed = raw.trim();
  const ln = i + 1;
  
  if (!trimmed || trimmed.startsWith('//')) { out.push(raw); continue; }
  const isJustBrace = /^[}\])]/.test(trimmed);
  const opensBlock = trimmed[trimmed.length - 1] === '{';
  const isReturn = /^return\b/.test(trimmed);
  
  if (isJustBrace) { out.push(raw); out.push(captureStr + ';'); continue; }
  if (opensBlock) { out.push(`__trace__(${ln}); ${raw}`); continue; }
  if (isReturn) { out.push(`__trace__(${ln}); ${captureStr};`); out.push(raw); continue; }
  out.push(`__trace__(${ln}); ${raw}`);
  out.push(captureStr + ';');
}

const instrumentedCode = out.join('\n');
console.log('--- Instrumented Code ---');
console.log(instrumentedCode);

const __v__ = {};
const events = [];
function __trace__(ln) { events.push(ln); }
const safeConsole = { log: (...args) => console.log('INTERCEPTED:', ...args) };

try {
  const fn = new Function('__trace__', '__v__', 'console', `"use strict";\n${instrumentedCode}`);
  fn(__trace__, __v__, safeConsole);
  console.log('--- Events ---', events.length);
} catch(e) {
  console.error('ERROR:', e.message);
}
