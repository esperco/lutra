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

  function loadMeetingActions(ta, popover) {
'''
<ul #view class="popover-list">
  <li class="meeting-action">
    <a #viewLivePage target="blank">
      <div #viewLivePageIconContainer class="meeting-action-icon"/>
      <span class="meeting-action-label">View live page</span>
    </a>
  </li>
  <li #rescheduleAction class="meeting-action">
    <div #rescheduleIconContainer class="meeting-action-icon"/>
    <span class="meeting-action-label">Reschedule...</span>
  </li>
  <li #cancelAction class="meeting-action">
    <div #cancelIconContainer class="meeting-action-icon"/>
    <span class="meeting-action-label">Cancel...</span>
  </li>
  <li #deleteAction class="meeting-action">
    <div #deleteIconContainer class="meeting-action-icon"/>
    <span class="meeting-action-label">Delete...</span>
  </li>
</ul>
'''
    var viewLivePageIcon = $("<img class='svg-block'/>")
      .appendTo(viewLivePageIconContainer);
    svg.loadImg(viewLivePageIcon, "/assets/img/globe.svg");
    var rescheduleIcon = $("<img class='svg-block'/>")
      .appendTo(rescheduleIconContainer);
    svg.loadImg(rescheduleIcon, "/assets/img/reschedule.svg");
    var cancelIcon = $("<img class='svg-block'/>")
      .appendTo(cancelIconContainer);
    svg.loadImg(cancelIcon, "/assets/img/cancel-meeting.svg");
    var deleteIcon = $("<img class='svg-block'/>")
      .appendTo(deleteIconContainer);
    svg.loadImg(deleteIcon, "/assets/img/delete-meeting.svg");

    var hosts = sched.getHosts(ta);
    var host;
    list.iter(hosts, function(uid) {
      host = uid;
    });
    api.getGuestAppURL(ta.tid, host).done(function (url) {
      viewLivePage.attr("href", url.url);
    });

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

    popover.children().remove();
    popover.append(view);
  }

  function viewOfTaskCard(ta) {
'''
<div #view>
  <div #newMessages class="meeting-new-messages ellipsis"/>
  <div #actionsPopover class="meeting-actions-popover"
                       style="display:none"/>
  <div #subjectRow class="meeting-subject ellipsis">
    <div #arrowContainer class="meeting-actions-arrow"/>
    <div #subjectIconContainer class="meeting-subject-icon"/>
    <div #subject class="meeting-subject-text link ellipsis">
      <a #subjectText/>
    </div>
  </div>
  <div class="inner-shadow-down"/>
  <div #meetingTitle class="meeting-title scrollable">
    <div #meetingRow class="meeting-type"/>
  </div>
  <div class="inner-shadow-up"/>
  <div #meetingFooter class="meeting-footer">
    <div #statusRow class="meeting-status-row">
      <div #statusIcon class="meeting-status-icon">
        <div #toDo class="status-icon to-do-icon"/>
        <div #reminder class="status-icon reminder-status-icon hide"/>
      </div>
      <div #status class="meeting-status-text"/>
    </div>
    <div #updated class="meeting-updated-row"/>
  </div>
</div>
'''
    view.attr("id","task-" + ta.tid);

    if (ta.task_status) {
      newMessages.text("2");

      loadMeetingActions(ta, actionsPopover);

      var subjectIcon = $("<img class='svg-block'/>")
        .appendTo(subjectIconContainer);
      svg.loadImg(subjectIcon, "/assets/img/status-email.svg");
      var arrow = $("<img class='svg-block'/>")
        .appendTo(arrowContainer);
      svg.loadImg(arrow, "/assets/img/arrow-south-sm.svg");
      subjectText
        .text(ta.task_status.task_title)
        .attr("href","#!task/" + ta.tid);

      meetingRow.text(meetingType(ta));
      var guest1 = $("<div class='meeting-guest clearfix'/>")
        .appendTo(meetingTitle);
      var guest1Circ = $("<div class='meeting-guest-circ'/>")
        .text("C")
        .appendTo(guest1);
      var guest1Name = $("<div class='meeting-guest-name ellipsis'/>")
        .text("Christopher Christopherson")
        .appendTo(guest1);
     var guest2 = $("<div class='meeting-guest clearfix'/>")
        .appendTo(meetingTitle);
      var guest1Circ = $("<div class='meeting-guest-circ'/>")
        .text("C")
        .appendTo(guest2);
      var guest1Name = $("<div class='meeting-guest-name ellipsis'/>")
        .text("Christopher Christopherson")
        .appendTo(guest2);
     var guest3 = $("<div class='meeting-guest clearfix'/>")
        .appendTo(meetingTitle);
      var guest1Circ = $("<div class='meeting-guest-circ'/>")
        .text("C")
        .appendTo(guest3);
      var guest1Name = $("<div class='meeting-guest-name ellipsis'/>")
        .text("Christopher Christopherson")
        .appendTo(guest3);

      var toDoIcon = $("<img class='svg-block'/>")
        .appendTo(toDo);
      svg.loadImg(toDoIcon, "/assets/img/to-do.svg");
      var reminderIcon = $("<img class='svg-block'/>")
        .appendTo(reminder);
      svg.loadImg(reminderIcon, "/assets/img/status-reminder.svg");
      status.text(taskStatus(ta));
      updated.text("Updated 3 days ago");

      view.hover(
        function() {
          if (! view.hasClass("actions-open"))
            arrowContainer.css("display","block");
        }, function() {
          if (! view.hasClass("actions-open"))
            arrowContainer.css("display","none");
        }
      );

      arrowContainer
        .off("click")
        .click(function() {
          if (actionsPopover.hasClass("open")) {
            view.removeClass("actions-open");
            actionsPopover.removeClass("open")
                          .attr("style","display:none");
          } else {
            view.addClass("actions-open");
            actionsPopover.addClass("open")
                          .attr("style","display:block");
          }
        })
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
          .attr('class', 'clearfix pending-scheduling-tasks task-list');
      });
    $('.show-finalized-meetings')
      .unbind('click')
      .click(function() {
        $('.show-pending-meetings').removeClass('active');
        $('.show-finalized-meetings').addClass('active');
        $('#tasks')
          .attr('class', 'clearfix finalized-scheduling-tasks task-list');
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

  function viewOfToDo() {
'''
<div #view class="to-do">
  <div #toDoText class="to-do-text"/>
  <div #timestamp class="sidebar-timestamp"/>
</div>
'''
    toDoText
      .append($("<span class='bold'/>")
        .text("Offer meeting options"))
      .append($("<span/>")
        .text(" - Coffee with Johnny Appleseed"));

    // Implement jQuery dotdotdot()
    // toDoText.dotdotdot();

    timestamp.text("Yesterday at 12:45pm");

    return view;
  }

  function viewOfNotification() {
'''
<div #view class="notification">
  <div #notificationText class="notification-text"/>
  <div #timestamp class="sidebar-timestamp"/>
</div>
'''
    notificationText
      .append($("<span class='bold'/>")
        .text("Johnny Appleseed"))
      .append($("<span/>")
        .text(" sent you a message."));

    // Implement jQuery dotdotdot()
    // notificationText.dotdotdot();

    timestamp.text("Apr 30 at 12:45pm");

    return view;
  }

  function loadSidebar() {
'''
<div #view>
  <div #hello class="hello ellipsis"/>
  <div #exec/>
  <div #notifications class="sidebar-section">
    <div class="sidebar-section-header">
      <div #notificationsIcon class="notifications-icon"/>
      <div #notificationsCount class="notifications-count"/>
      <div class="sidebar-section-title">Notifications</div>
      <a class="see-all link">See all</a>
    </div>
    <div #notificationsList class="notifications-list"/>
  </div>
  <div #toDo class="sidebar-section">
    <div class="sidebar-section-header">
      <div #toDoIcon class="to-do-icon"/>
      <div #toDoCount class="to-do-count"/>
      <div class="sidebar-section-title">To Do</div>
      <a class="see-all link">See all</a>
    </div>
    <div #toDoList class="to-do-list"/>
  </div>
</div>
'''
    api.getProfile(login.me()).done(function(eaProf) {
      hello.text("Hello, " + profile.firstName(eaProf) + "!");
    });

    profile.get(login.leader()).done(function(obsProf) {
      var execName = profile.firstName(obsProf.prof);
      var possessive = execName;
      if (execName.slice(-1) === "s") {
        possessive += "'";
      } else {
        possessive += "'s"
      }
      exec.text("Here's what's happening with " + execName + "'s meetings:");
    });

    var bell = $("<img class='svg-block'/>")
      .appendTo(notificationsIcon);
    svg.loadImg(bell, "/assets/img/notifications.svg");

    //iterate through notifications
    notificationsList.append(viewOfNotification);

    //iterate through to do's
    toDoList.append(viewOfToDo);

    var clipboard = $("<img class='svg-block'/>")
      .appendTo(toDoIcon);
    svg.loadImg(clipboard, "/assets/img/to-do.svg");

    $(".sidebar-content").children().remove();
    $(".sidebar-content").append(view);
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
  };

  return mod;
}());
