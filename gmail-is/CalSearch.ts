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
                              team, eventsTab,
                              profiles: ApiT.Profile[]) {
    Log.d("renderSearchResult()");
'''
<div #view class="esper-ev-result">
  <div #date title class="esper-ev-date esper-clickable">
    <div #month class="esper-ev-month"></div>
    <div #day class="esper-ev-day"></div>
  </div>
  <a #link class="esper-link-event">Link</a>
  <div #spinner class="esper-spinner esper-link-spinner"/>
  <div #linked class="esper-linked">
    <object #check class="esper-svg"/>
    <span>Linked</span>
  </div>
  <div>
    <div class="esper-ev-title"><span #title/></div>
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

    var threadId = Sidebar.currentThreadId;
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

    link.click(function() {
      spinner.show();
      link.hide();
      CalTab.linkEvent(e, team, threadId, eventsTab, profiles, resultView);
    });

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

    return view;
  }

  function displayLinkableEvents(linkedEvents,
                                 eventList,
                                 team,
                                 searchView: SearchView,
                                 eventsTab: CalTab.CalTabView,
                                 profiles: ApiT.Profile[]) {
    Log.d("displayLinkableEvents()");
    var list = $("<div>");
    eventList.forEach(function(e) {
      renderSearchResult(e, linkedEvents, team, eventsTab, profiles)
        .appendTo(list);
    });
    searchView.clear.css("visibility", "visible");
    searchView.searchInstructions.hide();
    searchView.spinner.hide();
    searchView.resultsList.show();
    searchView.resultsList.children().remove();
    searchView.resultsList.append(list);
    if (eventList.length === 0) {
      searchView.searchStats.text("No upcoming events found");
      searchView.searchStats.addClass("esper-no-events");
    } else if (eventList.length === 1) {
      searchView.searchStats.text(eventList.length + " event found");
      searchView.searchStats.removeClass("esper-no-events");
    } else {
      searchView.searchStats.text(eventList.length + " events found");
      searchView.searchStats.removeClass("esper-no-events");
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

  function setupSearch(events, team,
                       searchView: SearchView,
                       eventsTab: CalTab.CalTabView,
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
      Api.eventSearch(team.teamid, team.team_calendars,
                      searchView.searchbox.val())
        .done(function(results) {
          displayLinkableEvents(events, results.events, team,
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

  export function openSearchModal(team, threadId,
                                  eventsTab: CalTab.CalTabView,
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
    <div class="esper-clear-search-container">
      <div #clear class="esper-clear-search">
        <object #clearImg class="esper-svg-block"/>
      </div>
    </div>
    <input #searchbox
      type="text" class="esper-searchbox"
      placeholder="Search calendar"/>
    <div #results class="esper-search-results">
      <div #searchInstructions class="esper-search-instructions"/>
      <div #spinner class="esper-spinner esper-search-spinner"/>
      <div #resultsList/>
      <div #searchStats class="esper-search-stats"/>
    </div>
    <div class="esper-search-footer">
      <button #done class="esper-primary-btn esper-done-btn">Done</button>
      <object #modalLogo class="esper-svg esper-search-footer-logo"/>
    </div>
  </div>
</div>
'''
    var searchView = <SearchView> _view;

    function closeModal() { view.remove(); }

    title.text("Link to existing event");

    Api.getLinkedEvents(team.teamid, threadId, team.team_calendars)
      .done(function(linkedEvents) {
        setupSearch(linkedEvents.linked_events, team,
                    searchView, eventsTab, profiles);
    });

    searchbox.css(
      "background",
      "url(" + Init.esperRootUrl + "img/search.svg) no-repeat scroll 16px 16px"
    );

    clearImg.attr("data", Init.esperRootUrl + "img/clear.svg");
    clear.click(function() { resetSearch(_view) });

    searchInstructions.text("Start typing above to find upcoming events.");

    modalLogo.attr("data", Init.esperRootUrl + "img/footer-logo.svg");

    background.click(closeModal);
    closeIcon.attr("data", Init.esperRootUrl + "img/close.svg");
    close.click(closeModal);
    done.click(closeModal);

    $("body").append(view);
  }

}
