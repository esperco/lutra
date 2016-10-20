/*
  Misc time stats config
*/

module Esper.Config {
  export const STRIPE_KEY = Esper.PRODUCTION ?
    'pk_live_ntMF09YuECJYPD6A9c4sfdHG' :
    'pk_test_tDzGbpaybyFQ3A7XGF6ctE3f';

  /* Config for period selectors */

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


  // Deprecated config options below

  /*
    0 is current period. Min and max determine how far forward and back we
    can go back or advance in relative time
  */
  export const MAX_QUARTER_INCR = 1;
  export const MIN_QUARTER_INCR = -2;

  // 9 months total convering previous quarter to next
  export const MAX_MONTH_INCR = moment()
    .endOf('quarter')
    .add(MAX_QUARTER_INCR, 'quarter')
    .diff(moment(), 'month');
  export const MIN_MONTH_INCR = moment()
    .startOf('quarter')
    .add(MIN_QUARTER_INCR, 'quarter')
    .diff(moment(), 'month');

  // Week => fixed incr (all weeks in a quarter is a lot)
  export const MAX_WEEK_INCR = 10;
  export const MIN_WEEK_INCR = -10;

  // Custom (how many days relative to tody)
  export const MAX_CUSTOM_INCR = moment()
    .endOf('quarter')
    .add(MAX_QUARTER_INCR, 'quarter')
    .diff(moment(), 'days');
  export const MIN_CUSTOM_INCR = moment()
    .startOf('quarter')
    .add(MIN_QUARTER_INCR, 'quarter')
    .diff(moment(), 'days');
}
