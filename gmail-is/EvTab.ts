module Esper.EvTab {

  function toggleList(container) {
    if (container.css("display") === "none") {
      container.slideDown("fast");
    } else {
      container.slideUp("fast");
    }
  }

  export function linkEvent(e, teamid, threadId, eventsTab,
                            profiles, view) {
    Api.linkEventForMe(teamid, threadId, e.google_event_id)
      .done(function() {
        view.spinner.hide();
        view.linked.show();
        refreshEventList(teamid, threadId, eventsTab, profiles);

        Api.linkEventForTeam(teamid, threadId, e.google_event_id)
          .done(function() {
            Api.syncEvent(teamid, threadId, e.google_event_id)
              .done(function() {
                // TODO Report something, handle failure, etc.
                refreshEventList(teamid, threadId, eventsTab, profiles);
              });
          });
      });
  }

  function displayLinkOptions(e: ApiT.CalendarEvent,
                              linkedEvents, teamid, threadId,
                              eventsTab: EventsTab,
                              profiles: ApiT.Profile[]) {
'''
<div #view>
  <div #link class="esper-link-event esper-clickable">Link to this event</div>
  <div #spinner class="spinner link-spinner"/>
  <div #linked class="esper-linked">
    <object #check/>
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
      spinner.show();
      link.hide();
      linkEvent(e, teamid, threadId, eventsTab, profiles, _view);
    });

    return view;
  }

  function displayEventOptions(ev: ApiT.EventWithSyncInfo,
                               team: ApiT.Team,
                               threadId: string,
                               eventsTab: EventsTab,
                               profiles: ApiT.Profile[]) {
'''
<div #view>
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
        <object #info title class="esper-click-safe info"/>
        <input #syncCheckbox
               type="checkbox"
               class="esper-click-safe sync-checkbox"/>
        <div #spinner class="esper-click-safe spinner sync-spinner"/>
      </li>
      <li #teamSync class="esper-click-safe esper-li disabled sync-users"/>
      <li #syncNote class="esper-click-safe esper-li disabled sync-note"/>
    </div>
  </ul>
</div>
'''
    var e = ev.event;

    if (e.google_cal_url !== undefined) {
      editEvent
        .removeClass("disabled")
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
        "tooltipClass": "top sync-info"
      });

    syncCheckbox.change(function() {
      var apiCall;
      if(this.checked) apiCall = Api.syncEvent;
      else apiCall = Api.unsyncEvent;
      syncCheckbox.hide();
      spinner.show();
      apiCall(team.teamid, threadId, e.google_event_id).done(function() {
        spinner.hide();
        syncCheckbox.show();
        refreshEventList(team.teamid, threadId, eventsTab, profiles);
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
      if (disclose.hasClass("open")) {
        MsgView.dismissDropdowns();
      } else {
        MsgView.dismissDropdowns();
        dropdown.toggle();
        disclose.addClass("open");
      }
    })

    unlinkEvent.click(function() {
      view.addClass("disabled");
      Api.unlinkEvent(team.teamid, threadId, e.google_event_id)
        .done(function() {
          view.slideUp();
          refreshEventList(team.teamid, threadId, eventsTab, profiles);
        });
    });

    deleteEvent.click(function() {
      view.addClass("disabled");
      Api.deleteLinkedEvent(team.teamid, threadId, e.google_event_id)
        .done(function() {
          view.slideUp();
          refreshEventList(team.teamid, threadId, eventsTab, profiles);
        });
    });

    return view;
  }

  function renderEvent(linkedEvents: ApiT.LinkedCalendarEvents,
                       ev, recent, last, team: ApiT.Team,
                       threadId: string, eventsTab: EventsTab,
                       profiles: ApiT.Profile[]) {
'''
<div #view class="esper-ev">
  <div #date title class="esper-ev-date">
    <div #month class="esper-ev-month"/>
    <div #day class="esper-ev-day"/>
  </div>
  <div>
    <div #title class="esper-ev-title"/>
    <div #time class="esper-ev-times">
      <span #startTime class="esper-ev-start"/>
      &rarr;
      <span #endTime class="esper-ev-end"/>
    </div>
  </div>
</div>
'''
    var e = ev;

    if (recent) {
      view.append(displayLinkOptions(ev, linkedEvents, team.teamid,
                                     threadId, eventsTab, profiles));
    } else {
      e = ev.event;
      time.prepend(displayEventOptions(ev, team, threadId,
                                       eventsTab, profiles));
    }

    var start = XDate.ofString(e.start.local);
    var end = XDate.ofString(e.end.local);

    month.text(XDate.month(start).toUpperCase());
    day.text(XDate.day(start).toString());
    startTime.text(XDate.timeOnly(start));
    endTime.text(XDate.timeOnly(end));

    if (e.title !== undefined)
      title.text(e.title);
    else
      title.text("Untitled event");

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
          "tooltipClass": "top esper-tooltip"
        });
      title
        .addClass("esper-link-black")
        .click(function() {
          open(e.google_cal_url, "_blank");
        });
    }

    if (last)
      view.addClass("last");

    return view;
  }

  function displayRecentEvents(linkedEvents, teamid, threadId,
                               container, profiles) {
'''
<div #view>
  <div #spinner class="spinner list-spinner"/>
  <div #noRecents class="esper-no-events">No recent events</div>
  <div #eventsList class="esper-events-list"/>
</div>
'''
    container.children().remove();

    var active = Login.getAccount().activeEvents;
    console.log("active: " + active);

    if (active === null || active === undefined) return;
    else console.log("not null");
    var events = active.calendars;
    console.log("length: " + events.length);

    var team =
      List.find(Login.myTeams(), function(team) {
        return team.teamid === teamid;
      });
    if (team === null || team === undefined) return;

    var getEventCalls =
      List.filterMap(
        events[team.team_calendar.google_calendar_id],
        function(e) {
          var item = e.item; // compatibility check
          if (item !== undefined)
            return Api.getEventDetails(teamid, item.eventId);
          else
            return undefined;
      });

    Deferred.join(getEventCalls).done(function(activeEvents) {
      var i = 0;
      var last = false;
      var recent = true;
      activeEvents.forEach(function(e: ApiT.CalendarEvent) {
        if (i === activeEvents.length - 1)
          last = true;
        eventsList.append(renderEvent(linkedEvents, e, recent, last, team,
                                      threadId, container, profiles));
        i++;
      });
    });

    return view;
  }

  function displayLinkedEvents(eventsTab, linkedEvents, team, threadId,
                               container, profiles) {
'''
<div #view>
  <div #linkActions class="esper-section-actions clearfix">
    <div #newEvent class="esper-link-action">
      <div class="esper-link-action-icon-container">
        <object #newEventIcon type="image/svg+xml"
                class="esper-link-action-icon"/>
      </div>
      <div class="esper-link-action-text">New event</div>
    </div>
    <div #linkEvent class="esper-link-action">
      <div class="esper-link-action-icon-container">
        <object #linkEventIcon type="image/svg+xml"
                class="esper-link-action-icon"/>
      </div>
      <div class="esper-link-action-text">Link to event</div>
    </div>
  </div>
  <div #noEvents class="esper-no-events">No linked events</div>
  <div #eventsList class="esper-events-list"/>
</div>
'''
    newEventIcon.attr("data", Init.esperRootUrl + "img/add.svg");
    linkEventIcon.attr("data", Init.esperRootUrl + "img/link.svg");

    container.children().remove();

    if (linkedEvents.length === 0) {
      noEvents.show();
    } else {
      var i = 0;
      var recent, last = false;
      linkedEvents.forEach(function(e: ApiT.EventWithSyncInfo) {
        if (i === linkedEvents.length - 1)
          last = true;
        eventsList.append(renderEvent(linkedEvents, e, recent, last, team,
                                      threadId, container, profiles));
        i++;
      });
    }

    newEvent.click(function() {
      var newTab = window.open("");
      newTab.document.write("Creating new linked event, please wait...");
      var threadId = MsgView.currentThreadId;
      Api.createNewLinkedEvent(team.teamid, threadId).done(function(e) {
        var eventId = e.google_event_id;
        if (eventId !== null && eventId !== undefined) {
          newTab.document.write(" done! Syncing thread to description...");
          Api.syncEvent(team.teamid, threadId, eventId).done(function() {
            var url = e.google_cal_url;
            if (url !== null && url !== undefined)
              newTab.location.assign(url);
          });
        }
      });
    });

    linkEvent.click(function() {
      EvSearch.openSearchModal(linkedEvents, team, eventsTab, profiles);
    });

    return view;
  }

  /* reuse the view created for the team, update list of linked events */
  export function refreshEventList(team, threadId, eventsTab, profiles) {
    Api.getLinkedEvents(team.teamid, threadId)
      .done(function(linkedEvents) {
        eventsTab.linkedEventsContainer.append(displayLinkedEvents(
          eventsTab,
          linkedEvents.linked_events,
          team,
          threadId,
          eventsTab.linkedEventsContainer,
          profiles
        ));
        if (linkedEvents.linked_events.length === 0)
          eventsTab.noEvents.show();
        else
          eventsTab.noEvents.hide();
      });
  }

  export interface EventsTab {
    view: JQuery;
    linkedEventsHeader: JQuery;
    showLinkedEvents: JQuery;
    linkedEventsContainer: JQuery;
    recentEventsHeader: JQuery;
    showRecentEvents: JQuery;
    recentEventsContainer: JQuery;
    recents: JQuery;
    footer: JQuery;
    sidebarLogo: JQuery;
    teamName: JQuery;
  }

  export function displayCalendarTab(tab1,
                                     team: ApiT.Team,
                                     profiles : ApiT.Profile[],
                                     linkedEvents: ApiT.LinkedCalendarEvents) {
'''
<div #view>
  <div class="esper-section">
    <div #linkedEventsHeader class="esper-section-header open">
      <span #showLinkedEvents class="esper-link" style="float:right">Hide</span>
      <span class="bold">Linked Events</span>
    </div>
    <div #linkedEventsContainer class="esper-section-container"/>
  </div>
  <div class="esper-section">
    <div #recentEventsHeader class="esper-section-header open">
      <span #showRecentEvents class="esper-link" style="float:right">Hide</span>
      <span class="bold">Recently Viewed Events</span>
    </div>
    <div #recentEventsContainer class="esper-section-container"/>
  </div>
</div>
'''

    var eventsTab = <EventsTab> _view;

    linkedEventsContainer.append(displayLinkedEvents(
      eventsTab,
      linkedEvents.linked_events,
      team,
      MsgView.currentThreadId,
      linkedEventsContainer,
      profiles
    ));

    recentEventsContainer.append(displayRecentEvents(
      linkedEvents.linked_events,
      team.teamid,
      MsgView.currentThreadId,
      recentEventsContainer,
      profiles
    ));

    showLinkedEvents.click(function() {
      toggleList(linkedEventsContainer);
      if (this.innerHTML === "Hide")
        $(this).text("Show");
      else
        $(this).text("Hide");
    })

    showRecentEvents.click(function() {
      toggleList(recentEventsContainer);
      if (this.innerHTML === "Hide")
        $(this).text("Show");
      else
        $(this).text("Hide");
    })

    Login.watchableAccount.watch(function(newAccount, newValidity) {
      if (newValidity === true && !!MsgView.currentThreadId) {
        Log.d("Refreshing active events");
        recentEventsContainer.append(displayRecentEvents(
          linkedEvents.linked_events,
          team.teamid,
          MsgView.currentThreadId,
          recentEventsContainer,
          profiles
        ));
      }
    });

    tab1.append(view);
  }

}
