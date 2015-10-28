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

  function renderSearchResult(e: ApiT.EmailThread, task: ApiT.Task,
                              team: ApiT.Team, threadId: string, eventsTab, userTab) {
    Log.d("renderSearchResult()");
'''
<div #view class="esper-bs">
  <div class="input-group">
    <span class="input-group-addon">
      <input #link type="checkbox" aria-label="...">
    </span>
    <div #info class="form-control esper-gmail-search-result" aria-label="..." readonly>
      <object #logo class="esper-email-logo"/>
    </div>
  </div>
</div>
'''

    var newTask;
    var searchThread = e.gmail_thrid;

    Api.getTaskForThread(team.teamid, searchThread, false, false)
      .done(function(existingTask) {
        if (existingTask !== undefined) {
          logo.attr("data", Init.esperRootUrl + "img/menu-logo-purple.svg");
        } else {
          logo.attr("data", Init.esperRootUrl + "img/footer-logo.svg");
        }
        info.html(info.html() + "<b>" + e.subject + "</b> - " + e.snippet);
        newTask = existingTask;
      });

    var url = window.location.origin + window.location.pathname + "#all/" + searchThread;
    info.click(function(e) {
      window.open(url, '_blank');
    });

    //check threads that are already linked
    if (task !== undefined) {
      List.iter(task.task_threads || [], function(thread: ApiT.EmailThread) {
        if (thread.gmail_thrid === searchThread) {
          (<HTMLInputElement>link[0]).checked = true;
        }
      });
    }

    link.click(function(e) {
      if (!link.is(":checked")) {
        TaskTab.unlinkThread(team.teamid, task.taskid, searchThread);
      } else {
        Api.getTaskForThread(team.teamid, searchThread, false, false)
          .done(function(newTask) {
            var job;
            CurrentThread.getTaskForThread()
              .done(function(autoTask) {
                var currentTask = autoTask;
                CurrentThread.setTask(currentTask);

                if (newTask !== undefined) {
                  job = Api.switchTaskForThread(team.teamid, searchThread,
                                                newTask.taskid, currentTask.taskid);
                  var meetingType = newTask.task_meeting_type;
                  if (meetingType && !currentTask.task_meeting_type) {
                    job.done(function() {
                      return Api.setTaskMeetingType(currentTask.taskid, meetingType);
                    });
                    currentTask.task_meeting_type = meetingType;
                  }
                } else {
                  job = Api.linkThreadToTask(team.teamid, searchThread, currentTask.taskid);
                }

                job.done(function() {
                  TaskTab.refreshTaskProgressSelection(team, threadId, eventsTab);
                  TaskTab.refreshLinkedThreadsList(team, threadId, eventsTab);
                  TaskTab.refreshLinkedEventsList(team, threadId, eventsTab);
                });

                eventsTab.taskTitle.val(currentTask.task_title);
                TaskTab.selectMeetingTypeOnUserTab(currentTask.task_meeting_type,
                                                   userTab);
                Analytics.track(Analytics.Trackable.LinkTaskTabToExistingTask);
              });
          });
      }
    });


    return view;
  }

  function setupSearch(team: ApiT.Team,
                       threadId: string,
                       searchView: SearchView,
                       eventsTab: TaskTab.TaskTabView,
                       userTab) {
    Util.afterTyping(searchView.search, 250, function() {
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
        var task = CurrentThread.task.get();
        Api.getTaskForThread(team.teamid, threadId, false, true)
          .done(function(task) {
            Api.emailSearch(team.teamid, searchView.search.val())
              .done(function(results) {
                var numResults = results.items.length;
                var i = 0;
                var last = false;

                searchView.spinner.hide();
                searchView.results.find(".esper-bs").remove();

                results.items.forEach(function(e) {
                  if (threadId !== e.gmail_thrid) {
                    renderSearchResult(e, task, team, threadId, eventsTab, userTab)
                      .appendTo(searchView.results);
                  }
                });

                if (results.items.length === 0) {
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
                                  eventsTab: TaskTab.TaskTabView,
                                  userTabContents) {
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

    setupSearch(team, threadId, searchView, eventsTab, userTabContents);

    search.css(
      "background",
      "url(" + Init.esperRootUrl + "img/search.svg) no-repeat scroll"
    );

    function closeModal() {
      TaskTab.refreshLinkedThreadsList(team, threadId, eventsTab);
      view.remove();
    }
    view.click(closeModal);
    Util.preventClickPropagation(modal);
    done.click(closeModal);
    cancel.click(closeModal);

    return _view;
  }

}
