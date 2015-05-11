/*
  Date-time-duration picker using calendar containing read-only events
  retrieved from the user's calendar.
*/

module Esper.CalPicker {

  // The calendar that the created events go on
  export var writeToCalendar : ApiT.Calendar;

  // Who appears as the creator of events that we write to the calendar
  var createdByEmail : string;

  // The team calendars whose events are currently displayed
  var showCalendars : { [calid : string] : string /* tz */ } = {};

  // The timezone that these calendars are displayed in
  var showTimezone : string; // America/Los_Angeles, America/New_York, etc.
  var showZoneAbbr : string; // PST, EDT, etc.

  /* This should be a parameter to fetchEvents, but fullCalendar calls
     that function for us, and I can only trigger it by doing
     x.fullCalendar("refetchEvents"), which takes no other parameters. */
  var refreshCache = false;

  // ditto
  var meetingType = "other";

  interface PickerView {
    view : JQuery;
    calendarPickerContainer : JQuery;
    dateJumper : JQuery;
    eventTitle : JQuery;
    eventLocation : JQuery;
    pickerSwitcher : JQuery;
    createdBy : JQuery;
    displayTz : JQuery;
    guestNames : JQuery;
    calendarView : JQuery;
    events : { [eventId : string] : FullCalendar.EventObject };
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

  /** A set of 9 (!) buttons to choose the meeting type. */
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

    Sidebar.customizeSelectArrow(container);

    return container;
  }

