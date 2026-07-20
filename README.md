# Astronomy Shop — synthetic monitoring proof of concept

Prepared for the Astronomy Corporation engineering team.

Your team already has strong visibility into the platform: Grafana, metrics, logs, and traces
across every service. The gap isn't observability, it's perspective. In the last few incidents,
customers noticed a problem before your own alerting did, because nothing in the current stack
experiences the app the way a customer does — from outside, over the network, clicking through
the actual purchase flow.

This repo is that missing layer: two Checkly checks, chosen for your specific failure history,
defined entirely as code so your team can read, extend, and own them the same way you own
application code. Everything below is written so an engineer who has never seen this repo can
get it running, understand why it's shaped this way, and extend it without us in the room.

## What's monitored, and why

**1. Browser check — the purchase journey** ([storefront-purchase.spec.ts](__checks__/storefront-purchase.spec.ts), every 5 minutes)

Home page -> product page -> add to cart -> place order -> order confirmation. This is your
revenue path. In the incidents you described, infrastructure dashboards stayed green while
customers could not complete an action. A journey check fails the moment a real customer would
fail, regardless of which backend service caused it. We verified this against your exact incident
class: with the `paymentFailure` flag at 100%, every container kept reporting healthy, and this
check failed at the confirmation step. That gap between "infra healthy" and "customer blocked" is
what this check closes.

**2. API check — product catalog** ([checks.check.ts](__checks__/checks.check.ts), every minute)

`GET /api/products/OLJCESPC7Z` with assertions on status, product name, and a non-zero price
(not just a 200). Two reasons for pinning this product: it's a real catalog item your customers
hit from the homepage, and it's the product your `productCatalogFailure` flag is scoped to break,
so this one check also covers single-SKU failures a whole-site ping would never catch. Degrades
at 1s, fails at 5s — a slow catalog is customer-visible long before it's an outage.

**Deliberately not built:** a check per service, uptime pings on every endpoint, alert-channel
sprawl. Two checks that map to your stated pain beat twenty that map to the service list. Your
Grafana/OTel stack stays exactly where it is — this detects from the outside, your traces still
explain from the inside.

## Retry policy

One retry after 30 seconds, same region, before a check counts as failed. This is deliberate:
alerting on the first blip trains a team to ignore alerts, which is close to how the last few
incidents reached your customers before your own tooling. This kills single-blip false alarms
without meaningfully delaying detection of a real outage.

## Test data

Checkout is pre-filled with test data (example.com email, a test card), so the journey check
places real orders through your real checkout, payment, and shipping services without touching
anything sensitive. Before this runs against production, we'd tag synthetic traffic the same way
your own load generator already does, with an OTel Baggage attribute, so synthetic orders are
excluded from business metrics and don't skew your dashboards.

## Getting this running on your side

```bash
# 1. Start the target app
cd opentelemetry-demo
docker compose --env-file .env --env-file .env.override \
  -f compose.yaml -f compose.observability.yaml -f compose.extras.yaml up -d

# 2. Run the journey check locally before touching Checkly at all
npm install
npx playwright test __checks__/storefront-purchase.spec.ts

# 3. Stand up a Private Location so Checkly can reach the app on your
#    internal network, the same way it would reach your real staging
#    or production environment. Create the location in Checkly (slug:
#    astronomy-shop-local), then join the agent to the app's own
#    Docker network — it reaches the storefront by service name
#    (http://frontend-proxy:8080), nothing exposed outward.
docker run -d --name checkly-agent --restart unless-stopped \
  --network opentelemetry-demo \
  -e API_KEY="pl_..." checkly/agent:latest

# 4. Ship it
npx checkly login
npx checkly deploy
```

## Reproducing the incident class this was built for

```bash
# Flip paymentFailure to 100% in opentelemetry-demo/src/flagd/demo.flagd.json,
# or live via http://localhost:8080/feature. Every container stays healthy.
# The journey check fails at order confirmation — the same gap your team
# described. Flip it back to "off" and the check recovers immediately.
```

## Extending this

The pattern here generalizes past these two checks. If your team wants to add coverage:

- New user journey -> a new Playwright spec + a `BrowserCheck` construct in `__checks__/`.
- New backend dependency -> an `ApiCheck` construct with assertions on the fields that actually
  matter, not just the status code.
- Everything ships the same way: `checkly test` to dry-run against the private location,
  `checkly deploy` to make it live. No UI clicking, no drift between what's live and what's in
  the repo. Review monitoring changes the same way you review application code, in a pull
  request, before they ship.
