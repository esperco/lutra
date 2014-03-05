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
  <div #calendarView/>
  <div #textView
       class="row hide">
    <div class="col-sm-3">
      <div class="location-title">Start</div>
      <div class="bootstrap-timepicker">
        <input #startInput
               type="text" class="form-control"/>
      </div>
    </div>
    <div class="col-sm-3 clearfix">
      <div class="location-title">End</div>
      <div class="bootstrap-timepicker">
        <input #endInput
               type="text" class="form-control"/>
      </div>
    </div>
    <div class="col-sm-6"/>
  </div>
</div>
'''

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

  function initTimePicker(picker,
                          fieldName, /* either "eventStart" or "eventEnd" */
                          timePicker) {
    timePicker.timepicker({
      minuteStep: 5,
      showSeconds: false
    });
    timePicker.timepicker().on('changeTime.timepicker', function(e) {
      /*
        TODO (known bugs):
        Ensure that end date/time is after start date/time.
      */
      var time = e.time;
      var date = picker[fieldName];
      date.hours(to24hours(time));
      date.minutes(time.minutes);
      updateCalendarView(picker);
    });
  }

  function initTimePickers(picker) {
    initTimePicker(picker, "eventStart", picker.startInput);
    initTimePicker(picker, "eventEnd", picker.endInput);
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
    if (util.isDefined(start)) {
      picker.startInput.timepicker('setTime', formatTime(start));
      picker.endInput.timepicker('setTime', formatTime(end));
      picker.textView.removeClass("hide");
    }
    else
      removeEvent(picker);
  }

  function updateCalendarView(picker) {
    var start = picker.eventStart;
    var end = picker.eventEnd;
    if (util.isDefined(start)) {
      removeCalendarEvent(picker);
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
    else
      removeEvent(picker);
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

  function fetchEvents(start, end, tz, callback) {
    api.postCalendar(login.leader(), {
      timezone: tz,
      window_start: start,
      window_end: end
    }).done(function (x) {
      callback(x.events);
    });
  }

  mod.createPicker = function(param) {
    var tz = param.timezone;
    var onChange = param.onChange;

    var picker = createView();
    initTimePickers(picker);
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
      getDates: (function() { return getDates(picker); })
    };
  }

  return mod;
})();
