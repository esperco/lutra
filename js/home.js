/*
  Home page (task lists)
*/

var home = (function() {
  var mod = {};

  function hideAllPopovers() {
    $(".task").each(function() {
      $(this).removeClass("actions-open");
    })
    $(".meeting-actions-arrow").each(function() {
      $(this).css("display","none");
    })
    $(".meeting-actions-popover").each(function() {
      $(this)
        .removeClass("open")
        .attr("style","display:none");
    })
  }

  function togglePopover(view, arrow, popover) {
    if (popover.hasClass("open")) {
      view.removeClass("actions-open");
      popover
        .removeClass("open")
        .attr("style","display:none");
    } else {
      hideAllPopovers();
      view.addClass("actions-open");
      arrow.css("display","block");
      popover
        .addClass("open")
        .attr("style","display:block");
    }
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
        var state = sched.getState(ta);
        ta.task_status.task_progress = "Coordinating";
        state.scheduling_stage = "Find_availability";
        state.calendar_options = [];
        delete state.reserved;
        api.postTask(ta).done(function() {
          observable.onTaskModified.notify(ta);
          window.location.href = "/#!task/" + ta.tid;
        });
      });
    });

    cancelAction.click(function() {
      api.cancelCalendar(ta.tid).done(function (resp) {
        var state = sched.getState(ta);
        ta.task_status.task_progress = "Closed";
        state.calendar_options = [];
        delete state.reserved;
        api.postTask(ta).done(function() {
          observable.onTaskModified.notify(ta);
        });
      });
    });

    deleteAction.click(function() {
      api.archiveTask(ta.tid);
      observable.onTaskArchived.notify(ta.tid);
    });

    if (!(util.isNotNull(sched.getState(ta).reserved)))
      rescheduleAction.hide();
    if (ta.task_status.task_progress === "Closed") {
      cancelAction.hide();
      rescheduleAction.show();
    } else
      deleteAction.hide();

    popover.children().remove();
    popover.append(view);
  }

  function viewOfTaskCard(profs, ta) {
'''
<div #view>
  <div #newMessages class="meeting-new-messages ellipsis"/>
  <div #actionsPopover class="meeting-actions-popover"
                       style="display:none"/>
  <div #subjectRow class="meeting-subject ellipsis">
    <div #arrowContainer class="meeting-actions-arrow"/>
    <div #subjectIconContainer class="meeting-subject-icon"/>
    <div #subject class="meeting-subject-text ellipsis">
      <a #subjectText class="link"/>
    </div>
  </div>
  <div class="inner-shadow-down"/>
  <div #meetingTitle class="meeting-title scrollable">
    <div #meetingRow class="meeting-type"/>
  </div>
  <div class="inner-shadow-up"/>
  <div #meetingFooter class="meeting-footer">
    <div #statusRow class="meeting-status-row">
      <div #statusIcon class="meeting-status-icon status-icon"/>
      <div #statusText class="meeting-status-text"/>
    </div>
    <div #updated class="meeting-updated-row"/>
  </div>
</div>
'''
    view.attr("id","task-" + ta.tid);
    actionsPopover.attr("id","popover-" + ta.tid);
    arrowContainer.attr("id","popover-trigger-" + ta.tid);

    if (ta.task_data === "Questions") return view;

    var unread = ta.task_status_text.status_unread_messages;
    if (unread > 0)
      newMessages.text(unread);
    else
      newMessages.hide();

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
    if (ta.task_priority_percentile >= 0.9){
      subjectRow.css({"border-left":"5px solid red", "padding-left":"5px"});
    } else if (ta.task_priority_percentile >= 0.6){
      subjectRow.css({"border-left":"5px solid orange", "padding-left":"5px"});
    } else {
      subjectRow.css({"border-left":"5px solid white", "padding-left":"5px"});
    }
    meetingRow.text(sched.getMeetingType(ta) + " with");
    var guests = sched.getAttendingGuests(ta);
    list.iter(guests, function(guest) {
      var nameOrEmail = profile.fullNameOrEmail(profs[guest].prof);
      var guestDiv = $("<div class='meeting-guest clearfix'/>")
        .appendTo(meetingTitle);
      var guestCirc = $("<div class='meeting-guest-circ'/>")
        .text(nameOrEmail[0])
        .appendTo(guestDiv);
      var guestName = $("<div class='meeting-guest-name ellipsis'/>")
        .text(nameOrEmail)
        .appendTo(guestDiv);
    });

    if (sched.isToDoStep(ta)) {
      var toDoIcon = $("<img class='svg-block'/>")
        .appendTo(statusIcon);
      svg.loadImg(toDoIcon, "/assets/img/to-do.svg");
    } else if (sched.isReminderStep(ta)) {
      var reminderIcon = $("<img class='svg-block'/>")
        .appendTo(statusIcon);
      svg.loadImg(reminderIcon, "/assets/img/status-reminder.svg");
    } else {
      statusIcon.hide();
    }

    var statusDetails = sched.taskStatus(ta);
    statusText.text(statusDetails.event);
    if (ta.task_status_text.status_step === "Wait_on_guest")
      statusText.addClass("waiting-on-guest");
    updated
      .append($("<span/>").text("Updated "))
      .append(statusDetails.timeAgo);

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
        togglePopover(view, arrowContainer, actionsPopover);
      })

    $("body").on("click", function (e) {
      var target = e.target;
      var parents = $(target).parents();
      if (actionsPopover.hasClass("open")
          && !actionsPopover.is(target)
          && $(target).parents("#popover-" + ta.tid).length === 0
          && !arrowContainer.is(target)
          && $(target).parents("#popover-trigger-" + ta.tid).length === 0) {
            hideAllPopovers();
            var card = $(target).parents(".task");
            if (card.length === 1) {
              card.find(".meeting-actions-arrow").css("display","block");
            }
      }
    });

    return view;
  }

  function classOfActiveTask(task) {
    if ("Scheduling" === variant.cons(task.task_data)) {
      if ("Confirmed" === task.task_status.task_progress)
        return "finalized-scheduling-task";
      else if ("Closed" === task.task_status.task_progress)
        return "canceled-scheduling-task";
      else
        return "pending-scheduling-task";
    } else {
      return "Closed" === task.task_status.task_progress
           ? "finalized-general-task"
           : "pending-general-task";
    }
  }

  function setTaskViewClass(view, viewClass) {
    view.attr("class", "task clearfix " + viewClass);
  }

  function viewOfActiveTaskCard(profs, task) {
    var view = viewOfTaskCard(profs, task);
    setTaskViewClass(view, classOfActiveTask(task));
    return view;
  }

  function viewOfArchiveTaskCard(profs, task) {
    var view = viewOfTaskCard(profs, task);
    setTaskViewClass(view, "archived-task");
    return view;
  }

  function taskUpdated(task) {
    header.updateToDo(task);
    header.updateNotifications(task);
    var view = $("#task-" + task.tid);
    var profs = profile.profilesOfTaskParticipants(task);
    if (view.length <= 0) {
      $("#tasks").prepend(viewOfActiveTaskCard(profs, task));
    } else if (view.hasClass("archived-task")) {
      view.replaceWith(viewOfArchiveTaskCard(profs, task));
    } else {
      view.replaceWith(viewOfActiveTaskCard(profs, task));
    }
  }

  function taskRanked(tid, mover) {
    var view = $("#task-" + tid);
    if (view.length > 0 && ! view.hasClass("archived-task")) {
      mover(view);
    } else {
      view.remove();
      api.getTask(tid).then(function(task) {
        var profs = profilesOfTaskParticipants(task);
        mover(viewOfActiveTaskCard(profs, task));
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
          var profs = profile.profilesOfTaskParticipants(task);
          mover(viewOfActiveTaskCard(profs, task), targetView);
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
        var profs = profilesOfTaskParticipants(task);
        $("#tasks").prepend(viewOfArchiveTaskCard(task));
      });
    }
  }

  function cmpScore(task1,task2) {
    //  log(task1.task_priority_percentile, task2.task_priority_percentile);
    if (task1.task_priority_percentile < task2.task_priority_percentile)
      return 1;
    if (task1.task_priority_percentile > task2.task_priority_percentile)
      return -1;
    return 0;
  }

  function cmpUpdate(task1,task2) {
    if (task1.task_lastmod < task2.task_lastmod)
      return 1;
    if (task1.task_lastmod > task2.task_lastmod)
      return -1;
    return 0;
  }

  function sortTasksBy(active,cmp) {
    log('sorting tasks');
    active.sort(cmp);
  }

  function showActiveTasks(active) {
    var view = $("#tasks");
    setTaskViewClass(view.children(), "archived-task"); // XXX Why??
    var deferredCards = list.map(active, function(task) {
      return profile.fetchProfilesOfTaskParticipants(task)
        .then(function(profs) {
          return { tid: task.tid, view: viewOfActiveTaskCard(profs, task) };
        });
    });
    deferred.join(deferredCards).done(function(cards) {
      list.iter(cards, function(card) {
        var taskView = $("#task-" + card.tid);
        if (taskView.length > 0) {
          taskView.replaceWith(card.view);
        } else {
          view.append(card.view);
        }
      });
    });
    $(".sort-task-update-btn")
          .unbind("click")
          .click(function () {
              log('sort by update time');
              sortTasksBy(active, cmpUpdate);
              $("#tasks").children().remove();
              showActiveTasks(active);
          });
      $(".sort-task-btn")
          .unbind("click")
          .click(function () {
              log('sort by score');
              sortTasksBy(active, cmpScore);
              $("#tasks").children().remove();
              showActiveTasks(active);
          });
  }

  function showAllTasks(data) {
    showActiveTasks(data.tasks);
    header.load(data.tasks);

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
      api.loadActiveTasks()
        .fail(status_.onError(404))
        .done(showAllTasks)
    );

    $('.show-pending-meetings')
      .unbind('click')
      .click(function() {
        $('.show-pending-meetings').addClass('active');
        $('.show-finalized-meetings').removeClass('active');
        $('.show-canceled-meetings').removeClass('active');
        $(".new-meeting-btn").show();
        $(".sort-task-btn").show();
        $(".sort-task-update-btn").show();
        $('#tasks')
          .attr('class', 'clearfix pending-scheduling-tasks task-list');
      });
    $('.show-finalized-meetings')
      .unbind('click')
      .click(function() {
        $('.show-pending-meetings').removeClass('active');
        $('.show-finalized-meetings').addClass('active');
        $('.show-canceled-meetings').removeClass('active');
        $(".new-meeting-btn").hide();
        $(".sort-task-btn").hide();
        $(".sort-task-update-btn").hide();
        $('#tasks')
          .attr('class', 'clearfix finalized-scheduling-tasks task-list');
      });
    $('.show-canceled-meetings')
      .unbind('click')
      .click(function() {
        $('.show-pending-meetings').removeClass('active');
        $('.show-finalized-meetings').removeClass('active');
        $('.show-canceled-meetings').addClass('active');
        $(".new-meeting-btn").hide();
        $(".sort-task-btn").hide();
        $(".sort-task-update-btn").hide();
        $('#tasks')
          .attr('class', 'clearfix canceled-scheduling-tasks task-list');
      });
  }

  function loadSearch() {
    var search = $(".search-meetings-input");
    var clear = $(".clear-search");

    function updateSearch() {
      if (search.val() != "") {
        clear.removeClass("hide");
        $(".meetings-toggle").attr("style","display:none");
        $(".search-stats").attr("style","display:block")
      } else {
        clear.addClass("hide");
        $(".meetings-toggle").attr("style","display:block");
        $(".search-stats").attr("style","display:none")
      }
    }

    util.afterTyping(search, 100, updateSearch);

    clear.click(function() {
      search.val("");
      updateSearch();
    })
  }

  function clickableViewOfTeam(team) {
    var isActive = login.getTeam().teamname === team.teamname;
    var label = labelOfTeam(team);
    var li = $("<li class='team-block hide'/>");
    var a = $("<a href='#' class='nav-team' data-toggle='pill'/>")
      .appendTo(li);
    var pic = $("<div class='list-exec-circ'/>")
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

    var leaderUid = team.team_leaders[0];
    profile.get(leaderUid)
      .done(function(p) {
        var initials = profile.veryShortNameOfProfile(p.prof);
        pic.text(initials);
      });

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
'''
<div #logout>
  <a href="#!logout">Log out of Esper</a>
</div>
<div #revoke>
  <a href="#">Revoke Esper's access to my Google account</a>
</div>
'''
    var view = $("#onboarding-interface");
    view.children().remove();

    revoke.click(function() {
      api.postGoogleAuthRevoke().done(revoke.remove());
      return false;
    });

    api.getGoogleAuthInfo(document.URL)
      .done(function(info) {
        view.append(logout);
        if (info.has_token) {
          view.append(revoke);
          agenda.create(view);
        } else {
          window.location = info.google_auth_url;
        }
      });
  };

  return mod;
}());
