import * as path from 'path'
import { ApiCheck, AssertionBuilder, BrowserCheck, Frequency } from 'checkly/constructs'

/**
 * Three checks, chosen against the prospect's stated pain: customers found
 * the last incidents before internal alerting did.
 *
 * 1. Browser check on the purchase journey: the outside-in view. If a
 *    customer can't buy, this fails, regardless of which backend service is
 *    the cause and regardless of what infra dashboards say.
 *
 * 2. Browser check on homepage image render time: catches a failure class
 *    their APM structurally cannot see. The demo's imageSlowLoad flag
 *    injects latency at the edge (Envoy fault injection on the image fetch),
 *    not inside an instrumented service, so no backend span ever represents
 *    it. Every container stays healthy; a customer just watches nothing
 *    load. Only an outside-in timer catches this.
 *
 * 3. API check on the product-catalog endpoint: the fast, cheap tripwire.
 *    Runs every minute, catches catalog outages and latency degradation
 *    before enough browser-check cycles have elapsed to page anyone.
 *
 * All three run from a Private Location: the `checkly/agent` container
 * joined to the app's own Docker network, exactly how a prospect would
 * monitor services behind their firewall. The agent reaches the storefront
 * by its service name (frontend-proxy), no ports exposed to the outside.
 */

const PRIVATE_LOCATION_SLUG = 'astronomy-shop-local'
const APP_URL = 'http://frontend-proxy:8080'

new BrowserCheck('storefront-purchase-journey', {
  name: 'Storefront purchase journey',
  tags: ['astronomy-shop'],
  frequency: Frequency.EVERY_5M,
  privateLocations: [PRIVATE_LOCATION_SLUG],
  environmentVariables: [{ key: 'ENVIRONMENT_URL', value: APP_URL }],
  code: {
    entrypoint: path.join(__dirname, 'storefront-purchase.spec.ts'),
  },
})

new BrowserCheck('homepage-render-performance', {
  name: 'Homepage image render budget',
  tags: ['astronomy-shop'],
  frequency: Frequency.EVERY_5M,
  privateLocations: [PRIVATE_LOCATION_SLUG],
  environmentVariables: [{ key: 'ENVIRONMENT_URL', value: APP_URL }],
  code: {
    entrypoint: path.join(__dirname, 'homepage-render-performance.spec.ts'),
  },
})

new ApiCheck('product-catalog-explorascope', {
  name: 'Product catalog API: Explorascope',
  tags: ['astronomy-shop'],
  frequency: Frequency.EVERY_1M,
  privateLocations: [PRIVATE_LOCATION_SLUG],
  // A slow catalog is a customer-visible problem long before it is an outage:
  // degraded past 1s, hard-fail past 5s.
  degradedResponseTime: 1000,
  maxResponseTime: 5000,
  request: {
    method: 'GET',
    url: `${APP_URL}/api/products/OLJCESPC7Z?currencyCode=USD`,
    followRedirects: true,
    skipSSL: false,
    assertions: [
      AssertionBuilder.statusCode().equals(200),
      AssertionBuilder.jsonBody('$.name').notEmpty(),
      AssertionBuilder.jsonBody('$.priceUsd.units').greaterThan(0),
    ],
  },
})
