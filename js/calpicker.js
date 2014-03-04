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
    var param = {
      minuteStep: 5,
      showSeconds: false
    };
    startInput.timepicker(param);
    endInput.timepicker(param);

    /*
      Later _view will also contain the following fields:
      - eventId
      - eventStart
      - eventEnd
     */
    return _view;
  }

  function removeEvent(picker) {
    var id = picker.eventId;
    if (util.isDefined(id)) {
      picker.calendarView.fullCalendar('removeEvents', function(calEvent) {
        return calEvent.id === id;
      });
      picker.textView.addClass("hide");
      delete picker.eventId;
    }
    delete picker.eventStart;
    delete picker.eventEnd;
  }

  function updateTextView(picker) {
    var start = picker.eventStart;
    var end = picker.eventEnd;
    if (util.isDefined(start)) {
      picker.startInput.timepicker('setTime', '12:45 AM');
      picker.endInput.timepicker('setTime', '12:55 AM');
      picker.textView.removeClass("hide");
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

    var eventId = util.randomString();
    picker.eventId = eventId;
    picker.eventStart = start;
    picker.eventEnd = end;

    var eventData = {
      id: eventId,
      title: "",
      start: start,
      end: end,
      color: "#ff0000",
      editable: true
    };
    var stick = true;
    picker.calendarView.fullCalendar('renderEvent', eventData, stick);
    picker.calendarView.fullCalendar('unselect');

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
    var picker = createView();
    var calendarView = picker.calendarView;
    var tz = param.timezone;

    function select(start, end) {
      initEvent(picker, start, end);
    }

    function eventClick(calEvent, jsEvent, view) {
      removeEvent(picker);
    }

    api.postCalendar(login.leader(), {
      timezone: tz,
      window_start: "2014-02-17T00:00:00-08:00",
      window_end: "2014-02-24T00:00:00-08:00"
    }).done(function (x) {
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
        editable: false,
        events: fetchEvents
      });
    });

    return {
      view: picker.view
    };
  }

  return mod;
})();
