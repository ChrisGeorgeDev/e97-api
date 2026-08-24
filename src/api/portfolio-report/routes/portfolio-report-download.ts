/**
 * portfolio-report-download router
 */

export default {
  routes: [
    {
      method: 'GET',
      path: '/portfolio-reports/:id/download',
      handler: 'portfolio-report.download',
      config: {
        policies: [
          {
            name: 'global::is-account-scoped-detail',
            config: { uid: 'api::portfolio-report.portfolio-report' },
          },
        ],
      },
    },
  ],
};
