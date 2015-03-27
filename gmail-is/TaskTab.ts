module Esper.TaskTab {

  var taskLabelCreate = "Create task";
  var taskLabelExists = "Title";

  /* To refresh from outside, like in CalPicker */
  export var refreshLinkedEventsAction : () => void;
  export var currentTaskTab : TaskTabView;

  export interface LinkOptionsView {
    view: JQuery;
    link: JQuery;
    spinner: JQuery;
    linked: JQuery;
    check: JQuery;
  }

  export function linkEvent(e, team, threadId,
                            taskTab: TaskTabView,
                            profiles,
                            view: LinkOptionsView) {
    Api.linkEventForMe(team.teamid, threadId, e.google_event_id)
      .done(function() {
        // TODO Report something, handle failure, etc.
        view.link.hide();
        view.spinner.hide();
        view.linked.show();
        Api.linkEventForTeam(team.teamid, threadId, e.google_event_id)
          .done(function() {
            refreshEventLists(team, threadId, taskTab, profiles);
            CurrentThread.refreshTaskForThread();
            Api.syncEvent(team.teamid, threadId,
                          e.google_cal_id, e.google_event_id);
          });
      });
  }

  function mergeActiveWithCreated(active: Types.Visited<Types.FullEventId>[],
                                  created: ApiT.CreatedCalendarEvent[]) {
    var createdTimed = List.map(created, function(e) {
      var time = XDate.ofString(e.creation_time).getTime() / 1000;
      var item = { calendarId: e.google_cal_id, eventId: e.google_event_id };
      return { id: e.google_event_id, item: item, lastVisited: time };
    });
    return Visited.merge(active, createdTimed, 5);
  }

  export function displayRecentsList(team, threadId,
                                     taskTab: TaskTabView,
                                     profiles,
                                     linkedEvents: ApiT.EventWithSyncInfo[]) {
'''
  <div #noEvents class="esper-no-events">No recently viewed events</div>
  <div #eventsList class="esper-events-list"/>
'''
    taskTab.refreshRecents.addClass("esper-disabled");
    taskTab.recentsList.children().remove();
    taskTab.recentsSpinner.show();

    function renderNone() {
      taskTab.recentsList.append(noEvents);
      taskTab.recentsSpinner.hide();
      taskTab.refreshRecents.removeClass("esper-disabled");
    }

    if (team === null || team === undefined) {
      renderNone();
      return;
    }
    var active = Login.getAccount().activeEvents;
    if (active === null || active === undefined) {
      renderNone();
      return;
    }
    var events = active.calendars;
    var activeEvents = [];
    List.iter(team.team_calendars, function(cal : ApiT.Calendar) {
      var eventsForCal = events[cal.google_cal_id];
      if (eventsForCal !== undefined)
        activeEvents = activeEvents.concat(eventsForCal);
    });
    if (activeEvents === []) {
      renderNone();
      return;
    }

    Api.getRecentlyCreatedEvents(team.teamid, team.team_calendars)
      .done(function(created) {
        var eventsForTeam: Types.Visited<Types.FullEventId>[] =
          mergeActiveWithCreated(activeEvents, created.created_events);

        var getEventCalls =
          List.filterMap(
            eventsForTeam,
            function(e) {
              var item = e.item; // compatibility check
              if (item !== undefined) {
                return Api.getEventDetails(team.teamid, item.calendarId,
                                           team.team_calendars, item.eventId);
              } else {
                renderNone();
                return;
              }
          });

        Promise.join(getEventCalls).done(function(activeEvents) {
          var i = 0;
          var last = false;
          var recent = true;
          activeEvents.forEach(function(response: ApiT.CalendarEventOpt) {
            var e = response.event_opt;
            if (e === undefined) return; // event is deleted aka cancelled
            if (i === activeEvents.length - 1)
              last = true;

            var ev = { event : e, synced_threads : [] };
            eventsList.append(EventWidget.renderEvent(linkedEvents, ev, recent, last,
                                                      team, threadId, profiles));
            i++;
          });
          taskTab.recentsList.children().remove();
          taskTab.recentsList.append(eventsList);
          taskTab.recentsSpinner.hide();
          taskTab.refreshRecents.removeClass("esper-disabled");
        });
      });
  }

  /* reuse the view created for the team, update list of linked events */
  export function displayLinkedEventsList(team, threadId, taskTab: TaskTabView,
                                          profiles, linkedEvents:
                                          ApiT.EventWithSyncInfo[]) {
'''
  <div #noEvents class="esper-no-events">No linked events</div>
  <div #eventsList class="esper-events-list"/>
'''
    taskTab.refreshLinkedEvents.addClass("esper-disabled");
    taskTab.linkedEventsList.children().remove();
    taskTab.linkedEventsSpinner.show();

    CurrentThread.linkedEvents.set(linkedEvents);

    if (linkedEvents.length === 0) {
      taskTab.linkedEventsList.append(noEvents);
    } else {
      var i = 0;
      var recent, last = false;
      linkedEvents.forEach(function(e: ApiT.EventWithSyncInfo) {
        if (i === linkedEvents.length - 1) last = true;

        eventsList.append(EventWidget.renderEvent(linkedEvents, e, recent, last,
                                                  team, threadId, profiles));
        i++;
      });
      taskTab.linkedEventsList.append(eventsList);
    }
    taskTab.linkedEventsSpinner.hide();
    taskTab.refreshLinkedEvents.removeClass("esper-disabled");
  }

  function unlinkThread(teamid, taskid, threadId) {
    return Api.unlinkThreadFromTask(teamid, threadId, taskid)
      .then(function() {
        /* force the creation of a task for the newly unlinked thread */
        return Api.obtainTaskForThread(teamid, threadId, false, false);
      });
  }

  export function displayLinkedThreadsList(task, threadId,
                                           taskTab: TaskTabView) {
'''
  <div #noThreads class="esper-no-threads">No linked emails</div>
  <ul #threadsList class="esper-thread-list"/>
'''
    taskTab.linkedThreadsList.children().remove();

    List.iter(task.task_threads, function(thread : ApiT.EmailThread) {
      var linkedThreadId = thread.gmail_thrid;
      if (linkedThreadId !== threadId) {
'''
<li #li class="esper-thread-li">
  <a #a
     class="esper-thread-link esper-link"></a>
  <span #cross
        class="esper-thread-unlink esper-clickable"
        title="Unlink thread into a new task">×</span>
</li>
'''
        a
          .text(thread.subject)
          .attr("title", thread.subject)
          .click(function(e) {
            e.stopPropagation();
            window.location.hash = "#all/" + thread.gmail_thrid;
          });

        cross.click(function() {
          unlinkThread(task.task_teamid, task.taskid, threadId);
          /* remove from the list without waiting for completion */
          li.remove();
          if (taskTab.linkedThreadsList.children("li").length === 0) {
            threadsList.remove();
            taskTab.linkedThreadsList.append(noThreads);
            taskTab.showLinkedThreads.click();
          }
        });

        li.appendTo(threadsList);
      }
    });

    if (threadsList.children("li").length > 0) {
      taskTab.linkedThreadsList.append(threadsList);
    } else {
      taskTab.linkedThreadsList.append(noThreads);
      taskTab.showLinkedThreads.click();
    }
  }

  export function displayTaskProgress(task, taskTab: TaskTabView) {
'''
  <div #taskProgress class="esper-section-selector esper-clearfix">
    <span class="esper-show-selector">Progress: </span>
    <select #taskProgressSelector class="esper-select"/>
  </div>
'''

    Sidebar.customizeSelectArrow(taskProgressSelector);
    var statuses = [
      {label:"New", state:"New"},
      {label:"In Progress", state:"In_progress"},
      {label:"Canceled", state:"Canceled"},
      {label:"Done", state:"Done"}
    ];
    List.iter(statuses, function(status) {
      $("<option value='" + status.state + "'>" + status.label + "</option>")
        .appendTo(taskProgressSelector);
    });
    taskProgressSelector.val(task.task_progress);
    taskProgressSelector.change(function() {
      var i = $(this).val();
      Api.setTaskProgress(task.taskid, i);
      task.task_progress = i;
    });

    taskTab.taskProgressContainer.append(taskProgress);
  }

  export function clearlinkedEventsList(team, taskTab: TaskTabView) {
    displayLinkedEventsList(team, "", taskTab, [], []);
  }

  /* Refresh only linked events, fetching linked events from the server. */
  export function refreshlinkedEventsList(team, threadId, taskTab, profiles) {
    Api.getLinkedEvents(team.teamid, threadId, team.team_calendars)
      .done(function(linkedEvents) {
        displayLinkedEventsList(team, threadId,
                                taskTab, profiles, linkedEvents);
      });
  }

  /* Refresh only recent events, fetching linked events from the server. */
  export function refreshRecentsList(team, threadId, taskTab, profiles) {
    Api.getLinkedEvents(team.teamid, threadId, team.team_calendars)
      .done(function(linkedEvents) {
        displayRecentsList(team, threadId, taskTab, profiles, linkedEvents);
      });
  }

  /* Refresh linked events and recent events, fetching linked events from
     the server. */
  export function refreshEventLists(team, threadId, taskTab, profiles) {
    Api.getLinkedEvents(team.teamid, threadId, team.team_calendars)
      .done(function(linkedEvents) {
        displayLinkedEventsList(team, threadId, taskTab,
                                profiles, linkedEvents);
        displayRecentsList(team, threadId, taskTab, profiles, linkedEvents);
      });
  }

  /* Refresh only recent events, fetching linked events from the server. */
  export function refreshLinkedThreadsList(team, threadId, taskTab, profiles) {
    Api.getLinkedEvents(team.teamid, threadId, team.team_calendars)
      .done(function(linkedEvents) {
        displayRecentsList(team, threadId, taskTab, profiles, linkedEvents);
      });
  }

  function createOrRenameTask(taskTitle, teamid, threadId, taskTab, query) {
    Sidebar.dismissDropdowns();
    CurrentThread.refreshTaskForThread()
      .done(function(task) {
        Api.setTaskTitle(task.taskid, query);
        task.task_title = query;
        CurrentThread.task.set(task);
        taskTitle.val(query);
      });
  }

  // Search for matching tasks and display the results in a dropdown
  function displaySearchResults(taskTitle, dropdown, results, actions,
                                team: ApiT.Team,
                                threadId: string,
                                query,
                                profiles: ApiT.Profile[],
                                taskTab: TaskTabView) {
    var teamid = team.teamid;
    Api.searchTasks(teamid, query).done(function(response) {
      results.find(".esper-li").remove();
'''
<li #noResults class="esper-li esper-disabled esper-click-safe"/>
'''
      noResults
        .append($("<span>No other tasks are named </span>"))
        .append($("<span class='esper-bold'>" + query + "</span>"))
        .appendTo(results);
      if (!(dropdown.hasClass("esper-open"))) dropdown.toggle();
      List.iter(response.search_results, function(result) {
        noResults.remove();
        var newTaskId = result.task_data.taskid;
        var title = result.task_data.task_title;
        $("<li class='esper-li'>" + title + "</li>")
          .appendTo(results)
          .click(function() {
            var currentTask = CurrentThread.task.get();
            var job =
              currentTask !== undefined ?
              Api.switchTaskForThread(teamid, threadId,
                                      currentTask.taskid, newTaskId)
              :
              Api.linkThreadToTask(teamid, threadId,
                                   newTaskId);

            job.done(function() {
              refreshlinkedEventsList(team, threadId, taskTab, profiles);
            });

            CurrentThread.task.set(result.task_data);
            taskTitle.val(title);
            Sidebar.dismissDropdowns();
          });
      });

      actions.find(".esper-li").remove();

      var currentTask = CurrentThread.task.get();
      var renameLabel =
        currentTask !== undefined ?
          "Rename task as"
        : "Create a new task named";
      var rename =
        $("<li class='esper-li'/>")
          .append($("<span>" + renameLabel + " </span>"))
          .append($("<span class='esper-bold'>" + query + "</span>"));
      rename
        .appendTo(actions)
        .click(function() {
          createOrRenameTask(taskTitle, teamid, threadId, taskTab, query);
        });

      function addArchiveOption(task) {
'''
<li #li class="esper-li"></li>
'''
        var apiCall;
        var finalState = ! task.task_archived;
        if (task.task_archived) {
          li.text("Unarchive this task");
          apiCall = Api.unarchiveTask;
        }
        else {
          li.text("Archive this task");
          apiCall = Api.archiveTask;
        }

        li
          .appendTo(actions)
          .click(function() {
            apiCall(task.taskid)
              .done(function() {
                task.task_archived = finalState;
                CurrentThread.task.set(task);
                Sidebar.dismissDropdowns();
              });
          });
      }

      var currentTask = CurrentThread.task.get();
      if (currentTask !== undefined)
        addArchiveOption(currentTask);

      dropdown.addClass("esper-open");
    });
  }

  function markNewTaskAsInProgress(task) {
    if (task.task_progress === "New") {
      var state = "In_progress";
      /* let this run in the background and assume it succeeds */
      Api.setTaskProgress(task.taskid, state);
      task.task_progress = state;
    }
  }

  export interface TaskTabView {
    taskCaption: JQuery;
    taskTitle: JQuery;
    taskSearchDropdown: JQuery;
    taskSearchResults: JQuery;
    taskSearchActions: JQuery;

    taskProgressHeader: JQuery;
    showTaskProgress: JQuery;
    refreshTaskProgress: JQuery;
    refreshTaskProgressIcon: JQuery;
    taskProgressContainer: JQuery;
    taskProgressSpinner: JQuery;
    taskProgressList: JQuery;

    linkedThreadsHeader: JQuery;
    showLinkedThreads: JQuery;
    refreshLinkedThreads: JQuery;
    refreshLinkedThreadsIcon: JQuery;
    linkedThreadsContainer: JQuery;
    linkedThreadsSpinner: JQuery;
    linkedThreadsList: JQuery;

    linkedEventsHeader: JQuery;
    showLinkedEvents: JQuery;
    refreshLinkedEvents: JQuery;
    refreshLinkedEventsIcon: JQuery;
    linkActions: JQuery;
    createEvent: JQuery;
    createEventIcon: JQuery;
    linkEvent: JQuery;
    linkEventIcon: JQuery;
    linkedEventsContainer: JQuery;
    linkedEventsSpinner: JQuery;
    linkedEventsList: JQuery;

    recentsHeader: JQuery;
    showRecents: JQuery;
    refreshRecents: JQuery;
    refreshRecentsIcon: JQuery;
    recentsContainer: JQuery;
    recentsSpinner: JQuery;
    recentsList: JQuery;
  }

  export function displayTaskTab(tab1,
                                 team: ApiT.Team,
                                 threadId: string,
                                 autoTask: boolean,
                                 profiles: ApiT.Profile[],
                                 linkedEvents: ApiT.EventWithSyncInfo[]) {
'''
<div #view>
  <div class="esper-tab-header">
    <div #taskCaption class="esper-bold" style="margin-bottom:6px"/>
    <input #taskTitle type="text" size="24"
           class="esper-input esper-task-name"/>
    <ul #taskSearchDropdown
        class="esper-drop-ul esper-dropdown-btn esper-task-search-dropdown">
      <div #taskSearchResults class="esper-dropdown-section"/>
      <div class="esper-click-safe esper-drop-ul-divider"/>
      <div #taskSearchActions class="esper-dropdown-section"/>
    </ul>
  </div>
  <div class="esper-tab-overflow">
    <div class="esper-section">
      <div #taskProgressHeader
           class="esper-section-header esper-clearfix esper-open">
        <span #showTaskProgress
              class="esper-link" style="float:right">Hide</span>
        <span class="esper-bold" style="float:left">Task Progress</span>
        <div #refreshTaskProgress
             class="esper-refresh esper-clickable esper-disabled">
          <object #refreshTaskProgressIcon class="esper-svg"/>
        </div>
      </div>
      <div #taskProgressContainer class="esper-section-container">
        <div #taskProgressSpinner class="esper-events-list-loading">
          <div class="esper-spinner esper-list-spinner"/>
        </div>
        <div #taskProgressList/>
      </div>
    </div>
    <hr class="esper-hr"/>
    <div class="esper-section">
      <div #linkedThreadsHeader
           class="esper-section-header esper-clearfix esper-open">
        <span #showLinkedThreads
              class="esper-link" style="float:right">Hide</span>
        <span class="esper-bold" style="float:left">Linked Emails</span>
        <div #refreshLinkedThreads
             class="esper-refresh esper-clickable esper-disabled">
          <object #refreshLinkedThreadsIcon class="esper-svg"/>
        </div>
      </div>
      <div #linkedThreadsContainer class="esper-section-container">
        <div #linkedThreadsSpinner class="esper-events-list-loading">
          <div class="esper-spinner esper-list-spinner"/>
        </div>
        <div #linkedThreadsList/>
      </div>
    </div>
    <div class="esper-section">
      <div #linkedEventsHeader
           class="esper-section-header esper-clearfix esper-open">
        <span #showLinkedEvents
              class="esper-link" style="float:right">Hide</span>
        <span class="esper-bold" style="float:left">Linked Events</span>
        <div #refreshLinkedEvents
             class="esper-refresh esper-clickable esper-disabled">
          <object #refreshLinkedEventsIcon class="esper-svg"/>
        </div>
      </div>
      <div #linkActions
           class="esper-section-actions esper-clearfix esper-open">
        <div style="display:inline-block">
          <div #createEvent
               class="esper-link-action esper-dropdown-btn esper-click-safe">
            <object #createEventIcon class="esper-svg esper-link-action-icon"/>
            <div class="esper-link-action-text esper-click-safe">
              Create event
            </div>
          </div>
          <div class="esper-vertical-divider"/>
          <div #linkEvent class="esper-link-action">
            <object #linkEventIcon class="esper-svg esper-link-action-icon"/>
            <div class="esper-link-action-text">Link event</div>
          </div>
        </div>
      </div>
      <div #linkedEventsContainer class="esper-section-container">
        <div #linkedEventsSpinner class="esper-events-list-loading">
          <div class="esper-spinner esper-list-spinner"/>
        </div>
        <div #linkedEventsList/>
      </div>
    </div>
    <hr class="esper-hr"/>
    <div class="esper-section">
      <div #recentsHeader
           class="esper-section-header esper-clearfix esper-open">
        <span #showRecents
              class="esper-link" style="float:right">Hide</span>
        <span class="esper-bold" style="float:left">Recents</span>
        <div #refreshRecents
             class="esper-refresh esper-clickable esper-disabled">
          <object #refreshRecentsIcon class="esper-svg"/>
        </div>
      </div>
      <div #recentsContainer class="esper-section-container">
        <div #recentsSpinner class="esper-events-list-loading">
          <div class="esper-spinner esper-list-spinner"/>
        </div>
        <div #recentsList/>
      </div>
    </div>
  </div>
</div>
'''
    var taskTabView = currentTaskTab = <TaskTabView> _view;

    CurrentThread.task.watch(
      function (task: ApiT.Task, isValid: boolean,
                oldTask: ApiT.Task, oldIsValid: boolean) {
        if (isValid) {
          taskTabView.taskCaption.text(taskLabelExists);
          taskTabView.taskTitle.text(task.task_title);
        } else {
          taskTabView.taskCaption.text(taskLabelCreate);
          taskTabView.taskTitle.text("");
        }
      }
    );

    CurrentThread.onLinkedEventsChanged(function () {
      refreshEventLists(team, threadId, taskTabView, profiles);
    });

    refreshLinkedEventsIcon.attr("data", Init.esperRootUrl + "img/refresh.svg");
    refreshRecentsIcon.attr("data", Init.esperRootUrl + "img/refresh.svg");
    createEventIcon.attr("data", Init.esperRootUrl + "img/create.svg");
    linkEventIcon.attr("data", Init.esperRootUrl + "img/link.svg");

    displayLinkedEventsList(team, threadId, taskTabView,
                            profiles, linkedEvents);
    displayRecentsList(team, threadId, taskTabView, profiles, linkedEvents);

    /* Set function to refresh from outside without passing any arguments  */
    refreshLinkedEventsAction = function() {
      refreshlinkedEventsList(team, threadId, taskTabView, profiles);
      if (linkedEventsContainer.css("display") === "none") {
        Sidebar.toggleList(linkedEventsContainer);
        showLinkedEvents.text("Hide");
        linkedEventsHeader.addClass("esper-open");
      }
    };
    refreshLinkedEvents.click(refreshLinkedEventsAction);

    refreshRecents.click(function() {
      refreshRecentsList(team, threadId, taskTabView, profiles);
      if (recentsContainer.css("display") === "none") {
        Sidebar.toggleList(recentsContainer);
        showRecents.text("Hide");
      }
    });

    showTaskProgress.click(function() {
      Sidebar.toggleList(taskProgressContainer);
      if(this.innerHTML === "Hide") {
        $(this).text("Show");
        taskProgressHeader.removeClass("esper-open");
      } else {
        $(this).text("Hide");
        taskProgressHeader.addClass("esper-open");
      }
    });

    showLinkedThreads.click(function() {
      Sidebar.toggleList(linkedThreadsContainer);
      if (this.innerHTML === "Hide") {
        $(this).text("Show");
        linkedThreadsHeader.removeClass("esper-open");
      } else {
        $(this).text("Hide");
        linkedThreadsHeader.addClass("esper-open");
      }
    });

    showLinkedEvents.click(function() {
      Sidebar.toggleList(linkedEventsContainer);
      if (this.innerHTML === "Hide") {
        $(this).text("Show");
        linkActions.removeClass("esper-open");
      } else {
        $(this).text("Hide");
        linkActions.addClass("esper-open");
      }
    });

    showRecents.click(function() {
      Sidebar.toggleList(recentsContainer);
      if (this.innerHTML === "Hide") {
        $(this).text("Show");
        recentsHeader.removeClass("esper-open");
      } else {
        $(this).text("Hide");
        recentsHeader.addClass("esper-open");
      }
    });

    createEvent.click(function() {
      if (CurrentThread.threadId.isValid() &&
          CurrentThread.task.isValid() &&
          CurrentThread.team.isValid()) {
        CurrentThread.withPreferences(function(prefs) {
          CalPicker.createInline(CurrentThread.team.get(),
                                 CurrentThread.task.get(),
                                 CurrentThread.threadId.get(),
                                 prefs);
        });
      }
    });

    var apiGetTask = autoTask ?
      Api.getAutoTaskForThread
      : Api.getTaskForThread;

    apiGetTask(team.teamid, threadId, false, true).done(function(task) {
      CurrentThread.task.set(task);
      var title = "";
      linkedThreadsSpinner.hide();
      taskProgressSpinner.hide();
      if (task !== undefined) {
        taskCaption.text(taskLabelExists);
        title = task.task_title;
        displayLinkedThreadsList(task, threadId, taskTabView);
        markNewTaskAsInProgress(task);
        displayTaskProgress(task, taskTabView);
      } else {
        taskCaption.text(taskLabelCreate);
        var thread = esperGmail.get.email_data();
        if (thread !== undefined && thread !== null)
          title = thread.subject;
      }
      taskTitle.val(title);
      Util.afterTyping(taskTitle, 250, function() {
        var query = taskTitle.val();
        if (query !== "")
          displaySearchResults(taskTitle, taskSearchDropdown, taskSearchResults,
                               taskSearchActions, team, threadId,
                               query, profiles,
                               taskTabView);
      });
      taskTitle.keydown(function(pressed) {
        var name = taskTitle.val();
        var isEnterKey = pressed.which === 13;
        if (isEnterKey) {
          pressed.stopPropagation();
          taskTitle.blur();
          Gmail.threadContainer().focus();
          createOrRenameTask(taskTitle, team.teamid, threadId,
                             taskTabView, name);
        }
      });
    });

    linkEvent.click(function() {
      var searchModal = CalSearch.viewOfSearchModal(team, threadId,
                                                    taskTabView, profiles);
      $("body").append(searchModal.view);
      searchModal.search.focus();
    });

    /* Reuse the same watcherId in order to overwrite the previous
       watcher for that same thread or any other thread,
       since at most one thread is displayed at once.
    */
    var accountWatcherId = "TaskTab-account-watcher";
    Login.watchableAccount.watch(function(newAccount, newValidity) {
      if (newValidity === true && threadId === CurrentThread.threadId.get()) {
        Log.d("Refreshing recently viewed events");
        refreshRecentsList(team, threadId, taskTabView, profiles);
      }
    }, accountWatcherId);

    var taskWatcherId = "TaskTab-task-watcher";
    CurrentThread.task.watch(function(task, valid) {
      if (valid) {
        if (task.task_archived && threadId === CurrentThread.threadId.get())
          taskTitle.addClass("esper-archived");
        else
          taskTitle.removeClass("esper-archived");
      }
    }, taskWatcherId);

    tab1.append(view);
  }

}
