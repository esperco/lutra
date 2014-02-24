/*
  Date-time-duration picker using calendar containing read-only events
  retrieved from the user's calendar.
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

  mod.createCalendar = function(param) {
    var calendarView = $("<div>");

    function select(start, end) {
      var eventData = {
        id: util.randomString(),
	title: "Nice!",
	start: start,
	end: end,
        color: "#ff0000"
      };
      var stick = false;
      calendarView.fullCalendar('renderEvent', eventData, stick);
      calendarView.fullCalendar('unselect');
    }

    function eventClick(calEvent, jsEvent, view) {
      var id = calEvent.id;
      calendarView.fullCalendar('removeEvents', function(calEvent) {
        return calEvent.id === id;
      });
    }

    api.postCalendar(login.leader(), {
      timezone: "America/Los_Angeles",
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
        timezone: "America/Los_Angeles",
        selectable: true,
        selectHelper: true,
	select: select,
        eventClick: eventClick,
        editable: false,
        events: fetchEvents
      });
    });
    return calendarView;
  }

  return mod;
})();
