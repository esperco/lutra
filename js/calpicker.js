/*
  Date-time-duration picker using calendar containing read-only events
  retrieved from the user's calendar.

  Input:
  - timezone
  - setTextEventDate(start, end): called by the calendar when the date changes

  Output:
  - calendarView
  - setCalEventDate(start, end): called from outside to update the calendar view


  Implementation notes:

  Several input widgets are tied to a pair of dates. This pair of dates
  is an observable value of type ref (see ref.js). Each input widget
  does the following:
  - reacts to user actions (clicks and such) by calling r.set()
  - reacts to changes in r by initially registering a handler using r.watch()

  We have 3 kinds of inputs:
  - time only (start and end picked independently)
  - date only (start)
  - date-time (start + end) picked from full calendar
*/

var calpicker = (function() {
  var mod = {};
  /* Duration in seconds between two Dates */
  function getDuration(start, end) {
    return (end.getTime() - start.getTime()) / 1000;
  }

  /* Check if the start and end dates are complete and valid */
  function datesAreValid(dates) {
    if (util.isNotNull(dates.start) && util.isNotNull(dates.end)) {
      var start = dates.start;
      var end = dates.end;
      var duration = getDuration(start, end);
      return duration > 0;
    }
    else
      return false;
  }

  /* Export dates for outside use */
  function getDates(picker) {
    var r = picker.datesRef;
    var dates = r.getValidOrNothing();
    if (util.isNotNull(dates)) {
      var start = dates.start;
      var end = dates.end;
      return {
        start: start,
        end: end,
        duration: getDuration(start, end)
      };
    }
    else
      return null;
  }

  /*
    Create a ref (r) holding start and end date-time expressed in calendar time
    (local time relative to the calendar's timezone).
  */
  function createRef(localStart, localEnd) {

    var initDates = {
      start: localStart,
      end: localEnd
    };

    var r = ref.create(datesAreValid, initDates);
    return r;
  }

  function createView(datesRef, tz) {
'''
<div #view>
  <div class="location-title">Date</div>
  <div #datePicker/>
  <div #textView
       class="row hide">
    <div class="col-sm-3">
      <div class="location-title">Start</div>
      <input #startInput type="text" class="time form-control"/>
    </div>
    <div class="col-sm-3 clearfix">
      <div class="location-title">End</div>
      <input #endInput type="text" class="time form-control"/>
    </div>
    <div class="col-sm-6"/>
  </div>
  <div #timezoneView/>
  <div #calendarView/>
</div>
'''
    timezoneView.text("Time Zone: " + timezone.format(tz));

    _view.focus = startInput.focus;
    _view.datesRef = datesRef;
    _view.timezone = tz;

    /*
      Later _view will also contain the following fields:
      - eventId
      - eventStart
      - eventEnd
     */
    return _view;
  }

  /***** Time pickers (start/end time of day) *****/

  var timeWatcherId = "timeWatcher";

  function setupTimePicker(picker,
                           fieldName, /* either "start" or "end" */
                           timePicker) {
    var r = picker.datesRef;
    timePicker.timepicker({
      timeFormat: "g:i a",
        /* PHP date() format http://php.net/manual/en/function.date.php */
      step: 5
        /* granularity in minutes */
    });
    timePicker.on("changeTime", function() {
      var oldDates = r.get();
      var oldDate = oldDates[fieldName];
      if (util.isNotNull(oldDate)) {
        var dates = util.copyObject(oldDates);
        var d = timePicker.timepicker("getTime"); /* native js Date */
        log("timepicker's date: ", d);
        var local = date.copy(oldDates[fieldName]);
        local.setUTCHours(d.getHours());
        local.setUTCMinutes(d.getMinutes());
        dates[fieldName] = local;
        r.set(dates, [timeWatcherId]);
      }
    });
    r.watch(function(dates, isValid) {
      if (isValid) {
        var local = dates[fieldName];
        var d = date.copy(local);
        d.setHours(local.getUTCHours());
        d.setMinutes(local.getUTCMinutes());
        if (util.isDefined(date)) {
          timePicker.timepicker('setTime', d);
        }
      }
    }, timeWatcherId);
  }

  function setupTimePickers(picker) {
    setupTimePicker(picker, "start", picker.startInput);
    setupTimePicker(picker, "end", picker.endInput);

    /* Make time pickers visible once dates have been set */
    picker.datesRef.watch(function(dates, isValid) {
      if (isValid)
        picker.textView.removeClass("hide");
      else if (! util.isDefined(dates.start) && !util.isDefined(dates.end))
        picker.textView.addClass("hide");
    }, timeWatcherId);
  }

  /***** Date picker (start date, independent from time of day) *****/

  var dateWatcherId = "dateWatcher";

  function setDate(ymd, d) {
    return dateYmd.utc.toDate(ymd,
                              d.getUTCHours(),
                              d.getUTCMinutes(),
                              d.getUTCSeconds());
  }

  function createDatePicker(picker) {
    var r = picker.datesRef;
    picker.datePicker.datepicker({
      gotoCurrent: true,
      numberOfMonths: 4,
      onSelect: function(selectedDate) {
        var ymd = dateYmd.ofString(selectedDate);
        var oldDates = r.getValidOrNothing();
        var dates;
        if (oldDates !== null) {
          dates = {
            start: setDate(ymd, oldDates.start),
            end: setDate(ymd, oldDates.end)
          };
        }
        else {
          /* default to 9:00-10:00 */
          var start = dateYmd.utc.toDate(ymd, 9, 0, 0);
          var end = dateYmd.utc.toDate(ymd, 10, 0, 0);
          dates = {
            start: start,
            end: end
          };
        }
        r.set(dates, [dateWatcherId]);
      }
    });
  }

  function datePickerDateOfDates(dates) {
    var ymd = dateYmd.utc.ofDate(dates.start);
    var pickerDate = dateYmd.local.toDate(ymd);
    return pickerDate;
  }

  function setupDatePicker(picker) {
    var r = picker.datesRef;
    r.watch(function(dates, isValid) {
      if (isValid) {
        var pickerDate = datePickerDateOfDates(dates);
        picker.datePicker.datepicker("setDate", pickerDate);
      }
    }, dateWatcherId);
    createDatePicker(picker);
  }

  /***** Calendar picker (start/end date-time) *****/

  var calendarWatcherId = "calendarWatcher";

  /* Remove event from the calendar view but preserve start/end fields */
  function removeCalendarEvent(picker) {
    var id = picker.eventId;
    if (util.isDefined(id)) {
      picker.calendarView.fullCalendar('removeEvents', function(calEvent) {
        return calEvent.id === id;
      });
      delete picker.eventId;
    }
  }

  /* Get rid of any previously selected date and time,
     propagate to other date/time pickers */
  function removeEvent(picker) {
    removeCalendarEvent(picker);
    picker.datesRef.set({}, [calendarWatcherId]);
  }

  function createPickedCalendarEvent(picker, startMoment, endMoment) {
    var eventId = util.randomString();
    picker.eventId = eventId;
    var eventData = {
      id: eventId,
      title: "",
      start: startMoment,
      end: endMoment,
      color: "#A25CC6",
      editable: true
    };
    var stick = true;
    picker.calendarView.fullCalendar('renderEvent', eventData, stick);
    picker.calendarView.fullCalendar('unselect');
    picker.calendarView.fullCalendar('gotoDate', startMoment);
  }

  /*
    Ignores the 'Z' suffix and assumes time expressed in the calendar's
    timezone.
  */
  function parseDateUsingCalendarTimezone(picker, dateString) {
    return picker.calendarView.fullCalendar("moment", dateString);
  }

  /*
    Takes a javascript Date representing a local time and converts
    it into moment (type used by the calendar) using the calendar's timezone.

    (just slightly contrived)
   */
  function momentOfDate(picker, d) {
    var s = date.toString(d);
    return parseDateUsingCalendarTimezone(picker, s);
  }

  /*
    Convert a Fullcalendar date (Moment library) into a javascript Date
  */
  function dateOfMoment(m) {
    return m.toDate();
  }

  function datesOfMoments(startMoment, endMoment) {
    return {
      start: dateOfMoment(startMoment),
      end: dateOfMoment(endMoment)
    };
  }

  function createPickedEvent(picker, dates) {
    var startMoment = momentOfDate(picker, dates.start);
    var endMoment = momentOfDate(picker, dates.end);
    createPickedCalendarEvent(picker, startMoment, endMoment);
  }

  /*
    Clear previous selection if any,
    create new calendar event and populate input boxes
  */
  function initEvent(picker, start, end) {
    removeCalendarEvent(picker);
    updateTextView(picker);
  }

  function makeTaskUrl(tid) {
    return "#!task/" + tid;
  }

  /*
    Translate calendar events as returned by the API into
    the format supported by Fullcalendar.

    Input event type: calendar_event defined in api.atd
    Output event type:
      http://arshaw.com/fullcalendar/docs2/event_data/Event_Object/
  */
  function importEvents(esperCalendar) {
    return list.map(esperCalendar.events, function(x) {
      var url;
      if (util.isString(x.esper_tid))
        url = makeTaskUrl(x.esper_tid);
      var ev = {
        title: x.title, /* required */
        allDay: x.all_day,
        start: x.start.local, /* required */
        end: x.end.local, /* required */
        url: url,
        orig: x /* custom field */
      };
      return ev;
    })
  }

  function fetchEvents(start, end, tz, callback) {
    var async = api.postCalendar(login.leader(), {
      timezone: tz,
      window_start: start,
      window_end: end
    })
      .done(function (esperCalendar) {
        var events = importEvents(esperCalendar);
        callback(events);
      });
    spinner.spin("Loading calendar...", async);
  }

  function setupCalendar(picker, tz, defaultDate) {
    var r = picker.datesRef;
    var calendarView = picker.calendarView;

    function setEventMoments(startMoment, endMoment) {
      removeCalendarEvent(picker);
      createPickedCalendarEvent(picker, startMoment, endMoment);
      picker.datesRef.set(datesOfMoments(startMoment, endMoment),
                          [calendarWatcherId]);
    }

    function setEvent(dates) {
      setEventMoments(momentOfDate(picker, dates.start),
                      momentOfDate(picker, dates.end));
    }

    function select(startMoment, endMoment) {
      setEventMoments(startMoment, endMoment);
    }

    function eventClick(calEvent, jsEvent, view) {
      removeEvent(picker);
    }

    function updateEvent(calEvent) {
      setEventMoments(calEvent.start, calEvent.end);
    }

    function eventDrop(calEvent, revertFunc, jsEvent, ui, view) {
      updateEvent(calEvent);
    }

    function eventResize(calEvent, jsEvent, ui, view) {
      updateEvent(calEvent);
    }

    r.watch(function(dates, isValid) {
      if (isValid)
        setEvent(dates);
      else
        removeEvent(picker);
    }, calendarWatcherId);

    calendarView.fullCalendar({
      header: {
        left: 'prev,next today',
        center: 'title',
        right: 'month,agendaWeek,agendaDay'
      },
      defaultDate: defaultDate,
      defaultView: 'agendaWeek',
      timezone: tz,
      selectable: true,
      selectHelper: true,
      select: select,
      eventClick: eventClick,
      eventDrop: eventDrop,
      eventResize: eventResize,
      editable: false,
      events: fetchEvents
    });
  }

  /*
    Create date and time picker using user's calendar.

    Parameters:
    - timezone: IANA timezone in which all local times are expressed
    - defaultDate:
        date that determines which calendar page to display initially
        (default: today)
   */
  mod.create = function(param) {
    var tz = param.timezone;
    var defaultDate = param.defaultDate;

    var r = createRef();
    var picker = createView(r, tz);

    setupTimePickers(picker);
    setupDatePicker(picker);
    setupCalendar(picker, tz, defaultDate);

    function render() {
      picker.calendarView.fullCalendar("render");
    }

    return {
      view: picker.view,
      render: render, // to be called after attaching the view to the dom tree

      /*
        getDates and setDates take/return native js dates as a record of type:
        { start: Date, end: Date }
        getDates also returns a 'duration' field (seconds).
      */
      getDates: (function() { return getDates(picker); }),
      setDates: (function(x) { picker.datesRef.set(x); }),
      clearDates: (function() { picker.datesRef.set({}); })
    };
  };

  return mod;
})();
