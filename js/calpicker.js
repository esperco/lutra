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
  <div #datePickerContainer class="hide">
    <input #datePickerStart
           type="text"
           class="form-control date-picker-field start"/>
    <input #startInput
           type="text"
           class="form-control time time-picker-field"/>
    <div class="time-to-text">to</div>
    <input #datePickerEnd
           type="text"
           class="form-control date-picker-field end"/>
    <input #endInput
           type="text"
           class="form-control time time-picker-field"/>
  </div>

  <div #calendarPickerContainer class="hide">
    <div #calendarSidebar
         class="cal-sidebar">
      <div #dateJumper
           class="date-jumper">
        DATE JUMPER
      </div>
      <div class="time-zone-label-section">
        <div class="time-zone-label">TIME ZONE:</div>
        <div #timezoneView/>
      </div>
    </div>
    <div class="modal-dialog cal-picker-modal">
      <div class="modal-content cal-picker-modal">
        <div #calendarView
             class="cal-picker-container"/>
      </div>
    </div>
  </div>
</div>
'''
    if (util.isDefined(tz))
      timezoneView.text(timezone.format(tz));

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

  /*** Shared utilities ***/

  var defaultMeetingLength = 60; /* minutes */

  function setDate(ymd, d) {
    return dateYmd.utc.toDate(ymd,
                              d.getUTCHours(),
                              d.getUTCMinutes(),
                              d.getUTCSeconds());
  }

  function defaultDates(ymd) {
    /* default to 9:00-10:00 */
    var start = dateYmd.utc.toDate(ymd, 9, 0, 0);
    var end = date.addMinutes(start, defaultMeetingLength);
    return {
      start: start,
      end: end
    };
  }

  /* Set default */
  function completeDates(optYmd, optDates, fieldName) {
    var ymd = optYmd;
    if (! util.isDefined(optYmd)) {
      ymd = dateYmd.local.today();
      if (util.isNotNull(optDates)) {
        var start = optDates.start;
        var end = optDates.end;
        var d = util.isNotNull(start) ? start
          : (util.isNotNull(end) ? end : new Date());
        ymd = dateYmd.utc.ofDate(d);
      }
    }
    var dates = {};
    if (util.isNotNull(optDates)) {
      var start = optDates.start;
      var end = optDates.end;
      if (util.isNotNull(start)) {
        dates.start = fieldName === "start" ? setDate(ymd, start) : start;
        if (util.isNotNull(end))
          dates.end = fieldName === "end" ? setDate(ymd, end) : end;
        else
          dates.end = date.addMinutes(dates.start, defaultMeetingLength);
      }
      else if (util.isNotNull(end)) {
        dates.end = fieldName === "end" ? setDate(ymd, end) : end;
        if (util.isNotNull(start))
          dates.start = fieldName === "start" ? setDate(ymd, start) : start;
        else
          dates.start = date.addMinutes(dates.end, -defaultMeetingLength);
      }
      else {
        dates = defaultDates(ymd);
      }
    }
    else {
      dates = defaultDates(ymd);
    };
    return dates;
  }

  /***** Time pickers (start/end time of day) *****/

  var timeWatcherId = "timeWatcher";
  var dateWatcherId = "dateWatcher";

  function setupTimePicker(picker,
                           fieldName, /* either "start" or "end" */
                           timePicker) {
    var watcherId = timeWatcherId + "-" + fieldName;
    var r = picker.datesRef;
    timePicker.timepicker({
      timeFormat: "g:i a",
        /* PHP date() format http://php.net/manual/en/function.date.php */
      step: 5
        /* granularity in minutes */
    });
    timePicker.on("changeTime", function() {
      var oldDates = r.get();
      var dates = {};
      var local = new Date();
      if (util.isNotNull(oldDates)) {
        dates = util.copyObject(oldDates);
        var oldDate = oldDates[fieldName];
        if (util.isNotNull(oldDate)) {
          local = date.copy(oldDates[fieldName]);
        }
      }
      var d = timePicker.timepicker("getTime"); /* native js Date */
      if (util.isNotNull(d)) {
        local.setUTCHours(d.getHours());
        local.setUTCMinutes(d.getMinutes());
        dates[fieldName] = local;
        if (
          fieldName === "start"
          && util.isNotNull(oldDates)
          && util.isNotNull(oldDates["start"])
          && util.isNotNull(oldDates["end"])
        ) {
          /* When start time is increased or decreased by some amount,
             apply the same amount to the end time */
          var oldSecs = oldDates["start"].getTime();
          var newSecs = local.getTime();
          var diffSecs = newSecs - oldSecs;
          var newEnd = oldDates["end"];
          newEnd.setTime(newEnd.getTime() + diffSecs);
          dates["end"] = newEnd;
          r.updateValidity();
        }
      }
      dates = completeDates(undefined, dates, undefined);
      r.set(dates, [watcherId, dateWatcherId + "-end"]);
    });
    r.watch(function(dates, isValid) {
      if (util.isNotNull(dates)) {
        var local = dates[fieldName];
        if (util.isNotNull(local)) {
          var d = date.copy(local);
          d.setHours(local.getUTCHours());
          d.setMinutes(local.getUTCMinutes());
          if (util.isDefined(d)) {
            timePicker.timepicker('setTime', d);
          }
        }
      }
    }, watcherId);
  }

  function setupTimePickers(picker) {
    setupTimePicker(picker, "start", picker.startInput);
    setupTimePicker(picker, "end", picker.endInput);
  }

  /***** Date picker (start date, independent from time of day) *****/

  function createDatePicker(picker, datePicker, fieldName) {
    var r = picker.datesRef;
    datePicker.datepicker({
      gotoCurrent: true,
      numberOfMonths: 1,
      onSelect: function(selectedDate) {
        var ymd = dateYmd.ofString(selectedDate);
        var oldDates = r.get();
        var dates = completeDates(ymd, oldDates, fieldName);
        r.set(dates, [dateWatcherId + "-" + fieldName]);
      }
    });
  }

  function startDateOfDates(dates) {
    var ymd = dateYmd.utc.ofDate(dates.start);
    var startDate = dateYmd.local.toDate(ymd);
    return startDate;
  }

  function endDateOfDates(dates) {
    var ymd = dateYmd.utc.ofDate(dates.end);
    var endDate = dateYmd.local.toDate(ymd);
    return endDate;
  }

  var dayMS = 86400000; // milliseconds per day

  // Fires when the END date is selected
  function startDateWatcher(picker, dates) {
    var r = picker.datesRef;
    var startDate = startDateOfDates(dates);
    var endDate = endDateOfDates(dates);
    picker.datePickerStart.datepicker("setDate", startDate);
    picker.datePickerEnd.datepicker("setDate", endDate);
    var startMS = dates.start.getTime();
    var endMS = dates.end.getTime();
    if (endMS <= startMS) {
      /* End date was moved before start date,
         so move start date back to new end date */
      dates.start.setUTCFullYear(dates.end.getUTCFullYear());
      dates.start.setUTCMonth(dates.end.getUTCMonth());
      dates.start.setUTCDate(dates.end.getUTCDate());
      startMS = dates.start.getTime();
      endMS = dates.end.getTime();
      var newStartDateUTC = dateYmd.utc.ofDate(dates.start);
      var newStartDate = dateYmd.local.toDate(newStartDateUTC);
      picker.datePickerStart.datepicker("setDate", newStartDate);
      if (endMS <= startMS) {
        /* If end time is STILL before start time (on same day),
           advance the end date by a day */
        dates.end.setTime(endMS + dayMS);
        var newEndDateUTC = dateYmd.utc.ofDate(dates.end);
        var newEndDate = dateYmd.local.toDate(newEndDateUTC);
        picker.datePickerEnd.datepicker("setDate", newEndDate);
      }
    }
    r.updateValidity();
  }

  // Fires when the START date is selected
  function endDateWatcher(picker, dates) {
    var r = picker.datesRef;
    var startDate = startDateOfDates(dates);
    picker.datePickerEnd.datepicker("setDate", startDate);
    // Copy selected start date into end date
    var oldEnd = dates.end;
    dates.end = date.copy(dates.start);
    dates.end.setUTCHours(oldEnd.getUTCHours());
    dates.end.setUTCMinutes(oldEnd.getUTCMinutes());
    var newEndMS = dates.end.getTime();
    var startMS = dates.start.getTime();
    if (newEndMS <= startMS) {
      /* If copying start into end has made the range invalid,
         advance the end date by a day */
      dates.end.setTime(newEndMS + dayMS);
      var newEndDateUTC = dateYmd.utc.ofDate(dates.end);
      var newEndDate = dateYmd.local.toDate(newEndDateUTC);
      picker.datePickerEnd.datepicker("setDate", newEndDate);
    }
    r.updateValidity();
  }

  function setupDatePickers(picker) {
    var r = picker.datesRef;

    r.watch(function(dates, isValid) {
      startDateWatcher(picker, dates);
    }, dateWatcherId + "-start");

    r.watch(function(dates, isValid) {
      endDateWatcher(picker, dates);
    }, dateWatcherId + "-end");

    createDatePicker(picker, picker.datePickerStart, "start");
    createDatePicker(picker, picker.datePickerEnd, "end");
    picker.datePickerContainer.removeClass("hide");
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
  function importEvents(esperEvents) {
    return list.map(esperEvents, function(x) {
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
    });
  }

  function fetchEvents(momentStart, momentEnd, tz, callback) {
    var start = momentStart.toDate();
    var end = momentEnd.toDate();
    var cache = calcache.getCache();
    var async = cache.fetch(start, end, tz)
      .done(function (esperEvents) {
        var fullcalEvents = importEvents(esperEvents);
        callback(fullcalEvents);
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
    picker.calendarPickerContainer.removeClass("hide");
  }

  /*
    Create date and time picker using user's calendar.

    Parameters:
    - timezone: IANA timezone in which all local times are expressed;
      optional if the full calendar is not displayed.
    - defaultDate:
        date that determines which calendar page to display initially
        (default: today)
    - withDatePicker, withCalendarPicker: whether
      the corresponding input widgets should be created.
   */
  mod.create = function(param) {
    var tz = param.timezone;
    var defaultDate = param.defaultDate;
    var withDatePicker = util.option(param.withDatePicker, false);
    var withCalendarPicker = util.option(param.withCalendarPicker, false);

    var r = createRef();
    var picker = createView(r, tz);

    if (withDatePicker) {
      setupDatePickers(picker);
      setupTimePickers(picker);
    }
    if (withCalendarPicker)
      setupCalendar(picker, tz, defaultDate);

    function render() {
      if (withCalendarPicker)
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
      clearDates: (function() { picker.datesRef.set({}); }),
      watchDates: (function(handler, watcherId) {
        picker.datesRef.watch(handler, watcherId);
      })
    };
  };

  return mod;
})();
