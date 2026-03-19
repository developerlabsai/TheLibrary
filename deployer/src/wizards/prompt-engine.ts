/**
 * Interactive prompt engine for CLI wizards.
 * Provides a consistent interface for gathering user input
 * across all wizard types.
 */

import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * Asks a single question and returns the answer.
 */
export function ask(question: string, defaultValue?: string): Promise<string> {
  const prompt = defaultValue ? `${question} [${defaultValue}]: ` : `${question}: `;
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer.trim() || defaultValue || '');
    });
  });
}

/**
 * Asks a yes/no question.
 */
export async function confirm(question: string, defaultYes: boolean = true): Promise<boolean> {
  const hint = defaultYes ? '(Y/n)' : '(y/N)';
  const answer = await ask(`${question} ${hint}`);
  if (!answer) return defaultYes;
  return answer.toLowerCase().startsWith('y');
}

/**
 * Presents a numbered list and lets the user select one.
 */
export async function select(question: string, options: string[]): Promise<string> {
  console.log(`\n  ${question}`);
  options.forEach((opt, i) => console.log(`    ${i + 1}. ${opt}`));
  const answer = await ask('  Select number');
  const index = parseInt(answer, 10) - 1;
  if (index >= 0 && index < options.length) {
    return options[index];
  }
  return options[0];
}

/**
 * Presents a numbered list and lets the user select multiple (comma-separated).
 */
export async function multiSelect(question: string, options: string[]): Promise<string[]> {
  console.log(`\n  ${question}`);
  options.forEach((opt, i) => console.log(`    ${i + 1}. ${opt}`));
  console.log(`    0. None`);
  const answer = await ask('  Select numbers (comma-separated)');
  if (!answer || answer === '0') return [];

  return answer
    .split(',')
    .map((s) => parseInt(s.trim(), 10) - 1)
    .filter((i) => i >= 0 && i < options.length)
    .map((i) => options[i]);
}

/**
 * Asks for multi-line input (blank line to finish).
 */
export async function multiLine(question: string): Promise<string> {
  console.log(`\n  ${question} (blank line to finish):`);
  const lines: string[] = [];
  return new Promise((resolve) => {
    const handler = (line: string) => {
      if (line === '') {
        rl.removeListener('line', handler);
        resolve(lines.join('\n'));
      } else {
        lines.push(line);
      }
    };
    rl.on('line', handler);
  });
}

/**
 * Asks for a comma-separated list.
 */
export async function askList(question: string, defaultValue?: string[]): Promise<string[]> {
  const def = defaultValue?.join(', ');
  const answer = await ask(question + ' (comma-separated)', def);
  if (!answer) return defaultValue || [];
  return answer.split(',').map((s) => s.trim()).filter(Boolean);
}

/**
 * Closes the readline interface.
 */
export function closePrompt(): void {
  rl.close();
}
