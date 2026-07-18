import { interpretCode } from './src/utils/jsInterpreter';

const code = `
function slindingWindow(arr) {
    let k = 4
    console.log(arr[k]);
    let map = new Map();

    // Output = 12.75

    let avarage = 0;
    let Sum = 0;
    let sildWindow = 0

    for (let i = sildWindow; i < k; i++) {
        Sum += arr[i];
        avarage = Sum / k;

        if (i == k - 1) {
            map.set(sildWindow, avarage);
            console.log(map);
            sildWindow++;
        }
    }
}
const result = slindingWindow([1, 12, -5, -6, 50, 3]);
`;

const result = interpretCode(code);
console.log('Total steps:', result.steps.length);
if (result.error) {
    console.log('Error:', result.error);
} else {
    console.log('Last step line:', result.steps[result.steps.length - 1].line);
}
