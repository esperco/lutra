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
                              team: ApiT.Team, threadId: string, eventsTab, last) {
    Log.d("renderSearchResult()");
'''
<li #view class="esper-ev-result esper-click-safe">
  <div #weekday class="esper-ev-weekday esper-click-safe"/>
  <div #date title class="esper-ev-date esper-clickable esper-click-safe">
    <div #month class="esper-ev-month esper-click-safe"></div>
    <div #day class="esper-ev-day esper-click-safe"></div>
  </div>
  <a #link class="esper-link-event esper-click-safe">Link</a>
  <div #spinner class="esper-spinner esper-link-spinner esper-click-safe"/>
  <div #linked class="esper-linked esper-click-safe">
    <object #check class="esper-linked-check esper-click-safe"/>
    <span class="esper-click-safe">Linked</span>
  </div>
  <div>
    <div class="esper-ev-title esper-click-safe"><span #title/></div>
    <div class="esper-ev-times esper-click-safe">
      <span #startTime class="esper-ev-start esper-click-safe"></span>
      &rarr;
      <span #endTime class="esper-ev-end esper-click-safe"></span>
      <span #timezone class="esper-ev-tz esper-click-safe"/>
    </div>
  </div>
</li>
'''
    if (last) view.addClass("esper-last");

    var resultView = <ResultView> _view;
    var start = XDate.ofString(e.start.local);
    var end = XDate.ofString(e.end ? e.end.local : e.start.local);

    weekday.text(XDate.fullWeekDay(start));
    month.text(XDate.month(start).toUpperCase());
    day.text(XDate.day(start).toString());
    startTime.text(XDate.utcToLocalTimeOnly(start));
    endTime.text(XDate.utcToLocalTimeOnly(end));

    var calendar = List.find(team.team_calendars, function(cal) {
      return cal.google_cal_id === e.google_cal_id;
    });
    timezone.text(CalPicker.zoneAbbr(calendar.calendar_timezone));

    if (e.title !== undefined) {
      title.text(e.title);
    } else {
      title.text("Untitled event");
    }

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
          "tooltipClass": "esper-top esper-tooltip"
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
      CurrentThread.linkEvent(e).done(function () {
        resultView.link.hide();
        resultView.spinner.hide();
        resultView.linked.show();
      }).fail(function () {
        resultView.link.hide();
        resultView.spinner.hide();

'''
<div #body>
  <p> 
    This event is likely linked to an existing task.
  </p>
  <p>
    Link this email to that task instead, using the title section at the top of the sidebar.
  </p>
</div>
'''
        Modal.alert("Could not link event.", body).view.appendTo($("body"));
      });
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

  function setupSearch(team: ApiT.Team,
                       threadId: string,
                       searchView: SearchView,
                       eventsTab: TaskTab.TaskTabView) {
    Util.afterTyping(searchView.search, 250, function() {
      searchView.results.find("li").remove();
      if (searchView.search.val().trim() === "") {
        searchView.resultsDropdown.hide();
        if (searchView.resultsDropdown.hasClass("esper-open")) {
          searchView.resultsDropdown.removeClass("esper-open");
        }
      } else {
        searchView.resultsDropdown.show();
        if (!(searchView.resultsDropdown.hasClass("esper-open"))) {
          searchView.resultsDropdown.addClass("esper-open");
        }
        searchView.spinner.show();
        searchView.noResults.hide();
        Api.getLinkedEvents(team.teamid, threadId, team.team_calendars)
          .done(function(events) {
            Api.eventSearch(team.teamid, team.team_calendars,
                            searchView.search.val())
              .done(function(results) {
                var numResults = results.events.length;
                var i = 0;
                var last = false;

                searchView.spinner.hide();

                results.events.forEach(function(e) {
                  if (i == (numResults - 1)) last = true;
                  renderSearchResult(e, events, team, threadId, eventsTab, last)
                    .appendTo(searchView.results);
                  i++;
                });

                if (results.events.length === 0) {
                  searchView.noResultsFeedback.text(searchView.search.val());
                  searchView.noResults.show();
                } else {
                  searchView.noResults.hide();
                }
              });
          });
        }
    });
  }

  interface SearchView {
    view: JQuery;
    background: JQuery;
    modal: JQuery;
    search: JQuery;
    resultsDropdown: JQuery;
    spinner: JQuery;
    results: JQuery;
    noResults: JQuery;
    noResultsFeedback: JQuery;
    done: JQuery;
    cancel: JQuery;
  }

  export function viewOfSearchModal(team, threadId,
                                  eventsTab: TaskTab.TaskTabView) {
'''
<div #view class="esper-modal-bg">
  <div #modal class="esper-search-modal esper-modal-flexbox">
    <div class="esper-modal-header">Link to existing event</div>
    <div class="esper-modal-content">
      <input #search
        type="text" class="esper-input esper-search-modal-input"
        placeholder="Search calendar"/>
      <ul #resultsDropdown class="esper-ev-search-results esper-ul-results">
        <div #spinner class="esper-spinner esper-search-spinner"/>
        <div #results>
          <div #noResults class="esper-no-results esper-click-safe">
            <span class="esper-click-safe">No upcoming events named </span>
            &quot;
            <span #noResultsFeedback class="esper-bold esper-click-safe"/>
            &quot;
          </div>
        </div>
      </ul>
    </div>
    <div class="esper-modal-footer esper-clearfix">
      <button #done class="esper-btn esper-btn-primary modal-primary">
        Done
      </button>
      <button #cancel class="esper-btn esper-btn-secondary modal-cancel">
        Cancel
      </button>
    </div>
  </div>
</div>
'''
    var searchView = <SearchView> _view;

    setupSearch(team, threadId, searchView, eventsTab);

    search.css(
      "background",
      "url(" + Init.esperRootUrl + "img/search.svg) no-repeat scroll"
    );

    function closeModal() { view.remove(); }
    view.click(closeModal);
    Util.preventClickPropagation(modal);
    done.click(closeModal);
    cancel.click(closeModal);

    return _view;
  }

}
