/** A widget for summarizing linked events in the sidebar.
 */
module Esper.EventWidget {

  /** Displays an oval button to link unlinked events. */
  export function displayLinkOptions(e: ApiT.CalendarEvent,
                              linkedEvents: ApiT.TaskEvent[],
                              team,
                              threadId,
                              onLinkEvent?: (e:ApiT.CalendarEvent) => any) {
'''
<div #view>
  <div #link class="esper-link-event esper-clickable">Link to this event</div>
  <div #spinner/>
  <div #linked class="esper-linked">
    <object #check class="esper-svg esper-linked-check"/>
    <span>Linked</span>
  </div>
</div>
'''
    check.attr("data", Init.esperRootUrl + "img/check.svg");

    var alreadyLinked = linkedEvents.filter(function(ev) {
      return ev.task_event.google_event_id === e.google_event_id;
    });

    if (alreadyLinked.length > 0) {
      link.hide();
      linked.show();
    } else {
      link.show();
      linked.hide();
    }

    link.click(function() {
      link
        .removeClass("esper-link-event")
        .addClass("esper-linked")
        .text("Linking...");
      CurrentThread.linkEvent(e);
    });

    return view;
  }

  function confirmEvent(view,
                        event: ApiT.CalendarEvent,
                        linkedEvents: ApiT.CalendarEvent[],
                        team: ApiT.Team) {
    var prefs = Teams.getTeamPreferences(team).general;
    var start = Math.floor(moment(event.start.utc).unix());
    var end = Math.floor(
      moment(event.end ? event.end.utc : event.start.utc).unix()
    );

    var calendars = List.filter(team.team_calendars, function(cal) {
                      return cal.google_cal_id === event.google_cal_id;
                    });
    Api.eventRange(team.teamid, calendars, start, end)
      .done(function(results) {
        var events = List.filter(results.events, function(ev) {
          return (ev.google_event_id !== event.google_event_id &&
                  ev.recurring_event_id !== event.google_event_id);
        });

        if (FinalizeEvent.justHolds(linkedEvents).length > 0 &&
            (prefs.double_booking_warning ||
            prefs.delete_holds_inquiry)) {
          var confirmModal =
            displayConfirmEventModal(view, event, events, team);
          $("body").append(confirmModal.view);
        } else {
          view.parent().find(".esper-ev").addClass("esper-disabled");
          // Setting false here reduces API calls
          FinalizeEvent.finalizeEvent(event, false);
        }
      });
  }

  /** Displays a shortcut for choosing the event without using the menu. */
  export function displayEventChoose(view, event: ApiT.CalendarEvent,
                                     linkedEvents: ApiT.CalendarEvent[],
                                     team: ApiT.Team) {
'''
<div #choose title="Choose this event." class="esper-choose-event">
  <object #check class="esper-svg esper-linked-check"/>
</div>
'''
    check.attr("data", Init.esperRootUrl + "img/green-check.svg");

    choose.click(function() {
      confirmEvent(view, event, linkedEvents, team);
      Analytics.track(Analytics.Trackable.ChooseTaskTabEvent);
    });

    return choose;
  }

