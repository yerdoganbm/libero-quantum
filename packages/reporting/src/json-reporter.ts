/**
 * JSON Reporter
 */

import { RunResult } from '@libero/core';
import { writeJson, logger } from '@libero/core';
import * as path from 'path';

export class JsonReporter {
  generate(result: RunResult, outputDir: string): string {
    const filePath = path.join(outputDir, `${result.runId}.json`);
    writeJson(filePath, result);
    logger.info(`JSON report: ${filePath}`);
    return filePath;
  }
}
