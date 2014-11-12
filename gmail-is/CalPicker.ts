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
    dateJumper : JQuery;
    eventTitle : JQuery;
    pickerSwitcher : JQuery;
    calendarView : JQuery;
    events : { [eventId : string] : FullCalendar.EventObject };
  }

  function createView(refreshCal, userSidebar) : PickerView {
'''
<div #view>
  <div #calendarPickerContainer class="hide">
    <div #dateJumper class="esper-date-jumper" style="display: none"/>
    <div class="esper-calendar-modal-event-settings esper-clearfix">
      <div class="esper-event-settings-col">
        <span class="esper-bold">Event title:</span>
        <input #eventTitle type="text" size="24" class="esper-input"/>
      </div>
      <div class="esper-event-settings-col">
        <span class="esper-bold">Save events to:</span>
        <select #pickerSwitcher class="esper-select"/>
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
    showCalendars = {}; // Clear out old entries from previous views
    showCalendars[writeToCalendar.google_cal_id] = {};
    userSidebar.calendarsContainer.children().remove();
    List.iter(calendars, function(cal, i) {
'''
<div #calendarCheckboxRow class="esper-calendar-checkbox">
  <input #calendarCheckbox type="checkbox"/>
  <span #calendarName/>
</div>
'''
      if (i === 0) calendarCheckbox.prop("checked", true);
      calendarCheckbox.click(function() {
        if (this.checked) showCalendars[cal.google_cal_id] = {};
        else delete showCalendars[cal.google_cal_id];
        calendarView.fullCalendar("refetchEvents");
      });
      var tz =
        cal.calendar_timezone === "UTC" ? "UTC" : // moment-tz can't handle it
        (<any> moment).tz(moment(), cal.calendar_timezone).zoneAbbr();
      calendarName.text(cal.calendar_title + " (" + tz + ")");
      calendarCheckboxRow.appendTo(userSidebar.calendarsContainer);
    });
    userSidebar.calendarsSection.show();

    refreshCal.click(function() {
      refreshCache = true;
      calendarView.fullCalendar("refetchEvents");
    });

    var title =
      TaskTab.currentTask !== undefined ?
      TaskTab.currentTask.task_title :
      esperGmail.get.email_subject();
    eventTitle.val("HOLD: " + title);

    Sidebar.customizeSelectArrow(pickerSwitcher);

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

    function eventRender(calEvent, element) {
      var orig = calEvent.orig;
      var loc;
      if (orig !== undefined) loc = orig.location;
      if (loc !== undefined) {
        var address = loc.address;
        if (loc.title !== "")
          address = loc.title + " - " + address;
        element
          .attr("title", "")
          .tooltip({
            show: { effect: "none" },
            hide: { effect: "none" },
            "content": address,
            "position": { my: 'center bottom', at: 'center top-7' },
            "tooltipClass": "esper-top esper-tooltip"
          });
      }
    }

    var calHeight = (window.innerHeight * 0.9) - 198;

    calendarView.fullCalendar({
      header: {
        left: 'prev,next today',
        center: 'title',
        right: 'month,agendaWeek,agendaDay'
      },
      height: calHeight,
      defaultView: 'agendaWeek',
      snapDuration: "00:15:00",
      selectable: true,
      selectHelper: true,
      select: select,
      eventClick: eventClick,
      eventDrop: eventDrop,
      eventResize: eventResize,
      eventRender: eventRender,
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
  function createPicker(refreshCal, userSidebar) : Picker {
    var pickerView = createView(refreshCal, userSidebar);
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
      <div #refreshCal title class="esper-calendar-modal-refresh">
        <object #refreshCalIcon class="esper-svg"/>
      </div>
      <div #title class="esper-modal-title"/>
    </div>
    <div #userSidebar class="esper-calendar-modal-preferences"/>
    <div #calendar class="esper-calendar-modal-grid"/>
    <div class="esper-modal-footer esper-clearfix">
      <button #save class="esper-btn esper-btn-primary modal-primary">
        Save
      </button>
      <button #cancel class="esper-btn esper-btn-secondary modal-cancel">
        Cancel
      </button>
    </div>
  </div>
</div>
'''
    function closeModal() { view.remove(); }

    refreshCalIcon.attr("data", Init.esperRootUrl + "img/refresh.svg");
    title.text("Create linked events");

    var userInfo = UserTab.viewOfUserTab(Sidebar.currentTeam, Sidebar.profiles);
    var picker = createPicker(refreshCal, userInfo);
    calendar.append(picker.view);
    userSidebar.append(userInfo.view);

    refreshCal.tooltip({
      show: { delay: 500, effect: "none" },
      hide: { effect: "none" },
      "content": "Refresh calendars",
      "position": { my: 'center bottom', at: 'center top-7' },
      "tooltipClass": "esper-top esper-tooltip"
    });

    window.onresize = function(event) {
      picker = createPicker(refreshCal, userInfo);
      calendar.children().remove();
      calendar.append(picker.view);
      picker.render();
    };

    background.click(closeModal);
    cancel.click(closeModal);

    save.click(function() {
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
        TaskTab.currentTaskTab.linkedEventsList.children().remove();
        TaskTab.currentTaskTab.linkedEventsSpinner.show();
      }
      Promise.join(linkCalls).done(function(linkedEvents) {
        if (events.length > 0) TaskTab.refreshLinkedEventsAction();

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
