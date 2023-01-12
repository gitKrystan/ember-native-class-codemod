import path from 'path';
import { runTransformTest } from 'codemod-cli';
import { setTelemetry } from 'ember-codemods-telemetry-helpers';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// bootstrap the mock telemetry data
import walkSync from 'walk-sync';
import mockTelemetryData from './__testfixtures__/-mock-telemetry.json';

// This is nasty, cwd is screwed up here for some reason
let testFiles = walkSync('./transforms/ember-object/__testfixtures__', {
  globs: ['**/*.input.js'],
});
let mockTelemetry = {};

for (let testFile of testFiles) {
  let moduleName = testFile.replace(/\.input\.[^/.]+$/, '');
  let value = mockTelemetryData[moduleName] || {};

  mockTelemetry[path.resolve(__dirname, `./__testfixtures__/${moduleName}`)] = value;
}

setTelemetry(mockTelemetry);

runTransformTest({
  type: 'jscodeshift',
  name: 'ember-object',
});
