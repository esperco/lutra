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

  function fetchEvents(start, end, tz, callback) {
    api.postCalendar(login.leader(), {
      timezone: tz,
      window_start: start,
      window_end: end
    }).done(function (x) {
      callback(x.events);
    });
  }

  function onSelect(calendarView, start, end) {
    var eventData = {
      id: util.randomString(),
      title: "",
      start: start,
      end: end,
      color: "#ff0000",
      editable: true
    };
    var stick = true;
    calendarView.fullCalendar('renderEvent', eventData, stick);
    calendarView.fullCalendar('unselect');
  }

  mod.createPicker = function(param) {
    var tz = param.timezone;
    var setCalEventDate = param.selCalEventDate;

    var calendarView = $("<div>");
    var newEvent;

    function select(start, end) {
      onSelect(calendarView, start, end);
    }

    function eventClick(calEvent, jsEvent, view) {
      var id = calEvent.id;
      calendarView.fullCalendar('removeEvents', function(calEvent) {
        return calEvent.id === id;
      });
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
      calendarView: calendarView,
      setCalEventDate: setCalEventDate
    };
  }

  return mod;
})();
