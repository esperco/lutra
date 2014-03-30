/*
  Local time handling and formatting.
*/

var date = (function() {
  var mod = [];
  mod.us = {};

  mod.copy = function(d) {
    return new Date(d.getTime());
  };

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
  };

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

  /*
    Add 8 hours if the timezone offset is -08:00.
    (spend as little time as possible in momentjs whose interface
    is atrocious)
  */
  mod.utcOfLocal = function(tz, jsDate) {
    var m = moment(jsDate);
    m.tz(tz);
    var offsetMinutes = m.zone();
    m.add("minutes", offsetMinutes);

    /* Check if we passed a daylight-savings transition
       and use the new offset instead.
       Don't know how to do better given the lack of documentation
       and examples.
    */
    var updatedOffset = m.zone();
    if (updatedOffset !== offsetMinutes) {
      log("Correcting offset after daylight savings transition: "
          + offsetMinutes + " min -> "
          + updatedOffset + " min");
      m.add("minutes", updatedOffset - offsetMinutes);
    }

    return m.toDate();
  };

  /*
    Subtract 8 hours if the timezone offset is -08:00.
  */
  mod.localOfUtc = function(tz, jsDate) {
    var m = moment(jsDate);
    m.tz(tz);
    var offsetMinutes = m.zone();
    m.add("minutes", -offsetMinutes);

    return m.toDate();
  };

  function testDates() {
    var d = date.ofString("2014-09-23T19:38:51.683Z");
    log(date.dateOnly(d));
    test.assert(date.dateOnly(d) === 'September 23, 2014');
    test.assert(date.timeOnly(d) === '7:38 pm');
    return true;
  }

  function testOfLocal(dateString, tz, offset) {
    return function() {
      var d1 = mod.ofString(dateString);
      var h1 = d1.getUTCHours();
      var d2 = mod.utcOfLocal(tz, d1);
      var h2 = d2.getUTCHours();
      return test.assert(h2 === h1 - offset);
    }
  }

  function testToLocal(dateString, tz, offset)  {
    return function() {
      var d1 = mod.ofString(dateString);
      var h1 = d1.getUTCHours();
      var d2 = mod.localOfUtc(tz, d1);
      var h2 = d2.getUTCHours();
      return test.assert(h2 === h1 + offset);
    }
  }

  mod.tests = [
    ["dates", testDates],

    ["testOfLocal - Arizona",
     testOfLocal("2014-09-23T12:34:56.789Z", "America/Phoenix", -7)],
    ["testToLocal - Arizona",
     testToLocal("2014-09-23T12:34:56.789Z", "America/Phoenix", -7)],

    ["testOfLocal - California Summer",
     testOfLocal("2014-07-01T12:34:56.789Z", "America/Los_Angeles", -7)],
    ["testToLocal - California Summer",
     testToLocal("2014-07-01T12:34:56.789Z", "America/Los_Angeles", -7)],

    ["testOfLocal - California Winter",
     testOfLocal("2014-01-01T12:34:56.789Z", "America/Los_Angeles", -8)],
    ["testToLocal - California Winter",
     testToLocal("2014-01-01T12:34:56.789Z", "America/Los_Angeles", -8)],

    /*
      Test around transition adding one hour to local time
     */
    ["testOfLocal - just before forward leap",
     testOfLocal("2014-03-09T01:30:00Z", "America/Los_Angeles", -8)],
    ["testToLocal - just before forward leap",
     testToLocal("2014-03-08T17:30:00Z", "America/Los_Angeles", -8)],
    /* 02:30 local does not exist; don't care about it */
    ["testOfLocal - just after forward leap",
     testOfLocal("2014-03-09T03:30:00Z", "America/Los_Angeles", -7)],
    ["testToLocal - just after forward leap",
     testToLocal("2014-03-09T10:30:00Z", "America/Los_Angeles", -7)],

    /*
      Test around transition subtracting one hour from local time
     */
    ["testOfLocal - just before backward leap",
     testOfLocal("2014-11-02T00:30:00Z", "America/Los_Angeles", -7)],
    ["testToLocal - just before backward leap",
     testToLocal("2014-11-01T17:30:00Z", "America/Los_Angeles", -7)],
    /* 01:30 local exists twice; don't care about it */
    ["testOfLocal - just after backward leap",
     testOfLocal("2014-11-02T02:30:00Z", "America/Los_Angeles", -8)],
    ["testToLocal - just after backward leap",
     testToLocal("2014-11-02T10:30:00Z", "America/Los_Angeles", -8)]
  ];

  return mod;
}());
