# Chaos hour â€” execution state

Goal: one hour of staged incidents against the live deployed checks so the Checkly account
accumulates real, staggered failure history for the demo story. Public status dashboard captured
at each phase boundary; check-detail screenshots via Shawn's Edge after recovery.

Flag file: opentelemetry-demo/src/flagd/demo.flagd.json
productCatalogFailure needs its TARGETING armed ({"if":[{"==":[{"var":"product_id"},"OLJCESPC7Z"]},"on","off"]}),
not just defaultVariant.

## Schedule (phase -> action at its START)
- [x] T+0   phase1-catalog: arm productCatalogFailure targeting. Capture baseline-green first.
- [x] T+12  phase2-image: DONE. Catalog restored (pinned product 200 again), imageSlowLoad live at 5222ms verified locally. Captured status-01-after-catalog.
- [x] T+25  phase3-payment: DONE. imageSlowLoad off (render check passes in 1.3s again), paymentFailure 100% verified (journey fails at confirmation). Captured status-02-after-image.
- [x] T+38  phase4-greenchaos: DONE. Payment off, ads + recommendations broken, journey passed in 976ms anyway (correct silence proven on live schedule). Captured status-03-after-payment.
- [x] T+48  phase5-cart: DONE. Green-chaos ended, cartFailure 100% verified (journey fails). Captured status-04-during-greenchaos.
- [x] T+58  recovery: DONE. Every failure flag off (verified programmatically, incl. catalog targeting), journey green in 3.4s. Captured status-05-after-cart; status-06-recovered captured. ALL PHASES COMPLETE — hour executed exactly to plan, all three checks verified passing on schedule after recovery.

Capture command (from Desktop/checkly):
  CAPTURE_LABEL=<label> npx playwright test screenshots/chaos-hour/capture-status.spec.ts --reporter=list

After the hour: Edge captures of all three check-detail pages (red bands visible), home dashboard,
then the asset/story/deck workflow.