  function displayConfirmEventModal(eventView, event: ApiT.CalendarEvent,
                                    conflictingEvents: ApiT.CalendarEvent[],
                                    team: ApiT.Team) {
'''
<div #view class="esper-modal-bg">
  <div #modal class="esper-confirm-event-modal">
    <span #closeButton class="esper-modal-close esper-clickable">×</span>
    <div class="esper-modal-header">Finalize Event</div>
    <div #noConflicts class="esper-modal-content">
      <p>Would you like to delete all other linked HOLD events?</p>
    </div>
    <div #eventConflicts class="esper-modal-content">
      <p>You are trying to finalize the following event:</p>
      <div #confirmingEvent class="esper-events-list"/>
      <p>However there are other events on the calendar during this time frame:
      </p>
      <div #conflictingEventsList class="esper-events-list"/>
      <p>Would you also like to delete all other linked HOLD events?</p>
    </div>
    <div class="esper-modal-footer esper-clearfix">
      <button #yesButton class="esper-btn esper-btn-primary modal-primary">
        Yes, delete
      </button>
      <button #noButton class="esper-btn esper-btn-secondary modal-cancel">
        No, keep
      </button>
      <button #cancelButton class="esper-btn esper-btn-secondary modal-cancel">
        Cancel
      </button>
    </div>
  </div>
</div>
'''
    var prefs = Teams.getTeamPreferences(team).general;
    if (conflictingEvents.length > 0 && prefs.double_booking_warning) {
      noConflicts.hide();
      confirmingEvent.append(TaskList.renderEvent(team, event));

      conflictingEvents.forEach(function(ev) {
        conflictingEventsList.append(TaskList.renderEvent(team, ev));
      });
    } else {
      eventConflicts.hide();
    }

    function yesOption() {
      eventView.parent().find(".esper-ev").addClass("esper-disabled");
      FinalizeEvent.finalizeEvent(event, true);
      view.remove();
      Analytics.track(Analytics.Trackable.ClickFinalizeEventYesDeleteHolds);
    }
    function noOption() { 
      eventView.parent().find(".esper-ev").addClass("esper-disabled");
      FinalizeEvent.finalizeEvent(event, false);
      view.remove();
      Analytics.track(Analytics.Trackable.ClickFinalizeEventNoKeepHolds);
    }
    function cancelOption() { view.remove(); }

    view.click(cancelOption);
    Util.preventClickPropagation(modal);
    yesButton.click(yesOption);
    noButton.click(noOption);
    cancelButton.click(cancelOption);
    closeButton.click(cancelOption);

    return _view;
  }

  export function displayEventOptions(view,
                               ev: ApiT.TaskEvent,
                               linkedEvents: ApiT.CalendarEvent[],
                               team: ApiT.Team,
                               threadId: string) {
'''
<div #optionsView class="esper-dropdown-wrapper">
  <div #disclose class="esper-click-safe esper-dropdown-btn
                   esper-clickable esper-ev-disclose"/>
  <ul #dropdown class="esper-drop-ul esper-ev-dropdown">
    <div class="esper-dropdown-section">
      <li #chooseThisEvent
          class="esper-li">
        Confirm Event
      </li>
      <li #editEvent
          class="esper-li">
        Edit event
      </li>
      <li #reminder
          class="esper-li">
        Set reminder
      </li>
      <li #unlinkEvent
          class="esper-li">
        Unlink event
      </li>
      <li #deleteEvent
          class="esper-li">
        Delete event
      </li>
    </div>
    <div class="esper-click-safe esper-drop-ul-divider"/>
  </ul>
</div>
'''
    var e = ev.task_event;

    disclose.click(function() {
      if (disclose.hasClass("esper-open")) {
        Sidebar.dismissDropdowns();
      } else {
        Sidebar.dismissDropdowns();
        dropdown.toggle();
        disclose.addClass("esper-open");
      }
    })

    editEvent.click(function() {
      EventControls.insertAfterThread(e);
      Gmail.scrollToEventControl();
      Analytics.track(Analytics.Trackable.ClickTaskTabEditEvent);;
    });

    var reminderGuests = List.map(e.guests, function(guest) {
      var response;
      var x = guest.response.toLowerCase();
      if (x === "tentative") {
        response = ReminderView.GuestResponse.Maybe;
      } else if (x === "accepted") {
        response = ReminderView.GuestResponse.Yes;
      } else if (x === "declined") {
        response = ReminderView.GuestResponse.No;
      } else {
        response = ReminderView.GuestResponse.WaitingForReply;
      }
      return {
        name:  guest.display_name,
        email: guest.email,
        response: response,
        checked: false
      };
    });
    ReminderView.openReminderOnClick(reminder,
      e.google_cal_id, e.google_event_id, e.title, reminderGuests);

    unlinkEvent.click(function() {
      view.addClass("esper-disabled");
      Api.unlinkEvent(team.teamid, threadId, e.google_event_id)
        .done(function () {
          CurrentThread.linkedEventsChange.set(null);
        });
      Analytics.track(Analytics.Trackable.ClickTaskTabUnlinkEvent);
    });

    deleteEvent.click(function() {
      view.addClass("esper-disabled");
      Api.deleteLinkedEvent(team.teamid, threadId, e.google_event_id)
        .done(function () {
          CurrentThread.linkedEventsChange.set(null);
        });
      Analytics.track(Analytics.Trackable.ClickTaskTabDeleteEvent);
    });

    chooseThisEvent.click(function(){
      confirmEvent(view, e, linkedEvents, team);
      Analytics.track(Analytics.Trackable.ChooseTaskTabEvent);
    });

    return optionsView;
  }

