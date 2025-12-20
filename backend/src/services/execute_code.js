import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

export const executeCode = async (code, testCases) => {
  const results = [];
  let passed = 0;

  for (const test of testCases) {
    const fullCode = `
${code}

const inputs = ${test.input};
const result = solution(...inputs);
console.log(JSON.stringify(result));
    `;

    try {
      const { stdout } = await execAsync(`node -e "${fullCode.replace(/"/g, '\\"')}"`, { timeout: 5000 });
      const output = stdout.trim();
      const passedTest = output === test.expectedOutput.trim();
      if (passedTest) passed++;
      results.push({ passed: passedTest, output, expected: test.expectedOutput });
    } catch (err) {
      results.push({ passed: false, output: err.message, expected: test.expectedOutput });
    }
  }

  return { passed, total: testCases.length, results };
};