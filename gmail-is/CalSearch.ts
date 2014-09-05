module Esper.CalSearch {

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

  function renderSearchResult(e: ApiT.CalendarEvent, linkedEvents,
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
  <div #spinner class="spinner link-spinner"/>
  <div #linked class="linked">
    <object #check class="esper-svg"/>
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
      spinner.show();
      link.hide();
      CalTab.linkEvent(e, teamid, threadId, eventsTab, profiles, resultView);
    });

    check.attr("data", Init.esperRootUrl + "img/check.svg");
    var alreadyLinked = linkedEvents.filter(function(ev) {
      return ev.google_event_id === e.google_event_id;
    })
    if (alreadyLinked.length > 0) {
      link.hide();
      linked.show();
    } else {
      link.show();
      linked.hide();
    }

    return view;
  }

  function displayLinkableEvents(linkedEvents,
                                 eventList,
                                 teamid,
                                 searchView: SearchView,
                                 eventsTab: CalTab.EventsTab,
                                 profiles: ApiT.Profile[]) {
    Log.d("displayLinkableEvents()");
    var list = $("<div>");
    eventList.forEach(function(e) {
      renderSearchResult(e, linkedEvents, teamid, eventsTab, profiles)
        .appendTo(list);
    });
    searchView.clear.css("visibility", "visible");
    searchView.searchInstructions.hide();
    searchView.spinner.hide();
    searchView.resultsList.show();
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
    searchView.searchStats.show();
  }

  function resetSearch(view: SearchView) {
    view.searchbox.val("");
    view.searchbox.focus();
    view.clear.css("visibility", "hidden");
    view.searchInstructions.show();
    view.spinner.hide();
    view.resultsList.children().remove();
    view.searchStats.hide();
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
    var eventsForTeam = events[team.team_calendar.google_calendar_id];
    if (eventsForTeam === undefined) return;
    var getEventCalls =
      List.filterMap(
        eventsForTeam,
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
      searchView.clear.css("visibility", "visible");
      searchView.searchInstructions.hide();
      searchView.spinner.hide();
      searchView.resultsList.show();
      searchView.resultsList.children().remove();
      searchView.resultsList.append(list);
    });
  }

  function setupSearch(events, teamid,
                       searchView: SearchView,
                       eventsTab: CalTab.EventsTab,
                       profiles: ApiT.Profile[]) {
    Log.d("setupSearch()");
    resetSearch(searchView);
    Util.afterTyping(searchView.searchbox, 250, function() {
      if (searchView.searchbox.val().length === 0) {
        resetSearch(searchView);
      } else {
          searchView.searchbox.keypress(function(e) {
          if (e.which != 0) {
            searchView.searchInstructions.hide();
            searchView.spinner.show();
            searchView.resultsList.hide();
            searchView.searchStats.hide();
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
                                  eventsTab: CalTab.EventsTab,
                                  profiles: ApiT.Profile[]) {
'''
<div #view>
  <div #background class="esper-modal-bg"/>
  <div #modal class="esper-modal esper-search-modal">
    <div class="esper-modal-header">
      <div #close class="esper-modal-close-container">
        <object #closeIcon class="esper-svg esper-modal-close-icon"/>
      </div>
      <div #title class="esper-modal-title"/>
    </div>
    <div class="clear-search-container">
      <div #clear class="clear-search">
        <object #clearImg class="esper-svg-block"/>
      </div>
    </div>
    <input #searchbox
      type="text" class="esper-searchbox"
      placeholder="Search calendar"/>
    <div #results class="search-results">
      <div #searchInstructions class="search-instructions"/>
      <div #spinner class="spinner search-spinner"/>
      <div #resultsList/>
      <div #searchStats class="search-stats"/>
    </div>
    <div class="search-footer">
      <button #done class="primary-btn done-btn">Done</button>
      <object #modalLogo class="esper-svg search-footer-logo"/>
    </div>
  </div>
</div>
'''
    var searchView = <SearchView> _view;

    function closeModal() { view.remove(); }

    title.text("Link to existing event");

    setupSearch(linkedEvents.linked_events, team.teamid,
                searchView, eventsTab, profiles);

    searchbox.css(
      "background",
      "url(" + Init.esperRootUrl + "img/search.svg) no-repeat scroll 16px 16px"
    );

    clearImg.attr("data", Init.esperRootUrl + "img/clear.svg");
    clear.click(function() { resetSearch(_view) });

    var cal = team.team_calendar.google_calendar_id;
    searchInstructions.text("Start typing above to find upcoming events on " +
      "calendar " + cal + ".");

    modalLogo.attr("data", Init.esperRootUrl + "img/footer-logo.svg");

    background.click(closeModal);
    closeIcon.attr("data", Init.esperRootUrl + "img/close.svg");
    close.click(closeModal);
    done.click(closeModal);

    $("body").append(view);
  }

}
