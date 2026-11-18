// Loaded before the app (`node --import ./src/instrumentation.ts ...`) so the
// instrumentation can patch express, pg, http and socket.io as they load.
//
// Split of responsibilities:
//   • Sentry        → error tracking only (no tracing; OpenTelemetry owns that).
//   • OpenTelemetry → traces and metrics, exported over OTLP.
// Each is off unless configured, so local development needs no setup.

import { register } from 'node:module';
import * as Sentry from '@sentry/node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV ?? 'development',
    // No tracesSampleRate on purpose: OpenTelemetry (below) owns tracing.
  });
}

if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
  // Lets the hooks patch ES modules too, not only CommonJS packages.
  register('import-in-the-middle/hook.mjs', import.meta.url);

  const sdk = new NodeSDK({
    serviceName: process.env.OTEL_SERVICE_NAME ?? 'watchparty-api',
    // Endpoint and auth headers come from OTEL_EXPORTER_OTLP_* env vars.
    traceExporter: new OTLPTraceExporter(),
    metricReaders: [new PeriodicExportingMetricReader({ exporter: new OTLPMetricExporter() })],
    instrumentations: [
      getNodeAutoInstrumentations({
        // One span per file read is noise.
        '@opentelemetry/instrumentation-fs': { enabled: false },
        // Health probes would only be noise.
        '@opentelemetry/instrumentation-http': {
          ignoreIncomingRequestHook: (req) => req.url?.startsWith('/health') ?? false,
        },
      }),
    ],
  });
  sdk.start();

  // Flush buffered spans on shutdown (server.ts handles the signals themselves).
  process.once('beforeExit', () => void sdk.shutdown());
}
