/*
  Home page (task lists)
*/

var home = (function() {
  var mod = {};

  var reStatusTime = /<esper:time>([^<>]+)<\/esper:time>/gi;
  function taskStatus(ta) {
    return ta.task_status_text.replace(reStatusTime,
      function(orgMatch, timeStr) {
        try {
          var time = date.ofString(timeStr);
          return date.viewTimeAgo(time).text()
               + " at " + date.utcToLocalTimeOnly(time);
        } catch(e) {
          return orgMatch;
        }
      });
  }

  function viewOfTaskRow(ta) {
    var view = $("<div/>",{id:"task-" + ta.tid});

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
        observable.onTaskArchived.notify(ta.tid);
      });

    var restoreButton = $("<button class='restore-div'/>")
      .text("Restore")
      .appendTo(view);
    restoreButton.click(function() {
      $("#tasks").prepend(view);
      setTaskViewClass(view, classOfActiveTask(ta));
      api.rankTaskFirst(ta.tid);
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
      $("<div class='task-status'/>").append(taskStatus(ta))
        .appendTo(taskDetails);

      var team_organizers = login.organizers();
      if (team_organizers.length > 1) {
        profile.mget(team_organizers).done(function(profs) {
          list.iter(team_organizers, function(organizer_uid, i) {
            var v = $("<span/>");
            var img = $("<img/>");
            v.append(img);
            svg.loadImg(img, "/assets/img/checkbox-sm.svg");
            v.append(document.createTextNode(profile.fullName(profs[i].prof)));
            if (list.mem(ta.task_participants.organized_by, organizer_uid)) {
              v.addClass("checkbox-selected");
            }
            v.appendTo(taskDetails);

            v.click(function() {
              var task_organizers = ta.task_participants.organized_by;
              if (list.mem(task_organizers, organizer_uid)) {
                v.removeClass("checkbox-selected");
                task_organizers.splice(task_organizers.indexOf(organizer_uid),
                                       1);
              } else {
                v.addClass("checkbox-selected");
                task_organizers.push(organizer_uid);
              }
              api.postTask(ta);
            });
          });
        });
      }

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

  function classOfActiveTask(task) {
    if ("Scheduling" === variant.cons(task.task_data)) {
      return "Confirmed" === task.task_status.task_progress
          || "Closed"    === task.task_status.task_progress
           ? "completed-scheduling-task"
           : "in-progress-scheduling-task";
    } else {
      return "Closed" === task.task_status.task_progress
           ? "completed-general-task"
           : "in-progress-general-task";
    }
  }

  function setTaskViewClass(view, viewClass) {
    view.attr("class", "task clearfix " + viewClass);
  }

  function viewOfActiveTaskRow(task) {
    var view = viewOfTaskRow(task);
    setTaskViewClass(view, classOfActiveTask(task));
    return view;
  }

  function viewOfArchiveTaskRow(task) {
    var view = viewOfTaskRow(task);
    setTaskViewClass(view, "archived-task");
    return view;
  }

  function taskUpdated(task) {
    var view = $("#task-" + task.tid);
    if (view.length <= 0) {
      $("#tasks").prepend(viewOfActiveTaskRow(task));
    } else if (view.hasClass("archived-task")) {
      view.replaceWith(viewOfArchiveTaskRow(task));
    } else {
      view.replaceWith(viewOfActiveTaskRow(task));
    }
  }

  function taskRanked(tid, mover) {
    var view = $("#task-" + tid);
    if (view.length > 0 && ! view.hasClass("archived-task")) {
      mover(view);
    } else {
      view.remove();
      api.getTask(tid).then(function(task) {
        mover(viewOfActiveTaskRow(task));
      });
    }
  }

  function taskRanked2(tid, target_tid, mover) {
    var targetView = $("#task-" + target_tid);
    if (targetView.length > 0) {
      var view = $("#task-" + tid);
      if (view.length > 0) {
        mover(view, targetView);
      } else {
        api.getTask(tid).then(function(task) {
          mover(viewOfActiveTaskRow(task), targetView);
        });
      }
    } else {
      api.loadActiveTasks()
        .fail(status_.onError(404))
        .done(showActiveTasks);
    }
  }

  function taskRankedFirst(tid) {
    taskRanked(tid, function(taskView) {
      $("#tasks").prepend(taskView);
    });
  }

  function taskRankedLast(tid) {
    taskRanked(tid, function(taskView) {
      $("#tasks").append(taskView);
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
    var view = $("#task-" + tid);
    if (view.length > 0) {
      setTaskViewClass(view, "archived-task");
    } else {
      api.getTask(tid).done(function(task) {
        $("#tasks").prepend(viewOfArchiveTaskRow(task));
      });
    }
  }

  function showActiveTasks(data) {
    var view = $("#tasks");
    setTaskViewClass(view.children(), "archived-task");
    list.iter(data.tasks, function(task) {
      var taskView = $("#task-" + task.tid);
      if (taskView.length > 0) {
        taskView.replaceWith(viewOfActiveTaskRow(task));
      } else {
        view.append(viewOfActiveTaskRow(task));
      }
    });
  }

  function showAllTasks(data) {
    var view = $("#tasks");
    list.iter(data[0].tasks, function(task) {
      view.append(viewOfTaskRow(task));
    });

    showActiveTasks(data[1]);

    observable.onTaskArchived    .observe("task-list", taskArchived);
    observable.onTaskCreated     .observe("task-list", taskUpdated);
    observable.onTaskModified    .observe("task-list", taskUpdated);
    observable.onTaskRankedFirst .observe("task-list", taskRankedFirst);
    observable.onTaskRankedLast  .observe("task-list", taskRankedLast);
    observable.onTaskRankedBefore.observe("task-list", taskRankedBefore);
    observable.onTaskRankedAfter .observe("task-list", taskRankedAfter);
  }

  function loadTasks() {
    $("#tasks").children().remove();
    deferred.join([api.loadRecentTasks().fail(status_.onError(404)),
                   api.loadActiveTasks().fail(status_.onError(404))])
            .done(showAllTasks);

    $('a[href="#all-tasks"]')
    .unbind('click')
    .click(function() {
      $('#all-tasks-tab-content').append($('#tasks'));
      $('a[href="#all-tasks"]').tab('show');
    });
    $('a[href="#scheduling-task-list"]')
    .unbind('click')
    .click(function() {
      $('#scheduling-tasks-tab-content').append($('#tasks'));
      $('a[href="#scheduling-task-list"]').tab('show');
    });
    $('a[href="#general-task-list"]')
    .unbind('click')
    .click(function() {
      $('#general-tasks-tab-content').append($('#tasks'));
      $('a[href="#general-task-list"]').tab('show');
    });
    $('a[href="#archive-task-list"]')
    .unbind('click')
    .click(function() {
      $('#archive-tasks-tab-content').append($('#tasks'));
      $('a[href="#archive-task-list"]').tab('show');
    });

    $('.show-in-progress-scheduling-tasks')
    .unbind('click')
    .click(function() {
      $('.show-in-progress-scheduling-tasks').addClass('active');
      $('.show-completed-scheduling-tasks').removeClass('active');
      $('#scheduling-tasks-tab-content')
        .attr('class', 'in-progress-scheduling-tasks task-list');
    });
    $('.show-completed-scheduling-tasks')
    .unbind('click')
    .click(function() {
      $('.show-in-progress-scheduling-tasks').removeClass('active');
      $('.show-completed-scheduling-tasks').addClass('active');
      $('#scheduling-tasks-tab-content')
        .attr('class', 'completed-scheduling-tasks task-list');
    });
    $('.show-in-progress-general-tasks')
    .unbind('click')
    .click(function() {
      $('.show-in-progress-general-tasks').addClass('active');
      $('.show-completed-general-tasks').removeClass('active');
      $('#general-tasks-tab-content')
        .attr('class', 'in-progress-general-tasks task-list');
    });
    $('.show-completed-general-tasks')
    .unbind('click')
    .click(function() {
      $('.show-in-progress-general-tasks').removeClass('active');
      $('.show-completed-general-tasks').addClass('active');
      $('#general-tasks-tab-content')
        .attr('class', 'completed-general-tasks task-list');
    });
  }

  function clearTeams() {
    $(".team-block").remove();
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
    var li = $("<li class='team-block hide'/>");
    var a = $("<a href='#' class='nav-team' data-toggle='pill'/>")
      .appendTo(li);
    var pic = $("<div class='list-exec-circ'/>")
      .text(profile.shortenName(label))
      .appendTo(a);
    var div = $("<div class='list-exec-name ellipsis'/>")
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

  function insertLoggedIn() {
    $(".logged-in-as").each(function() {
      var view = $(this);
      view.children().remove();
      api.getProfile(login.me()).done(function(eaProf) {
        var fullName = profile.fullName(eaProf);
        view.append("<div class='logged-in-text'>LOGGED IN AS</div>")
            .append("<div class='logged-in-name ellipsis'>" + fullName + "</div>");
      });
    })
  }

  function loadNavHeader() {
    $(".nav-header").each(function() {
      var view = $(this);
      view.children().remove();
      var initialsView = $("<div id='exec-circ'/>")
        .appendTo(view);
      var execNameView = $("<div id='exec-name' class='ellipsis'/>");
      profile.get(login.leader())
        .done(function(obsProf) {
          var p = obsProf.prof;
          execNameView.text(profile.fullName(p));
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
      $(".team-block").each(function() {
        if (! $(this).hasClass("hide"))
          $(this).addClass("hide");
      });
      $(".account-divider-div").each(function() {
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
          $(".team-block").each(function() {
            $(this).addClass("hide");
          });
          $(".account-divider-div").each(function() {
            $(this).addClass("hide");
          });
        } else {
          caretDiv.removeClass("account-nav-closed");
          caretDiv.addClass("account-nav-open");
          $(".account-block").each(function() {
            $(this).removeClass("hide");
          });
          $(".team-block").each(function() {
            $(this).removeClass("hide");
          });
          $(".account-divider-div").each(function() {
            $(this).removeClass("hide");
          });
        }
      });
    });

    insertLoggedIn();
    insertTeams();
  }

  mod.load = function() {
    loadNavHeader();
    loadTasks();
    $(".place-nav")
      .off('click')
      .click(places.load);
    $(".settings-nav")
      .off('click')
      .click(settings.load);
    util.focus();
  };

  return mod;
}());
