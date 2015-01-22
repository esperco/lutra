/*
  Date-time-duration picker using calendar containing read-only events
  retrieved from the user's calendar.
*/

module Esper.CalPicker {

  // The calendar that the created events go on
  export var writeToCalendar : ApiT.Calendar;

  // The team calendars whose events are currently displayed
  var showCalendars : { [calid : string] : string /* tz */ } = {};

  // The timezone that these calendars are displayed in
  var showTimezone : string; // America/Los_Angeles, America/New_York, etc.
  var showZoneAbbr : string; // PST, EDT, etc.

  /* This should be a parameter to fetchEvents, but fullCalendar calls
     that function for us, and I can only trigger it by doing
     x.fullCalendar("refetchEvents"), which takes no other parameters. */
  var refreshCache = false;

  interface PickerView {
    view : JQuery;
    calendarPickerContainer : JQuery;
    dateJumper : JQuery;
    eventTitle : JQuery;
    eventLocation : JQuery;
    pickerSwitcher : JQuery;
    guestNames : JQuery;
    calendarView : JQuery;
    events : { [eventId : string] : FullCalendar.EventObject };
  }

  function zoneAbbr(zoneName) {
    return zoneName === "UTC" ?
      "UTC" : // moment-tz can't handle it
      (<any> moment).tz(moment(), zoneName).zoneAbbr();
  }

