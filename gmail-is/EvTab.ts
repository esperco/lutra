module Esper.EvTab {

  function renderEvent(ev: ApiT.EventWithSyncInfo,
                       teamid: string,
                       threadId: string,
                       eventsTab: EventsTab,
                       profiles: ApiT.Profile[]) {
'''
<div #view class="esper-ev">
  <div #date title class="esper-ev-date">
    <div #month class="esper-ev-month"/>
    <div #day class="esper-ev-day"/>
  </div>
  <div>
    <div #title class="esper-ev-title"/>
    <div class="esper-ev-times">
      <div #disclose class="esper-click-safe esper-dropdown-btn
                       esper-clickable esper-ev-disclose"/>
      <ul #dropdown class="esper-ul esper-ev-dropdown">
        <div class="esper-dropdown-section">
          <li #editEvent
              class="esper-li disabled">
            Edit
          </li>
          <li #duplicateEvent
              class="esper-li disabled">
            Duplicate
          </li>
          <li #unlinkEvent
              class="esper-li">
            Unlink
          </li>
          <li #deleteEvent
              class="esper-li danger">
            Delete from calendar
          </li>
        </div>
        <div class="esper-click-safe esper-ul-divider"/>
        <div #syncOption class="esper-click-safe esper-dropdown-section">
          <li class="esper-click-safe esper-li disabled sync-option">
            <span class="esper-click-safe sync-option-text">
              Description Sync
            </span>
            <img #info title class="esper-click-safe info"/>
            <input #syncCheckbox
                   type="checkbox"
                   class="esper-click-safe sync-checkbox"/>
            <div #spinner class="esper-click-safe spinner sync-spinner">
              <div class="double-bounce1"></div>
              <div class="double-bounce2"></div>
            </div>
          </li>
          <li #teamSync class="esper-click-safe esper-li disabled sync-users"/>
          <li #syncNote class="esper-click-safe esper-li disabled sync-note"/>
        </div>
      </ul>
      <span #startTime class="esper-ev-start"/>
      &rarr;
      <span #endTime class="esper-ev-end"/>
    </div>
  </div>
</div>
'''
    function isThreadOf(uid) {
      return function(x) {
        return x.esper_uid === uid && x.gmail_thrid === threadId;
      }
    }

    var e = ev.event;
    var start = XDate.ofString(e.start.local);
    var end = XDate.ofString(e.end.local);

    month.text(XDate.month(start).toUpperCase());
    day.text(XDate.day(start).toString());
    startTime.text(XDate.timeOnly(start));
    endTime.text(XDate.timeOnly(end));

    if (e.title !== undefined)
      title.text(e.title);

    if (e.google_cal_url !== undefined) {
      function openGcal() {
        open(e.google_cal_url, "_blank");
      }
      date
        .addClass("esper-clickable")
        .click(openGcal);
      editEvent
        .removeClass("disabled")
        .click(openGcal);
    }

    date.tooltip({
      show: { delay: 500, effect: "none" },
      hide: { effect: "none" },
      "content": "Open in Google Calendar",
      "position": { my: 'center bottom', at: 'center top-1' },
      "tooltipClass": "top esper-tooltip"
    });

    var infoContent = "Automatically synchronizes the event's " +
      "description with the contents of this email conversation.";
    info
      .attr("src", Init.esperRootUrl + "img/info.png")
      .tooltip({
        show: { effect: "none" },
        hide: { effect: "none" },
        "content": infoContent,
        "position": { my: 'center bottom', at: 'center top-5' },
        "tooltipClass": "top sync-info"
      });

    syncCheckbox.change(function() {
      var apiCall;
      if(this.checked) apiCall = Api.syncEvent;
      else apiCall = Api.unsyncEvent;
      syncCheckbox.attr("style", "display: none");
      spinner.attr("style", "display: block");
      apiCall(teamid, threadId, e.google_event_id).done(function() {
        spinner.attr("style", "display: none");
        syncCheckbox.attr("style", "display: block");
        refreshEventList(teamid, threadId, eventsTab, profiles);
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
      syncNote.attr("style", "display: none");
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
      if (disclose.hasClass("open")) {
        MsgView.dismissDropdowns();
      } else {
        MsgView.dismissDropdowns();
        dropdown.toggle();
        disclose.addClass("open");
      }
    })

    unlinkEvent.click(function() {
      view.attr("style", "opacity: 0.3");
      Api.unlinkEvent(teamid, threadId, e.google_event_id)
        .done(function() {
          view.slideUp();
          refreshEventList(teamid, threadId, eventsTab, profiles);
        });
    });

    deleteEvent.click(function() {
      view.attr("style", "opacity: 0.3");
      Api.deleteLinkedEvent(teamid, threadId, e.google_event_id)
        .done(function() {
          view.slideUp();
          refreshEventList(teamid, threadId, eventsTab, profiles);
        });
    });

    return view;
  }

  function displayEventList(events, teamid, threadId, eventsTab, profiles) {
    eventsTab.events.children().remove();
    events.forEach(function(e) {
      eventsTab.events.append(renderEvent(e, teamid, threadId,
                                          eventsTab, profiles));
    });
  }

  /* reuse the view created for the team, update list of linked events */
  export function refreshEventList(teamid, threadId, eventsTab, profiles) {
    Api.getLinkedEvents(teamid, threadId)
      .done(function(linkedEvents) {
        displayEventList(linkedEvents.linked_events, teamid,
                         threadId, eventsTab, profiles);
        // eventsTab.count.text(linkedEvents.linked_events.length.toString());
        if (linkedEvents.linked_events.length === 0)
          eventsTab.noEvents.attr("style", "display: block");
        else
          eventsTab.noEvents.attr("style", "display: none");
      });
  }

  export interface EventsTab {
    view: JQuery;
    linkActions: JQuery;
    newEvent: JQuery;
    newEventIcon: JQuery;
    linkEvent: JQuery;
    linkEventIcon: JQuery;
    events: JQuery;
    noEvents: JQuery;
    footer: JQuery;
    sidebarLogo: JQuery;
    teamName: JQuery;
  }

  export function displayLinkedEvents(tab1,
                                      team: ApiT.Team,
                                      profiles : ApiT.Profile[],
                                      linkedEvents: ApiT.LinkedCalendarEvents) {
'''
<div #view>
  <div #linkActions class="esper-tab-header">
    <div #newEvent class="esper-link-action">
      <div class="esper-link-action-icon-container">
        <img #newEventIcon class="esper-link-action-icon"/>
      </div>
      <div class="esper-link-action-text">Create new linked event</div>
    </div>
    <div #linkEvent class="esper-link-action">
      <div class="esper-link-action-icon-container">
        <img #linkEventIcon class="esper-link-action-icon"/>
      </div>
      <div class="esper-link-action-text">Link to existing event</div>
    </div>
  </div>
  <div #noEvents class="esper-no-events">No linked events</div>
  <div #events class="esper-linked-events"/>
</div>
'''

    var eventsTab = <EventsTab> _view;

    newEventIcon.attr("src", Init.esperRootUrl + "img/add.png");
    linkEventIcon.attr("src", Init.esperRootUrl + "img/link.png");

    if (linkedEvents.linked_events.length === 0)
      noEvents.attr("style", "display: block");

    displayEventList(
      linkedEvents.linked_events,
      team.teamid,
      MsgView.currentThreadId,
      eventsTab,
      profiles
    );

    linkEvent.click(function() {
      EvSearch.openSearchModal(linkedEvents, team, eventsTab, profiles);
    });

    tab1.append(view);
  }

}
