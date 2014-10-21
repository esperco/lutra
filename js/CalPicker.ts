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
    if (picker.events[eventId] !== undefined) {
      picker.calendarView.fullCalendar('removeEvents', function(calEvent) {
        return calEvent.id === eventId;
      });
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

  /*
  function fetchEvents(momentStart, momentEnd, tz, callback) {
    // TODO Display tz?
    var start = momentStart.toDate();
    var end = momentEnd.toDate();
    var cache = CalCache.getCache(
      Sidebar.currentTeam.teamid,
      teamCalendar.google_cal_id
    );
    cache.fetch(start, end).done(function(esperEvents) {
      var fullcalEvents = importEvents(esperEvents);
      callback(fullcalEvents);
    });
  }
  */

  function setupCalendar(picker : PickerView) {
    var calendarView = picker.calendarView;
    var calendarJump = picker.dateJumper;

    function setEventMoments(startMoment, endMoment, eventId) {
      if (eventId !== undefined) removeEvent(picker, eventId);
      Log.p(startMoment, endMoment);
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
        left: 'prev,next today',
        center: 'title',
        right: 'month,agendaWeek,agendaDay'
      },
      height: 400,
      defaultView: 'agendaWeek',
      snapDuration: "00:15:00",
      selectable: true,
      selectHelper: true,
      select: select,
      eventClick: eventClick,
      eventDrop: eventDrop,
      eventResize: eventResize,
      editable: false,
      //events: fetchEvents
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
  function createPicker() : Picker {
    var pickerView = createView();
    setupCalendar(pickerView);

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

  export function createModal() : void {
'''
<div #view
     class="modal fade"
     tabindex="-1"
     role="dialog"
     aria-hidden="true">
  <div class="modal-header calendar-modal-header">
    <div #iconContainer
         class="modal-icon cal-picker-modal-icon"/>
    <button #doneButton
            class="btn btn-primary"
            style="float:right">
      Done
    </button>
    <div #title
        class="modal-title">
      Click on the calendar to select a time.
    </div>
  </div>
  <div #content/>
</div>
'''
    var icon = $("<img class='svg-block'/>")
      .appendTo(iconContainer);
    //svg.loadImg(icon, "/assets/img/calendar.svg");

    var id = Util.randomString();
    title.attr("id", id);
    view.attr("aria-labelledby", id);

    var cal = createPicker();
    _view["cal"] = cal;
    _view.content.append(cal.view);

    (<any> cal.view).modal({});
    cal.render();
  }
}
