import { Dashboard } from 'checkly/constructs'

/**
 * Status dashboard, defined as code like everything else in this project.
 * Shows only the checks tagged astronomy-shop, so the bakery checks in the
 * same account stay out of the prospect's view. Deployed by the same
 * `checkly deploy` that ships the checks; change it in a PR, not in the UI.
 */
new Dashboard('astronomy-shop-dashboard', {
  header: 'Astronomy Shop',
  description: 'Live status of the customer purchase path, checked from inside the shop network',
  tags: ['astronomy-shop'],
  customUrl: 'astronomy-shop-tensorspace',
  refreshRate: 60, // seconds; matches the fastest check cadence
  paginate: false,
  hideTags: false,
})
