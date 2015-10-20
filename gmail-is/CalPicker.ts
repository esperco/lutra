/*
  Date-time-duration picker using calendar containing read-only events
  retrieved from the user's calendar.
*/

module Esper.CalPicker {

  // The calendar that the created events go on
  export var writeToCalendar : ApiT.Calendar;

  // An "error" to signal that the user has canceled an action or that event
  // validation has failed that we can pass via callback -- this is used
  // to turn off the busy spinner. Use to distinguish from a server or other
  // error.
  class HaltEventSave extends Error {}

  // The team calendars whose events are currently displayed
  var showCalendars : { [calid : string] : string /* tz */ } = {};

  // The timezone that these calendars are displayed in
  var showTimezone : string; // America/Los_Angeles, America/New_York, etc.
  var guestTimezone : string;
  var showZoneAbbr : string; // PST, EDT, etc.
  var guestZoneAbbr : string;

  /* This should be a parameter to fetchEvents, but fullCalendar calls
     that function for us, and I can only trigger it by doing
     x.fullCalendar("refetchEvents"), which takes no other parameters. */
  var refreshCache = false;

  // ditto
  var meetingType = "other";

  export interface TZEventObj extends FullCalendar.EventObject {
    tz : string; // value of showTimezone when this event was drawn
    recurrence : ApiT.Recurrence;
  }

  interface PickerView {
    view : JQuery;
    calendarPickerContainer : JQuery;
    dateJumper : JQuery;
    eventTitle : JQuery;
    eventLocation : JQuery;
    locationDropdown : JQuery;
    pickerSwitcher : JQuery;
    execTzDiv : JQuery;
    guestTzDiv : JQuery;
    viewCalInput : JQuery;
    viewCalDropdown : JQuery;
    calendarView : JQuery;
    events : { [eventId : string] : TZEventObj };
  }

  export function zoneAbbr(zoneName) {
    return /UTC$/.test(zoneName) || /GMT$/.test(zoneName) ?
      "UTC" : // moment-tz can't handle it
      (<any> moment).tz(moment(), zoneName).zoneAbbr();
  }

  function updateZoneAbbrDisplay() {
    $(".fc-day-grid").find("td").first()
      .html("all-day<br/>(" + showZoneAbbr + ")");
  }

  /** The dropdown menu to select a meeting type or workplace. */
  function meetingTypeMenu() {
'''
<select #container class="esper-select">
</div>
'''
    var types = ["other", "phone_call", "video_call", "breakfast",
                 "brunch", "lunch", "coffee", "dinner", "drinks"];
    types.forEach(function (type) {
'''
<option #option></option>
'''
      option.text(type.replace("_", " "));
      option.attr("value", type);
      container.append(option);
    });

    CurrentThread.withPreferences(function (prefs) {
      var places = Preferences.workplaceMap(prefs);

      for (var title in places) {
'''
<option #option></option>
'''
        option.text(title);
        option.attr("value", title);
        container.append(option);
      }
    });

    Sidebar.customizeSelectArrow(container);

    return container;
  }

