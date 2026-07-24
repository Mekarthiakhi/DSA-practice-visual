import { expect, Page, test } from '@playwright/test'

// Avoid TypeScript error "Cannot find name 'process'" in environments
// without @types/node by declaring process as any for this test file.
declare const process: any

async function replaceEditorCode(page: Page, code: string) {
  const editor = page.locator('.monaco-editor').first()
  await expect(editor).toBeVisible()
  await editor.click({ position: { x: 180, y: 80 } })
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A')
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.evaluate(source => navigator.clipboard.writeText(source), code)
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+V' : 'Control+V')
}

async function runAndWaitForSteps(page: Page) {
  await page.getByTestId('visualize-button').click()
  await expect(page.getByTestId('visualize-button')).toBeEnabled({ timeout: 50_000 })
  await expect(page.getByTestId('execution-step-counter')).toBeVisible()
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('AlgoVision', { exact: true })).toBeVisible()
  await expect(page.locator('.monaco-editor').first()).toBeVisible()
})

test('JavaScript runs in the visualizer and Monaco input stays invisible', async ({ page }) => {
  await replaceEditorCode(page, `function sum(values) {
  let total = 0;
  for (const value of values) total += value;
  return total;
}
console.log('Result:', sum([2, 3, 4]));`)
  await runAndWaitForSteps(page)

  await expect(page.getByTestId('visualization-panel')).toContainText('Execution Canvas')
  await expect(page.locator('.monaco-editor textarea:visible')).toHaveCount(0)
  await expect(page.getByTestId('execution-diagnostic')).toHaveCount(0)
})

test('a visualized function call does not require an output named result', async ({ page }) => {
  await replaceEditorCode(page, `function bubbleSort(values) {
  for (let i = 0; i < values.length - 1; i++) {
    for (let j = 0; j < values.length - i - 1; j++) {
      if (values[j] > values[j + 1]) {
        [values[j], values[j + 1]] = [values[j + 1], values[j]];
      }
    }
  }
  return values;
}
let test = bubbleSort([9, 4, 2]);`)
  await runAndWaitForSteps(page)

  await expect(page.getByTestId('execution-diagnostic')).toHaveCount(0)
  await expect(page.getByTestId('visualization-panel')).toContainText(/2|4|9/)
})

test('syntax and runtime errors point to an execution diagnostic', async ({ page }) => {
  await replaceEditorCode(page, 'function broken() {\n  const value = ;\n}\nbroken();')
  await runAndWaitForSteps(page)
  await expect(page.getByTestId('execution-diagnostic')).toContainText(/SyntaxError|Unexpected/)

  await replaceEditorCode(page, 'function crash() {\n  throw new Error("smoke runtime failure");\n}\ncrash();')
  await runAndWaitForSteps(page)
  await expect(page.getByTestId('execution-diagnostic')).toContainText(/Error|smoke runtime failure/)
})

test('linked-list and tree examples produce dynamic states', async ({ page }) => {
  await page.getByRole('button', { name: 'Examples' }).click()
  await page.getByRole('button', { name: 'Data Structures', exact: true }).click()
  await page.getByRole('button', { name: /^Linked List/ }).click()
  await runAndWaitForSteps(page)
  await expect(page.getByTestId('visualization-panel')).toContainText(/10|20/)

  await page.getByRole('button', { name: 'Examples' }).click()
  await page.getByRole('button', { name: 'Data Structures', exact: true }).click()
  await page.getByRole('button', { name: /^Binary Search Tree/ }).click()
  await runAndWaitForSteps(page)
  await expect(page.getByTestId('visualization-panel')).toContainText(/50|30|70/)
})

test('Python works on its first browser load', async ({ page }) => {
  await page.getByRole('button', { name: /JavaScript/ }).first().click()
  await page.getByRole('button', { name: /Python.*local runtime/ }).click()
  await replaceEditorCode(page, 'values = [3, 1, 2]\nvalues.sort()\nprint("Result:", values)')
  await runAndWaitForSteps(page)

  await expect(page.getByTestId('execution-diagnostic')).toHaveCount(0)
  await expect(page.getByTestId('execution-step-counter')).toBeVisible()
})

test('every problem detail exposes an approach overview', async ({ page }) => {
  await page.getByRole('button', { name: 'LeetCode' }).click()
  await page.getByRole('button', { name: /1\. Two Sum/ }).first().click()
  await expect(page.getByTestId('problem-overview')).toBeVisible()
  await expect(page.getByTestId('problem-overview')).toContainText('Suggested milestones')
  await expect(page.getByTestId('problem-overview')).toContainText('Correctness not verified yet')
})
