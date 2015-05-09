/** A widget for summarizing linked or recent events in the
 *  sidebar.
 */
module Esper.EventWidget {

  /** Displays an oval button to link unlinked (recent) events. */
  export function displayLinkOptions(e: ApiT.CalendarEvent,
                              linkedEvents: ApiT.EventWithSyncInfo[],
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
      return ev.event.google_event_id === e.google_event_id;
    })

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
    var start = Math.floor(Date.parse(event.start.utc)/1000);
    var end = Math.floor(Date.parse(event.end.utc)/1000);

    Api.eventRange(team.teamid, team.team_calendars, start, end)
      .done(function(results) {
        var events = List.filter(results.events, function(ev) {
          return ev.google_event_id !== event.google_event_id;
        });

        if (FinalizeEvent.justHolds(linkedEvents).length > 0) {
          var confirmModal =
            displayConfirmEventModal(view, event, events, team);
          $("body").append(confirmModal.view);
        } else {
          view.parent().find(".esper-ev").addClass("esper-disabled");
          FinalizeEvent.finalizeEvent(event);
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

    choose.click(function(){confirmEvent(view, event, linkedEvents, team)});

    return choose;
  }

  function displayConfirmEventModal(eventView, event: ApiT.CalendarEvent,
                                    conflictingEvents: ApiT.CalendarEvent[],
                                    team: ApiT.Team) {
'''
<div #view class="esper-modal-bg">
  <div #modal class="esper-confirm-event-modal">
    <div class="esper-modal-header">Finalize Event</div>
    <div #noConflicts class="esper-modal-content">
      <p>Other HOLD linked events will be deleted. Are you sure?</p>
    </div>
    <div #eventConflicts class="esper-modal-content">
      <p>You are trying to finalize the following event:</p>
      <div #confirmingEvent class="esper-events-list"/>
      <p>However there are other events on the calendar during this time frame:
      </p>
      <div #conflictingEventsList class="esper-events-list"/>
      <p>Other HOLD linked events will also be deleted. Are you sure you wish to
      proceed?</p>
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
    if (conflictingEvents.length > 0) {
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
      FinalizeEvent.finalizeEvent(event);
      view.remove();
    }
    function noOption() { view.remove(); }

    view.click(noOption);
    Util.preventClickPropagation(modal);
    yesButton.click(yesOption);
    noButton.click(noOption);

    return _view;
  }

  export function displayEventOptions(view,
                               ev: ApiT.EventWithSyncInfo,
                               linkedEvents: ApiT.CalendarEvent[],
                               team: ApiT.Team,
                               threadId: string) {
'''
<div #optionsView>
  <div #disclose class="esper-click-safe esper-dropdown-btn
                   esper-clickable esper-ev-disclose"/>
  <ul #dropdown class="esper-drop-ul esper-ev-dropdown">
    <div class="esper-dropdown-section">
      <li #editEvent
          class="esper-li">
        Edit
      </li>
      <li #inviteGuests
          class="esper-li">
        Invite guests
      </li>
      <li #unlinkEvent
          class="esper-li">
        Unlink
      </li>
      <li #deleteEvent
          class="esper-li esper-danger">
        Delete from calendar
      </li>
      <li #chooseThisEvent
          class="esper-li">
        Choose this event
      </li>
    </div>
    <div class="esper-click-safe esper-drop-ul-divider"/>
  </ul>
</div>
'''
    var e = ev.event;

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
      Gmail.scrollToInviteWidget();
    });

    inviteGuests.click(function() {
      CurrentThread.withPreferences(function(preferences) {
        FinalizeEvent.inviteGuests(e, preferences);
        Gmail.scrollToInviteWidget();
      });
    });

    unlinkEvent.click(function() {
      view.addClass("esper-disabled");
      Api.unlinkEvent(team.teamid, threadId, e.google_event_id).done(function () {
        CurrentThread.linkedEventsChanged();
      });
    });

    deleteEvent.click(function() {
      view.addClass("esper-disabled");
      Api.deleteLinkedEvent(team.teamid, threadId, e.google_event_id).done(function () {
        CurrentThread.linkedEventsChanged();
      });
    });

    chooseThisEvent.click(function(){confirmEvent(view, e, linkedEvents, team)});

    return optionsView;
  }

  export function renderEvent(linkedEvents: ApiT.EventWithSyncInfo[],
                              ev: ApiT.EventWithSyncInfo,
                              recent,
                              last,
                              team: ApiT.Team,
                              threadId: string) {
'''
<span #title/>
'''
    title.text(ev.event.title || "Untitled Event");

    title.addClass("esper-link-black")
         .click(function() {
           open(ev.event.google_cal_url, "_blank");
         });

    return base(linkedEvents, ev, recent, last, team, threadId, title);
  }

  /** The base event widget with the given payload in the main div. */
  export function base(linkedEvents: ApiT.EventWithSyncInfo[],
                       ev: ApiT.EventWithSyncInfo,
                       recent,
                       last,
                       team: ApiT.Team,
                       threadId: string,
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
    var e = ev.event;

    main.append(payload);

    if (recent) {
      view.append(displayLinkOptions(e, linkedEvents, team, threadId));
    } else {
      var evs = List.map(linkedEvents, function(ev) { return ev.event; });
      main.prepend(displayEventChoose(view, e, evs, team));
      main.prepend(displayEventOptions(view, ev, evs, team, threadId));
    }

    var calendar = List.find(team.team_calendars, function(cal) {
      return cal.google_cal_id === e.google_cal_id;
    });
    var calTimezone = calendar.calendar_timezone;
    var prefs = Teams.getTeamPreferences(team);
    var showTimezone = prefs.general.current_timezone;
    var start = XDate.ofString(Timezone.shiftTime(e.start.local,
                                                  calTimezone,
                                                  showTimezone));
    var end = XDate.ofString(Timezone.shiftTime(e.end.local,
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
