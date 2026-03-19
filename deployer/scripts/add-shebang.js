/**
 * Prepends #!/usr/bin/env node shebang to dist/bin/speckit.js if not already present.
 * Run after TypeScript compilation to ensure the CLI is executable.
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const targetFile = resolve(__dirname, '..', 'dist', 'bin', 'speckit.js');

const shebang = '#!/usr/bin/env node\n';

try {
  const content = readFileSync(targetFile, 'utf-8');
  if (!content.startsWith('#!')) {
    writeFileSync(targetFile, shebang + content);
    console.log('Added shebang to dist/bin/speckit.js');
  } else {
    console.log('Shebang already present in dist/bin/speckit.js');
  }
} catch (err) {
  console.error('Failed to add shebang:', err.message);
  process.exit(1);
}
