module MsgView {
  var currentThreadId : string;

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
    var anchor = findAnchor().attr("class", "esper-sidebar");
    var root = $("<div id='esper'/>");
    anchor.prepend(root);
    return root;
  }

  function renderEvent(e: ApiT.CalendarEvent, teamid, threadId, sidebar) {
'''
<div #view class="esper-ev">
  <div class="esper-ev-date">
    <div #month class="esper-ev-month"></div>
    <div #day class="esper-ev-day"></div>
  </div>
  <div>
    <div #title class="esper-ev-title"/>
    <div class="esper-ev-times">
      <img #cog class="esper-ev-cog"/>
      <ul #menu class="esper-ev-menu">
        <li #editEvent class="esper-ev-menu-item">Edit</li>
        <li #duplicateEvent class="esper-ev-menu-item">Duplicate</li>
        <li #unlinkEvent class="esper-ev-menu-item">Unlink</li>
        <li #deleteEvent class="esper-ev-menu-item delete-event">Delete from calendar</li>
      </ul>
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

    if (e.title !== undefined)
      title.text(e.title);

    cog.attr("src", Init.esperRootUrl + "img/event-cog.png")
    cog.click(function() {
      menu.toggle();
      if (cog.hasClass("open"))
        cog.removeClass("open");
      else
        cog.addClass("open");
    })

    unlinkEvent.click(function() {
      Api.unlinkEvent(teamid, threadId, e.google_event_id)
        .done(function() {
          view.remove();
          refreshEventList(teamid, threadId, sidebar);
        });
    });

    deleteEvent.click(function() {
      Api.deleteLinkedEvent(teamid, threadId, e.google_event_id)
        .done(function() {
          view.remove();
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
      google_event_id: e.google_event_id,
      sync_description: true
    })
      .done(function() {
        view.spinner.attr("style", "display: none");
        view.linked.attr("style", "display: block");
        refreshEventList(teamid, threadId, sidebar);
      });
  }

  function renderSearchResult(e: ApiT.CalendarEvent, linkedEvents, teamid, sidebar) {
'''
<div #view class="esper-ev-result">
  <div class="esper-ev-date">
    <div #month class="esper-ev-month"></div>
    <div #day class="esper-ev-day"></div>
  </div>
  <a #link class="link-event">Link</a>
  <div #spinner class="spinner">
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
      return ev.google_event_id == e.google_event_id;
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
    view.results.children().remove();
    view.results.append(list);
  }

  function setupSearch(events, teamid, view) {
    afterTyping(view.searchbox, 250, function() {
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
        displayEventList(linkedEvents.events, teamid, threadId, view);
        view.count.text(linkedEvents.events.length.toString());
        if (linkedEvents.events.length == 0)
          view.noEvents.attr("style", "display: block");
        else
          view.noEvents.attr("style", "display: none");  
      });
  }

  function displayLinkedEvents(rootElement,
                               team: ApiT.Team,
                               linkedEvents: ApiT.ShowCalendarEvents) {
'''
<div #view>
  <div class="esper-header">
    <button #add class="esper-add-btn">
      <img #addIcon class="esper-add-icon"/>
    </button>
    <div class="esper-title">Linked Events (<span #count></span>)</div>
    <ul #menu class="esper-add-menu">
      <li #newEvent class="esper-ev-menu-item disabled">Create new linked event</li>
      <li #existingEvent class="esper-ev-menu-item">Link to existing event</li>
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
    <div class="copyright">&copy; 2014 Esper</div>
    <div #searchModal class="search-modal">
      <img #close class="modal-close-icon"/>
      <div #searchTitle class="search-modal-title"/>
      <input #searchbox
        type="text" class="esper-searchbox"
        placeholder="Search calendar">
        <img #clear class="clear-search"/>
      </input>
      <div #results class="search-results"/>
      <div class="search-footer">
        <img #modalLogo class="search-footer-logo"/>
        <button #done class="done-btn">Done</button>
      </div>
    </div>
</div>
'''
    addIcon.attr("src", Init.esperRootUrl + "img/add-event.png");
    add.click(function() {
      arrow.toggle();
      menu.toggle();
      if (add.hasClass("open"))
        add.removeClass("open");
      else
        add.addClass("open");
    })

    arrow.attr("src", Init.esperRootUrl + "img/arrow.png");
    noEventsText.text("Click here to link this email conversation to events on "
      + "[Executive's]" + " calendar.");
    if (linkedEvents.events.length == 0)
      noEvents.attr("style", "display: block");
    else
      noEvents.attr("style", "display: none");

    displayEventList(linkedEvents.events, team.teamid, currentThreadId, _view);

    /* Search Modal */
    // http://api.jqueryui.com/dialog/#method-close
    existingEvent.click(function() {
      searchModal.dialog({ 
        modal: true,
        dialogClass: "no-close"
        });
      searchModal.dialog("option","modal",true);

      close.attr("src", Init.esperRootUrl + "img/close.png");
      close.click(function() { searchModal.dialog( "close" ) });
      done.click(function() { searchModal.dialog( "close" ) });
      searchTitle.text("Link to existing event");
      searchbox.attr("style", "background: url(" + Init.esperRootUrl + "img/search.png) no-repeat scroll 16px 16px");
      clear.attr("src", Init.esperRootUrl + "img/clear.png");
      setupSearch(linkedEvents.events, team.teamid, _view);

      sidebarLogo.attr("src", Init.esperRootUrl + "img/logo-footer.png");
      modalLogo.attr("src", Init.esperRootUrl + "img/logo-footer.png");

    });
    
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
          Api.getLinkedEvents(team.teamid, currentThreadId)
            .done(function(linkedEvents) {
              displayLinkedEvents(rootElement, team, linkedEvents);
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
    gmail.on.open_email(function(id, url, body) {
      Log.d("Opened email " + id, url, body);
      maybeUpdateView(10);
    });
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
