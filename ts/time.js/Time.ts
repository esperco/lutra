/*
  Helpers for modifying time
*/
module Esper.Time {

  type MomentOrDate = Date|moment.Moment;

  export function diffDay(d1: MomentOrDate, d2: MomentOrDate) {
    var m1 = moment(d1).clone().startOf('day');
    var m2 = moment(d2).clone().startOf('day');
    return m1.diff(m2, 'day');
  }

  export function sameDay(d1: MomentOrDate, d2: MomentOrDate) {
    return diffDay(d1, d2) === 0;
  }
}
