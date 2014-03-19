/*
  Local time handling and formatting.
*/

var date = (function() {
  var mod = [];
  mod.us = {};

  /* parse RFC 3339 date.
     For browser-compatibility reasons, a timezone specification
     must be provided (otherwise some interpret it as local time, some as UTC).

     Good: "2014-09-23T19:38:51.683Z"
     Bad:  "2014-09-23T19:38:51.683"
  */
  mod.ofString = function(s) {
    if (util.isNumber(s) || util.isNonEmptyString(s))
      return new Date(s);
    else
      return null;
  };

  /* print RFC 3339 date, millisecond precision */
  mod.toString = function(d) {
    return d.toISOString();
  };

  mod.now = function() {
    return Date.now();
  };

  mod.year = function(d) {
    return d.getUTCFullYear();
  };

  /* 1-12 */
  mod.month = function(d) {
    return d.getUTCMonth() + 1;
  };

  /* 1-31 */
  mod.day = function(d) {
    return d.getUTCDate();
  };

  /* 0-23 */
  mod.hours = function(d) {
    return d.getUTCHours();
  };

  /* 0-59 */
  mod.minutes = function(d) {
    return d.getUTCMinutes();
  };

  /* 0-59 */
  mod.seconds = function(d) {
    return d.getUTCSeconds();
  };

  function pad(s) {
    if (s.length >= 2)
      return s;
    else
      return "0" + s;
  }

  var weekDays =
    ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

  /* "Monday", "Tuesday", ... */
  mod.weekDay = function(d) {
    return weekDays[d.getUTCDay()];
  };

  var months =
    ["January", "February", "March", "April", "May", "June",
     "July", "August", "September", "October", "November", "December"];

  /* "January", "February", ... */
  mod.month = function(d) {
    return months[d.getUTCMonth()];
  };

  /* "August 13" */
  mod.dateOnlyWithoutYear = function(d) {
    return mod.month(d)
      + " " + mod.day(d).toString();
  };

  /* "August 13, 2019" */
  mod.dateOnly = function(d) {
    return mod.month(d)
      + " " + mod.day(d).toString()
      + ", " + mod.year(d).toString();
  };

  /* "1:30 pm" */
  function formatTimeOnly(hour, min) {
    var ampm;
    var h;
    if (hour < 12) {
      h = 0 < hour ? hour : 12;
      ampm = "am";
    } else {
      h = 12 < hour ? hour - 12 : 12;
      ampm = "pm";
    }
    return h.toString() + ":" + pad(min.toString()) + " " + ampm;
  }

  mod.timeOnly = function(d) {
    return formatTimeOnly(mod.hours(d), mod.minutes(d));
  };

  mod.utcToLocalTimeOnly = function(d) {
    return formatTimeOnly(d.getHours(), d.getMinutes());
  }

  /* "Wednesday August 13, 2019 from 12:30pm to 1:30 pm" */
  mod.range = function(d1, d2) {
    return mod.weekDay(d1) +" "+ mod.dateOnly(d1) +
      " from "+ mod.timeOnly(d1) +" to "+ mod.timeOnly(d2);
  };

  /* "Wednesday August 13, 2019 at 12:30pm" */
  mod.justStartTime = function(d1) {
    return mod.weekDay(d1) +" "+ mod.dateOnly(d1) +
      " at "+ mod.timeOnly(d1);
  };

  jQuery.timeago.settings.allowFuture = true;
  /* create a DOM element from a date,
     displaying how long ago it was. */
  mod.viewTimeAgo = function(d) {
    var view = $("<time class='timeago'/>")
      .attr("datetime", mod.toString(d));
    view.timeago();
    return view;
  };

  function testDates() {
    var d = date.ofString("2014-09-23T19:38:51.683Z");
    log(date.dateOnly(d));
    test.assert(date.dateOnly(d) === 'September 23, 2014');
    test.assert(date.timeOnly(d) === '7:38 pm');
    return true;
  }

  mod.tests = [
    ["dates", testDates]
  ];

  return mod;
}());
