/*
  Date-time-duration picker using calendar containing read-only events
  retrieved from the user's calendar.

  Input:
  - timezone
  - setTextEventDate(start, end): called by the calendar when the date changes

  Output:
  - calendarView
  - setCalEventDate(start, end): called from outside to update the calendar view

*/

var calpicker = (function() {
  var mod = {};

  function createView() {
'''
<div #view>
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
  <div #calendarView/>
</div>
'''
    _view.focus = startInput.focus;

    /*
      Later _view will also contain the following fields:
      - eventId
      - eventStart
      - eventEnd
      - onChange
     */
    return _view;
  }

  function to24hours(timePickerTime) {
    var hours12 = timePickerTime.hours % 12;
    var hours24 = timePickerTime.meridian === "AM" ? hours12 : hours12 + 12;
    return hours24;
  }

  function hasDates(picker) {
    var start = picker.eventStart;
    var end = picker.eventEnd;
    return util.isDefined(start) && util.isDefined(end);
  }

  function initTimePicker(picker,
                          fieldName, /* either "eventStart" or "eventEnd" */
                          timePicker,
                          userOnChange) {
    log("initTimePicker", fieldName);
    timePicker.timepicker({
      timeFormat: "g:i a",
        /* PHP date() format http://php.net/manual/en/function.date.php */
      step: 5
        /* granularity in minutes */
    });
    timePicker.on("changeTime", function() {
      /*
        TODO (known bug):
        Ensure that end date/time is after start date/time.
      */
      var date = picker[fieldName]; /* Moment */
      if (util.isDefined(date)) {
        var time = timePicker.timepicker("getTime"); /* native js Date */
        date.hours(time.getHours());
        date.minutes(time.getMinutes());
        updateCalendarView(picker);
        userOnChange(getDates(picker));
      }
    });
  }

  function initTimePickers(picker, userOnChange) {
    initTimePicker(picker, "eventStart", picker.startInput, userOnChange);
    initTimePicker(picker, "eventEnd", picker.endInput, userOnChange);
  }

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

  /* Get rid of any previously selected date and time */
  function removeEvent(picker) {
    removeCalendarEvent(picker);
    delete picker.eventStart;
    delete picker.eventEnd;
    picker.textView.addClass("hide");
    picker.onChange();
  }

  /*
    Convert a Fullcalendar date (Moment library) into a string
    accepted by Bootstrap-timepicker.
  */
  function formatTime(calDate) {
    return date.timeOnly(calDate.toDate());
  }

  function updateTextView(picker) {
    var start = picker.eventStart;
    var end = picker.eventEnd;
    if (hasDates(picker)) {
      picker.startInput.timepicker('setTime', formatTime(start));
      picker.endInput.timepicker('setTime', formatTime(end));
      picker.textView.removeClass("hide");
    }
    else
      removeEvent(picker);
  }

  function updateCalendarView(picker) {
    if (hasDates(picker)) {
      removeCalendarEvent(picker);
      var start = picker.eventStart;
      var end = picker.eventEnd;
      var eventId = util.randomString();
      picker.eventId = eventId;
      var eventData = {
        id: eventId,
        title: "",
        start: start,
        end: end,
        color: "#A25CC6",
        editable: true
      };
      var stick = true;
      picker.calendarView.fullCalendar('renderEvent', eventData, stick);
      picker.calendarView.fullCalendar('unselect');
    }
  }

  function getDates(picker) {
    if (util.isDefined(picker.eventStart) && util.isDefined(picker.eventEnd)) {
      var start = picker.eventStart;
      var end = picker.eventEnd;
      var duration = end.unix() - start.unix();
      return {
        start: start.toDate(),
        end: end.toDate(),
        duration: duration
      };
    }
    else
      return null;
  }

  /*
    Ignores the 'Z' suffix and assumes time expressed the calendar's
    timezone.
  */
  function parseDateUsingCalendarTimezone(picker, dateString) {
    return picker.calendarView.fullCalendar("moment", dateString);
  }

  function setDates(picker, start, end) {
    if (util.isDefined(start) && util.isDefined(end)) {
      picker.eventStart = parseDateUsingCalendarTimezone(picker, start);
      picker.eventEnd = parseDateUsingCalendarTimezone(picker, end);
      updateTextView(picker);
      updateCalendarView(picker);
    }
  }

  function clearDates(picker) {
    delete picker.eventStart;
    delete picker.eventEnd;
    removeEvent(picker);
    updateTextView(picker);
    updateCalendarView(picker);
  }

  /*
    Clear previous selection if any,
    create new calendar event and populate input boxes
  */
  function initEvent(picker, start, end) {
    removeEvent(picker);

    picker.eventStart = start;
    picker.eventEnd = end;
    picker.onChange(getDates(picker));

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
    api.postCalendar(login.leader(), {
      timezone: tz,
      window_start: start,
      window_end: end
    }).done(function (esperCalendar) {
      callback(importEvents(esperCalendar));
    });
  }

  /*
    Create date and time picker using user's calendar.

    Parameters:
    - timezone: IANA timezone in which all local times are expressed
    - onChange(optDates):
        fired when the dates are initialized or change;
        optDates is a record with fields start, end, and duration.
   */
  mod.create = function(param) {
    var tz = param.timezone;
    var onChange = param.onChange;

    var picker = createView();
    initTimePickers(picker, onChange);
    picker.onChange = onChange;

    var calendarView = picker.calendarView;

    function select(start, end) {
      initEvent(picker, start, end);
    }

    function eventClick(calEvent, jsEvent, view) {
      removeEvent(picker);
    }

    function updateEvent(picker, calEvent) {
      removeEvent(picker);
      initEvent(picker, calEvent.start, calEvent.end);
    }

    function eventDrop(calEvent, revertFunc, jsEvent, ui, view) {
      updateEvent(picker, calEvent);
    }

    function eventResize(calEvent, jsEvent, ui, view) {
      updateEvent(picker, calEvent);
    }

    calendarView.fullCalendar({
      header: {
        left: 'prev,next today',
        center: 'title',
        right: 'month,agendaWeek,agendaDay'
      },
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

    function render() {
      calendarView.fullCalendar("render");
    }

    return {
      view: picker.view,
      render: render, // to be called after attaching the view to the dom tree
      getDates: (function() { return getDates(picker); }),
      setDates: (function(x) { setDates(picker, x.start, x.end); }),
      clearDates: (function() { return clearDates(picker); })
    };
  }

  return mod;
})();
