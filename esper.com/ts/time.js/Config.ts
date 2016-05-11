/*
  Misc time stats config
*/

module Esper.Config {

  /* Config for period selectors */

  /*
    0 is current period. Min and max determine how far forward and back we
    can go back or advance in relative time
  */
  export const MAX_QUARTER_INCR = 1;
  export const MIN_QUARTER_INCR = -1;

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
