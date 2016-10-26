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

  export function allowCSV(planid: ApiT.PlanId) {
    if (!planid || _.startsWith(planid, "Basic")) return false;
    return true;
  }

  export function getMinDate(planid: ApiT.PlanId): Date {
    if (!planid) return moment()
      .subtract(2, 'month')
      .startOf('month')
      .toDate();
    switch (planid) {
      case "Basic_20161019":
        return moment().subtract(2, 'month')
                       .startOf('month')
                       .toDate();
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
}
