/*
  Date-time-duration picker using calendar containing read-only events
  retrieved from the user's calendar.

  Input:
  - timezone

  Output:
  - calendarView
*/

module Esper.CalPicker {

  function createView(tz) {
'''
<div #view>
  <div #calendarPickerContainer class="hide">
    <div #calendarSidebar
         class="esper-cal-sidebar">
      <div #dateJumper
           class="esper-date-jumper"/>
      <div class="esper-time-zone-label-section">
        <div class="esper-time-zone-label">TIME ZONE:</div>
        <div #timezoneView class="esper-time-zone-text"/>
      </div>
    </div>
    <div class="esper-modal-dialog esper-cal-picker-modal">
      <div class="esper-modal-content esper-cal-picker-modal">
        <div #calendarView
             class="esper-cal-picker-container"/>
      </div>
    </div>
  </div>
</div>
'''
    if (Util.isDefined(tz))
      timezoneView.text(/*timezone.format*/(tz));

    _view["timezone"] = tz;
    _view["events"] = {};

    return _view;
  }

  /***** Calendar picker (start/end date-time) *****/

  /* Remove event from the calendar view */
  function removeEvent(picker, eventId) {
    if (picker.events[eventId] !== undefined) {
      picker.calendarView.fullCalendar('removeEvents', function(calEvent) {
        return calEvent.id === eventId;
      });
      delete picker.events[eventId];
    }
  }

  function createPickedCalendarEvent(picker, startMoment, endMoment) {
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
    var s = XDate.toString(d);
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
    //removeEvent(picker);
  }

  /*
    Translate calendar events as returned by the API into
    the format supported by Fullcalendar.

    Input event type: calendar_event defined in api.atd
    Output event type:
      http://arshaw.com/fullcalendar/docs2/event_data/Event_Object/
  */
  function importEvents(esperEvents) {
    return List.map(esperEvents, function(x : any) {
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
    var start = momentStart.toDate();
    var end = momentEnd.toDate();
    var cache = CalCache.getCache(Login.myTeams()[0].teamid);
    cache.fetch(start, end, tz)
      .done(function (esperEvents) {
        var fullcalEvents = importEvents(esperEvents);
        callback(fullcalEvents);
      });
    //spinner.spin("Loading calendar...", async);
  }

  function setupCalendar(picker, tz, defaultDate) {
    var calendarView = picker.calendarView;
    var calendarJump = picker.dateJumper;

    function setEventMoments(startMoment, endMoment, eventId) {
      if (eventId !== undefined) removeEvent(picker, eventId);
      Log.d(startMoment, endMoment);
      createPickedCalendarEvent(picker, startMoment, endMoment);
    }

    /*function setEvent(dates) {
      setEventMoments(momentOfDate(picker, dates.start),
                      momentOfDate(picker, dates.end));
    }*/

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
      defaultDate: defaultDate,
      defaultView: 'agendaWeek',
      snapDuration: "00:15:00",
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

    function dateJump(date,view){
        Log.d("Jump");
        calendarView.fullCalendar('gotoDate',date);
    }

    calendarJump.datepicker({inline : true,
                             onSelect : dateJump});

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
  function createPicker(param) {
    var tz = param.timezone;
    var defaultDate = param.defaultDate;

    var picker = createView(tz);

    setupCalendar(picker, tz, defaultDate);

    function render() {
      picker.calendarView.fullCalendar("render");
    }

    return {
      events: picker["events"],
      view: picker.view,
      render: render, // to be called after attaching the view to the dom tree
    };
  };

  function calendarTimeOfMoment(localMoment) {
    var localTime = localMoment.toISOString();
    localMoment.local();
    var utcMoment = localMoment.clone();
    utcMoment.utc();
    var utcTime = utcMoment.toISOString();
    return { utc: utcTime, local: localTime };
  }

  function makeEventEdit(ev) : ApiT.CalendarEventEdit {
    return {
      google_cal_id: Login.myTeams()[0].team_calendars[0].google_cal_id,
      start: calendarTimeOfMoment(ev.start),
      end: calendarTimeOfMoment(ev.end),
      guests: []
    };
  }

  export function createModal(param) {
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

    var picker = createPicker(param);
    modalBody.append(picker.view);

    background.click(closeModal);
    close.click(closeModal);
    done.click(function() {
      Log.d(picker);
      var events = [];
      for (var k in picker.events)
        events.push(makeEventEdit(picker.events[k]));
      Log.d(events);
      var apiCalls = List.map(events, function(ev) {
        return Api.createLinkedEvent(
          Login.myTeams()[0].teamid,
          ev,
          Sidebar.currentThreadId
        );
      });
      Promise.join(apiCalls).done(closeModal);
    });

    $("body").append(view);
    picker.render();
  }
}
