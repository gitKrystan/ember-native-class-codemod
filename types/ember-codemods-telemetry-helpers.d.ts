declare module 'ember-codemods-telemetry-helpers' {
  export function getTelemetryFor(filePath: string): unknown;
  export function setTelemetry(telemetry: unknown): void;
}
