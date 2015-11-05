module Esper.GmailSearch {

  var linkThreads = {};
  var unlinkThreads = {};

  function renderEvent(e: ApiT.CalendarEvent, team: ApiT.Team) {
'''
<div #view class="esper-ev-result esper-click-safe">
  <div #weekday class="esper-ev-weekday esper-click-safe"/>
  <div #date title class="esper-ev-date esper-clickable esper-click-safe">
    <div #month class="esper-ev-month esper-click-safe"></div>
    <div #day class="esper-ev-day esper-click-safe"></div>
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
</div>
'''

    var start = XDate.ofString(e.start.local);
    var end = XDate.ofString(e.end ? e.end.local : e.start.local);

    weekday.text(XDate.fullWeekDay(start));
    month.text(XDate.month(start).toUpperCase());
    day.text(XDate.day(start).toString());
    startTime.text(XDate.timeOnly(start));
    endTime.text(XDate.timeOnly(end));

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

    return view;
  }

  function renderSearchResult(e: ApiT.EmailThreadSearch, task: ApiT.Task,
                              team: ApiT.Team, threadId: string, eventsTab) {
    Log.d("renderSearchResult()");
'''
<div #view class="esper-bs">
  <div class="input-group">
    <span class="input-group-addon">
      <input #link type="checkbox" aria-label="...">
    </span>
    <div #info class="form-control esper-gmail-search-result" aria-label="..." readonly>
      <object #logo class="esper-email-logo"/>
      <div class="gmail-from" #from/>
      <div class="gmail-subject" #subject/>
      <div class="gmail-date" #date/>
    </div>
  </div>
</div>
'''

    var newTask;
    var date_output;
    var searchThread = e.gmail_thrid;
    from.html(e.first_from);

    var thread_date = XDate.ofString(e.last_date);
    var now = new Date();
    if (now.getDay() === thread_date.getDay()) {
      date_output = XDate.timeOnly(thread_date);
    } else {
      date_output = XDate.month(thread_date) + " " + XDate.day(thread_date);
    }

    subject.html("<b>" + e.first_subject.substring(0,50) + "</b> - " 
                  + e.last_snippet.substring(0,80));
    date.html(date_output);

    var job = Api.getTaskForThread(team.teamid, searchThread, true, true)
      .done(function(existingTask) {
        if (existingTask !== undefined) {
          logo.attr("data", Init.esperRootUrl + "img/menu-logo-purple.svg");
        } else {
          logo.attr("data", Init.esperRootUrl + "img/footer-logo.svg");
        }
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

      //check for already clicked in this session, but not yet linked threads
      $.each(linkThreads, function(localthread, task) {
        if (localthread === searchThread) {
          (<HTMLInputElement>link[0]).checked = true;
        }
      })
    }

    link.click(function(e) {
      if (!link.is(":checked")) {
        delete linkThreads[searchThread];
        unlinkThreads[searchThread] = task;
      } else {
        delete unlinkThreads[searchThread];
        linkThreads[searchThread] = task;
        if (newTask !== undefined) {
'''
<div #modal class="esper-bs">
  <p> 
    This email is already linked to the following task:
  </p>
  <div class="panel panel-default">
    <div #title class="panel-heading"/>
    <div #body class="panel-body">
      <div #taskNotes>Task Notes:</div>
      <div><br></div>
      <div #linkedEmails>Linked Emails:</div>
      <div><br></div>
      <div #linkedEvents>Linked Events:</div>
    </div>
  </div>
</div>
<div #editorText/>
'''
          title.html(newTask.task_title);

          if (newTask.task_notes_quill === "" || newTask.task_notes_quill === undefined) {
            taskNotes.append("<div>None</div>");
          } else {
            var editor = new quill(editorText.get(0));
            editor.setContents(JSON.parse(newTask.task_notes_quill));
            taskNotes.append(editor.getHTML());
          }

          if (newTask.task_threads.length === 0) {
            linkedEmails.append("<div>None</div>");
          } else {
            newTask.task_threads.forEach(function(thread) {
'''<a #a class="esper-thread-link esper-link"></a>'''
              a
                .text(thread.subject)
                .attr("title", thread.subject)
                .click(function(e) {
                  e.stopPropagation();
                  var url = window.location.origin 
                            + window.location.pathname + "#all/" 
                            + thread.gmail_thrid;
                  window.open(url, '_blank');
                });
              linkedEmails.append(a);
            });
          }

          if (newTask.task_events.length === 0) {
            linkedEvents.append("<div>None</div>");
          } else {
            newTask.task_events.forEach(function(event) {
              linkedEvents.append(renderEvent(event.event, team));
            });
          }
          Modal.alert("Warning", modal).view.appendTo($("body"));
        }
      }
    });


    return view;
  }

  function setupSearch(team: ApiT.Team,
                       threadId: string,
                       searchView: SearchView,
                       eventsTab: TaskTab.TaskTabView) {
    Util.afterTypingNoClickNoFocus(searchView.search, 250, function() {
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
                    renderSearchResult(e, task, team, threadId, eventsTab)
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
            <span class="esper-click-safe">No emails named </span>
            &quot;
            <span #noResultsFeedback class="esper-bold esper-click-safe"/>
            &quot;
          </div>
        </div>
      </ul>
    </div>
    <div class="esper-modal-footer esper-clearfix">
      <button #done class="esper-btn esper-btn-primary modal-primary">
        Link
      </button>
      <button #cancel class="esper-btn esper-btn-secondary modal-cancel">
        Cancel
      </button>
    </div>
  </div>
</div>
'''
    var searchView = <SearchView> _view;
    linkThreads = {};
    unlinkThreads = {};

    setupSearch(team, threadId, searchView, eventsTab);

    search.css(
      "background",
      "url(" + Init.esperRootUrl + "img/search.svg) no-repeat scroll"
    );

    function closeModal() {
      Analytics.track(Analytics.Trackable.ClickCancelEmailSearch);
      linkThreads = {};
      unlinkThreads = {};
      view.remove();
    }

    function workAndCloseModal() {
      $.each(unlinkThreads, function(searchThread, task) {
        if (task !== undefined) {
          TaskTab.unlinkThread(team.teamid, task.taskid, searchThread).done(function() {
            TaskTab.refreshLinkedThreadsList(team, threadId, eventsTab);
          });
        }
      });

      $.each(linkThreads, function(searchThread, task) {
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
                                                    userTabContents);
                Analytics.track(Analytics.Trackable.LinkTaskTabToExistingTask);
              });
          });
      });
      Analytics.track(Analytics.Trackable.ClickLinkEmailSearch);
      linkThreads = {};
      unlinkThreads = {};
      view.remove();
    }

    view.click(closeModal);
    Util.preventClickPropagation(modal);
    done.click(workAndCloseModal);
    cancel.click(closeModal);

    return _view;
  }

}