  export function renderEvent(linkedEvents: ApiT.TaskEvent[],
                              ev: ApiT.TaskEvent,
                              last,
                              team: ApiT.Team,
                              threadId: string,
                              tpref: ApiT.TaskPreferences) {
'''
<span #title/>
'''
    title.text(ev.task_event.title || "Untitled Event");

    title.addClass("esper-link-black")
         .click(function() {
           open(ev.task_event.google_cal_url, "_blank");
         });

    return base(linkedEvents, ev, last, team, threadId, tpref, title);
  }

  /** The base event widget with the given payload in the main div. */
  export function base(linkedEvents: ApiT.TaskEvent[],
                       ev: ApiT.TaskEvent,
                       last,
                       team: ApiT.Team,
                       threadId: string,
                       tpref: ApiT.TaskPreferences,
                       payload?) {
'''
<div #view class="esper-ev">
  <div #weekday class="esper-ev-weekday"/>
  <div #date title class="esper-ev-date">
    <div #month class="esper-ev-month"/>
    <div #day class="esper-ev-day"/>
  </div>
  <div>
    <div #main class="esper-ev-title"></div>
    <div #time class="esper-ev-times">
      <span #startTime class="esper-ev-start"/>
      &rarr;
      <span #endTime class="esper-ev-end"/>
      <span #timezone class="esper-ev-tz"/>
    </div>
  </div>
</div>
'''
    var e = ev.task_event;

    main.append(payload);

    var evs = List.map(linkedEvents, function(ev) { return ev.task_event; });
    main.prepend(displayEventChoose(view, e, evs, team));
    main.prepend(displayEventOptions(view, ev, evs, team, threadId));

    var calendar = List.find(team.team_calendars, function(cal) {
      return cal.google_cal_id === e.google_cal_id;
    });
    var calTimezone = calendar.calendar_timezone;
    var prefs = Teams.getTeamPreferences(team);
    var showTimezone = PrefTimezone.execTimezone(prefs, tpref);
    var start = XDate.ofString(Timezone.shiftTime(e.start.local,
                                                  calTimezone,
                                                  showTimezone));
    var end = XDate.ofString(Timezone.shiftTime(e.end ? e.end.local : e.start.local,
                                                calTimezone,
                                                showTimezone));
    weekday.text(XDate.fullWeekDay(start));
    month.text(XDate.month(start).toUpperCase());
    day.text(XDate.day(start).toString());
    startTime.text(XDate.timeOnly(start));
    endTime.text(XDate.timeOnly(end));

    timezone.text(CalPicker.zoneAbbr(showTimezone));

    if (e.google_cal_url !== undefined) {
      date
        .addClass("esper-clickable")
        .click(function() {
          open(e.google_cal_url, "_blank");
        })
        .tooltip({
          show: { delay: 500, effect: "none" },
          hide: { effect: "none" },
          "content": "Open in Google Calendar",
          "position": { my: 'center bottom', at: 'center top-1' },
          "tooltipClass": "esper-top esper-tooltip"
        });

    }

    if (last) {
      view.addClass("esper-last");
    }

    return view;
  }
}
