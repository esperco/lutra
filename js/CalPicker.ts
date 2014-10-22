/*
  Date-time-duration picker using calendar containing read-only events
  retrieved from the user's calendar.
*/

module CalPicker {

  export var teamCalendar : ApiT.Calendar;

  interface PickerView {
    view : JQuery;
    calendarPickerContainer : JQuery;
    calendarSidebar : JQuery;
    dateJumper : any;
    calendarView : any; /*JQuery;*/
    events : { [eventId : string] : any /*FullCalendar.EventObject*/ };
  }

  function createView() : PickerView {
'''
<div #view>
  <div #calendarPickerContainer class="hide">
    <div #calendarSidebar class="esper-cal-sidebar">
      <div #dateJumper class="esper-date-jumper" style="display: none"/>
    </div>
    <div class="esper-modal-dialog esper-cal-picker-modal">
      <div class="esper-modal-content esper-cal-picker-modal">
        <div #calendarView class="esper-cal-picker-container"/>
      </div>
    </div>
  </div>
</div>
'''
    var pv = <PickerView> _view;
    pv.events = {};
    return pv;
  }

  /***** Calendar picker (start/end date-time) *****/

  /* Remove event from the calendar view */
  function removeEvent(picker : PickerView, eventId) {
    picker.calendarView.fullCalendar('removeEvents', function(calEvent) {
      return calEvent.id === eventId;
    });
    if (picker.events[eventId] !== undefined) {
      delete picker.events[eventId];
    }
  }

  function createPickedCalendarEvent(picker : PickerView,
                                     startMoment, endMoment) {
    var eventId = Util.randomString();
    var eventData = {
      id: eventId,
      title: "",
      start: startMoment,
      end: endMoment,
      color: "#A25CC6",
      editable: true
    };
    picker.events[eventId] = eventData;
    var stick = true;
    picker.calendarView.fullCalendar('renderEvent', eventData, stick);
    picker.calendarView.fullCalendar('unselect');
    picker.calendarView.fullCalendar('gotoDate', startMoment);
  }

  /*
    Convert a Fullcalendar date (Moment library) into a javascript Date
  */
  function dateOfMoment(m) : Date {
    return m.toDate();
  }

  /*
    Translate calendar events as returned by the API into
    the format supported by Fullcalendar.

    Input event type: calendar_event defined in api.atd
    Output event type:
      http://arshaw.com/fullcalendar/docs2/event_data/Event_Object/
  */
  function importEvents(esperEvents : ApiT.CalendarEvent[]) {
    return List.map(esperEvents, function(x) {
      var ev = {
        title: x.title, /* required */
        allDay: x.all_day,
        start: x.start.local, /* required */
        end: x.end.local, /* required */
        orig: x /* custom field */
      };
      return ev;
    });
  }

  declare var moment : any;

  function ymdOfMoment(m) {
    var month = m.month() + 1;
    return m.year() + "-" + month + "-" + m.date();
  }

  function ymdOfDay(d) {
    var startOfWeek = moment().startOf("week");
    var sun = ymdOfMoment(startOfWeek);
    var mon = ymdOfMoment(startOfWeek.add(1, "day"));
    var tue = ymdOfMoment(startOfWeek.add(1, "day")); // Remember,
    var wed = ymdOfMoment(startOfWeek.add(1, "day")); // it's mutable!
    var thu = ymdOfMoment(startOfWeek.add(1, "day")); // :(
    var fri = ymdOfMoment(startOfWeek.add(1, "day"));
    var sat = ymdOfMoment(startOfWeek.add(1, "day"));
    if (d === "Sun") return sun;
    else if (d === "Mon") return mon;
    else if (d === "Tue") return tue;
    else if (d === "Wed") return wed;
    else if (d === "Thu") return thu;
    else if (d === "Fri") return fri;
    else if (d === "Sat") return sat;
    else return null; // Should never happen
  }

  function hmsOfTime(t) {
    var hour = t.hour > 9 ? t.hour : "0" + t.hour;
    var minute = t.minute > 9 ? t.minute : "0" + t.minute;
    return hour + ":" + minute + ":00";
  }

  function availableEvents(picker, availabilities) {
    return List.map(availabilities, function(a) {
      var eventId = Util.randomString();
      var fromDay = ymdOfDay(a.avail_from.day);
      var toDay = ymdOfDay(a.avail_to.day);
      var fromTime = hmsOfTime(a.avail_from.time);
      var toTime = hmsOfTime(a.avail_to.time);
      var eventData = {
        id: eventId,
        start: moment(fromDay + "T" + fromTime),
        end: moment(toDay + "T" + toTime)
      };
      picker.events[eventId] = eventData;
      return eventData;
    });
  }

