/*
  Misc time stats config
*/

module Esper.Config {
  export const STRIPE_KEY = Esper.PRODUCTION ?
    'pk_live_ntMF09YuECJYPD6A9c4sfdHG' :
    'pk_test_tDzGbpaybyFQ3A7XGF6ctE3f';

  // Default plan should not apply to enterprise users -- this should only be
  // set if no existing plan
  export const DEFAULT_PLAN: ApiT.PlanId = "Basic_20161019";

  /* Config for period selectors */

  // Allow all dates (shutdown)
  export function getMinDate(planid: ApiT.PlanId): Date {
    // if (!planid) return moment()
    //   .subtract(2, 'month')
    //   .startOf('month')
    //   .toDate();
    switch (planid) {
      case "Basic_20161019":
        // return moment().subtract(2, 'month')
        //                .startOf('month')
        //                .toDate();
      case "Executive_20161019":
      case "Enterprise_20160923":
      case "Employee_20150304":
      default:
        return moment().subtract(5, 'year')
                       .startOf('month')
                       .toDate();
    }
  }
  export const MAX_DATE = moment()
    .add(1, 'quarter')
    .endOf('quarter')
    .toDate();

  // Config for disabling features for users subscribed to a limited plan
  export function disableAdvancedFeatures(planid: ApiT.PlanId): boolean {
    // return planid === "Basic_20161019"; // Enable all features (shutdown)
    return false;
  }
}
