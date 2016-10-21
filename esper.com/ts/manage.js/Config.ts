module Esper.Config {
  export const STRIPE_KEY = Esper.PRODUCTION ?
    'pk_live_ntMF09YuECJYPD6A9c4sfdHG' :
    'pk_test_tDzGbpaybyFQ3A7XGF6ctE3f' ;

  export function getCalendarLimit(planid: ApiT.PlanId) {
    if (!planid) return 0;
    switch (planid) {
      case "Basic_20161019":
        return 1;
      case "Executive_20161019":
      case "Enterprise_20160923":
      default:
        return Number.MAX_VALUE;
    }
  }
}
