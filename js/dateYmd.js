/*
  A natural year/month/day type used for internal purposes.

    type ymd = {
      year: int,  // e.g. 2014
      month: int, // 1-12 (not 0-11 like Unix and Date())
      day: int    // 1-31
    }
*/

var dateYmd = (function() {
  var mod = {};

  function isLeapYear(x) {
    return x % 4 === 0 && (! x % 100 === 0 || x % 400 === 0);
  }

  function maxDaysInMonth(year, month) {
    if (month >= 8) {
      if (month % 2 === 0)
        return 31;
      else
        return 30;
    }
    else {
      if (month % 2 === 0) {
        if (month === 2) {
          if (isLeapYear(year))
            return 29;
          else
            return 28;
        }
        else
          return 30;
      }
      else
        return 31;
    }
  }

  mod.isValid = function(x) {
    var y = x.year;
    var m = x.month;
    var d = x.day;
    if (y < 2000 || y > 2100)
      return false;
    else if (m < 1 || m > 12)
      return false;
    else if (d > maxDaysInMonth(y, m))
      return false;
    else
      return true;
  };

  function pad2(n) {
    if (n < 10)
      return "0" + n;
    else
      return "" + n;
  }

  /* ISO date such as "2014-03-02" */
  mod.toString = function(x) {
    return "" + x.year + "-" + pad2(x.month) + "-" + pad2(x.day);
  };

  /*
    Assume ISO format if dashes are found.
    Assume month/day/year if slashes are found.
  */
  mod.ofString = function(s) {
    var x = {};
    var a = s.split("-");
    if (a.length === 3) {
      x.year = parseInt(a[0]);
      x.month = parseInt(a[1]);
      x.day = parseInt(a[2]);
    }
    else {
      a = s.split("/");
      if (a.length === 3) {
        x.month = parseInt(a[0]);
        x.day = parseInt(a[1]);
        x.year = parseInt(a[2]);
      }
    }
    if (mod.isValid(x))
      return x;
    else
      return null;
  };

  /* Assume the ymd date is in UTC */
  mod.utc = {};

  mod.utc.toDate = function(x, optHours, optMinutes, optSeconds) {
    var d = new Date(mod.toString(x));
    if (optHours > 0)
      d.setUTCHours(optHours);
    if (optMinutes > 0)
      d.setUTCMinutes(optMinutes);
    if (optSeconds > 0)
      d.setUTCSeconds(optSeconds);
    return d;
  };

  mod.utc.ofDate = function(d) {
    return {
      year: d.getUTCFullYear(),
      month: d.getUTCMonth() + 1,
      day: d.getUTCDate()
    };
  };

  mod.utc.today = function() {
    return mod.utc.ofDate(new Date());
  };

  /* Assume the ymd date is expressed in the local timezone */
  mod.local = {};

  mod.local.toDate = function(x, optHours, optMinutes, optSeconds) {
    var hours = util.option(optHours, 0);
    var minutes = util.option(optMinutes, 0);
    var seconds = util.option(optSeconds, 0);
    return new Date(x.year, x.month - 1, x.day,
                    hours, minutes, seconds);
  };

  mod.local.ofDate = function(d) {
    return {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate()
    }
  };

  mod.local.today = function() {
    return mod.local.ofDate(new Date());
  };

  mod.tests = [
    test.expect("not a leap year", mod.isLeapYear, 2001, false),
    test.expect("leap year", mod.isLeapYear, 2004, true),
    test.expect("not a leap year", mod.isLeapYear, 2100, false),
    test.expect("leap year", mod.isLeapYear, 2000, true),
    test.expect("valid date", mod.isValid,
                {year: 2014, month: 1, day: 31}, true),
    test.expect("valid date", mod.isValid,
                {year: 2014, month: 6, day: 31}, false),
    test.expect("valid date", mod.isValid,
                {year: 2014, month: 7, day: 31}, true),
    test.expect("valid date", mod.isValid,
                {year: 2014, month: 8, day: 31}, true),
    test.expect("valid date", mod.isValid,
                {year: 2014, month: 9, day: 30}, false),
    test.expect("valid date", mod.isValid,
                {year: 2016, month: 2, day: 29}, true),
    test.expect("invalid date", mod.isValid,
                {year: 2016, month: 2, day: 30}, false),
    test.expect("invalid date (year too small)", mod.isValid,
                {year: 1970, month: 1, day: 1}, false),
    test.expect("invalid date (year too large)", mod.isValid,
                {year: 20014, month: 3, day: 27}, false),
    test.expect("date to string", mod.toString,
                {year: 2014, month: 1, day: 01}, "2014-01-01"),
    test.expect("date to string", mod.toString,
                {year: 2015, month: 12, day: 31}, "2014-12-31")
  ];

  return mod;
})();