  function setupCalendar(picker : PickerView, availabilities) {
    var calendarView = picker.calendarView;
    var calendarJump = picker.dateJumper;

    function setEventMoments(startMoment, endMoment, eventId) {
      if (eventId !== undefined) removeEvent(picker, eventId);
      Log.p(startMoment, endMoment, eventId);
      createPickedCalendarEvent(picker, startMoment, endMoment);
    }

    function select(startMoment, endMoment) {
      setEventMoments(startMoment, endMoment, undefined);
    }

    function eventClick(calEvent, jsEvent, view) {
      removeEvent(picker, calEvent.id);
    }

    function updateEvent(calEvent) {
      setEventMoments(calEvent.start, calEvent.end, calEvent.id);
    }

    function eventDrop(calEvent, revertFunc, jsEvent, ui, view) {
      updateEvent(calEvent);
    }

    function eventResize(calEvent, jsEvent, ui, view) {
      updateEvent(calEvent);
    }

    calendarView.fullCalendar({
      header: {
        left: "",
        center: "",
        right: ""
      },
      height: 600,
      defaultView: 'agendaWeek',
      snapDuration: "00:15:00",
      selectable: true,
      selectHelper: true,
      select: select,
      eventClick: eventClick,
      eventDrop: eventDrop,
      eventResize: eventResize,
      editable: true,
      events: {
        events: availableEvents(picker, availabilities),
        color: "#A25CC6"
      }
    });

    function dateJump(date, view) {
      Log.p("Jump");
      calendarView.fullCalendar('gotoDate', date);
    }

    /*calendarJump.datepicker({inline : true,
                             onSelect : dateJump});*/

    picker.calendarPickerContainer.removeClass("hide");
  }

  interface Picker {
    view : JQuery;
    events : { [eventId : string] : any /*FullCalendar.EventObject*/ };
    render : () => void;
  }

  /*
    Create date and time picker using user's calendar.
  */
  function createPicker(availabilities) : Picker {
    var pickerView = createView();
    setupCalendar(pickerView, availabilities);

    function render() {
      pickerView.calendarView.fullCalendar("render");
    }

    return {
      view: pickerView.view,
      events: pickerView.events,
      render: render, // to be called after attaching the view to the dom tree
    };
  };

  /*
    Add 8 hours if the timezone offset is -08:00.
    (spend as little time as possible in momentjs whose interface
    is atrocious)
  */
  function utcOfLocal(tz, localMoment) {
    var m = localMoment.clone();
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
      Log.p("Correcting offset after daylight savings transition: "
            + offsetMinutes + " min -> "
            + updatedOffset + " min");
      m.add("minutes", updatedOffset - offsetMinutes);
    }

    return m.toDate();
  };

  function calendarTimeOfMoment(localMoment) : ApiT.CalendarTime {
    var localTime = localMoment.toISOString();
    var timeZone = teamCalendar.calendar_timezone;
    if (timeZone === undefined) timeZone = "UTC"; // or use client tz?
    var utcMoment = utcOfLocal(teamCalendar.calendar_timezone, localMoment);
    var utcTime = utcMoment.toISOString();
    return { utc: utcTime, local: localTime };
  }

  function makeEventEdit(ev : /*FullCalendar.EventObject*/ any, eventTitle)
    : ApiT.CalendarEventEdit
  {
    return {
      google_cal_id: teamCalendar.google_cal_id,
      start: calendarTimeOfMoment(ev.start),
      end: calendarTimeOfMoment(ev.end),
      title: eventTitle.val(),
      guests: []
    };
  }

  // Get rid of specific dates on FullCalendar day-of-week headings
  function render(picker) {
    picker.render();

    // Cleveland says: "Oh, that's nasty!"
    picker.view.find(".fc-widget-header .fc-sun").text("Sun");
    picker.view.find(".fc-widget-header .fc-mon").text("Mon");
    picker.view.find(".fc-widget-header .fc-tue").text("Tue");
    picker.view.find(".fc-widget-header .fc-wed").text("Wed");
    picker.view.find(".fc-widget-header .fc-thu").text("Thu");
    picker.view.find(".fc-widget-header .fc-fri").text("Fri");
    picker.view.find(".fc-widget-header .fc-sat").text("Sat");
  }

  function makeAvailability(fcEvent) {
    var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return [{
      avail_from: {
        day: days[fcEvent.start.day()],
        time: {
          hour: fcEvent.start.hour(),
          minute: fcEvent.start.minute()
        }
      },
      avail_to: {
        day: days[fcEvent.end.day()],
        time: {
          hour: fcEvent.end.hour(),
          minute: fcEvent.end.minute()
        }
      }
    }];
  }

  export function createModal(defaults, element) : void {
'''
<div #modal
     class="modal fade" tabindex="-1"
     role="dialog">
  <div class="modal-dialog team-settings">
    <div class="modal-content">
      <div class="modal-header">Customize Availability</div>
      <div #content></div>
      <div class="modal-footer">
        <button #done class="button-primary">Done</button>
      </div>
    </div>
  </div>
</div>
'''
    var availabilities = defaults.availability;
    var picker = createPicker(availabilities);
    content.append(picker.view);

    (<any> modal).modal({}); // FIXME
    setTimeout(function() { render(picker); }, 320); // Wait for fade

    done.click(function() {
      var events = [];
      for (var k in picker.events)
        events = events.concat(makeAvailability(picker.events[k]));

      element.data("availabilities", events); // ughgh pass data through DOM
      defaults.availability = events;

      (<any> modal).modal("hide"); // FIXME
    });
  }
}