  function createView(refreshCal, userSidebar,
                      team: ApiT.Team) : PickerView {
'''
<div #view>
  <div #calendarPickerContainer class="hide">
    <div #dateJumper class="esper-date-jumper" style="display: none"/>
    <div class="esper-calendar-modal-event-settings esper-clearfix">
      <div class="esper-event-settings-col">
        <span class="esper-bold">Event title:</span>
        <input #eventTitle type="text" size="24" class="esper-input"/>
        <br/>
        <span class="esper-bold">Location:</span>
        <input #eventLocation type="text" size="24" class="esper-input"/>
        <br/>
        <span class="esper-bold">Thread participants:</span>
        <span #guestNames/>
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
    showCalendars = {}; // Clear out old entries from previous views
    userSidebar.calendarsContainer.children().remove();

    var calendars = team.team_calendars;
    var shows = [], writes = [];
    List.iter(calendars, function(cal) {
      if (cal.calendar_default_view)
        showCalendars[cal.google_cal_id] = cal.calendar_timezone;
      if (cal.calendar_default_write)
        writes.push(cal);
    });
    writeToCalendar = writes === [] ? calendars[0] : writes[0];
    //showCalendars[writeToCalendar.google_cal_id] =
      //writeToCalendar.calendar_timezone;
    showTimezone = writeToCalendar.calendar_timezone;
    showZoneAbbr = zoneAbbr(showTimezone);

    List.iter(calendars, function(cal, i) {
'''
<div #calendarCheckboxRow class="esper-calendar-checkbox">
  <input #calendarCheckbox type="checkbox"/>
  <span #calendarName/>
</div>
'''
      if (cal.calendar_default_view)
        calendarCheckbox.prop("checked", true);

      var abbr = zoneAbbr(cal.calendar_timezone);

      calendarCheckbox.click(function() {
        if (this.checked)
          showCalendars[cal.google_cal_id] = cal.calendar_timezone;
        else
          delete showCalendars[cal.google_cal_id];
        calendarView.fullCalendar("refetchEvents");
      });

      calendarName.text(cal.calendar_title + " (" + abbr + ")");
      calendarCheckboxRow.data("tz", cal.calendar_timezone);
      calendarCheckboxRow.appendTo(userSidebar.calendarsContainer);
    });

    userSidebar.calendarsSection.show();

    refreshCal.click(function() {
      refreshCache = true;
      calendarView.fullCalendar("refetchEvents");
    });

    var title =
      CurrentThread.hasTask() ?
      CurrentThread.task.get().task_title :
      esperGmail.get.email_subject();
    eventTitle.val("HOLD: " + title);

    Sidebar.customizeSelectArrow(pickerSwitcher);

    for (var i = 0; i < calendars.length; i++) {
      var opt = $("<option value='" + i + "'>" +
                  calendars[i].calendar_title + "</option>");
      opt.appendTo(pickerSwitcher);
      if (calendars[i].google_cal_id === writeToCalendar.google_cal_id)
        pickerSwitcher.val(i);
    }
    pickerSwitcher.change(function() {
      var i = $(this).val();
      writeToCalendar = calendars[i];
      calendarView.fullCalendar("refetchEvents");
    });

    var guests = [];
    var emailData = esperGmail.get.email_data();
    if (emailData !== undefined && emailData.people_involved !== undefined) {
      List.iter(emailData.people_involved, function(pair) {
        guests.push(pair[0]);
      });
    }
    guestNames.text(guests.join(", "));

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

  /* Given an ISO 8601 timestamp in local time (without timezone info),
     assume its timezone is fromTZ (the calendar zone)
     and apply the necessary changes to express it in toTZ (display zone).
  */
  function shiftTime(timestamp, fromTZ, toTZ) {
    var local = timestamp.replace(/Z$/, "");
    var inCalendarTZ = (<any> moment).tz(local, fromTZ);
    var inDisplayTZ = (<any> inCalendarTZ).tz(toTZ);
    return (<any> inDisplayTZ).format();
  }

  /* An event along with the timezone of the calendar that it's on,
     so we know how to interpret its local start/end times.
  */
  interface TZCalendarEvent extends ApiT.CalendarEvent {
    calendarTZ : string;
  }

  /*
    Translate calendar events as returned by the API into
    the format supported by Fullcalendar.

    Input event type: calendar_event defined in api.atd
    Output event type:
      http://arshaw.com/fullcalendar/docs2/event_data/Event_Object/
  */
  function importEvents(esperEvents : TZCalendarEvent[]) {
    return List.map(esperEvents, function(x) {
      var ev = {
        title: x.title, /* required */
        allDay: x.all_day,
        start: shiftTime(x.start.local, x.calendarTZ, showTimezone), /* req */
        end: shiftTime(x.end.local, x.calendarTZ, showTimezone), /* req */
        orig: x /* custom field */
      };
      return ev;
    });
  }

  function addTZToEvents(calid, events) {
    return List.map(events, function(ev) {
      (<TZCalendarEvent> ev).calendarTZ = showCalendars[calid];
      return ev;
    });
  }

  function fetchEvents(team: ApiT.Team,
                       momentStart, momentEnd, tz, callback) {
    var start = momentStart.toDate();
    var end = momentEnd.toDate();
    var cacheFetches : JQueryPromise<TZCalendarEvent[]>[] =
      List.map(Object.keys(showCalendars), function(calid) {
        var cache = CalCache.getCache(team.teamid, calid);
        if (refreshCache) {
          return cache.fetch(start, end).then(function(calEvents) {
            return addTZToEvents(calid, calEvents);
          });
        } else {
          var cached = cache.get(start, end);
          var fetch =
            (cached === null) ?
            cache.fetch(start, end) :
            Promise.defer(cached);
          return fetch.then(function(calEvents) {
            return addTZToEvents(calid, calEvents);
          });
        }
      });
    Promise.join(cacheFetches).done(function(ll) {
      var esperEvents = List.concat(ll);
      var fullcalEvents = importEvents(esperEvents);
      refreshCache = false;
      callback(fullcalEvents);
    });
  }

  function setupCalendar(team: ApiT.Team,
                         picker : PickerView) {
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
      events: function(momentStart, momentEnd, tz, callback) {
        return fetchEvents(team, momentStart, momentEnd, tz, callback);
      }
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
    eventLocation : JQuery;
    render : () => void;
  }

  /*
    Create date and time picker using user's calendar.
  */
  function createPicker(refreshCal, userSidebar, team: ApiT.Team) : Picker {
    var pickerView = createView(refreshCal, userSidebar, team);
    setupCalendar(team, pickerView);

    function render() {
      pickerView.calendarView.fullCalendar("render");
      $(".fc-day-grid").find("td").first()
        .html("all-day<br/>(" + showZoneAbbr + ")");
    }

    return {
      view: pickerView.view,
      events: pickerView.events,
      eventTitle: pickerView.eventTitle,
      eventLocation: pickerView.eventLocation,
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

  function makeEventEdit(ev : FullCalendar.EventObject,
                         eventTitle, eventLocation)
    : ApiT.CalendarEventEdit
  {
    return {
      google_cal_id: writeToCalendar.google_cal_id,
      start: calendarTimeOfMoment(ev.start),
      end: calendarTimeOfMoment(ev.end),
      title: eventTitle.val(),
      location: { title: "", address: eventLocation.val() },
      guests: []
    };
  }

  export function createModal(team: ApiT.Team,
                              threadId: string) : void {
'''
<div #view class="esper-modal-bg">
  <div #modal class="esper-calendar-modal">
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

    var userInfo = UserTab.viewOfUserTab(team, Sidebar.profiles);
    var picker = createPicker(refreshCal, userInfo, team);
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
      picker = createPicker(refreshCal, userInfo, team);
      calendar.children().remove();
      calendar.append(picker.view);
      picker.render();
    };

    view.click(closeModal);
    Util.preventClickPropagation(modal);
    cancel.click(closeModal);

    save.click(function() {
      var events = [];
      for (var k in picker.events) {
        var edit = makeEventEdit(picker.events[k],
                                 picker.eventTitle, picker.eventLocation);
        events.push(edit);
      }

      // Wait for link
      var linkCalls = List.map(events, function(ev) {
        return Api.createLinkedEvent(
          team.teamid,
          ev,
          threadId
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
              team.teamid,
              threadId,
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
