/**
 * investment lifecycles
 *
 * Guards the one-row-per-project-per-account invariant: Investment is the join
 * table between shared Projects and Accounts, and a duplicate row would make
 * "my investments" queries return the same project twice.
 */

export default {
  async beforeCreate(event: any) {
    const { data } = event.params;
    if (!data.project || !data.account) return;

    const existing = await strapi.documents('api::investment.investment').findFirst({
      filters: { project: data.project, account: data.account },
    });

    if (existing) {
      throw new Error('An Investment already exists for this project and account.');
    }
  },
};
