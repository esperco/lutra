/*
  Date-time-duration picker using calendar containing read-only events
  retrieved from the user's calendar.
*/

module Esper.CalPicker {

  // The calendar that the created events go on
  export var writeToCalendar : ApiT.Calendar;

  // The team calendars whose events are currently displayed
  var showCalendars : { [calid : string] : any } = {};

  /* This should be a parameter to fetchEvents, but fullCalendar calls
     that function for us, and I can only trigger it by doing
     x.fullCalendar("refetchEvents"), which takes no other parameters. */
  var refreshCache = false;

  interface PickerView {
    view : JQuery;
    calendarPickerContainer : JQuery;
    calendarSidebar : JQuery;
    dateJumper : JQuery;
    pickerSwitcher : JQuery;
    showCalCheckboxes : JQuery;
    refreshCal : JQuery;
    refreshCalIcon : JQuery;
    eventTitle : JQuery;
    calendarView : JQuery;
    events : { [eventId : string] : FullCalendar.EventObject };
  }

  function createView() : PickerView {
'''
<div #view>
  <div #calendarPickerContainer class="hide">
    <div #calendarSidebar class="esper-cal-sidebar">
      <div #dateJumper class="esper-date-jumper" style="display: none"/>
      <div class="esper-cal-picker-switcher">
        Write to calendar: <select #pickerSwitcher/>
      </div>
      <div #showCalCheckboxes>Show calendars: </div>
      <div>
        <span style="float: left">Refresh calendar:</span>
        <div #refreshCal class="esper-refresh esper-clickable">
          <object #refreshCalIcon class="esper-svg"/>
        </div>
      </div>
      <br/>
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
    writeToCalendar = calendars[0];
    showCalendars[writeToCalendar.google_cal_id] = {};
    List.iter(calendars, function(cal, i) {
      var box = $("<input type='checkbox'>");
      if (i === 0) box.prop("checked", true);
      box.click(function() {
        if (this.checked) showCalendars[cal.google_cal_id] = {};
        else delete showCalendars[cal.google_cal_id];
        calendarView.fullCalendar("refetchEvents");
      });
      box.appendTo(showCalCheckboxes);
      $("<span>" + cal.calendar_title + "</span>").insertAfter(box);
    });

    eventTitle.val("HOLD: " + esperGmail.get.email_subject());
    refreshCalIcon.attr("data", Init.esperRootUrl + "img/refresh.svg");
    refreshCal.click(function() {
      refreshCache = true;
      calendarView.fullCalendar("refetchEvents");
    });

    for (var i = 0; i < calendars.length; i++) {
      var opt = $("<option value='" + i + "'>" +
                  calendars[i].calendar_title + "</option>");
      opt.appendTo(pickerSwitcher);
    }
    pickerSwitcher.change(function() {
      var i = $(this).val();
      writeToCalendar = calendars[i];
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
    var cacheFetches =
      List.map(Object.keys(showCalendars), function(calid) {
        var cache = CalCache.getCache(Sidebar.currentTeam.teamid, calid);
        if (refreshCache) {
          return cache.fetch(start, end);
        } else {
          var cached = cache.get(start, end);
          if (cached === null) return cache.fetch(start, end);
          else return Promise.defer(cached);
        }
      });
    Promise.join(cacheFetches).done(function(ll) {
      var esperEvents = List.concat(ll);
      var fullcalEvents = importEvents(esperEvents);
      refreshCache = false;
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
      Log.d("Correcting offset after daylight savings transition: "
            + offsetMinutes + " min -> "
            + updatedOffset + " min");
      m.add("minutes", updatedOffset - offsetMinutes);
    }

    return m.toDate();
  };

  function calendarTimeOfMoment(localMoment) : ApiT.CalendarTime {
    var localTime = localMoment.toISOString();
    var timeZone = writeToCalendar.calendar_timezone;
    if (timeZone === undefined) timeZone = "UTC"; // or use client tz?
    var utcMoment = utcOfLocal(writeToCalendar.calendar_timezone, localMoment);
    var utcTime = utcMoment.toISOString();
    return { utc: utcTime, local: localTime };
  }

  function makeEventEdit(ev : FullCalendar.EventObject, eventTitle)
    : ApiT.CalendarEventEdit
  {
    return {
      google_cal_id: writeToCalendar.google_cal_id,
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

      // Wait for link
      var linkCalls = List.map(events, function(ev) {
        return Api.createLinkedEvent(
          Sidebar.currentTeam.teamid,
          ev,
          Sidebar.currentThreadId
        );
      });

      closeModal();
      if (events.length > 0) {
        CalTab.currentCalTab.linkedList.children().remove();
        CalTab.currentCalTab.linkedSpinner.show();
      }
      Promise.join(linkCalls).done(function(linkedEvents) {
        if (events.length > 0) CalTab.refreshLinkedEvents();

        // Don't wait for sync
        var syncCalls =
          List.map(linkedEvents, function(ev : ApiT.CalendarEvent) {
            return Api.syncEvent(
              Sidebar.currentTeam.teamid,
              Sidebar.currentThreadId,
              ev.google_cal_id,
              ev.google_event_id
            );
          });
        Promise.join(syncCalls);
      });
    });

    $("body").append(view);
    picker.render();
  }
}
