module Esper.TaskTab {

  var taskLabelCreate = "Create task";
  var taskLabelExists = "Title";

  /* To refresh from outside, like in CalPicker */
  export var refreshLinkedEventsAction : () => void;
  export var currentTaskTab : TaskTabView;

  function obtainTaskForThread(teamid, threadId,
                               view: TaskTabView) {
    var currentTask = CurrentThread.task.get();

    if (currentTask !== undefined)
      return Promise.defer(currentTask);
    else {
      return Api.obtainTaskForThread(teamid, threadId, false, true)
        .then(function(task) {
          CurrentThread.task.set(task);
          view.taskCaption.text(taskLabelExists);
          view.taskTitle.text(task.task_title);
          return task;
        });
    }
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
            obtainTaskForThread(team.teamid, threadId,
                                taskTab);
            Api.syncEvent(team.teamid, threadId,
                          e.google_cal_id, e.google_event_id);
          });
      });
  }

  export interface LinkOptionsView {
    view: JQuery;
    link: JQuery;
    spinner: JQuery;
    linked: JQuery;
    check: JQuery;
  }

  function displayLinkOptions(e: ApiT.CalendarEvent,
                              linkedEvents: ApiT.EventWithSyncInfo[],
                              team,
                              threadId,
                              taskTab: TaskTabView,
                              profiles: ApiT.Profile[]) {
'''
<div #view>
  <div #link class="esper-link-event esper-clickable">Link to this event</div>
  <div #spinner/>
  <div #linked class="esper-linked">
    <object #check class="esper-svg esper-linked-check"/>
    <span>Linked</span>
  </div>
</div>
'''
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

    link.click(function() {
      link
        .removeClass("esper-link-event")
        .addClass("esper-linked")
        .text("Linking...");
      linkEvent(e, team, threadId, taskTab, profiles, _view);
    });

    return view;
  }

  /** Displays a shortcut for choosing the event without using the menu. */
  function displayEventChoose(view, event: ApiT.CalendarEvent) {
'''
<div #choose title="Choose this event." class="esper-choose-event">
  <object #check class="esper-svg esper-linked-check"/>
</div>
'''
    check.attr("data", Init.esperRootUrl + "img/green-check.svg");

    choose.click(function() {
      var msg = "Other linked events will be deleted. Are you sure?";
      if (window.confirm(msg)) { // TODO Style me
        view.parent().find(".esper-ev").addClass("esper-disabled");

        FinalizeEvent.finalizeEvent(event);
      }
    });

    return choose;
  }

  function displayEventOptions(view,
                               ev: ApiT.EventWithSyncInfo,
                               linkedEvents: ApiT.EventWithSyncInfo[],
                               team: ApiT.Team,
                               threadId: string,
                               taskTab: TaskTabView,
                               profiles: ApiT.Profile[]) {
'''
<div #optionsView>
  <div #disclose class="esper-click-safe esper-dropdown-btn
                   esper-clickable esper-ev-disclose"/>
  <ul #dropdown class="esper-drop-ul esper-ev-dropdown">
    <div class="esper-dropdown-section">
      <li #editEvent
          class="esper-li esper-disabled">
        Edit
      </li>
      <li #inviteGuests
          class="esper-li">
        Invite guests
      </li>
      <li #unlinkEvent
          class="esper-li">
        Unlink
      </li>
      <li #deleteEvent
          class="esper-li esper-danger">
        Delete from calendar
      </li>
      <li #chooseThisEvent
          class="esper-li">
        Choose this event
      </li>
    </div>
    <div class="esper-click-safe esper-drop-ul-divider"/>
    <div #syncOption class="esper-click-safe esper-dropdown-section">
      <li class="esper-click-safe esper-li esper-disabled esper-sync-option">
        <span class="esper-click-safe esper-sync-option-text">
          Description Sync
        </span>
        <object #info title class="esper-svg esper-click-safe esper-info"/>
        <input #syncCheckbox
               type="checkbox"
               class="esper-click-safe esper-sync-checkbox"/>
        <div #spinner
             class="esper-click-safe esper-spinner esper-sync-spinner"/>
      </li>
      <li #teamSync
          class="esper-click-safe esper-li esper-disabled esper-sync-users"/>
      <li #syncNote
          class="esper-click-safe esper-li esper-disabled esper-sync-note"/>
    </div>
  </ul>
</div>
'''
    var e = ev.event;

    if (e.google_cal_url !== undefined) {
      editEvent
        .removeClass("esper-disabled")
        .click(function() {
          open(e.google_cal_url, "_blank");
        });
    }

    var infoContent = "Automatically synchronizes the event's " +
      "description with the contents of this email conversation.";
    info
      .attr("data", Init.esperRootUrl + "img/info.svg")
      .tooltip({
        show: { effect: "none" },
        hide: { effect: "none" },
        "content": infoContent,
        "position": { my: 'center bottom', at: 'center top-5' },
        "tooltipClass": "esper-top esper-sync-info"
      });

    syncCheckbox.change(function() {
      var apiCall;
      if(this.checked) apiCall = Api.syncEvent;
      else apiCall = Api.unsyncEvent;
      syncCheckbox.hide();
      spinner.show();
      apiCall(team.teamid, threadId, e.google_cal_id, e.google_event_id)
        .done(function() {
          spinner.hide();
          syncCheckbox.show();
          refreshlinkedEventsList(team.teamid, threadId, taskTab, profiles);
        });
    });

    var currentSynced = false;
    var syncedUsers = [];

    List.iter(profiles, function(prof) {
      var synced = List.exists(ev.synced_threads, function(x) {
        return x.esper_uid === prof.profile_uid;
      });
      if (synced && prof.profile_uid === Login.myUid()) {
        syncCheckbox.attr("checked", true);
        currentSynced = true;
        syncedUsers.unshift("You");
      } else if (synced) {
        syncedUsers.push(prof.display_name);
      }
    });

    var teamPhrase = "";
    if ((syncedUsers.length === 0) ||
        (syncedUsers.length === 1 && syncedUsers[0] === "You")) {
      teamPhrase = "No other team members are ";
      syncNote.hide();
    } else if (syncedUsers.length === 1) {
      teamPhrase = syncedUsers[0] + " is ";
    } else if (syncedUsers.length === 2) {
      teamPhrase = syncedUsers[0] + " and " + syncedUsers[1] + " are ";
    } else {
      for (var i = 0; i < syncedUsers.length; i++) {
        if (i < syncedUsers.length - 1)
          teamPhrase += syncedUsers[i] + ", ";
        else
          teamPhrase += "and " + syncedUsers[i] + " are ";
      }
    }
    teamSync.text(teamPhrase += " syncing messages with this event.");

    var notePhrase = "";
    if (!currentSynced && syncedUsers.length > 0) {
      notePhrase = "Turn on Description Sync to also include messages from " +
        "your version of this email conversation. Duplicate messages will be " +
        "automatically excluded.";
    } else if (syncedUsers.length > 1) {
      notePhrase = "Duplicate messages are automatically excluded.";
    }
    syncNote.text(notePhrase);

    disclose.click(function() {
      if (disclose.hasClass("esper-open")) {
        Sidebar.dismissDropdowns();
      } else {
        Sidebar.dismissDropdowns();
        dropdown.toggle();
        disclose.addClass("esper-open");
      }
    })

    inviteGuests.click(function() {
      CurrentThread.withPreferences(function(preferences) {
        FinalizeEvent.inviteGuests(e, preferences);
        Gmail.scrollToInviteWidget();
      });
    });

    unlinkEvent.click(function() {
      view.addClass("esper-disabled");
      Api.unlinkEvent(team.teamid, threadId, e.google_event_id)
        .done(function() {
          refreshEventLists(team, threadId, taskTab, profiles);
        });
    });

    deleteEvent.click(function() {
      view.addClass("esper-disabled");
      Api.deleteLinkedEvent(team.teamid, threadId, e.google_event_id)
        .done(function() {
          refreshEventLists(team, threadId, taskTab, profiles);
        });
    });

    chooseThisEvent.click(function() {
      var msg = "Other linked events will be deleted. Are you sure?";
      if (window.confirm(msg)) { // TODO Style me
        view.parent().find(".esper-ev").addClass("esper-disabled");

        FinalizeEvent.finalizeEvent(e);
      }
    });

    return optionsView;
  }

  function renderEvent(linkedEvents: ApiT.EventWithSyncInfo[],
                       ev, recent, last, team: ApiT.Team,
                       threadId: string, taskTab: TaskTabView,
                       profiles: ApiT.Profile[]) {
'''
<div #view class="esper-ev">
  <div #date title class="esper-ev-date">
    <div #month class="esper-ev-month"/>
    <div #day class="esper-ev-day"/>
  </div>
  <div>
    <div class="esper-ev-title"><span #title/></div>
    <div #time class="esper-ev-times">
      <span #startTime class="esper-ev-start"/>
      &rarr;
      <span #endTime class="esper-ev-end"/>
    </div>
  </div>
</div>
'''
    var e = ev;

    if (recent) {
      view.append(displayLinkOptions(ev, linkedEvents, team,
                                     threadId, taskTab, profiles));
    } else {
      e = ev.event;
      time.prepend(displayEventChoose(view, e));
      time.prepend(displayEventOptions(view, ev, linkedEvents, team,
                                       threadId, taskTab, profiles));
    }

    var start = XDate.ofString(e.start.local);
    var end = XDate.ofString(e.end.local);

    month.text(XDate.month(start).toUpperCase());
    day.text(XDate.day(start).toString());
    startTime.text(XDate.timeOnly(start));
    endTime.text(XDate.timeOnly(end));

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
          "tooltipClass": "esper-top esper-tooltip"
        });
      title
        .addClass("esper-link-black")
        .click(function() {
          open(e.google_cal_url, "_blank");
        });
    }

    if (last)
      view.addClass("esper-last");

    return view;
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
            eventsList.append(renderEvent(linkedEvents, e, recent, last, team,
                                          threadId, taskTab, profiles));
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

        eventsList.append(renderEvent(linkedEvents, e, recent, last, team,
                                      threadId, taskTab, profiles));
        i++;
      });
      taskTab.linkedEventsList.append(eventsList);
    }
    taskTab.linkedEventsSpinner.hide();
    taskTab.refreshLinkedEvents.removeClass("esper-disabled");
  }

  export function displayLinkedThreadsList(task, threadId,
                                           taskTab: TaskTabView) {
'''
  <div #noThreads class="esper-no-events">No linked threads</div>
  <div #threadsList class="esper-events-list"/>
'''
    taskTab.linkedThreadsList.children().remove();

    List.iter(task.task_threads, function(thread : ApiT.EmailThread) {
      if (thread.gmail_thrid !== threadId) {
        $("<li class='esper-link'/>")
          .text(thread.subject)
          .click(function(e) {
            e.stopPropagation();
            window.location.hash = "#all/" + thread.gmail_thrid;
          })
          .appendTo(threadsList);
      }
    });

    if (threadsList.children("li").length > 0) {
      taskTab.linkedThreadsList.append(threadsList);
    } else {
      taskTab.linkedThreadsList.append(noThreads);
      taskTab.showLinkedThreads.click();
    }
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
          obtainTaskForThread(teamid, threadId, taskTab)
            .done(function(task) {
              Api.setTaskTitle(currentTask.taskid, query);
              currentTask.task_title = query;
              taskTitle.val(query);
              Sidebar.dismissDropdowns();
            });
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

  export interface TaskTabView {
    taskCaption: JQuery;
    taskTitle: JQuery;
    taskSearchDropdown: JQuery;
    taskSearchResults: JQuery;
    taskSearchActions: JQuery;

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
      <div #linkedThreadsHeader
           class="esper-section-header esper-clearfix esper-open">
        <span #showLinkedThreads
              class="esper-link" style="float:right">Hide</span>
        <span class="esper-bold" style="float:left">Linked Threads</span>
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
        CalPicker.createModal(CurrentThread.team.get(),
                              CurrentThread.task.get(),
                              CurrentThread.threadId.get());
      }
    });

    var apiGetTask = autoTask ?
      Api.getAutoTaskForThread
      : Api.getTaskForThread;

    apiGetTask(team.teamid, threadId, false, true).done(function(task) {
      CurrentThread.task.set(task);
      var title = "";
      linkedThreadsSpinner.hide();
      if (task !== undefined) {
        taskCaption.text(taskLabelExists);
        title = task.task_title;
        displayLinkedThreadsList(task, threadId, taskTabView);
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
