/** A widget for summarizing linked or recent events in the
 *  sidebar.
 */
module Esper.EventWidget {

  /** Displays an oval button to link unlinked (recent) events. */
  export function displayLinkOptions(e: ApiT.CalendarEvent,
                              linkedEvents: ApiT.EventWithSyncInfo[],
                              team,
                              threadId,
                              profiles: ApiT.Profile[],
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
      CurrentThread.linkEvent(e, profiles);
    });

    return view;
  }

  /** Displays a shortcut for choosing the event without using the menu. */
  export function displayEventChoose(view, event: ApiT.CalendarEvent) {
'''
<div #choose title="Choose this event." class="esper-choose-event">
  <object #check class="esper-svg esper-linked-check"/>
</div>
'''
    check.attr("data", Init.esperRootUrl + "img/green-check.svg");

    choose.click(function() {
      var msg = "Other linked events will be deleted. Are you sure?";
      if (window.confirm(msg)) { // TODO Style me
        view.parent().find(".esper-ev").addClass("esper-disabled");

        FinalizeEvent.finalizeEvent(event);
      }
    });

    return choose;
  }

  export function displayEventOptions(view,
                               ev: ApiT.EventWithSyncInfo,
                               linkedEvents: ApiT.EventWithSyncInfo[],
                               team: ApiT.Team,
                               threadId: string,
                               profiles: ApiT.Profile[]) {
'''
<div #optionsView>
  <div #disclose class="esper-click-safe esper-dropdown-btn
                   esper-clickable esper-ev-disclose"/>
  <ul #dropdown class="esper-drop-ul esper-ev-dropdown">
    <div class="esper-dropdown-section">
      <li #editEvent
          class="esper-li esper-disabled">
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
    <div #syncOption class="esper-click-safe esper-dropdown-section">
      <li class="esper-click-safe esper-li esper-disabled esper-sync-option">
        <span class="esper-click-safe esper-sync-option-text">
          Description Sync
        </span>
        <object #info title class="esper-svg esper-click-safe esper-info"/>
        <input #syncCheckbox
               type="checkbox"
               class="esper-click-safe esper-sync-checkbox"/>
        <div #spinner
             class="esper-click-safe esper-spinner esper-sync-spinner"/>
      </li>
      <li #teamSync
          class="esper-click-safe esper-li esper-disabled esper-sync-users"/>
      <li #syncNote
          class="esper-click-safe esper-li esper-disabled esper-sync-note"/>
    </div>
  </ul>
</div>
'''
    var e = ev.event;

    if (e.google_cal_url !== undefined) {
      editEvent
        .removeClass("esper-disabled")
        .click(function() {
          open(e.google_cal_url, "_blank");
        });
    }

    var infoContent = "Automatically synchronizes the event's " +
      "description with the contents of this email conversation.";
    info
      .attr("data", Init.esperRootUrl + "img/info.svg")
      .tooltip({
        show: { effect: "none" },
        hide: { effect: "none" },
        "content": infoContent,
        "position": { my: 'center bottom', at: 'center top-5' },
        "tooltipClass": "esper-top esper-sync-info"
      });

    syncCheckbox.change(function() {
      var apiCall;
      if(this.checked) apiCall = Api.syncEvent;
      else apiCall = Api.unsyncEvent;
      syncCheckbox.hide();
      spinner.show();
      apiCall(team.teamid, threadId, e.google_cal_id, e.google_event_id)
        .done(function() {
          spinner.hide();
          syncCheckbox.show();
        });
    });

    var currentSynced = false;
    var syncedUsers = [];

    List.iter(profiles, function(prof) {
      var synced = List.exists(ev.synced_threads, function(x) {
        return x.esper_uid === prof.profile_uid;
      });
      if (synced && prof.profile_uid === Login.myUid()) {
        syncCheckbox.attr("checked", true);
        currentSynced = true;
        syncedUsers.unshift("You");
      } else if (synced) {
        syncedUsers.push(prof.display_name);
      }
    });

    var teamPhrase = "";
    if ((syncedUsers.length === 0) ||
        (syncedUsers.length === 1 && syncedUsers[0] === "You")) {
      teamPhrase = "No other team members are ";
      syncNote.hide();
    } else if (syncedUsers.length === 1) {
      teamPhrase = syncedUsers[0] + " is ";
    } else if (syncedUsers.length === 2) {
      teamPhrase = syncedUsers[0] + " and " + syncedUsers[1] + " are ";
    } else {
      for (var i = 0; i < syncedUsers.length; i++) {
        if (i < syncedUsers.length - 1)
          teamPhrase += syncedUsers[i] + ", ";
        else
          teamPhrase += "and " + syncedUsers[i] + " are ";
      }
    }
    teamSync.text(teamPhrase += " syncing messages with this event.");

    var notePhrase = "";
    if (!currentSynced && syncedUsers.length > 0) {
      notePhrase = "Turn on Description Sync to also include messages from " +
        "your version of this email conversation. Duplicate messages will be " +
        "automatically excluded.";
    } else if (syncedUsers.length > 1) {
      notePhrase = "Duplicate messages are automatically excluded.";
    }
    syncNote.text(notePhrase);

    disclose.click(function() {
      if (disclose.hasClass("esper-open")) {
        Sidebar.dismissDropdowns();
      } else {
        Sidebar.dismissDropdowns();
        dropdown.toggle();
        disclose.addClass("esper-open");
      }
    })

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

    chooseThisEvent.click(function() {
      var msg = "Other linked events will be deleted. Are you sure?";
      if (window.confirm(msg)) { // TODO Style me
        view.parent().find(".esper-ev").addClass("esper-disabled");

        FinalizeEvent.finalizeEvent(e);
      }
    });

    return optionsView;
  }

  function zoneAbbr(zoneName) {
    return zoneName === "UTC" ?
      "UTC" : // moment-tz can't handle it
      (<any> moment).tz(moment(), zoneName).zoneAbbr();
  }

  export function renderEvent(linkedEvents: ApiT.EventWithSyncInfo[],
                              ev: ApiT.EventWithSyncInfo,
                              recent, last, team: ApiT.Team, threadId: string, profiles: ApiT.Profile[]) {
'''
<span #title/>
'''
    title.text(ev.event.title || "Untitled Event");

    title.addClass("esper-link-black")
         .click(function() {
           open(ev.event.google_cal_url, "_blank");
         });

    return base(linkedEvents, ev, recent, last, team, threadId, profiles, title);
  }

  /** The base event widget with the given payload in the main div. */
  export function base(linkedEvents: ApiT.EventWithSyncInfo[],
                       ev: ApiT.EventWithSyncInfo,
                       recent, last, team: ApiT.Team, threadId: string,
                       profiles: ApiT.Profile[], payload?) {
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
      view.append(displayLinkOptions(e, linkedEvents, team, threadId, profiles));
    } else {
      main.prepend(displayEventChoose(view, e));
      main.prepend(displayEventOptions(view, ev, linkedEvents, team, threadId, profiles));
    }

    var start = XDate.ofString(e.start.local);
    var end = XDate.ofString(e.end.local);

    weekday.text(XDate.fullWeekDay(start));
    month.text(XDate.month(start).toUpperCase());
    day.text(XDate.day(start).toString());
    startTime.text(XDate.timeOnly(start));
    endTime.text(XDate.timeOnly(end));

    var calendar = List.find(team.team_calendars, function(cal) {
      return cal.google_cal_id === e.google_cal_id;
    });
    timezone.text(zoneAbbr(calendar.calendar_timezone));

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

    if (last)
      view.addClass("esper-last");

    return view;
  }
}
