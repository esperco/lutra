module Esper.TaskTab {

  var taskLabelCreate = "Create task";
  var taskLabelExists = "Title";

  /* To refresh from outside, like in CalPicker */
  export var refreshLinkedThreadsAction : () => void;
  export var refreshLinkedEventsAction : () => void;
  export var currentTaskTab : TaskTabView;

  var refreshTaskParticipants : () => void = function() {};

  export function init() {
    GmailJs.after.send_message(function() {
      refreshTaskParticipants();
    });
    /* GmailJs.on.show_newly_arrived_message would be more appropriate
       but doesn't work. */
    GmailJs.on.new_email(function() {
      refreshTaskParticipants();
    });
  }

  export interface LinkOptionsView {
    view: JQuery;
    link: JQuery;
    spinner: JQuery;
    linked: JQuery;
    check: JQuery;
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

  /* reuse the view created for the team, update list of linked events */
  export function displayLinkedEventsList(
    team: ApiT.Team,
    threadId, taskTab: TaskTabView,
    linkedEvents: ApiT.TaskEvent[]
  ) {
'''
  <div #noEvents class="esper-no-events">No linked events</div>
  <div #eventsList class="esper-events-list"/>
'''
    taskTab.refreshLinkedEvents.addClass("esper-disabled");
    taskTab.linkedEventsList.children().remove();
    taskTab.linkedEventsSpinner.show();

    if (linkedEvents.length === 0) {
      taskTab.linkedEventsList.append(noEvents);
    } else {
      CurrentThread.taskPrefs
        .then(Option.unwrap<ApiT.TaskPreferences>
              ("taskPrefs (in displayLinkedEventsList)"))
        .done(function(tpref) {
          var i = 0;
          var last = false;
          linkedEvents.forEach(function(e: ApiT.TaskEvent) {
            if (i === linkedEvents.length - 1) last = true;

            eventsList.append(
              EventWidget.renderEvent(linkedEvents, e, last,
                                      team, threadId, tpref)
            );
            i++;
          });
          taskTab.linkedEventsList.append(eventsList);
        });
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
            window.location.hash = "#all/" + linkedThreadId;
          });

        cross.click(function() {
          unlinkThread(task.task_teamid, task.taskid, linkedThreadId);
          /* remove from the list without waiting for completion */
          li.remove();
          if (threadsList.children("li").length === 0) {
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

  function workflowChecklistCompleted() {
    var allChecked = true;
    $(".esper-workflow-checklist").find("input").each(function() {
      if (!($(this).is(":checked"))) {
        allChecked = false;
        return;
      }
    });
    return allChecked;
  }

  export function displayTaskProgress(task, taskTab: TaskTabView) {
'''
  <div #view class="esper-clearfix esper-task-progress">
    <span class="esper-show-selector">Progress: </span>
    <select #taskProgressSelector class="esper-select"/>
  </div>
'''
    taskTab.taskProgressContainer.children().remove();

    Sidebar.customizeSelectArrow(taskProgressSelector);
    var statuses = [
      {label:"New", state:"New"},
      {label:"In Progress", state:"In_progress"},
      {label:"Pending", state:"Pending"},
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
      function applyChange() {
        Api.setTaskProgress(task.taskid, i);
        task.task_progress = i;
      }
      if (i === "Done") {
        if (workflowChecklistCompleted()) {
          applyChange();
        } else {
          taskProgressSelector.val(task.task_progress);
          alert("Please complete all checklist items before finalizing.");
        }
      } else {
        applyChange();
      }
    });

    taskTab.taskProgressContainer.append(view);
  }

  export function clearLinkedEventsList(team: ApiT.Team,
                                        taskTab: TaskTabView) {
    displayLinkedEventsList(team, "", taskTab, []);
  }

  /* Refresh only linked events, fetching linked events from the server. */
  export function refreshLinkedEventsList(team: ApiT.Team,
                                          threadId, taskTab) {
    Api.getLinkedEvents(team.teamid, threadId, team.team_calendars)
      .done(function(linkedEvents) {
        CurrentThread.linkedEvents.set(linkedEvents);
        displayLinkedEventsList(team, threadId, taskTab, linkedEvents);
      });
  }

  /* Refresh linked threads, fetching linked threads from the server. */
  export function refreshLinkedThreadsList(team, threadId, taskTab) {
    Api.getTaskForThread(team.teamid, threadId, false, true)
      .done(function(task) {
        displayLinkedThreadsList(task, threadId, taskTab);
        if ((task.task_threads.length > 1 &&
                  taskTab.showLinkedThreads.text() === "Show") ||
                  (task.task_threads.length <= 1 &&
                  taskTab.showLinkedThreads.text() === "Hide")) {
          taskTab.showLinkedThreads.click();
        }
      });
  }

  /* Refresh task progress, fetching task progress from the server. */
  export function refreshTaskProgressSelection(team, threadId, taskTab) {
    Api.getTaskForThread(team.teamid, threadId, false, false)
      .done(function(task) {
        displayTaskProgress(task, taskTab);
      });
  }

  function selectMeetingTypeOnUserTab(meetingType : string,
                                      userTabContent : UserTab.UserTabView)
  : void {
    var found = false;
    userTabContent.meetingSelector.find("option").each(function(i) {
      if ($(this).text() === meetingType.replace("_", " ")) {
        found = true;
        userTabContent.meetingSelector.val($(this).val());
        userTabContent.meetingSelector.trigger("change");
        if (userTabContent.showMeetings.text() === "Show") {
          userTabContent.showMeetings.trigger("click");
        }
      }
    });
    if (!found) {
      var opt = $("<option value='" + meetingType + "' disabled>"
                  + meetingType.replace("_", " ") + "</option>");
      var drop = userTabContent.meetingSelector;
      drop.append($("<option disabled>──────</option>"));
      drop.append(opt);
      drop.val(opt.val());
      userTabContent.meetingInfo.hide();
      userTabContent.noMeetingPrefs.show();
      if (userTabContent.showMeetings.text() === "Show") {
        userTabContent.showMeetings.trigger("click");
      }
    }
  }

  /** Creates or renames a task, explicitly triggered by a UI action.
   *
   *  Will fail if a task cannot be created, such as if there is no
   *  valid team. Since this is initiated from the sidebar UI, this
   *  should not happen and is logged as an error.
   */
  // TODO: Update using centralized model at CurrentThread
  function createOrRenameTask(taskTitle, teamid, threadId, taskTab, query,
                              userTabContent : UserTab.UserTabView) {
    Sidebar.dismissDropdowns();
    Log.d("Creating task with meetingType ", taskTitle.data("meetingType"));
    var force = true;
    CurrentThread.refreshTaskForThread(force)
      .done(function(task) {
        if (task) {
          Api.setTaskTitle(task.taskid, query);
          task.task_title = query;
          var meetingType = taskTitle.data("meetingType");
          if (meetingType) {
            Api.setTaskMeetingType(task.taskid, meetingType);
            task.task_meeting_type = meetingType;
            selectMeetingTypeOnUserTab(meetingType, userTabContent);
          }
          CurrentThread.setTask(task);
          taskTitle.val(query);
          markNewTaskAsInProgress(task);
          displayTaskProgress(task, taskTab);
          displayLinkedThreadsList(task, threadId, taskTab);
        } else {
          Log.e("Task failed to create—perhaps the current team is not set correctly?");
        }
      });
  }

  // Search for matching tasks and display the results in a dropdown
  function displaySearchResults(taskTitle, dropdown, results, actions,
                                team: ApiT.Team,
                                threadId: string,
                                query,
                                taskTab: TaskTabView,
                                userTabContent : UserTab.UserTabView) {
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
              refreshTaskProgressSelection(team, threadId, taskTab);
              refreshLinkedThreadsList(team, threadId, taskTab);
              refreshLinkedEventsList(team, threadId, taskTab);
            });

            CurrentThread.setTask(result.task_data);
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
          createOrRenameTask(taskTitle, teamid, threadId, taskTab, query,
                             userTabContent);
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
                CurrentThread.setTask(task);
                Sidebar.dismissDropdowns();
              });
          });
      }

      var currentTask = CurrentThread.task.get();
      if (currentTask !== undefined) {
        addArchiveOption(currentTask);
      }

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

  function displayWorkflow(team : ApiT.Team,
                           prefs : ApiT.Preferences,
                           workflows: ApiT.Workflow[],
                           workflowSection : JQuery,
                           workflowSelect : JQuery,
                           workflowNotes : JQuery,
                           stepSelect : JQuery,
                           stepNotes : JQuery,
                           checklistDiv : JQuery,
                           checklist : JQuery) : void {
    Sidebar.customizeSelectArrow(workflowSelect);
    Sidebar.customizeSelectArrow(stepSelect);

    List.iter(workflows, function(wf) {
      $("<option value='" + wf.id + "'>" + wf.title + "</option>")
        .appendTo(workflowSelect);
    });

    var currentWorkflow : ApiT.Workflow;
    var currentProgress : ApiT.TaskWorkflowProgress;

    workflowSelect.change(function() {
      var chosen = $(this).val();
      if (chosen !== "header") {
        var wf = List.find(workflows, function(wf) {
          return wf.id === chosen;
        });
        currentWorkflow = wf;
        var task = CurrentThread.task.get();
        var startingProgress = {
          workflow_id: wf.id,
          checklist: []
        };
        var progress = task.task_workflow_progress;
        if (!progress || progress.workflow_id !== wf.id) {
          progress = startingProgress;
        }
        Api.putWorkflowProgress(team.teamid, task.taskid, progress);
        currentProgress = progress;
        workflowNotes.text(wf.notes);

        stepSelect.children().slice(1).remove();
        stepNotes.text("");
        checklist.children().remove();
        checklistDiv.addClass("esper-hide");

        List.iter(wf.steps, function(s) {
          $("<option value='" + s.id + "'>" + s.title + "</option>")
            .appendTo(stepSelect);
        });

        if (currentProgress && currentProgress.step_id) {
          stepSelect.val(currentProgress.step_id);
          stepSelect.trigger("change");
        } else if (wf.steps.length === 1) {
          stepSelect.val(wf.steps[0].id);
          stepSelect.trigger("change");
        }

        var userTabContent = $(".esper-user-tab-content");
        userTabContent.children().remove();
        userTabContent.append(UserTab.viewOfUserTab(team).view);

        workflowSection.removeClass("esper-hide");
      }
    });

    stepSelect.change(function() {
      var chosen = $(this).val();
      if (chosen !== "header") {
        var wf = currentWorkflow;
        var progress = currentProgress;
        var task = CurrentThread.task.get();
        var step = List.find(wf.steps, function(s) {
          return s.id === chosen;
        });
        if (progress.checklist.length === 0 || progress.step_id !== step.id) {
          progress.checklist = step.checklist;
        }
        progress.step_id = step.id;
        Api.putWorkflowProgress(team.teamid, task.taskid, progress);
        stepNotes.text(step.notes);
        stepNotes.removeClass("esper-hide");

        checklist.children().remove();
        List.iter(progress.checklist, function(x, i) {
          var div = $("<div/>");
          var label = $("<label/>");
          var box = $("<input type='checkbox' class='esper-checklist-box'/>")
          box.prop("checked", x.checked);
          box.change(function() {
            var item = progress.checklist[i];
            item.checked = this.checked;
            Api.putWorkflowProgress(team.teamid, task.taskid, progress);
          });
          label.append(box).append(x.text);
          div.append(label);
          checklist.append(div);
        });
        checklistDiv.removeClass("esper-hide");

        if (step.meeting_prefs) {
          var meetingInfo = $(".esper-user-tab-meeting-info");
          var meetingSelector = $(".esper-meeting-selector");
          var showHide = $(".esper-meetings");
          var meetingTypes = prefs.meeting_types;
          var workplaces = prefs.workplaces;
          var opt = step.meeting_prefs[0].toLowerCase();
          meetingTypes[opt] = step.meeting_prefs[1];
          meetingInfo.children().remove();
          meetingSelector.children().remove();
          UserTab.populateMeetingsDropdown(meetingSelector, meetingInfo,
                                           meetingTypes, workplaces,
                                           [], []);
          meetingSelector.val(opt);
          meetingSelector.trigger("change");
          if (showHide.text() === "Show") {
            showHide.text("Hide");
            $(".esper-meetings-header").addClass("esper-open");
            Sidebar.toggleList($(".esper-meetings-container"));
          }
        }
      }
    });

  }

  export interface TaskTabView {
    taskCaption: JQuery;
    taskTitle: JQuery;
    taskParticipants: JQuery;
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
  }

  function meetingTypeDropdown(taskTitle : JQuery,
                               taskCancel : JQuery) : JQuery {
'''
<select #meetingType class="esper-meeting-type esper-select">
  <option value="header">Select meeting type...</option>
  <option #phone value="Phone_call">Phone call</option>
  <option #video value="Video_call">Video call</option>
  <option #breakfast value="Breakfast">Breakfast</option>
  <option #brunch value="Brunch">Brunch</option>
  <option #lunch value="Lunch">Lunch</option>
  <option #coffee value="Coffee">Coffee</option>
  <option #dinner value="Dinner">Dinner</option>
  <option #drinks value="Drinks">Drinks</option>
  <option value="Meeting">Meeting</option>
  <option value="Other">Other</option>
</select>
'''
    meetingType.change(function() {
      var type = $(this).val();
      if (type === "Other") {
        taskTitle.val("");
      } else {
        taskTitle.data("meetingType", type);
        taskTitle.val(type.replace("_", " ") + " ");
      }
      meetingType.hide();
      taskTitle.show();
      taskCancel.show();
      taskTitle.focus();
    });
    Sidebar.customizeSelectArrow(meetingType);
    return meetingType;
  }

  export function displayTaskTab(tab1,
                                 team: ApiT.Team,
                                 threadId: string,
                                 autoTask: boolean,
                                 linkedEvents: ApiT.TaskEvent[],
                                 workflows: ApiT.Workflow[],
                                 userTabContent : UserTab.UserTabView) {
'''
<div #view>
  <div class="esper-tab-header">
    <div #taskCaption class="esper-bold" style="margin-bottom:6px"/>
    <input #taskTitle type="text" size="24"
           class="esper-input esper-task-name"/>
    <button #taskCancel
            class="esper-task-cancel esper-btn-secondary">✕</button>
    <ul #taskSearchDropdown
        class="esper-drop-ul esper-dropdown-btn esper-task-search-dropdown">
      <div #taskSearchResults class="esper-dropdown-section"/>
      <div class="esper-click-safe esper-drop-ul-divider"/>
      <div #taskSearchActions class="esper-dropdown-section"/>
    </ul>
    <div class="esper-clearfix esper-workflow-gap">
      <select #workflowSelect class="esper-select" disabled>
        <option value="header">Select workflow...</option>
      </select>
    </div>
  </div>
  <div class="esper-tab-overflow">

    <div class="esper-section">
      <div class="esper-section-header esper-clearfix esper-open">
        <span class="esper-bold" style="float:left">Esper Executives</span>
      </div>
      <div class="esper-section-container">
        <ul #taskParticipants class="esper-ul"></ul>
      </div>
    </div>

    <div #workflowSection class="esper-section esper-hide">
      <div class="esper-section-header esper-clearfix esper-open">
        <span class="esper-bold" style="float:left">Workflow</span>
      </div>
      <div class="esper-section-container esper-section-notes">
        <div #workflowNotes class="esper-text-notes"/>
        <div class="esper-clearfix esper-workflow-gap">
          <select #stepSelect class="esper-select">
            <option value="header">Select step...</option>
          </select>
        </div>
        <div #stepNotes
          class="esper-clearfix esper-hide esper-text-notes"/>
        <div #checklistDiv class="esper-clearfix esper-hide">
          <b>Checklist:</b>
          <div #checklist class="esper-workflow-checklist"/>
        </div>
      </div>
    </div>
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
             class="esper-refresh esper-clickable">
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
  </div>
</div>
'''
    var taskTabView = currentTaskTab = <TaskTabView> _view;

    function populateTaskParticipants(obj: ApiT.TeamPreferencesList) {
      taskTabView.taskParticipants.empty();
      List.iter(obj.team_prefs, function(x: ApiT.TeamPreferences){
'''
<li #li class="esper-li">
  <span #teamName></span>
  <ul class="esper-ul" #emails></ul>
</li>
'''
	var team = x.team;
        if (team.team_name.length === 0) {
          teamName.text("(no name)");
        }
        else {
          teamName.text(team.team_name);
        }
        if (team.team_email_aliases.length === 0) {
          emails.append($('<li>(no email address)</li>'));
        }
        else {
          List.iter(team.team_email_aliases, function(emailAlias){
            var aliasLine = $('<li/>');
            aliasLine.text("• " + emailAlias);
            emails.append(aliasLine);
          });
        }
  	taskTabView.taskParticipants.append(li);
      });
    };

    refreshTaskParticipants = function() {
      Api.getThreadParticipantPrefs(threadId).done(populateTaskParticipants);
    }
    refreshTaskParticipants();

    function updateTaskHeaders(task: ApiT.Task, isValid: boolean,
                               oldTask: ApiT.Task, oldIsValid: boolean) {
      if (isValid) {
        taskTabView.taskCaption.text(taskLabelExists);
        taskTabView.taskTitle.text(task.task_title);
        workflowSelect.prop("disabled", false);
      } else {
        taskTabView.taskCaption.text(taskLabelCreate);
        taskTabView.taskTitle.text("");
        workflowSelect.prop("disabled", true);
      }
    }
    CurrentThread.task.watch(updateTaskHeaders, "updateTaskHeaders");

    CurrentThread.linkedEventsChange.watch(function () {
      var curThreadId = CurrentThread.threadId.get();
      if (CurrentThread.threadId.isValid()) {
        refreshLinkedEventsList(team, curThreadId, taskTabView);
      }
    }, "TaskTab.refreshLinkedEventsList");

    refreshLinkedThreadsIcon.attr("data",
      Init.esperRootUrl + "img/refresh.svg");
    refreshLinkedEventsIcon.attr("data", Init.esperRootUrl + "img/refresh.svg");
    createEventIcon.attr("data", Init.esperRootUrl + "img/create.svg");
    linkEventIcon.attr("data", Init.esperRootUrl + "img/link.svg");

    displayLinkedEventsList(team, threadId, taskTabView, linkedEvents);

    /* Set function to refresh from outside without passing any arguments  */
    refreshLinkedThreadsAction = function() {
      refreshLinkedThreadsList(team, threadId, taskTabView);
      if (linkedThreadsContainer.css("display") === "none") {
        Sidebar.toggleList(linkedThreadsContainer);
        showLinkedEvents.text("Hide");
        linkedEventsHeader.addClass("esper-open");
      }
    };
    refreshLinkedThreads.click(refreshLinkedThreadsAction);

    /* Set function to refresh from outside without passing any arguments  */
    refreshLinkedEventsAction = function() {
      refreshLinkedEventsList(team, threadId, taskTabView);
      if (linkedEventsContainer.css("display") === "none") {
        Sidebar.toggleList(linkedEventsContainer);
        showLinkedEvents.text("Hide");
        linkedEventsHeader.addClass("esper-open");
      }
    };
    refreshLinkedEvents.click(refreshLinkedEventsAction);

    showTaskProgress.click(function() {
      Sidebar.toggleList(taskProgressContainer);
      if (showTaskProgress.text() === "Hide") {
        showTaskProgress.text("Show");
        taskProgressHeader.removeClass("esper-open");
      } else {
        showTaskProgress.text("Hide");
        taskProgressHeader.addClass("esper-open");
      }
    });

    showLinkedThreads.click(function() {
      Sidebar.toggleList(linkedThreadsContainer);
      if (showLinkedThreads.text() === "Hide") {
        showLinkedThreads.text("Show");
        linkedThreadsHeader.removeClass("esper-open");
      } else {
        showLinkedThreads.text("Hide");
        linkedThreadsHeader.addClass("esper-open");
      }
    });

    showLinkedEvents.click(function() {
      Sidebar.toggleList(linkedEventsContainer);
      if (showLinkedEvents.text() === "Hide") {
        showLinkedEvents.text("Show");
        linkActions.removeClass("esper-open");
      } else {
        showLinkedEvents.text("Hide");
        linkActions.addClass("esper-open");
      }
    });

    createEvent.click(function() {
      if (CurrentThread.threadId.isValid() &&
          CurrentThread.task.isValid()) {
        CalPicker.createInline(CurrentThread.task.get(),
                               CurrentThread.threadId.get());
      }
    });

    var apiGetTask = autoTask ?
      Api.obtainTaskForThread
      : Api.getTaskForThread;

    apiGetTask(team.teamid, threadId, false, true).done(function(task) {
      CurrentThread.setTask(task);
      Api.getThreadDetails(threadId).done(function(deets) {
        var title = "";
        linkedThreadsSpinner.hide();
        taskProgressSpinner.hide();

        Api.getPreferences(team.teamid).done(function(prefs) {
          displayWorkflow(team, prefs, workflows,
                          workflowSection, workflowSelect, workflowNotes,
                          stepSelect, stepNotes,
                          checklistDiv, checklist);

          function showMTDrop() {
            $("select.esper-meeting-type").remove();
            taskTitle.hide();
            taskCancel.hide();
            taskTitle.after(meetingTypeDropdown(taskTitle, taskCancel));
          }
          taskCancel.click(showMTDrop);
          if (task !== undefined) {
            taskCaption.text(taskLabelExists);
            title = task.task_title;
            displayLinkedThreadsList(task, threadId, taskTabView);
            markNewTaskAsInProgress(task);
            displayTaskProgress(task, taskTabView);
            if (task.task_meeting_type) {
              selectMeetingTypeOnUserTab(task.task_meeting_type, userTabContent);
            }

            var progress = task.task_workflow_progress;
            if (progress) {
              workflowSelect.val(progress.workflow_id);
              workflowSelect.trigger("change");
            }
            workflowSelect.prop("disabled", false);
          } else {
            taskCaption.text(taskLabelCreate);
            showMTDrop();
            title = deets.subject;
            if (title === undefined) title = "(no subject)";
          }
          taskTitle.val(title);
        });

        Util.afterTyping(taskTitle, 250, function() {
          var query = taskTitle.val();
          if (query !== "") {
            displaySearchResults(taskTitle, taskSearchDropdown,
                                 taskSearchResults,
                                 taskSearchActions, team,
                                 threadId, query, taskTabView,
                                 userTabContent);
          }
        });
        taskTitle.keydown(function(pressed) {
          var name = taskTitle.val();
          var isEnterKey = pressed.which === 13;
          if (isEnterKey) {
            pressed.stopPropagation();
            taskTitle.blur();
            Gmail.threadContainer().focus();
            createOrRenameTask(taskTitle, team.teamid, threadId,
                               taskTabView, name, userTabContent);
          }
        });
      });
    });

    linkEvent.click(function() {
      var searchModal =
        CalSearch.viewOfSearchModal(team, threadId, taskTabView);
      $("body").append(searchModal.view);
      searchModal.search.focus();
    });

    var taskWatcherId = "TaskTab-task-watcher";
    CurrentThread.task.watch(function(task, valid) {
      if (valid) {
        if (task.task_archived && threadId === CurrentThread.threadId.get()) {
          taskTitle.addClass("esper-archived");
        } else {
          taskTitle.removeClass("esper-archived");
        }
      }
    }, taskWatcherId);

    tab1.append(view);
  }

}