  function createView(refreshCal: JQuery,
                      userSidebar: UserTab.UserTabView,
                      team: ApiT.Team,
                      tpref: ApiT.TaskPreferences) : PickerView {
'''
<div #view>
  <div #calendarPickerContainer class="hide">
    <div #dateJumper class="esper-date-jumper" style="display: none"/>
    <div class="esper-calendar-modal-event-settings esper-clearfix esper-bs">
      <div class="container-fluid"><div class="row">
        <div class="col-md-6 col-lg-4">
          <div class="form-group">
            <label class="control-label">Event Title</label>
            <input #eventTitle type="text" class="form-control"/>
          </div>
          <div class="form-group">
            <label class="control-label">Location</label>
            <div class="dropdown">
              <input #eventLocation type="text" class="form-control"
                     data-toggle="dropdown" />
              <ul #locationDropdown class="dropdown-menu" />
            </div>
          </div>
        </div>
        <div class="col-md-6 col-lg-4">
          <div class="form-group">
            <label class="control-label">View Calendars</label>
            <div class="dropdown">
              <select #viewCalInput class="esper-select form-control"
                      data-toggle="dropdown" />
              <ul #viewCalDropdown class="dropdown-menu" />
            </div>
          </div>
          <div class="form-group">
            <label class="control-label">Save Events To</label>
            <select #pickerSwitcher class="esper-select form-control"/>
          </div>
        </div>
        <div class="col-md-12 col-lg-4"><div class="row">
          <div class="col-md-6 col-lg-12 form-group">
            <label class="control-label">Executive Timezone</label>
            <div #execTzDiv />
          </div>
          <div class="col-md-6 col-lg-12 form-group">
            <label class="control-label">Guest Timezone</label>
            <div #guestTzDiv />
          </div>
        </div>
      </div></div>
    </div></div>
    <div class="esper-modal-dialog esper-cal-picker-modal">
      <div class="esper-modal-content esper-cal-picker-modal">
        <div #calendarView class="esper-cal-picker-container"/>
      </div>
    </div>
  </div>
</div>
'''
    var prefs = Teams.getTeamPreferences(team);
    showCalendars = {}; // Clear out old entries from previous views
    userSidebar.calendarsContainer.children().remove();

    var calendars = team.team_calendars;
    var writes = [];
    List.iter(calendars, function(cal) {
      if (cal.calendar_default_view) {
        showCalendars[cal.google_cal_id] = cal.calendar_timezone;
      }
      if (cal.calendar_default_write) {
        writes.push(cal);
      }
    });
    writeToCalendar = writes[0] || calendars[0];

    /* showTimezone: timezone used for the executive and for calendar display
       guestTimezone: timezone used for the guests unless they have
                      their own individual timezone, set later
                      during event finalization */
    showTimezone = tpref.executive_timezone || prefs.general.current_timezone;
    guestTimezone = tpref.guest_timezone || showTimezone;

    showZoneAbbr = zoneAbbr(showTimezone);
    guestZoneAbbr = zoneAbbr(guestTimezone);

    eventLocation.dropdown();
    function searchLocation() {
      var query = eventLocation.val();
      LocSearch.displayResults(team, eventLocation, locationDropdown,
                               query, prefs);
    }
    Util.afterTyping(eventLocation, 250, searchLocation);
    eventLocation.click(function() {
      searchLocation();
      Analytics.track(Analytics.Trackable.EditCalendarPickerLocation);
    });

    refreshCal.click(function() {
      refreshCache = true;
      calendarView.fullCalendar("refetchEvents");
    });

    var title =
      CurrentThread.hasTask() ?
      CurrentThread.task.get().task_title :
      GmailJs.get.email_subject();
    eventTitle.val("HOLD: " + title);
    eventTitle.click(function() {
      Analytics.track(Analytics.Trackable.EditCalendarPickerEventTitle);
    });

    Sidebar.customizeSelectArrow(pickerSwitcher);
    Sidebar.customizeSelectArrow(viewCalInput);

    for (var i = 0; i < calendars.length; i++) {
      var opt = $("<option value='" + i + "'>" +
                  calendars[i].calendar_title + "</option>");
      opt.appendTo(pickerSwitcher);
      if (calendars[i].google_cal_id === writeToCalendar.google_cal_id) {
        pickerSwitcher.val(i.toString());
      }
    }

    pickerSwitcher.change(function() {
      var i = $(this).val();
      writeToCalendar = calendars[i];
      calendarView.fullCalendar("refetchEvents");
    });

    pickerSwitcher.click(function() {
      Analytics.track(Analytics.Trackable.ClickCalendarPickerSaveEventsTo);
    });

    function updateCalendarViewList() {
      var curViewList = [];
      List.iter(calendars, function(cal) {
        if (showCalendars[cal.google_cal_id]) {
          curViewList.push(cal.calendar_title);
        }
      });
      viewCalInput.children().remove();
      viewCalInput.append("<option>" + curViewList.join(", ") + "</option>");
    }
    updateCalendarViewList();
    viewCalInput.dropdown();
    viewCalInput.mousedown(function(e) {
      e.preventDefault();
      viewCalDropdown.outerWidth(viewCalInput.outerWidth());
      viewCalInput.dropdown('toggle');
      Analytics.track(Analytics.Trackable.ClickCalendarPickerViewCalendar);
    });
    List.iter(calendars, function(cal, i) {
'''
<li #calendarCheckboxRow class="esper-calendar-checkbox esper-li esper-click-safe">
  <span #fakeCheckbox class="fa fa-fw esper-fake-checkbox" />
  <span #calendarName class="esper-fake-checkbox-text"/>
</li>
'''
      var calColor = colorForCalendar(team, cal);
      fakeCheckbox.css("background", calColor.background);
      fakeCheckbox.css("color", calColor.foreground);

      function isChecked() {
        return fakeCheckbox.hasClass("fa-check");
      }

      function makeChecked(checked) {
        if (checked) {
          fakeCheckbox.addClass("fa-check");
        } else {
          fakeCheckbox.removeClass("fa-check");
        }
      }

      if (cal.calendar_default_view) {
        makeChecked(true);
      }
      var abbr = zoneAbbr(cal.calendar_timezone);
      calendarCheckboxRow.click(function() {
        fakeCheckbox.click();
      });
      fakeCheckbox.click(function(e) {
        e.stopPropagation();
        if (isChecked()) {
          makeChecked(false);
          delete showCalendars[cal.google_cal_id];
        } else {
          makeChecked(true);
          showCalendars[cal.google_cal_id] = cal.calendar_timezone;
        }
        calendarView.fullCalendar("refetchEvents");
        updateCalendarViewList();
      });
      calendarName.text(cal.calendar_title + " (" + abbr + ")");
      calendarCheckboxRow.data("tz", cal.calendar_timezone);
      calendarCheckboxRow.appendTo(viewCalDropdown);
    });

    var execTz = Timezone.appendTimezoneSelector(execTzDiv, showTimezone);
    execTz.parent().css("display", "block");
    execTz.addClass("form-control");
    var guestTz = Timezone.appendTimezoneSelector(guestTzDiv, guestTimezone);
    guestTz.parent().css("display", "block");
    guestTz.addClass("form-control");

    execTz.bind("typeahead:change", function() {
      var tz = Timezone.selectedTimezone(execTz);
      showTimezone = tz;
      showZoneAbbr = zoneAbbr(tz);
      updateZoneAbbrDisplay();
      calendarView.fullCalendar("refetchEvents");
      tpref.executive_timezone = tz;
      Api.putTaskPrefs(tpref);
    });
    execTz.click(function() {
      Analytics.track(Analytics.Trackable.SelectCalendarPickerExecutiveTimezone);
    });

    guestTz.bind("typeahead:change", function() {
      var tz = Timezone.selectedTimezone(guestTz);
      guestTimezone = tz;
      guestZoneAbbr = zoneAbbr(tz);
      calendarView.fullCalendar("refetchEvents");
      tpref.guest_timezone = tz;
      Api.putTaskPrefs(tpref);
    });
    guestTz.click(function() {
      Analytics.track(Analytics.Trackable.SelectCalendarPickerGuestTimezone);
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
      editable: true,
      tz: showTimezone,
      recurrence: null
    };
    picker.events[eventId] = eventData;
    var stick = false;
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
    return CurrentThread.currentTeam.get().match({
      some : function (team) {
        return List.map(esperEvents, function(x) {
          var ev = {
            title: x.title, /* required */
            allDay: x.all_day,
            start: Timezone.shiftTime(x.start.local,
                                      x.calendarTZ,
                                      showTimezone), /* req */
            end: Timezone.shiftTime(x.end ? x.end.local : x.start.local,
                                    x.calendarTZ,
                                    showTimezone), /* req */
            orig: x /* custom field */
          };

          // Display ghost calendar events in gray
          var evCal =
            List.find(team.team_calendars, function(cal : ApiT.Calendar) {
              return cal.google_cal_id === x.google_cal_id;
            });
          var colors = colorForCalendar(team, evCal);
          ev["color"] = colors.background;
          ev["textColor"] = colors.foreground;
          return ev;
        });
      },
      none : function () {
        // TODO: Handle more gracefully?
        window.alert("Cannot fetch events: current team not detected.");
        return [];
      }
    });
  }

  function addTZToEvents(calid: string, events: ApiT.CalendarEvent[]) {
    return List.map(events, function(ev) {
      (<TZCalendarEvent> ev).calendarTZ = showCalendars[calid];
      return ev;
    });
  }

  function fetchEvents(team: ApiT.Team, picker,
                       momentStart, momentEnd, tz, callback) {
    var start = momentStart.toDate();
    var end = momentEnd.toDate();
    var cacheFetches : JQueryPromise<TZCalendarEvent[]>[] =
      List.map(Object.keys(showCalendars), function(calid) {
        var cache = CalCache.getCache(team.teamid, calid);
        if (refreshCache) {
          return cache.refresh(start, end).then(function(calEvents) {
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
      refreshCache = false;
      var normalEvents = importEvents(esperEvents);

      // Reinterpret drawn events in current showTimezone
      var movedEdits = [];
      for (var k in picker.events) {
        var ev = picker.events[k];
        removeEvent(picker, ev.google_event_id);
        var startTime = ev.start.toISOString();
        var endTime = ev.end ? ev.end.toISOString() : ev.start.toISOString();
        ev.start = moment.utc(
          Timezone.shiftTime(startTime, ev.tz, showTimezone)
        );
        ev.end = moment.utc(
          Timezone.shiftTime(endTime, ev.tz, showTimezone)
        );
        ev.tz = showTimezone;
        movedEdits.push(ev);
      }
      var withEdits = normalEvents.concat(movedEdits);

      function invokeCallback(backgroundEvents) {
        callback(withEdits.concat(backgroundEvents));
      }
      BackgroundEvents.meetingTimes(meetingType, momentStart, momentEnd,
                                    invokeCallback);
    });
  }

  function setupCalendar(team: ApiT.Team,
                         picker : PickerView) {
    var calendarView = picker.calendarView;
    var calendarJump = picker.dateJumper;
    refreshCache = true;

    function setEventMoments(startMoment, endMoment, eventId) {
      if (eventId !== undefined) removeEvent(picker, eventId);
      Log.d(startMoment, endMoment);
      createPickedCalendarEvent(picker, startMoment, endMoment);
    }

    function select(startMoment, endMoment) {
      setEventMoments(startMoment, endMoment, undefined);
    }

    function eventClick(calEvent, jsEvent, viewObj) {
'''
<div class="esper-event-click-menu" #view>
  <ul class="esper-ul" #menu/>
</div>
'''
      $(".esper-event-click-menu").remove();
      menu.css({
        "background-color": "white",
        border: "2px solid black",
        position: "absolute",
        left: jsEvent.pageX,
        top: jsEvent.pageY,
        "z-index": 6
      });
      if (!calEvent.orig) {
        $("<li class='esper-li'>Repeat...</li>")
          .click(function() {
            var ev = picker.events[calEvent.id];
            Recur.load(team, ev);
            view.remove();
          })
          .appendTo(menu);
        $("<li class='esper-li'>Remove event</li>")
          .click(function() {
            removeEvent(picker, calEvent.id);
            view.remove();
          })
          .appendTo(menu);
        $("<li class='esper-li'>Close menu</li>")
          .click(function() { view.remove(); })
          .appendTo(menu);
        view.appendTo($("body"));
      }
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
      var guestTime = "";
      if (showTimezone !== guestTimezone) {
        var start = calEvent.start, end = calEvent.end;
        var guestStart =
          Timezone.shiftTime(start.format(), showTimezone, guestTimezone);
        var guestEnd =
          Timezone.shiftTime(end ? end.format() : start.format(),
                             showTimezone, guestTimezone);
        guestTime =
          " (" + moment(guestStart).format("h:mm") + " - " +
          moment(guestEnd).format("h:mm a") + " " + guestZoneAbbr + ")";
      }

      var address = "";
      var orig = calEvent.orig;
      var loc;
      if (orig !== undefined) loc = orig.location;
      if (loc !== undefined) {
        address = loc.address;
        if (loc.title !== "") {
          address = loc.title + " - " + address;
        }
      }

      if (guestTime !== "" || address !== "") {
        element
          .attr("title", "")
          .tooltip({
            show: { effect: "none" },
            hide: { effect: "none" },
            "content": address + guestTime,
            "position": { my: 'center bottom', at: 'center top-7' },
            "tooltipClass": "esper-top esper-tooltip"
          });
      }
    }

    var calHeight = (window.innerHeight * 0.9) - 198;

    calendarView.fullCalendar({
      header: {
        left: 'today prev,next',
        center: 'title',
        right: 'agendaDay,agendaWeek,month'
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
        return fetchEvents(team, picker, momentStart, momentEnd,
                           tz, callback);
      }
    });

    function dateJump(date, view) {
      Log.d("Jump");
      calendarView.fullCalendar('gotoDate', date);
    }

    calendarJump.datepicker({onSelect : dateJump});

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
  function createPicker(refreshCal: JQuery,
                        userSidebar: UserTab.UserTabView,
                        team: ApiT.Team,
                        tpref: ApiT.TaskPreferences) : Picker {
    var pickerView = createView(refreshCal, userSidebar, team, tpref);
    setupCalendar(team, pickerView);

    // add the meeting type menu:
    var menu = meetingTypeMenu();
    pickerView.view.find(".fc-left").append(menu);
    menu.change(function () {
      meetingType = menu.val();
      pickerView.calendarView.fullCalendar("refetchEvents");
    });
    menu.click(function() {
      Analytics.track(Analytics.Trackable.SelectCalendarPickerMeetingType);
    })

    var type = UserTab.currentMeetingType;
    if (menu.find("option[value='" + type + "']").length > 0) {
      meetingType = type;
      menu.val(type);
    }

    function render() {
      pickerView.calendarView.fullCalendar("render");
      updateZoneAbbrDisplay();
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
    // Handles FullCalendar's "ambiguous time" moments by setting the
    // time to midnight for full-day events.
    var localTime = localMoment.hasTime() ?
      localMoment.toISOString() :
      localMoment.time('00:00').toISOString();

    var utcMoment = utcOfLocal(showTimezone, localMoment);
    var utcTime = utcMoment.toISOString();
    return { utc: utcTime, local: localTime };
  }

  function makeEventEdit(ev : TZEventObj, eventTitle,
                         eventLocation, prefs: ApiT.Preferences)
    : ApiT.CalendarEventEdit
  {
    var title = eventTitle.val();
    var eventEdit : ApiT.CalendarEventEdit = {
      google_cal_id: writeToCalendar.google_cal_id,
      start: calendarTimeOfMoment(ev.start),
      end: calendarTimeOfMoment(ev.end),
      title: title,
      location: { title: "", address: eventLocation.val(), timezone: showTimezone },
      guests: [],
      recurrence: ev.recurrence
    };
    var gen = prefs.general;
    if (gen && gen.hold_event_color && /^HOLD: /.test(title)) {
      eventEdit.color_id = gen.hold_event_color.key;
    }
    return eventEdit;
  }

  //make event with data available so that it can be rendered in the UI
  function makeFakeEvent(ev : FullCalendar.EventObject, eventTitle,
                         eventLocation)
    : ApiT.CalendarEvent
  {
    var title = eventTitle.val();

    // FullCalendar extends Moment.js with "ambiguous times" which are
    // dates that do not specify a time. These are used for full-day
    // events.
    //
    // The <any> is a hack because we want to use the FullCalendar
    // custom moment and DefinitelyTyped has ev.start as a Date.
    var isFullDay = !(<any> ev.start).hasTime();

    var event : ApiT.CalendarEvent = {
      google_event_id: "",
      google_cal_id: writeToCalendar.google_cal_id,
      start: calendarTimeOfMoment(ev.start),
      end: calendarTimeOfMoment(ev.end),
      title: title,
      description_messageids: [],
      location: { title: "", address: eventLocation.val() },
      guests: [],
      all_day: isFullDay
    };
    return event;
  }

  //save events added in the picker
  function saveEvents(picker, team: ApiT.Team, task: ApiT.Task,
                      threadId: string, callback: (err?: Error) => void) {
    var prefs = Teams.getTeamPreferences(team);
    var events = [];
    for (var k in picker.events) {
      var edit = makeEventEdit(picker.events[k], picker.eventTitle,
                               picker.eventLocation, prefs);
      events.push(edit);
    }

    // Wait for link
    var linkCalls = List.map(events, function(ev) {
      return Api.createTaskLinkedEvent(
        Login.myEmail(),
        team.teamid,
        ev,
        task.taskid
      );
    });

    // If the task title was never set, update it based on the event
    var emailSubject = GmailJs.get.email_subject();
    var taskTitle = task.task_title;
    var eventTitle = picker.eventTitle.val();
    if (taskTitle === emailSubject) {
      var newTaskTitle = eventTitle.replace(/^HOLD: /, "");
      Api.setTaskTitle(task.taskid, newTaskTitle);
      task.task_title = newTaskTitle;
      CurrentThread.setTask(task);
      $(".esper-task-name").val(newTaskTitle);
    }

    if (events.length > 0) {
      TaskTab.currentTaskTab.linkedEventsList.children().remove();
      TaskTab.currentTaskTab.linkedEventsSpinner.show();
    }
    Promise.join(linkCalls).done(function(linkedEvents) {
      callback();
      if (events.length > 0) TaskTab.refreshLinkedEventsAction();

      // Signal that the linked events have changed
      // and that they must be refreshed from the server
      CurrentThread.linkedEventsChange.set(null);

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
    }).fail(function(err) {
      callback(err);
    });
  }

  function confirmEvents(view, picker, team: ApiT.Team, task: ApiT.Task,
                         threadId: string,
                         callback: (err?: Error) => void) {
    var prefs = Teams.getTeamPreferences(team).general;
    var onCommit = function() : boolean {
      var events = [];
      for (var k in picker.events) {
        var edit = makeFakeEvent(picker.events[k], picker.eventTitle,
                                 picker.eventLocation);
        events.push(edit);
      }

      var cals = List.filter(team.team_calendars, function(cal) {
                   return cal.google_cal_id === writeToCalendar.google_cal_id;
                 });
      Promise.join(
        List.map(events, function(event) {
          var start = Math.floor(moment(event.start.utc).unix());
          var end = Math.floor(
            moment(event.end ? event.end.utc : event.start.utc).unix()
          );
          return Api.eventRange(team.teamid, cals, start, end);
        })
      ).done(function(all_results) {
        var filtered_results = List.filterMap(all_results, function(result, i) {
          if (result.events.length > 0) return [i, result.events];
          else return null;
        });

        if (filtered_results.length > 0 && prefs.double_booking_warning) {
          var confirmModal = displayConfirmEventModal(
            view, events, filtered_results, picker, team, task, threadId,
            callback);
          $("body").append(confirmModal.view);
        } else {
          saveEvents(picker, team, task, threadId, callback);
        }
      }).fail(function(err) {
        callback(new Error(err));
      });
      return true;
    };
    if (picker.eventLocation.val() == "" && prefs.no_location_warning) {
      var locationModal = displayCheckLocationModal();
      $("body").append(locationModal.view);
    } else {
      onCommit();
    }

    function displayCheckLocationModal() {
'''
<div #content>
  <p> The events being created do not have a location set. </p>
  <p> Do you still want to proceed? </p>
</div>
'''
      return Modal.okCancelDialog("Location Missing", content,
        onCommit,
        "Yes",
        function() { callback(new HaltEventSave("Location needed")); },
        "No");
    }
  }

  function displayConfirmEventModal(eventView, events: ApiT.CalendarEvent[],
                                    results,
                                    picker, team: ApiT.Team,
                                    task: ApiT.Task, threadId: string,
                                    callback: (err?: Error) => void) {
'''
<div #view class="esper-modal-bg">
  <div #modal class="esper-confirm-event-modal">
    <div class="esper-modal-header">Finalize Event</div>
    <div class="esper-modal-content">
      <p>You are trying to create the following events:</p>
      <div #creatingEvents class="esper-events-list"/>
      <p>However there are other events on the calendar during these time
      frames:</p>
      <div #conflictingEvents class="esper-events-list"/>
      <p>Are you sure you wish to proceed?</p>
    </div>
    <div class="esper-modal-footer esper-clearfix">
      <button #yesButton class="esper-btn esper-btn-primary modal-primary">
        Yes
      </button>
      <button #noButton class="esper-btn esper-btn-secondary modal-cancel">
        No
      </button>
    </div>
  </div>
</div>
'''
    var creating =
      List.map(results, function(result){ return events[result[0]]; });
    creating.forEach(function(ev) {
      creatingEvents.append(TaskList.renderEvent(team, ev));
    });

    var conflicting = List.map(results, function(result){ return result[1]; });
    conflicting.forEach(function(evs) {
      evs.forEach(function(ev) {
        conflictingEvents.append(TaskList.renderEvent(team, ev));
      });
    });

    function yesOption() {
      saveEvents(picker, team, task, threadId, callback);
      view.remove();
    }
    function noOption() {
      view.remove();
      callback(new HaltEventSave("Did not confirm"));
    }

    view.click(noOption);
    Util.preventClickPropagation(modal);
    yesButton.click(yesOption);
    noButton.click(noOption);

    return _view;
  }

  function createInlineSync(task: ApiT.Task,
                            threadId: string,
                            tpref: ApiT.TaskPreferences)
    : void
  {
'''
<div #view class="esper-centered-container">
  <div #inline>
    <div class="esper-modal-header">
      <div #refreshCal title class="esper-calendar-refresh">
        <object #refreshCalIcon class="esper-svg"/>
      </div>
      <div #title class="esper-modal-title"/>
    </div>
    <div #calendar class="esper-calendar-grid esper-scroll-target"/>
    <div class="esper-modal-footer esper-clearfix">
      <span #busySpinner class="esper-spinner"></span>
      <button #cancel class="esper-btn esper-btn-secondary">
        Cancel
      </button>
      <button #save class="esper-btn esper-btn-primary">
        Save
      </button>
    </div>
  </div>
</div>
'''

    CurrentThread.currentTeam.get().match({
      some : function (team) {
        function closeView() {
          Sidebar.selectTaskTab();
          view.remove();
        }

        function makeBusy() {
          busySpinner.show();
          save.prop("disabled", true);
        }

        function unmakeBusy() {
          busySpinner.hide();
          save.prop("disabled", false);
        }
        unmakeBusy();

        refreshCalIcon.attr("data", Init.esperRootUrl + "img/refresh.svg");
        title.text("Create linked events");

        var userInfo = UserTab.viewOfUserTab(team);
        var picker = createPicker(refreshCal, userInfo, team, tpref);
        calendar.append(picker.view);

        refreshCal.tooltip({
          show: { delay: 500, effect: "none" },
          hide: { effect: "none" },
          "content": "Refresh calendars",
          "position": { my: 'center bottom', at: 'center top-7' },
          "tooltipClass": "esper-top esper-tooltip"
        });

        cancel.click(function() {
          closeView();
          Analytics.track(Analytics.Trackable.ClickCalendarPickerCancel);
        });

        save.click(function() {
          makeBusy();
          confirmEvents(view, picker, team, task, threadId,
            function(err: Error) {
              if (err) {
                unmakeBusy();
              } else {
                closeView();
              }
            });
          Analytics.track(Analytics.Trackable.ClickCalendarPickerSave);
        });

        InThreadControls.setEventControlContainer(view);
        picker.render();
        Sidebar.selectUserTab();
        Gmail.scrollToEventControl();
      },
      none : function () {
        window.alert("Cannot create cal picker because no team is currently detected.");
      }
    });
  }

  export function createInline(): void
  {
    var threadId = CurrentThread.threadId.get();
    if (!threadId) { return; }

    var showSpinner = true;
    CurrentThread.getTaskForThread()
      .then(function(task) {
        showSpinner = false;  // See below
        CurrentThread.taskPrefs
          .then(Option.unwrap<ApiT.TaskPreferences>(
            "taskPrefs (in createInline)"))
          .done(function(tpref) {
            createInlineSync(task, threadId, tpref);
          });
      }, function() {
        hideCalPickerSpinner();
      });

    /*
      If Task already exists, then above call to getTaskForThread will resolve
      promise synchronously and showSpinner will be false.
    */
    if (showSpinner) {
      showCalPickerSpinner();
    }
  }

  function showCalPickerSpinner(): void {
    var spinner = $(`<div class="esper-spinner esper-inline-spinner"></div>`);
    InThreadControls.setEventControlContainer(spinner);
    Gmail.scrollToEventControl();
  }

  function hideCalPickerSpinner(): void {
    InThreadControls.setEventControlContainer($(`<span />`));
  }

  /*
    Currently no way to get calendar colors from Google without backend changes,
    so let's just use some pre-assigned colors based on the order in which
    we get our list of calendars for the team.

    Colors are pulled from Google Calendar and arranged in a way that ensures
    at least some contrast between neighboring colors in the list.
  */
  var presetColors: string[] = [
    "#9FE1E7",
    "#FFAD46",
    "#42D692",
    "#9A9CFF",
    "#FF7537",
    "#92E1C0",
    "#AC725E",
    "#16A765",
    "#D06B64",
    "#B99AFF",
    "#F83A22",
    "#C2C2C2",
    "#9FC6E7",
    "#FBE983",
    "#7BD148",
    // "#CD74E6", -- This color is too close to our "active" calendar color
    "#F691B2",
    "#CABDBF",
    "#4986E7",
    "#FAD165",
    "#B3DC6C",
    "#A47AE2",
    "#FA573C",
    "#CCA6AC"
  ];

  interface eventColor {
    background: string;
    foreground: string;
  }

  function colorForCalendar(team: ApiT.Team, calendar: ApiT.Calendar)
    : eventColor
  {
    var index = _.findIndex(team.team_calendars, function(teamCal) {
      return teamCal.google_cal_id === calendar.google_cal_id;
    });

    // Ghost calendar check
    if (/ Ghost$/.test(calendar.calendar_title)) {
      return {
        background: "#BCBEC0", // @gray_30
        foreground: "333"
      };
    }

    if (index < 0) {
      index = 0;
    }
    return {
      background: presetColors[index % presetColors.length],
      foreground: "#333"
    };
  }
}
