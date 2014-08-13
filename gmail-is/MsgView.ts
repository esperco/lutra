/*
  Gmail thread view
*/
module Esper.MsgView {
  export var currentThreadId : string;

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

  /* Find a good insertion point, on the right-hand side of the page. */
  function findAnchor() {
    var anchor = $(".nH.g.id");
    if (anchor.length !== 1) {
      Log.e("Cannot find anchor point for the Esper thread controls.");
      return $();
    }
    else
      return anchor;
  }

  function removeEsperRoot() {
    $("#esper").remove();
  }

  function insertEsperRoot() {
    removeEsperRoot();
    var anchor = findAnchor();
    var root = $("<div id='esper'/>");
    anchor.prepend(root);
    return root;
  }

  function displayDock(rootElement,
                       sidebar,
                       team: ApiT.Team,
                       profiles : ApiT.Profile[]) {
'''
<div #view class="esper-dock-container">
  <div #wrapLeft class="esper-dock-wrap-left"/>
  <div #wrapRight class="esper-dock-wrap-right"/>
  <div class="esper-dock">
    <div #teamName class="esper-team-name"/>
  </div>
  <div #overflow class="esper-overflow" style="display:none">
    <a href="http://esper.com">
      <img #sidebarLogo class="esper-footer-logo"/>
    </a>
    <div class="esper-footer-links">
      <a href="mailto:team@esper.com">Help</a>
      <div class="esper-footer-divider"/>
      <a href="http://esper.com/privacypolicy.html">Privacy</a>
      <div class="esper-footer-divider"/>
      <a href="https://app.esper.com">Settings</a>
  </div>
</div>
'''
  
    var name = team.team_name;
    if (name === null || name === undefined || name === "") {
      var exec = List.find(profiles, function(prof) {
        return prof.profile_uid === team.team_executive;
      });
      name = exec.display_name;
    }

    teamName.text(name);

    view.click(function() {
      if (sidebar.css("display") === "none") {
        wrapLeft.fadeIn(250);
        wrapRight.fadeIn(250);
        sidebar.show("slide", { direction: "down" }, 250);
      } else {
        wrapLeft.fadeOut(250);
        wrapRight.fadeOut(250);
        sidebar.hide("slide", { direction: "down" }, 250);
      }
    });

    rootElement.append(view);
  }

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

  function displayLinkedEvents(tab1,
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
      currentThreadId,
      eventsTab,
      profiles
    );

    linkEvent.click(function() {
      EvSearch.openSearchModal(linkedEvents, team, eventsTab, profiles);
    });

    tab1.append(view);
  }

  function displaySidebar(rootElement,
                          team: ApiT.Team,
                          profiles : ApiT.Profile[],
                          linkedEvents: ApiT.LinkedCalendarEvents) {
'''
<div #view class="esper-sidebar">
  <ul class="esper-tab-links">
    <li class="active"><a #tab1 href="#tab1">Events</a></li>
    <li><a #tab2 href="#tab2">Polls</a></li>
    <li><a #tab3 href="#tab3">People</a></li>
  </ul>
  <div class="esper-tab-content">
    <div #content1 id="tab1" class="tab active"/>
    <div #content2 id="tab2" class="tab"/>
    <div #content3 id="tab3" class="tab"/>
  </div>
</div>
'''

    tab1.click(function() {
      switchTab(tab1);
    })
    tab2.click(function() {
      switchTab(tab2);
    })
    tab3.click(function() {
      switchTab(tab3);
    })

    function switchTab(tab) {
      var currentAttrValue = tab.attr("href");
      $('.esper-tab-content ' + currentAttrValue).show().siblings().hide();
      tab.parent('li').addClass('active').siblings().removeClass('active');
    };

    displayLinkedEvents(content1, team, profiles, linkedEvents);

    rootElement.append(view);

    return view;
  }

  function getTeamProfiles(team: ApiT.Team): JQueryDeferred<ApiT.Profile[]> {
    var teamMembers = List.copy(team.team_assistants);
    teamMembers.push(team.team_executive);
    var l =
      List.map(teamMembers, function(uid) {
        return Api.getProfile(uid, team.teamid);
      });
    return Deferred.join(l);
  }

  /* We do something if we detect a new msg ID. */
  function maybeUpdateView(maxRetries) {
    Log.d("maybeUpdateView("+maxRetries+")");
    var emailData = gmail.get.email_data();
    if (emailData !== undefined && emailData.first_email !== undefined) {
      var threadId = emailData.first_email;
      if (currentThreadId !== threadId) {
        currentThreadId = threadId;
        Log.d("Using new thread ID " + currentThreadId);
        var rootElement = insertEsperRoot();
        Login.myTeams().forEach(function(team) {
          getTeamProfiles(team).done(function(profiles) {
            Api.getLinkedEvents(team.teamid, currentThreadId)
              .done(function(linkedEvents) {
                var sidebar = displaySidebar(rootElement, team,
                                             profiles, linkedEvents);
                displayDock(rootElement, sidebar, team, profiles);
                sidebar.show("slide", { direction: "down" }, 250);
              });
          });
        });
      }
    }
    else {
      /* retry every second, up to 10 times. */
      if (maxRetries > 0)
        setTimeout(maybeUpdateView, 1000, maxRetries - 1);
    }
  }

  function listen() {
    gmail.on.open_email(function(id, url, body, xhr) {
      Log.d("Opened email " + id, url, body);
      maybeUpdateView(10);
    });
    window.onhashchange = function() {
      // TODO Actually check hash?
      Log.d("Left email message view");
      currentThreadId = null;
    };
  }

  var alreadyInitialized = false;

  export function init() {
    if (! alreadyInitialized) {
      alreadyInitialized = true;
      Log.d("MsgView.init()");
      listen();
      maybeUpdateView(10);
    }
  }
}
