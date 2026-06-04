import { interpretCode } from './src/utils/jsInterpreter.js';

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

const res = interpretCode(code);
console.log(JSON.stringify(res, null, 2));
