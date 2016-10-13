/*
  Misc time stats config
*/

module Esper.Config {
  export const STRIPE_KEY_DEV = 'pk_test_tDzGbpaybyFQ3A7XGF6ctE3f';
  export const STRIPE_KEY_PROD = 'pk_live_ntMF09YuECJYPD6A9c4sfdHG';

  /* Config for period selectors */

  export const MIN_DATE = moment()
    .subtract(2, 'quarter')
    .startOf('quarter')
    .toDate();
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
