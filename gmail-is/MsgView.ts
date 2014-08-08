/*
  Gmail thread view
*/
module Esper.MsgView {
  var currentThreadId : string;

  function dismissDropdowns() {
    if ($(".esper-add-btn").hasClass("open"))
      $(".no-events-arrow").toggle();
    $(".esper-dropdown").attr("style", "display: none");
    $(".esper-dropdown-btn").removeClass("open");
  }

  $(document).on('click', function(e) {
    var $target = $(e.target);
    if (!$target.hasClass("esper-dropdown-btn") &&
        !$target.parent().hasClass("esper-dropdown-btn")) {
        dismissDropdowns();
    }
  });

  /* Find a good insertion point, on the right-hand side of the page. */
  function findAnchor() {
    var anchor = $("div[role=complementary].nH.adC");
    if (anchor.length !== 1) {
      Log.e("Cannot find anchor point for Esper controls");
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

  function renderEvent(ev: ApiT.EventWithSyncInfo, teamid, threadId, sidebar) {
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
      <ul #dropdown class="esper-dropdown esper-ev-dropdown">
        <li #editEvent
            class="esper-ev-dropdown-item disabled">
          Edit
        </li>
        <li #duplicateEvent
            class="esper-ev-dropdown-item disabled">
          Duplicate
        </li>
        <li #syncDescription
            class="esper-ev-dropdown-item">
          Sync thread to description
        </li>
        <li #unlinkEvent
            class="esper-ev-dropdown-item">
          Unlink
        </li>
        <li #deleteEvent
            class="esper-ev-dropdown-item delete-event">
          Delete from calendar
        </li>
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

    if (List.exists(ev.synced_threads, isThreadOf(Login.myUid()))) {
      syncDescription.addClass("disabled");
    } else {
      syncDescription.removeClass("disabled");
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

    var profiles = sidebar["profiles"];
    List.iter(profiles, function(prof) {
      var syncInfo = $("<li class='esper-ev-dropdown-item esper-sync-info'>")
        .text(prof[1].display_name);
      if (prof[0] !== Login.myUid()) syncInfo.addClass("disabled");
      var synced = List.exists(ev.synced_threads, function(x) {
        return x.esper_uid === prof[0];
      });
      if (synced) syncInfo.append(" - Synced");
      else syncInfo.append(" - Not Synced");
      syncInfo.click(function() {
        var apiCall;
        if (synced) apiCall = Api.unsyncEvent;
        else apiCall = Api.syncEvent;
        apiCall(teamid, threadId, e.google_event_id).done(function() {
          refreshEventList(teamid, threadId, sidebar);
        });
      });
      syncInfo.appendTo(dropdown);
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

    syncDescription.click(function () {
      Api.syncEvent(teamid, threadId, e.google_event_id).done(function() {
        refreshEventList(teamid, threadId, sidebar);
      });
    });

    unlinkEvent.click(function() {
      view.attr("style", "opacity: 0.3");
      Api.unlinkEvent(teamid, threadId, e.google_event_id)
        .done(function() {
          view.slideUp();
          refreshEventList(teamid, threadId, sidebar);
        });
    });

    deleteEvent.click(function() {
      view.attr("style", "opacity: 0.3");
      Api.deleteLinkedEvent(teamid, threadId, e.google_event_id)
        .done(function() {
          view.slideUp();
          refreshEventList(teamid, threadId, sidebar);
        });
    });

    $(".esper-sync-info").click(function(syncInfo) {
      Log.d("clicked");
      var apiCall;
      if (syncInfo.data("synced") === true) apiCall = Api.syncEvent;
      else apiCall = Api.unsyncEvent;
      apiCall(teamid, threadId, e.google_event_id).done(function() {
        refreshEventList(teamid, threadId, sidebar);
      });
    });

    return view;
  }

  function displayEventList(events, teamid, threadId, view) {
    view.count.text(events.length.toString());
    view.events.children().remove();
    events.forEach(function(e) {
      view.events.append(renderEvent(e, teamid, threadId, view));
    });
  }

  function afterTyping(elt: JQuery, delayMs: number, func) {
    var lastPressed = Date.now(); // date in milliseconds
    elt
      .unbind("keydown")
      .keydown(function() {
        var t1 = lastPressed;
        var t2 = Date.now();
        if (lastPressed >= t2)
          lastPressed = lastPressed + 1;
        else
          lastPressed = t2;
        var lastPressed0 = lastPressed;
        window.setTimeout(function() {
          if (lastPressed0 === lastPressed)
            func();
        }, delayMs);
      });
  }

  function linkEvent(e, teamid, threadId, sidebar, view) {
    Api.linkEvent(teamid, threadId, {
      google_event_id: e.google_event_id
    })
      .done(function() {
        view.spinner.attr("style", "display: none");
        view.linked.attr("style", "display: block");
        refreshEventList(teamid, threadId, sidebar);

        Api.syncEvent(teamid, threadId, e.google_event_id)
          .done(function() {
            // TODO Report something, handle failure, etc.
            refreshEventList(teamid, threadId, sidebar);
          });
      });
  }

  function renderSearchResult(e: ApiT.CalendarEvent, linkedEvents,
                              teamid, sidebar) {
'''
<div #view class="esper-ev-result">
  <div class="esper-ev-date">
    <div #month class="esper-ev-month"></div>
    <div #day class="esper-ev-day"></div>
  </div>
  <a #link class="link-event">Link</a>
  <div #spinner class="link-spinner">
    <div class="double-bounce1"></div>
    <div class="double-bounce2"></div>
  </div>
  <div #linked class="linked animated fadeInRight">
    <img #check/>
    <span>Linked</span>
  </div>
  <div>
    <div #title class="esper-ev-title"/>
    <div class="esper-ev-times">
      <span #startTime class="esper-ev-start"></span>
      &rarr;
      <span #endTime class="esper-ev-end"></span>
    </div>
  </div>
</div>
'''
    var start = XDate.ofString(e.start.local);
    var end = XDate.ofString(e.end.local);

    month.text(XDate.month(start).toUpperCase());
    day.text(XDate.day(start).toString());
    startTime.text(XDate.timeOnly(start));
    endTime.text(XDate.timeOnly(end));

    var threadId = currentThreadId;
    if (e.title !== undefined)
      title.text(e.title);

    link.click(function() {
      spinner.attr("style", "display: block");
      link.attr("style", "display: none");
      linkEvent(e, teamid, threadId, sidebar, _view);
    });

    check.attr("src", Init.esperRootUrl + "img/check.png");
    var alreadyLinked = linkedEvents.filter(function(ev) {
      return ev.google_event_id === e.google_event_id;
    })
    if (alreadyLinked.length > 0) {
      link.attr("style", "display: none");
      linked.attr("style", "display: block");
    } else {
      link.attr("style", "display: block");
      linked.attr("style", "display: none");
    }

    return view;
  }

  function displayLinkableEvents(linkedEvents, eventList, teamid, view) {
    var list = $("<div>");
    eventList.forEach(function(e) {
      renderSearchResult(e, linkedEvents, teamid, view)
        .appendTo(list);
    });
    view.clear.attr("style", "visibility: visible");
    view.searchInstructions.attr("style", "display: none");
    view.spinner.attr("style", "display: none");
    view.resultsList.attr("style", "display: block");
    view.resultsList.children().remove();
    view.resultsList.append(list);
    if (eventList.length === 0) {
      view.searchStats.text("No events found");
      view.searchStats.addClass("no-events");
    } else if (eventList.length === 1) {
      view.searchStats.text(eventList.length + " event found");
      view.searchStats.removeClass("no-events");
    } else {
      view.searchStats.text(eventList.length + " events found");
      view.searchStats.removeClass("no-events");
    }
    view.searchStats.attr("style", "display: block");
  }

  function resetSearch(view) {
    view.searchbox.val("");
    view.searchbox.focus();
    view.clear.attr("style", "visibility: hidden");
    view.searchInstructions.attr("style", "display: block");
    view.spinner.attr("style", "display: none");
    view.resultsList.children().remove();
    view.searchStats.attr("style", "display: none");
  }

  function setupSearch(events, teamid, view) {
    resetSearch(view);
    afterTyping(view.searchbox, 250, function() {
      if (view.searchbox.val().length === 0) {
        resetSearch(view);
      } else {
          view.searchbox.keypress(function(e) {
          if (e.which != 0) {
            view.searchInstructions.attr("style", "display: none");
            view.spinner.attr("style", "display: block");
            view.resultsList.attr("style", "display: none");
            view.searchStats.attr("style", "display: none");
          }
        })
      }
      Api.eventSearch(teamid, view.searchbox.val())
        .done(function(results) {
          displayLinkableEvents(events, results.events, teamid, view);
        });
    });
  }

  /* reuse the view created for the team, update list of linked events */
  function refreshEventList(teamid, threadId, view) {
    Api.getLinkedEvents(teamid, threadId)
      .done(function(linkedEvents) {
        displayEventList(linkedEvents.linked_events, teamid, threadId, view);
        view.count.text(linkedEvents.linked_events.length.toString());
        if (linkedEvents.linked_events.length === 0)
          view.noEvents.attr("style", "display: block");
        else
          view.noEvents.attr("style", "display: none");
      });
  }

  function displayLinkedEvents(rootElement,
                               team: ApiT.Team,
                               profiles : any[],
                               linkedEvents: ApiT.LinkedCalendarEvents) {
'''
<div #view>
  <div class="esper-header">
    <button #add class="esper-dropdown-btn esper-add-btn">
      <img #addIcon class="esper-add-icon"/>
    </button>
    <div class="esper-title">Linked Events (<span #count></span>)</div>
    <ul #dropdown class="esper-dropdown esper-add-dropdown">
      <li #newEvent
          class="esper-ev-dropdown-item disabled">
        Create new linked event
      </li>
      <li #existingEvent class="esper-ev-dropdown-item">
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
  <div #search class="esper-modal">
    <div #modalBackground class="modal-bg">
    <div #searchModal class="modal search-modal">
      <div class="modal-header">
        <img #close class="modal-close-icon"/>
        <div #searchTitle class="search-modal-title"/>
      </div>
      <div class="clear-search-container">
        <img #clear class="clear-search"/>
      </div>
      <input #searchbox
        type="text" class="esper-searchbox"
        placeholder="Search calendar"/>
      <div #results class="search-results">
        <div #searchInstructions class="search-instructions"/>
        <div #spinner class="search-spinner">
          <div class="double-bounce1"></div>
          <div class="double-bounce2"></div>
        </div>
        <div #resultsList/>
        <div #searchStats class="search-stats"/>
      </div>
      <div class="search-footer">
        <img #modalLogo class="search-footer-logo"/>
        <button #done class="done-btn">Done</button>
      </div>
    </div>
  </div>
</div>
'''
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
        return prof[0] === team.team_executive;
      });
      assisting = exec[1].display_name;
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

    _view["profiles"] = profiles;

    displayEventList(
      linkedEvents.linked_events,
      team.teamid,
      currentThreadId,
      _view
    );

    clear.click(function() { resetSearch(_view) });
    searchInstructions.text("Start typing above to find events on " +
      possessive + " calendar.");

    teamName.text("Assisting " + assisting);

    /* Search Modal */
    // http://api.jqueryui.com/dialog/#method-close
    existingEvent.click(function() {
      setupSearch(linkedEvents.linked_events, team.teamid, _view);

      search.attr("style", "display: block");
      searchModal.dialog({
        modal: true,
        dialogClass: "no-close"
        });
      searchModal.dialog("option","modal",true);

      close.attr("src", Init.esperRootUrl + "img/close.png");
      close.click(closeModal);
      done.click(closeModal);
      modalBackground.click(closeModal);
      searchTitle.text("Link to existing event");
      var searchBgUrl = Init.esperRootUrl + "img/search.png";
      searchbox.attr(
        "style",
        "background: url(" + searchBgUrl + ") no-repeat scroll 16px 16px"
      );
      clear.attr("src", Init.esperRootUrl + "img/clear.png");

      modalLogo.attr("src", Init.esperRootUrl + "img/logo-footer.png");
    });

    function closeModal() {
      search.attr("style", "display:none");
      searchModal.dialog("close");
    }

    sidebarLogo.attr("src", Init.esperRootUrl + "img/logo-footer.png");

    rootElement.append(view);
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
          var teamMembers = team.team_assistants;
          teamMembers.push(team.team_executive);
          var profileApiCalls = List.map(teamMembers, function(uid) {
            var apiCall = Api.getGoogleProfile(uid, team.teamid);
            return Deferred.join([Deferred.defer(uid), apiCall]);
          });
          Deferred.join(profileApiCalls).done(function(profiles) {
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
