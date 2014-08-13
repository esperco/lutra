module Esper.EvTab {

  function dismissDropdowns() {
    $(".esper-ul").attr("style", "display: none");
    $(".esper-menu-bg").attr("style", "display: none");
    $(".esper-caret").attr("style", "display: none");
    $(".esper-dropdown-btn").removeClass("open");
  }

  $(document).on('click', function(e) {
    var $target = $(e.target);
    if (!$target.hasClass("esper-dropdown-btn") &&
        !$target.parent().hasClass("esper-dropdown-btn") &&
        !$target.hasClass("sync-list") &&
        !$target.parent().hasClass("sync-list") &&
        !$target.hasClass("disabled")) {
        dismissDropdowns();
    }
  });

  function renderEvent(ev: ApiT.EventWithSyncInfo,
                       teamid: string,
                       threadId: string,
                       eventsTab: EventsTab,
                       profiles: ApiT.Profile[]) {
'''
<div #view class="esper-ev">
  <div #date class="esper-ev-date">
    <div #month class="esper-ev-month"/>
    <div #day class="esper-ev-day"/>
  </div>
  <div>
    <div #title class="esper-ev-title"/>
    <div class="esper-ev-times">
      <img #cog class="esper-dropdown-btn esper-ev-cog"/>
      <ul #dropdown class="esper-ul esper-ev-dropdown">
        <div class="esper-ev-actions">
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
        <div class="esper-ul-divider"/>
        <div #syncOption class="esper-ev-sync">
          <li class="esper-li sync-list sync-option">
            <span class="sync-option-text">Description Sync</span>
            <img #info title class="info"/>
            <input #syncCheckbox type="checkbox" class="sync-checkbox"/>
            <div #spinner class="spinner sync-spinner">
              <div class="double-bounce1"></div>
              <div class="double-bounce2"></div>
            </div>
          </li>
          <li #teamSync class="esper-li sync-list sync-users"/>
          <li #syncNote class="esper-li sync-list sync-note"/>
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

    info
      .attr("src", Init.esperRootUrl + "img/info.png")
      .tooltip();
    var position = { my: 'center bottom', at: 'center top-10' };
    var infoContent = "Automatically synchronizes the event's " +
      "description with the contents of this email conversation.";
    info
      .tooltip("option", "content", infoContent)
      .tooltip("option", "position", position)
      .tooltip("option", "tooltipClass", "top sync-info");

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


    cog.attr("src", Init.esperRootUrl + "img/event-cog.png")
    cog.click(function() {
      if (cog.hasClass("open")) {
        dismissDropdowns();
      } else {
        dismissDropdowns();
        dropdown.toggle();
        cog.addClass("open");
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
  <div #linkActions class="esper-link-actions">
    <div #newEvent class="esper-link-action">
      <img #newEventIcon class="esper-link-action-icon"/>
      <div class="esper-link-action-text">Create new linked event</div>
    </div>
    <div #linkEvent class="esper-link-action">
      <img #linkEventIcon class="esper-link-action-icon"/>
      <div class="esper-link-action-text">Link to existing event</div>
    </div>
  </div>
  <div #noEvents class="esper-no-events">No linked events</div>
  <div #events class="esper-linked-events"/>
</div>
'''

    var eventsTab = <EventsTab> _view;

    newEventIcon.attr("src", Init.esperRootUrl + "img/new-event.png");
    linkEventIcon.attr("src", Init.esperRootUrl + "img/link-event.png");

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
