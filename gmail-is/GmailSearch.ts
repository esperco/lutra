module Esper.GmailSearch {

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

  function renderSearchResult(e: ApiT.EmailThread, linkedEvents,
                              team: ApiT.Team, threadId: string, eventsTab, last) {
    Log.d("renderSearchResult()");
'''
<div #view class="esper-bs">
  <div class="input-group">
    <span class="input-group-addon">
      <input #link type="checkbox" aria-label="...">
    </span>
    <div #info class="form-control esper-gmail-search-result" aria-label="..." readonly>
  </div>
</div>
'''

    info.html("<b>" + e.subject + "</b> - " + e.snippet);

    var url = window.location.origin + window.location.pathname + "#all/" + e.gmail_thrid;
    info.click(function(e) {
      window.open(url, '_blank');
    });

    link.click(function(e) {
      
    });


    return view;
  }

  function setupSearch(team: ApiT.Team,
                       threadId: string,
                       searchView: SearchView,
                       eventsTab: TaskTab.TaskTabView) {
    Util.afterTyping(searchView.search, 250, function() {
      searchView.results.find(".esper-bs").remove();
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
            Api.emailSearch(team.teamid, searchView.search.val())
              .done(function(results) {
                console.error("STOP");
                console.log(results);
                var numResults = results.threads.length;
                var i = 0;
                var last = false;

                searchView.spinner.hide();

                results.threads.forEach(function(e) {
                  if (i == (numResults - 1)) last = true;
                  renderSearchResult(e, events, team, threadId, eventsTab, last)
                    .appendTo(searchView.results);
                  i++;
                });

                if (results.threads.length === 0) {
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
    <div class="esper-modal-header">Link to existing email</div>
    <div class="esper-modal-content">
      <input #search
        type="text" class="esper-input esper-search-modal-input"
        placeholder="Search gmail"/>
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
