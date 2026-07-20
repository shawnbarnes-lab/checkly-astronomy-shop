import { defineConfig } from 'checkly'
import { RetryStrategyBuilder } from 'checkly/constructs'

/**
 * Astronomy Shop — synthetic monitoring MVP
 *
 * Scenario: the prospect has metrics/logs/traces (Grafana + OTel) but no
 * synthetic monitoring. Customers found the last incidents before internal
 * alerting did. These checks close that exact gap: they exercise the same
 * paths a customer does, from outside, on a schedule.
 */
export default defineConfig({
  projectName: 'Astronomy Shop Synthetics',
  logicalId: 'astronomy-shop-synthetics',
  checks: {
    // Every check inherits these unless it overrides them.
    activated: true,
    muted: false,
    frequency: 5, // minutes; checkout is revenue-critical, catch breaks fast
    checkMatch: '**/__checks__/**/*.check.ts',
    browserChecks: {
      // Specs are wired explicitly via BrowserCheck constructs in
      // __checks__/checks.check.ts (so each check controls its own frequency
      // and private location). This pattern intentionally matches nothing.
      testMatch: '**/__checks__/**/*.auto.spec.ts',
    },
    // Retry once after 30s before alerting: kills flaky-network false alarms
    // without meaningfully delaying detection of a real outage.
    retryStrategy: RetryStrategyBuilder.fixedStrategy({
      baseBackoffSeconds: 30,
      maxRetries: 1,
      sameRegion: true,
    }),
  },
  cli: {
    // `checkly test` runs ad hoc from here before anything is deployed.
    runLocation: 'us-east-1',
  },
})
