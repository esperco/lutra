/*
  Home page (task lists)
*/

var home = (function() {
  var mod = {};

  function taskStatus(ta) {
    var time = date.ofString(ta.task_status_text.status_timestamp);
    var statusEvent = $("<span/>")
      .text(ta.task_status_text.status_last + " ");
    var statusTimeAgo = date.viewTimeAgo(time);
    var statusTime = $("<span/>")
      .text(" at " + date.utcToLocalTimeOnly(time));
    return $("<div/>")
      .append(statusEvent)
      .append(statusTimeAgo)
      .append(statusTime);
  }

  function meetingType(ta) {
    // get meeting type
    var type = "[Meeting type]"
    return type + " with";
  }

  function loadTaskActions(ta) {
    var view = $("#task-actions");
    view.children().remove();

    var viewLivePage = $("<a class='task-action' target='blank'/>");
    var viewLivePageIconContainer = $("<div class='task-action-icon'/>")
      .appendTo(viewLivePage);
    var viewLivePageIcon = $("<img/>")
      .appendTo(viewLivePageIconContainer);
    svg.loadImg(viewLivePageIcon, "/assets/img/globe.svg");
    viewLivePage.append(($("<span class='task-action-label'/>"))
                  .text("View live page"))
                .appendTo(view);
    var assignAction = $("<a class='task-action disabled'/>");
    var assignIconContainer = $("<div class='task-action-icon'/>")
      .appendTo(assignAction);
    var assignIcon = $("<img/>")
      .appendTo(assignIconContainer);
    svg.loadImg(assignIcon, "/assets/img/assign-to.svg");
    assignAction.append(($("<span class='task-action-label caret-text'/>"))
                  .text("Assign to"));
    var assignCaret = $("<img class='caret-link'/>")
      .appendTo(assignAction);
    svg.loadImg(assignCaret, "/assets/img/caret.svg");
    assignAction.appendTo(view);
    var rescheduleAction = $("<a class='task-action'/>");
    var rescheduleIconContainer = $("<div class='task-action-icon'/>")
      .appendTo(rescheduleAction);
    var rescheduleIcon = $("<img/>")
      .appendTo(rescheduleIconContainer);
    svg.loadImg(rescheduleIcon, "/assets/img/reschedule.svg");
    rescheduleAction.append(($("<span class='task-action-label'/>"))
                      .text("Reschedule..."))
                    .appendTo(view);
    var cancelAction = $("<a class='task-action'/>");
    var cancelIconContainer = $("<div class='task-action-icon'/>")
      .appendTo(cancelAction);
    var cancelIcon = $("<img/>")
      .appendTo(cancelIconContainer);
    svg.loadImg(cancelIcon, "/assets/img/cancel-meeting.svg");
    cancelAction.append(($("<span class='task-action-label'/>"))
                  .text("Cancel..."))
                .appendTo(view);
    var deleteAction = $("<a class='task-action'/>");
    var deleteIconContainer = $("<div class='task-action-icon'/>")
      .appendTo(deleteAction);
    var deleteIcon = $("<img/>")
      .appendTo(deleteIconContainer);
    svg.loadImg(deleteIcon, "/assets/img/delete-meeting.svg");
    deleteAction.append(($("<span class='task-action-label'/>"))
                  .text("Delete..."))
                .appendTo(view);

    var hosts = sched.getHosts(ta);
    var host;
    list.iter(hosts, function(uid) {
      host = uid;
    });
    api.getGuestAppURL(ta.tid, host).done(function (url) {
      viewLivePage.attr("href", url.url);
    });

    loadAssignToPopover(ta, assignAction);

    rescheduleAction.click(function() {
      api.cancelCalendar(ta.tid).done(function (resp) {
        ta.task_status.task_progress = "Coordinating";
        sched.getState(ta).scheduling_stage = "Find_availability";
        api.postTask(ta).done(function() {
          observable.onTaskModified.notify(ta);
          window.location.href = "/#!task/" + ta.tid;
        });
      });
    });

    cancelAction.click(function() {
      api.cancelCalendar(ta.tid).done(function (resp) {
        ta.task_status.task_progress = "Closed";
        api.postTask(ta).done();
      });
    });

    deleteAction.click(function() {
      api.archiveTask(ta.tid);
      observable.onTaskArchived.notify(ta.tid);
    });
  }

  function viewOfTaskCard(ta) {
    var view = $("<a/>",{
      href: "#!task/" + ta.tid,
      id:"task-" + ta.tid
    })
      .click(function() {
        loadTaskActions(ta);
      })

    if (ta.task_status) {
      var typeRow = $("<div class='meeting-type'/>")
        .append(meetingType(ta))
        .appendTo(view);

      var guestsSection = $("<div class='meeting-guests ellipsis'/>")
        .appendTo(view);
      var guest1 = $("<div class='meeting-guest-name'/>")
        .text("Christopher Christopherson")
        .appendTo(guestsSection);
      var guest2 = $("<div class='meeting-guest-name'/>")
        .text("Christopher Christopherson")
        .appendTo(guestsSection);

      var meetingFooter = $("<div class='meeting-footer'/>")
        .appendTo(view);

      var statusRow = $("<div class='meeting-status-row'/>")
        .appendTo(meetingFooter);
      var status = $("<div class='meeting-status-text'/>")
        .text(taskStatus(ta));
      var guests = $("<div class='status-icon guests-status-icon '/>");
      var guestsIcon = $("<img/>")
        .appendTo(guests);
      svg.loadImg(guestsIcon, "/assets/img/status-guests.svg");
      var email = $("<div class='status-icon email-status-icon hide'/>");
      var emailIcon = $("<img/>")
        .appendTo(email);
      svg.loadImg(emailIcon, "/assets/img/status-email.svg");
      var options = $("<div class='status-icon options-status-icon hide'/>");
      var optionsIcon = $("<img/>")
        .appendTo(options);
      svg.loadImg(optionsIcon, "/assets/img/status-options.svg");
      var calendar = $("<div class='status-icon calendar-status-icon hide'/>");
      var calendarIcon = $("<img/>")
        .appendTo(calendar);
      svg.loadImg(calendarIcon, "/assets/img/status-calendar.svg");
      var reminder = $("<div class='status-icon reminder-status-icon hide'/>");
      var reminderIcon = $("<img/>")
        .appendTo(reminder);
      svg.loadImg(reminderIcon, "/assets/img/status-reminder.svg");
      var statusIcon = $("<div class='meeting-status-icon'/>")
        .append(guests)
        .append(email)
        .append(options)
        .append(calendar)
        .append(reminder)
        .appendTo(statusRow);
      statusRow.append(status);

      var updatedRow = $("<div class='meeting-updated-row'/>")
        .text("Updated 3 days ago")
        .appendTo(meetingFooter);
    }

    return view;
  }

  function classOfActiveTask(task) {
    if ("Scheduling" === task.task_kind) {
      return "Confirmed" === task.task_status.task_progress
          || "Closed"    === task.task_status.task_progress
           ? "finalized-scheduling-task"
           : "pending-scheduling-task";
    } else {
      return "Closed" === task.task_status.task_progress
           ? "finalized-general-task"
           : "pending-general-task";
    }
  }

  function setTaskViewClass(view, viewClass) {
    view.attr("class", "task clearfix " + viewClass);
  }

  function viewOfActiveTaskCard(task) {
    var view = viewOfTaskCard(task);
    setTaskViewClass(view, classOfActiveTask(task));
    return view;
  }

  function viewOfArchiveTaskCard(task) {
    var view = viewOfTaskCard(task);
    setTaskViewClass(view, "archived-task");
    return view;
  }

  function taskUpdated(task) {
    var view = $("#task-" + task.tid);
    if (view.length <= 0) {
      $("#tasks").prepend(viewOfActiveTaskCard(task));
    } else if (view.hasClass("archived-task")) {
      view.replaceWith(viewOfArchiveTaskCard(task));
    } else {
      view.replaceWith(viewOfActiveTaskCard(task));
    }
  }

  function taskRanked(tid, mover) {
    var view = $("#task-" + tid);
    if (view.length > 0 && ! view.hasClass("archived-task")) {
      mover(view);
    } else {
      view.remove();
      api.getTask(tid).then(function(task) {
        mover(viewOfActiveTaskCard(task));
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
          mover(viewOfActiveTaskCard(task), targetView);
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
        $("#tasks").prepend(viewOfArchiveTaskCard(task));
      });
    }
  }

  function showActiveTasks(data) {
    var view = $("#tasks");
    setTaskViewClass(view.children(), "archived-task");
    list.iter(data.tasks, function(task) {
      var taskView = $("#task-" + task.tid);
      if (taskView.length > 0) {
        taskView.replaceWith(viewOfActiveTaskCard(task));
      } else {
        view.append(viewOfActiveTaskCard(task));
      }
    });
  }

  function showAllTasks(data) {
    var view = $("#tasks");
    list.iter(data[0].tasks, function(task) {
      view.append(viewOfTaskCard(task));
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

  function loadMeetings() {
    $("#tasks").children().remove();
    spinner.spin(
      "Loading tasks...",
      deferred.join([api.loadRecentTasks().fail(status_.onError(404)),
                     api.loadActiveTasks().fail(status_.onError(404))])
        .done(showAllTasks)
    );

    $('.show-pending-meetings')
      .unbind('click')
      .click(function() {
        $('.show-pending-meetings').addClass('active');
        $('.show-finalized-meetings').removeClass('active');
        $('#tasks')
          .attr('class', 'pending-scheduling-tasks task-list');
      });
    $('.show-finalized-meetings')
      .unbind('click')
      .click(function() {
        $('.show-pending-meetings').removeClass('active');
        $('.show-finalized-meetings').addClass('active');
        $('#tasks')
          .attr('class', 'finalized-scheduling-tasks task-list');
      });
  }

  function loadSearch() {
    var search = $("#search-meetings-input");
    var clear = $("#clear-search");

    function updateSearch() {
      if (search.val() != "") {
        clear.removeClass("hide");
        $("#meetings-toggle").attr("style","display:none");
        $("#search-stats").attr("style","display:block")
      } else {
        clear.addClass("hide");
        $("#meetings-toggle").attr("style","display:block");
        $("#search-stats").attr("style","display:none")
      }
    }

    util.afterTyping(search, 100, updateSearch);

    clear.click(function() {
      search.val("");
      updateSearch();
    })
  }

  function loadSidebar() {

  }

  function loadPageTitle() {
    profile.get(login.leader()).done(function(obsProf) {
      var execName = profile.fullName(obsProf.prof);
      document.title = "Meetings - " + execName;
    });
    $(".meeting-path").addClass("hide");
    $(".path-to").addClass("hide");
    $(".page-title").text("Meetings");
  }

  mod.load = function() {
    header.load();
    loadPageTitle();
    loadSidebar();
    loadSearch();
    loadMeetings();
    util.focus();
    $(document).click(function(event) {
      var target = $(event.target);
      if ((! target.parents("#tasks").length) &&
          (! target.parents("#home-tools").length)) {
        $(".task").each(function() {
          $(this).removeClass("selected");
        })
        $("#new-message-stats").removeClass("hide");
        $("#task-actions").addClass("hide");
      }
    })
  };

  return mod;
}());