  function createView(refreshCal: JQuery,
                      userSidebar: UserTab.UserTabView,
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
      <div class="esper-event-settings-col">
        <span class="esper-bold">Created by:</span>
        <select #createdBy class="esper-select"/>
      </div>
      <div class="esper-event-settings-col">
        <span class="esper-bold">Display timezone:</span>
        <select #displayTz class="esper-select"/>
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
    showTimezone = prefs.general.current_timezone;
    showZoneAbbr = zoneAbbr(showTimezone);

    List.iter(calendars, function(cal, i) {
'''
<div #calendarCheckboxRow class="esper-calendar-checkbox">
  <input #calendarCheckbox type="checkbox"/>
  <span #calendarName/>
</div>
'''
      if (cal.calendar_default_view) {
        calendarCheckbox.prop("checked", true);
      }

      var abbr = zoneAbbr(cal.calendar_timezone);

      calendarCheckbox.click(function() {
        if (this.checked) {
          showCalendars[cal.google_cal_id] = cal.calendar_timezone;
        } else {
          delete showCalendars[cal.google_cal_id];
        }
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
      if (calendars[i].google_cal_id === writeToCalendar.google_cal_id) {
        pickerSwitcher.val(i);
      }
    }
    pickerSwitcher.change(function() {
      var i = $(this).val();
      writeToCalendar = calendars[i];
      calendarView.fullCalendar("refetchEvents");
    });

    var aliases = team.team_email_aliases;
    createdBy.children().remove();
    if (aliases.length === 0) {
      $("<option>" + Login.myEmail() + "</option>").appendTo(createdBy);
      createdBy.prop("disabled", true);
      createdByEmail = Login.myEmail();
    } else {
      aliases.forEach(function(email : string, i) {
        $("<option>" + email + "</option>").appendTo(createdBy);
        if (i === 0) createdByEmail = email;
      });
      createdBy.change(function() {
        createdByEmail = $(this).val();
      });
    }

    var popularZones = [
      "America/New_York",
      "America/Chicago",
      "America/Denver",
      "America/Los_Angeles"
    ];
    var calendarZones =
      List.filterMap(team.team_calendars, function(cal : ApiT.Calendar) {
        return cal.calendar_timezone; // filtered out if undefined
      });

    /* List of timezones for the dropdown, starting with
       the default timezone which is the one from
       the executive's preferences */
    var dispZones =
      List.union(List.union([showTimezone], calendarZones),
                 popularZones);

    List.iter(dispZones, function(tz) {
      var abbr = zoneAbbr(tz);
      $("<option value=\"" + tz + "\">" + abbr + " (" + tz + ")</option>")
        .attr("selected", tz === showTimezone)
        .appendTo(displayTz);
    });
    displayTz.change(function() {
      var tz = $(this).val();
      showTimezone = tz;
      showZoneAbbr = zoneAbbr(tz);
      updateZoneAbbrDisplay();
      calendarView.fullCalendar("refetchEvents");
    });

    var guests = CurrentThread.getParticipants().map(function(guest) {
      // With a fallback if the display name is not set:
      return guest.display_name || guest.email;
    });
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
      editable: true,
      tz: showTimezone
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
    return CurrentThread.team.get().match({
      some : function (team) {
        return List.map(esperEvents, function(x) {
          var ev = {
            title: x.title, /* required */
            allDay: x.all_day,
            start: Timezone.shiftTime(x.start.local,
                                      x.calendarTZ,
                                      showTimezone), /* req */
            end: Timezone.shiftTime(x.end.local,
                                    x.calendarTZ,
                                    showTimezone), /* req */
            orig: x /* custom field */
          };

          // Display ghost calendar events in gray
          var evCal =
            List.find(team.team_calendars, function(cal : ApiT.Calendar) {
              return cal.google_cal_id === x.google_cal_id;
            });
          if (/ Ghost$/.test(evCal.calendar_title)) {
            ev["color"] = "#BCBEC0"; // @gray_30
          }

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

  function addTZToEvents(calid, events) {
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
      refreshCache = false;
      var normalEvents = importEvents(esperEvents);

      // Reinterpret drawn events in current showTimezone
      var movedEdits = [];
      for (var k in picker.events) {
        var ev = picker.events[k];
        removeEvent(picker, ev.google_event_id);
        var startTime = ev.start.toISOString();
        var endTime = ev.end.toISOString();
        ev.start = moment.utc(
          Timezone.shiftTime(startTime, (<any> ev).tz, showTimezone)
        );
        ev.end = moment.utc(
          Timezone.shiftTime(endTime, (<any> ev).tz, showTimezone)
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
        if (loc.title !== "") {
          address = loc.title + " - " + address;
        }
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
        return fetchEvents(team, picker, momentStart, momentEnd,
                           tz, callback);
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
  function createPicker(refreshCal: JQuery,
                        userSidebar: UserTab.UserTabView,
                        team: ApiT.Team) : Picker {
    var pickerView = createView(refreshCal, userSidebar, team);
    setupCalendar(team, pickerView);

    // add the meeting type menu:
    var menu = meetingTypeMenu();
    pickerView.view.find(".fc-left").append(menu);
    menu.change(function () {
      meetingType = menu.val();
      pickerView.calendarView.fullCalendar("refetchEvents");
    });

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
    var localTime = localMoment.toISOString();
    var utcMoment = utcOfLocal(showTimezone, localMoment);
    var utcTime = utcMoment.toISOString();
    return { utc: utcTime, local: localTime };
  }

  function makeEventEdit(ev : FullCalendar.EventObject, eventTitle,
                         eventLocation, prefs: ApiT.Preferences)
    : ApiT.CalendarEventEdit
  {
    var title = eventTitle.val();
    var eventEdit : ApiT.CalendarEventEdit = {
      google_cal_id: writeToCalendar.google_cal_id,
      start: calendarTimeOfMoment(ev.start),
      end: calendarTimeOfMoment(ev.end),
      title: title,
      location: { title: "", address: eventLocation.val() },
      guests: []
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
    var event : ApiT.CalendarEvent = {
      google_event_id: "",
      google_cal_id: writeToCalendar.google_cal_id,
      start: calendarTimeOfMoment(ev.start),
      end: calendarTimeOfMoment(ev.end),
      title: title,
      location: { title: "", address: eventLocation.val() },
      guests: []
    };
    return event;
  }

  //save events added in the picker
  function saveEvents(closePicker, picker,
                      team: ApiT.Team,
                      task: ApiT.Task,
                      threadId: string) {
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
        createdByEmail,
        team.teamid,
        ev,
        task.taskid
      );
    });

    // If the task title was never set, update it based on the event
    var emailSubject = esperGmail.get.email_subject();
    var taskTitle = task.task_title;
    var eventTitle = picker.eventTitle.val();
    if (taskTitle === emailSubject) {
      var newTaskTitle = eventTitle.replace(/^HOLD: /, "");
      Api.setTaskTitle(task.taskid, newTaskTitle);
      task.task_title = newTaskTitle;
      CurrentThread.task.set(task);
      $(".esper-task-name").val(newTaskTitle);
    }

    closePicker();
    if (events.length > 0) {
      TaskTab.currentTaskTab.linkedEventsList.children().remove();
      TaskTab.currentTaskTab.linkedEventsSpinner.show();
    }
    Promise.join(linkCalls).done(function(linkedEvents) {
      if (events.length > 0) TaskTab.refreshLinkedEventsAction();

      CurrentThread.linkedEventsChanged();

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
  }

  function confirmEvents(view, closePicker,
                        picker, team: ApiT.Team,
                        task: ApiT.Task,
                        threadId: string) {
    var events = [];
    for (var k in picker.events) {
      var edit = makeFakeEvent(picker.events[k], picker.eventTitle,
                               picker.eventLocation);
      events.push(edit);
    }

    Promise.join(
      List.map(events, function(event) {
        var start = Math.floor(Date.parse(event.start.utc)/1000);
        var end = Math.floor(Date.parse(event.end.utc)/1000);
        return Api.eventRange(team.teamid, team.team_calendars, start, end);
      })
    ).done(function(all_results) {
      var filtered_results = List.filterMap(all_results, function(result, i) {
        if (result.events.length > 0) return [i, result.events];
        else return null;
      });

      if (filtered_results.length > 0) {
        var confirmModal = displayConfirmEventModal(view, closePicker, events,
          filtered_results, picker, team, task, threadId);
        $("body").append(confirmModal.view);
      } else {
        saveEvents(closePicker, picker, team, task, threadId);
      }
    });
  }

  function displayConfirmEventModal(eventView, closePicker,
                                    events: ApiT.CalendarEvent[],
                                    results,
                                    picker, team: ApiT.Team,
                                    task: ApiT.Task,
                                    threadId: string) {
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
      saveEvents(closePicker, picker, team, task, threadId);
      view.remove();
    }
    function noOption() { view.remove(); }

    view.click(noOption);
    Util.preventClickPropagation(modal);
    yesButton.click(yesOption);
    noButton.click(noOption);

    return _view;
  }

  export function createInline(task: ApiT.Task,
                               threadId: string)
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
    <div #calendar class="esper-calendar-grid"/>
    <div class="esper-modal-footer esper-clearfix">
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
    CurrentThread.team.get().match({
      some : function (team) {
        function closeView() {
          Sidebar.selectTaskTab();
          view.remove();
        }

        refreshCalIcon.attr("data", Init.esperRootUrl + "img/refresh.svg");
        title.text("Create linked events");

        var userInfo = UserTab.viewOfUserTab(team);
        var picker = createPicker(refreshCal, userInfo, team);
        calendar.append(picker.view);

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

        cancel.click(closeView);

        save.click(function() {
          confirmEvents(view, closeView, picker, team, task, threadId);
        });

        Gmail.threadContainer().append(view);
        picker.render();
        Sidebar.selectUserTab();
        Gmail.scrollToMeetingOffers();
      },
      none : function () {
        window.alert("Cannot create cal picker because no team is currently detected.");
      }
    });
  }
}
