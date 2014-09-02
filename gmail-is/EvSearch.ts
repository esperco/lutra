module Esper.EvSearch {

  function linkEvent(e, teamid, threadId,
                     eventsTab: EvTab.EventsTab,
                     profiles,
                     resultView: ResultView) {
    Api.linkEventForMe(teamid, threadId, e.google_event_id)
      .done(function() {
        resultView.spinner.attr("style", "display: none");
        resultView.linked.attr("style", "display: block");
        EvTab.refreshEventList(teamid, threadId, eventsTab, profiles);

        Api.linkEventForTeam(teamid, threadId, e.google_event_id)
          .done(function() {
            Api.syncEvent(teamid, threadId, e.google_event_id)
              .done(function() {
                // TODO Report something, handle failure, etc.
                EvTab.refreshEventList(teamid, threadId, eventsTab, profiles);
              });
          });
      });
  }

  interface ResultView {
    view: JQuery;
    month: JQuery;
    day: JQuery;
    link: JQuery;
    spinner: JQuery;
    linked: JQuery;
    check: JQuery;
    title: JQuery;
    startTime: JQuery;
    endTime: JQuery;
  }

  export function renderSearchResult(e: ApiT.CalendarEvent, linkedEvents,
                                     teamid, eventsTab,
                                     profiles: ApiT.Profile[]) {
    Log.d("renderSearchResult()");
'''
<div #view class="esper-ev-result">
  <div class="esper-ev-date">
    <div #month class="esper-ev-month"></div>
    <div #day class="esper-ev-day"></div>
  </div>
  <a #link class="link-event">Link</a>
  <div #spinner class="spinner link-spinner">
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
    var resultView = <ResultView> _view;
    var start = XDate.ofString(e.start.local);
    var end = XDate.ofString(e.end.local);

    month.text(XDate.month(start).toUpperCase());
    day.text(XDate.day(start).toString());
    startTime.text(XDate.timeOnly(start));
    endTime.text(XDate.timeOnly(end));

    var threadId = MsgView.currentThreadId;
    if (e.title !== undefined)
      title.text(e.title);

    link.click(function() {
      spinner.attr("style", "display: block");
      link.attr("style", "display: none");
      linkEvent(e, teamid, threadId, eventsTab, profiles, resultView);
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

  function displayLinkableEvents(linkedEvents,
                                 eventList,
                                 teamid,
                                 searchView: SearchView,
                                 eventsTab: EvTab.EventsTab,
                                 profiles: ApiT.Profile[]) {
    Log.d("displayLinkableEvents()");
    var list = $("<div>");
    eventList.forEach(function(e) {
      renderSearchResult(e, linkedEvents, teamid, eventsTab, profiles)
        .appendTo(list);
    });
    searchView.clear.attr("style", "visibility: visible");
    searchView.searchInstructions.attr("style", "display: none");
    searchView.spinner.attr("style", "display: none");
    searchView.resultsList.attr("style", "display: block");
    searchView.resultsList.children().remove();
    searchView.resultsList.append(list);
    if (eventList.length === 0) {
      searchView.searchStats.text("No events found");
      searchView.searchStats.addClass("no-events");
    } else if (eventList.length === 1) {
      searchView.searchStats.text(eventList.length + " event found");
      searchView.searchStats.removeClass("no-events");
    } else {
      searchView.searchStats.text(eventList.length + " events found");
      searchView.searchStats.removeClass("no-events");
    }
    searchView.searchStats.attr("style", "display: block");
  }

  function resetSearch(view: SearchView) {
    view.searchbox.val("");
    view.searchbox.focus();
    view.clear.attr("style", "visibility: hidden");
    view.searchInstructions.attr("style", "display: block");
    view.spinner.attr("style", "display: none");
    view.resultsList.children().remove();
    view.searchStats.attr("style", "display: none");
  }

  function displayActiveEvents(linkedEvents, teamid, searchView,
                               eventsTab, profiles) {
    var list = $("<div>");
    var active = Login.getAccount().activeEvents;
    if (active === null || active === undefined) return;
    var events = active.calendars;
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
    searchView.spinner.attr("style", "display: block");
    Deferred.join(getEventCalls).done(function(activeEvents) {
      activeEvents.forEach(function(e : ApiT.CalendarEvent) {
        renderSearchResult(e, linkedEvents, teamid, eventsTab, profiles)
          .appendTo(list);
      });
      searchView.clear.attr("style", "visibility: visible");
      searchView.searchInstructions.attr("style", "display: none");
      searchView.spinner.attr("style", "display: none");
      searchView.resultsList.attr("style", "display: block");
      searchView.resultsList.children().remove();
      searchView.resultsList.append(list);
    });
  }

  function setupSearch(events, teamid,
                       searchView: SearchView,
                       eventsTab: EvTab.EventsTab,
                       profiles: ApiT.Profile[]) {
    Log.d("setupSearch()");
    resetSearch(searchView);
    Util.afterTyping(searchView.searchbox, 250, function() {
      if (searchView.searchbox.val().length === 0) {
        resetSearch(searchView);
      } else {
          searchView.searchbox.keypress(function(e) {
          if (e.which != 0) {
            searchView.searchInstructions.attr("style", "display: none");
            searchView.spinner.attr("style", "display: block");
            searchView.resultsList.attr("style", "display: none");
            searchView.searchStats.attr("style", "display: none");
          }
        })
      }
      Api.eventSearch(teamid, searchView.searchbox.val())
        .done(function(results) {
          displayLinkableEvents(events, results.events, teamid,
                                searchView, eventsTab, profiles);
        });
    });
  }

  interface SearchView {
    view: JQuery;
    background: JQuery;
    modal: JQuery;
    close: JQuery;
    closeIcon: JQuery;
    title: JQuery;
    clear: JQuery;
    searchbox: JQuery;
    searchInstructions: JQuery;
    spinner: JQuery;
    resultsList: JQuery;
    searchStats: JQuery;
    modalLogo: JQuery;
    done: JQuery;
  }

  export function openSearchModal(linkedEvents, team,
                                  eventsTab: EvTab.EventsTab,
                                  profiles: ApiT.Profile[]) {
'''
<div #view>
  <div #background class="esper-modal-bg"/>
  <div #modal class="esper-modal esper-search-modal">
    <div class="esper-modal-header">
      <div #close class="esper-modal-close-container">
        <img #closeIcon class="esper-modal-close-icon"/>
      </div>
      <div #title class="esper-modal-title"/>
    </div>
    <div class="clear-search-container">
      <img #clear class="clear-search"/>
    </div>
    <input #searchbox
      type="text" class="esper-searchbox"
      placeholder="Search calendar"/>
    <div #results class="search-results">
      <div #searchInstructions class="search-instructions"/>
      <div #spinner class="spinner search-spinner">
        <div class="double-bounce1"></div>
        <div class="double-bounce2"></div>
      </div>
      <div #resultsList/>
      <div #searchStats class="search-stats"/>
    </div>
    <div class="search-footer">
      <img #modalLogo class="search-footer-logo"/>
      <button #done class="primary-btn done-btn">Done</button>
    </div>
  </div>
</div>
'''
    var searchView = <SearchView> _view;

    function closeModal() {
      view.remove();
    }

    title.text("Link to existing event");

    setupSearch(linkedEvents.linked_events, team.teamid,
                searchView, eventsTab, profiles);

    var searchBgUrl = Init.esperRootUrl + "img/search.png";
    searchbox.attr(
      "style",
      "background: url(" + searchBgUrl + ") no-repeat scroll 16px 16px"
    );

    clear.attr("src", Init.esperRootUrl + "img/clear.png");
    clear.click(function() { resetSearch(_view) });

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

    searchInstructions.text("Start typing above to find upcoming events on " +
      possessive + " calendar.");

    modalLogo.attr("src", Init.esperRootUrl + "img/footer-logo.png");

    background.click(closeModal);
    closeIcon.attr("src", Init.esperRootUrl + "img/close.png");
    close.click(closeModal);
    done.click(closeModal);

    $("body").append(view);
  }

}
