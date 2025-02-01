import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const coverageSummary = JSON.parse(
  readFileSync(join(__dirname, '../coverage/coverage-summary.json'), 'utf8')
);

const threshold = 80;
const coverage = coverageSummary.total.statements.pct;

if (coverage < threshold) {
  console.error(
    `Test coverage (${coverage}%) is below threshold (${threshold}%)`
  );
  process.exit(1);
}
