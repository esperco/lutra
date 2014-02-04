/*
  Home page (task lists)
*/

var home = (function() {
  var mod = {};

  function viewOfTaskRow(ta, taskViewId) {
    var view = $("<div/>",{'class':'task clearfix', 'id':taskViewId});

    var title = ta.task_status
      ? ta.task_status.task_title
      : null;

    var dragDiv = $("<div class='task-drag-div hide'></div>")
      .appendTo(view);
    var drag = $("<img class='drag'/>")
      .appendTo(dragDiv);
    svg.loadImg(drag, "/assets/img/drag.svg");

    // Add both Archive button and Restore button to the row.
    // By css magic they will only show up in the appropriate tabs.
    var archiveDiv = $("<div class='archive-div'></div>")
      .appendTo(view);
    var archive = $("<img class='archive'/>")
      .appendTo(archiveDiv);
    svg.loadImg(archive, "/assets/img/x.svg");
    archiveDiv
      .tooltip({"title":"Archive"})
      .click(function() {
        api.archiveTask(ta.tid);
        task.onTaskArchived.notify(ta.tid);
      });

    var restoreButton = $("<button class='restore-div'/>")
      .text("Restore")
      .appendTo(view);
    restoreButton.click(function() {
      api.rankTaskFirst(ta.tid);
      task.onTaskRankedFirst.notify(ta.tid);
    });

    var taskDetails = $("<div class='task-details'></div>")
      .appendTo(view);

    if (title) {
      $("<div class='new-label new-label-task hide'>NEW</div>")
        .appendTo(taskDetails);
      $("<div class='updated updated-task hide'></div>")
        .appendTo(taskDetails);
      $("<a href='#!task/" + ta.tid + "' class='task-title ellipsis'></a>")
        .text(title)
        .appendTo(taskDetails);
      $("<div class='task-status'/>").text(ta.task_status_text)
        .appendTo(taskDetails);
      $("<div class='task-date hide'></div>")
        .append($("<span class='verb'>Created </span>"))
        .append($("<span>on </span>"))
        .append($("<span class='update-date'>May 30, 2014 at 12:55 pm</span>"))
        .append($("<span class='update-author'> by Christopher</span>"))
        .appendTo(taskDetails);

      // var exec = $("<div class='task-exec'></div>")
      //   .appendTo(view);
      // $("<div class='task-exec-circ-line'></div>")
      //   .append($("<div class='task-exec-circ unselectable'>JL</div>"))
      //   .appendTo(exec);
      // $("<div class='task-exec-name ellipsis'>Christopher W.</div>")
      //   .appendTo(exec);

      // var withDiv = $("<div class='with-div'></div>")
      //   .appendTo(view);
      // var withIcon = $("<img class='with'/>")
      //   .appendTo(withDiv);
      // svg.loadImg(withIcon, "/assets/img/with.svg");

      // var taskGuest = $("<div class='task-guest'></div>")
      //   .appendTo(view);
      // $("<div class='task-guest-circ-line'></div>")
      //   .append($("<div class='task-guest-circ unselectable'>CW</div>"))
      //   .appendTo(taskGuest);
      // $("<div class='task-guest-name ellipsis'>Christopher W.</div>")
      //   .appendTo(taskGuest);
    }

    return view;
  }

  function activeTaskViewId(tid) {
    return "active-" + tid;
  }
  function archiveTaskViewId(tid) {
    return "archive-" + tid;
  }
  function allTaskViewId(tid) {
    return "all-" + tid;
  }

  function viewOfActiveTaskRow(task) {
    return viewOfTaskRow(task, activeTaskViewId(task.tid));
  }
  function viewOfArchiveTaskRow(task) {
    return viewOfTaskRow(task, archiveTaskViewId(task.tid));
  }
  function viewOfAllTaskRow(task) {
    return viewOfTaskRow(task, allTaskViewId(task.tid));
  }

  function listViewOfTask(task) {
    return "Scheduling" === variant.cons(task.task_data)
         ? $("#scheduling-tasks-tab-content")
         : $("#general-tasks-tab-content");
  }

  function taskUpdated(task) {
    var activeViewId = activeTaskViewId(task.tid);

    // In case the task kind has changed, remove the task title from
    // all the other tabs.
    if ("Scheduling" === variant.cons(task.task_data)) {
      $("#general-tasks-tab-content #" + activeViewId).remove();
    } else {
      $("#scheduling-tasks-tab-content #" + activeViewId).remove();
    }

    var view = $("#" + activeViewId);
    if (view.length > 0) {
      view.replaceWith(viewOfActiveTaskRow(task));
    } else {
      listViewOfTask(task).prepend(viewOfActiveTaskRow(task));
    }

    view = $("#" + allTaskViewId(task.tid));
    if (view.length > 0) {
      view.replaceWith(viewOfAllTaskRow(task));
    } else {
      $("#all-tasks-tab-content")
              .prepend(viewOfAllTaskRow(task));
    }

    view = $("#" + archiveTaskViewId(task.tid));
    if (view.length > 0) {
      view.replaceWith(viewOfArchiveTaskRow(task));
    }
  }

  function taskRanked(tid, mover) {
    var view = $("#" + activeTaskViewId(tid));
    if (view.length > 0) {
      mover(view.parent(), view);
    } else {
      $("#" + archiveTaskViewId(tid)).remove();
      api.getTask(tid).then(function(task) {
        mover(listViewOfTask(task), viewOfActiveTaskRow(task));
      });
    }
  }

  function taskRanked2(tid, target_tid, mover) {
    var targetView = $("#" + activeTaskViewId(target_tid));
    if (targetView.length > 0) {
      var view = $("#" + activeTaskViewId(tid));
      if (view.length > 0) {
        mover(view, targetView);
      } else {
        $("#" + archiveTaskViewId(tid)).remove();
        api.getTask(tid).then(function(task) {
          mover(viewOfActiveTaskRow(task), targetView);
        });
      }
    } else {
      $("#" + archiveTaskViewId(tid)).remove();
      loadActiveTasks();
    }
  }

  function taskRankedFirst(tid) {
    taskRanked(tid, function(parent, taskView) {
      parent.prepend(taskView);
    });
  }

  function taskRankedLast(tid) {
    taskRanked(tid, function(parent, taskView) {
      parent.append(taskView);
    });
  }

  function taskRankedBefore(tid, target_tid) {
    taskRanked2(tid, target_tid, function(view, targetView) {
      targetView.before(view);
    });
  }

  function taskRankedAfter(tid, target_tid) {
    taskRanked2(tid, target_tid, function(view, targetView) {
      targetView.after(view);
    });
  }

  function taskArchived(tid) {
    var view = $("#" + activeTaskViewId(tid));
    if (view.length == 1) {
      view.attr("id", archiveTaskViewId(tid));
      $("#archive-tasks-tab-content").prepend(view);
    }
    else if ($("#" + archiveTaskViewId(tid)).length <= 0) {
      api.getTask(tid).done(function(task) {
        $("#archive-tasks-tab-content")
              .prepend(viewOfArchiveTaskRow(task));
      });
    }
  }

  function task_tid(task) {
    return task.tid;
  }

  function loadArchive(tasks) {
    var allTasks    = tasks[0];
    var activeTasks = tasks[1];

    var view = $("#archive-tasks-tab-content");
    view.children().remove();
    list.iter(list.diff(allTasks, activeTasks, task_tid), function(task) {
      view.append(viewOfArchiveTaskRow(task));
    });

    task.onTaskArchived.observe("task-list", taskArchived);
  }

  function loadActiveTasks() {
    $("#general-tasks-tab-content").children().remove();
    $("#scheduling-tasks-tab-content").children().remove();
    return api.loadActiveTasks()
      .fail(status_.onError(404))
      .then(function(data) {
        list.iter(data.tasks, function(task) {
          listViewOfTask(task).append(viewOfActiveTaskRow(task));
        });
        task.onTaskCreated     .observe("task-list", taskUpdated);
        task.onTaskModified    .observe("task-list", taskUpdated);
        task.onTaskRankedFirst .observe("task-list", taskRankedFirst);
        task.onTaskRankedLast  .observe("task-list", taskRankedLast);
        task.onTaskRankedBefore.observe("task-list", taskRankedBefore);
        task.onTaskRankedAfter .observe("task-list", taskRankedAfter);
        return data.tasks;
      });
  }

  function loadAllTasks() {
    var view = $("#all-tasks-tab-content");
    view.children().remove();
    return api.loadRecentTasks()
      .fail(status_.onError(404))
      .then(function(data) {
        list.iter(data.tasks, function(task) {
          view.append(viewOfAllTaskRow(task));
        });
        return data.tasks;
      });
  }

  function clearTeams() {
    $(".nav-team").remove();
  }

  function switchTeam(team) {
    login.setTeam(team);
    mod.load();
  }

  function labelOfTeam(team) {
    var label = team.team_label;
    if (! util.isString(label) || label === "")
      label = team.teamname;
    return label;
  }

  function sortTeams(a) {
    return list.sort(a, function(t1, t2) {
      var l1 = labelOfTeam(t1);
      var l2 = labelOfTeam(t2);
      return l1.localeCompare(l2);
    });
  }

  function clickableViewOfTeam(team) {
    var isActive = login.getTeam().teamname === team.teamname;
    var label = labelOfTeam(team);
    var li = $("<li class='nav-team'/>");
    var a = $("<a href='#' class='nav-block' data-toggle='pill'/>")
      .appendTo(li);
    var div = $("<div class='nav-text'/>")
      .text(label)
      .appendTo(a);

    if (isActive) {
      li.addClass("active");
      a.addClass("nav-active-team");
    } else {
      li.click(function() {
        switchTeam(team);
      });
    }

    return li;
  }

  function insertTeams() {
    clearTeams();
    var teams = sortTeams(login.getTeams());
    $(".nav-teams").each(function() {
      var sep = $(this);
      list.iter(list.rev(teams), function(team) {
        clickableViewOfTeam(team)
          .insertAfter(sep);
      });
    });
  }

  function loadNavHeader() {
    insertTeams();
    $(".nav-header").each(function() {
      var view = $(this);
      view.children().remove();
      var initialsView = $("<div id='exec-circ'/>");
      var circ = $("<div id='exec-circ-outline'></div>")
        .append(initialsView)
        .appendTo(view);
      var execNameView = $("<div id='exec-name' class='ellipsis'/>");
      profile.get(login.leader())
        .done(function(obsProf) {
          var p = obsProf.prof;
          execNameView.text(p.full_name);
          initialsView.text(profile.veryShortNameOfProfile(p));
        });
      var exec = $("<div id='exec-name-div'></div>")
        .append($("<div id='assisting'>ASSISTING</div>"))
        .append(execNameView)
        .appendTo(view);
      var caretDiv = $("<div id='exec-caret'></div>")
        .appendTo(view);
      var caret = $("<img/>")
        .appendTo(caretDiv);
      svg.loadImg(caret, "/assets/img/caret.svg");
      $(".account-block").each(function() {
        if (! $(this).hasClass("hide"))
          $(this).addClass("hide");
      });
      view.click(function() {
        if (caretDiv.hasClass("account-nav-open")) {
          caretDiv.removeClass("account-nav-open");
          caretDiv.addClass("account-nav-closed");
          $(".account-block").each(function() {
            $(this).addClass("hide");
          });
        } else {
          caretDiv.removeClass("account-nav-closed");
          caretDiv.addClass("account-nav-open");
          $(".account-block").each(function() {
            $(this).removeClass("hide");
          });
        }
      });
    });
  }

  mod.load = function() {
    loadNavHeader();
    deferred.join([loadAllTasks(), loadActiveTasks()])
            .done(loadArchive);
    $(".place-nav").click(places.load);
    $(".settings-nav").click(settings.load);
    util.focus();
  };

  return mod;
}());
