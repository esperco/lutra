/*
  Date-time-duration picker using calendar containing read-only events
  retrieved from the user's calendar.
*/

module Esper.CalPicker {

  export var teamCalendar : ApiT.Calendar;

  interface PickerView {
    view : JQuery;
    calendarPickerContainer : JQuery;
    calendarSidebar : JQuery;
    dateJumper : JQuery;
    pickerSwitcher : JQuery;
    eventTitle : JQuery;
    calendarView : JQuery;
    events : { [eventId : string] : FullCalendar.EventObject };
  }

  function createView() : PickerView {
'''
<div #view>
  <div #calendarPickerContainer class="hide">
    <div #calendarSidebar class="esper-cal-sidebar">
      <div #dateJumper class="esper-date-jumper"/>
      <div class="esper-cal-picker-switcher">
        Calendar: <select #pickerSwitcher/>
      </div>
      <div class="esper-cal-event-title">
        Event title: <input #eventTitle type="text" size=64/>
      </div>
    </div>
    <div class="esper-modal-dialog esper-cal-picker-modal">
      <div class="esper-modal-content esper-cal-picker-modal">
        <div #calendarView class="esper-cal-picker-container"/>
      </div>
    </div>
  </div>
</div>
'''
    var calendars = Sidebar.currentTeam.team_calendars;
    teamCalendar = calendars[0];

    eventTitle.val("HOLD: " + gmail.get.email_subject());

    for (var i = 0; i < calendars.length; i++) {
      var opt = $("<option value='" + i + "'>" +
                  calendars[i].calendar_title + "</option>");
      opt.appendTo(pickerSwitcher);
    }
    pickerSwitcher.change(function() {
      var i = $(this).val();
      teamCalendar = calendars[i];
      calendarView.fullCalendar("refetchEvents");
    });


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

  function setupCalendar(picker : PickerView) {
    var calendarView = picker.calendarView;
    var calendarJump = picker.dateJumper;

    function setEventMoments(startMoment, endMoment, eventId) {
      if (eventId !== undefined) removeEvent(picker, eventId);
      Log.d(startMoment, endMoment);
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
      height: 600,
      defaultView: 'agendaWeek',
      snapDuration: "00:15:00",
      selectable: true,
      selectHelper: true,
      select: select,
      eventClick: eventClick,
      eventDrop: eventDrop,
      eventResize: eventResize,
      editable: false,
      events: fetchEvents
    });

    function dateJump(date, view) {
      Log.d("Jump");
      calendarView.fullCalendar('gotoDate', date);
    }

    calendarJump.datepicker({inline : true,
                             onSelect : dateJump});

    picker.calendarPickerContainer.removeClass("hide");
  }


  interface Picker {
    view : JQuery;
    events : { [eventId : string] : FullCalendar.EventObject };
    eventTitle : JQuery;
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
      eventTitle: pickerView.eventTitle,
      render: render, // to be called after attaching the view to the dom tree
    };
  };

  function calendarTimeOfMoment(localMoment) : ApiT.CalendarTime {
    var localTime = localMoment.toISOString();
    localMoment.local();
    var utcMoment = localMoment.clone();
    utcMoment.utc();
    var utcTime = utcMoment.toISOString();
    return { utc: utcTime, local: localTime };
  }

  function makeEventEdit(ev : FullCalendar.EventObject, eventTitle)
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
<div #view>
  <div #background class="esper-modal-bg"/>
  <div #modal class="esper-modal esper-calendar-modal">
    <div class="esper-modal-header">
      <div #close class="esper-modal-close-container">
        <object #closeIcon class="esper-svg esper-modal-close-icon"/>
      </div>
      <div #title class="esper-modal-title"/>
    </div>
    <div #modalBody/>
    <div class="esper-search-footer">
      <button #done class="esper-primary-btn esper-done-btn">Done</button>
      <object #modalLogo class="esper-svg esper-search-footer-logo"/>
    </div>
  </div>
</div>
'''
    function closeModal() { view.remove(); }

    title.text("Select meeting times");
    modalLogo.attr("data", Init.esperRootUrl + "img/footer-logo.svg");
    closeIcon.attr("data", Init.esperRootUrl + "img/close.svg");

    var picker = createPicker();
    modalBody.append(picker.view);

    background.click(closeModal);
    close.click(closeModal);
    done.click(function() {
      var events = [];
      for (var k in picker.events)
        events.push(makeEventEdit(picker.events[k], picker.eventTitle));
      var apiCalls = List.map(events, function(ev) {
        return Api.createLinkedEvent(
          Sidebar.currentTeam.teamid,
          ev,
          Sidebar.currentThreadId
        );
      });
      Promise.join(apiCalls).done(function() {
        closeModal();
        if (events.length > 0) CalTab.refreshLinkedEvents();
      });
    });

    $("body").append(view);
    picker.render();
  }
}
