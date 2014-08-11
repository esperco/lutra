/*
  Gmail thread view
*/
module Esper.MsgView {
  export var currentThreadId : string;

  function dismissDropdowns() {
    if ($(".esper-add-btn").hasClass("open"))
      $(".no-events-arrow").toggle();
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
    var anchor = $("div[role=complementary].nH.adC");
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
    var root = $("<div id='esper' class='esper-sidebar'/>");
    anchor.prepend(root);
    return root;
  }

  function renderEvent(ev: ApiT.EventWithSyncInfo,
                       teamid: string,
                       threadId: string,
                       sidebar: Sidebar,
                       profiles: ApiT.Profile[]) {
'''
<div #view class="esper-ev">
  <div class="esper-ev-date">
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
        <div #syncList class="esper-ev-sync">
          <li #sectionHeader class="esper-li sync-list ul-section-header">
            <span class="ul-section-header-text">Description Sync</span>
            <img #info title class="info"/>
          </li>
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

    info
      .attr("src", Init.esperRootUrl + "img/info.png")
      .tooltip();
    var position = { my: 'center bottom', at: 'center top-10' };
    var infoContent = "Team members included in this email conversation " +
      "can sync their messages to this event's description.";
    info
      .tooltip("option", "content", infoContent)
      .tooltip("option", "position", position)
      .tooltip("option", "tooltipClass", "top sync-info");

    List.iter(profiles, function(prof: ApiT.Profile) {
      var syncInfo = $("<li class='esper-li sync-list sync-row'>");
      var name = (prof.profile_uid === Login.myUid())
        ? (prof.display_name + " (Me)")
        : (prof.display_name);

      var synced = List.exists(ev.synced_threads, function(x) {
        return x.esper_uid === prof.profile_uid;
      });
      var syncCheckbox = $("<input type='checkbox' class='sync-checkbox'>")
        .appendTo(syncInfo);
      if (synced) syncCheckbox.attr("checked", true);
      if (prof.profile_uid !== Login.myUid()) {
        syncInfo.addClass("disabled");
        syncCheckbox.attr("disabled", true);
      } else {
        syncCheckbox.change(function() {
          var apiCall;
          if (this.checked)
            apiCall = Api.syncEvent;
          else
            apiCall = Api.unsyncEvent;
          apiCall(teamid, threadId, e.google_event_id).done(function() {
            refreshEventList(teamid, threadId, sidebar, profiles);
          });
        });
      }

      syncInfo
        .append(name)
        .appendTo(syncList);
    });

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
          refreshEventList(teamid, threadId, sidebar, profiles);
        });
    });

    deleteEvent.click(function() {
      view.attr("style", "opacity: 0.3");
      Api.deleteLinkedEvent(teamid, threadId, e.google_event_id)
        .done(function() {
          view.slideUp();
          refreshEventList(teamid, threadId, sidebar, profiles);
        });
    });

    return view;
  }

  function displayEventList(events, teamid, threadId, sidebar, profiles) {
    sidebar.count.text(events.length.toString());
    sidebar.events.children().remove();
    events.forEach(function(e) {
      sidebar.events.append(renderEvent(e, teamid, threadId,
                                        sidebar, profiles));
    });
  }

  /* reuse the view created for the team, update list of linked events */
  export function refreshEventList(teamid, threadId, sidebar, profiles) {
    Api.getLinkedEvents(teamid, threadId)
      .done(function(linkedEvents) {
        displayEventList(linkedEvents.linked_events, teamid,
                         threadId, sidebar, profiles);
        sidebar.count.text(linkedEvents.linked_events.length.toString());
        if (linkedEvents.linked_events.length === 0)
          sidebar.noEvents.attr("style", "display: block");
        else
          sidebar.noEvents.attr("style", "display: none");
      });
  }

  export interface Sidebar {
    view: JQuery;
    add: JQuery;
    addIcon: JQuery;
    count: JQuery;
    dropdown: JQuery;
    newEvent: JQuery;
    existingEvent: JQuery;
    noEvents: JQuery;
    arrow: JQuery;
    noEventsText: JQuery;
    events: JQuery;
    footer: JQuery;
    sidebarLogo: JQuery;
    teamName: JQuery;
  }

  function displayLinkedEvents(rootElement,
                               team: ApiT.Team,
                               profiles : ApiT.Profile[],
                               linkedEvents: ApiT.LinkedCalendarEvents) {
'''
<div #view>
  <div class="esper-header">
    <button #add class="esper-dropdown-btn esper-add-btn">
      <img #addIcon class="esper-add-icon"/>
    </button>
    <div class="esper-title">Linked Events (<span #count></span>)</div>
    <ul #dropdown class="esper-ul esper-add-dropdown">
      <li #newEvent
          class="esper-li disabled">
        Create new linked event
      </li>
      <li #existingEvent class="esper-li">
        Link to existing event
      </li>
    </ul>
  </div>
  <div #noEvents class="esper-ev">
    <img #arrow class="no-events-arrow"/>
    <div #noEventsText class="no-events-text"/>
  </div>
  <div #events/>
  <div #footer class="esper-footer">
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
    <div>
      <div #teamName class="esper-team-name"/>
      <div class="copyright">&copy; 2014 Esper</div>
    </div>
  </div>

</div>
'''
    var sidebar = <Sidebar> _view;
    addIcon.attr("src", Init.esperRootUrl + "img/add-event.png");
    add.click(function() {
      if (add.hasClass("open")) {
        dismissDropdowns();
      } else {
        dismissDropdowns();
        arrow.toggle();
        dropdown.toggle();
        add.addClass("open");
      }
    })

    var assisting = team.team_name;
    if (assisting === null || assisting === undefined || assisting === "") {
      var exec = List.find(profiles, function(prof) {
        return prof.profile_uid === team.team_executive;
      });
      assisting = exec.display_name;
    }
    var possessive = (assisting.slice(-1) === "s")
        ? (assisting + "'")
        : (assisting + "'s");

    arrow.attr("src", Init.esperRootUrl + "img/arrow.png");
    noEventsText.text("Click here to link this email conversation " +
      "to events on " + possessive + " calendar.");
    if (linkedEvents.linked_events.length === 0)
      noEvents.attr("style", "display: block");
    else
      noEvents.attr("style", "display: none");

    displayEventList(
      linkedEvents.linked_events,
      team.teamid,
      currentThreadId,
      sidebar,
      profiles
    );

    teamName.text("Assisting " + assisting);

    existingEvent.click(function() {
      EvSearch.openSearchModal(linkedEvents, team, possessive,
                               sidebar, profiles);
    });

    sidebarLogo.attr("src", Init.esperRootUrl + "img/footer-logo.png");

    rootElement.append(view);
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
                displayLinkedEvents(rootElement, team, profiles, linkedEvents);
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
