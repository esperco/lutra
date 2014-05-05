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

  /* The EA Web app status formatting shows what they need to do,
     while the exec mobile status formatting shows what the EA is doing */
  function eaStatus(ta) {
    var step = ta.task_status_text.status_step;
    var plural_s = ta.task_participants.organized_for.length > 2 ? "s" : "";
    if (step === "Offer_meeting_options")
      return "Offer meeting options";
    else if (step === "Wait_on_guest")
      return "Waiting on guest" + plural_s;
    else if (step === "Follow_up_with_guest")
      return "Follow up with guest" + plural_s;
    else if (step === "Finalize_meeting_details")
      return "Finalize meeting details";
    else if (step === "Confirm_with_guest")
      return "Confirm with guest" + plural_s;
    else if (step === "No_reminder_scheduled")
      return "No reminder" + plural_s + " scheduled";
    else if (step === "Reminder_scheduled")
      return "Reminder" + plural_s + " scheduled";
    else if (step === "Reminder_sent")
      return "Reminder" + plural_s + " sent";
    else
      // Should never happen
      return "UNRECOGNIZED TASK STATUS STEP";
  }

  function taskStatus(ta) {
    var time = date.ofString(ta.task_status_text.status_timestamp);
    var statusEvent = $("<span/>")
      .text(eaStatus(ta) + ", updated ");
    var statusTimeAgo = date.viewTimeAgo(time);
    var statusTime = $("<span/>")
      .text(" at " + date.utcToLocalTimeOnly(time));
    return $("<div/>")
      .append(statusEvent)
      .append(statusTimeAgo)
      .append(statusTime);
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
    actionsPopover.attr("id","popover-" + ta.tid);
    arrowContainer.attr("id","popover-trigger-" + ta.tid);

    if (ta.task_status && ta.task_data !== "Questions") { // TODO XXX Why is this here?
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
    }

    return view;
  }

  function classOfActiveTask(task) {
    if ("Scheduling" === variant.cons(task.task_data)) {
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
    var view = $("#task-" + task.tid);
    profile.profilesOfTaskParticipants(task).done(function(profs) {
      if (view.length <= 0) {
        $("#tasks").prepend(viewOfActiveTaskCard(profs, task));
      } else if (view.hasClass("archived-task")) {
        view.replaceWith(viewOfArchiveTaskCard(profs, task));
      } else {
        view.replaceWith(viewOfActiveTaskCard(profs, task));
      }
    });
  }

  function taskRanked(tid, mover) {
    var view = $("#task-" + tid);
    if (view.length > 0 && ! view.hasClass("archived-task")) {
      mover(view);
    } else {
      view.remove();
      api.getTask(tid).then(function(task) {
        profile.profilesOfTaskParticipants(task).done(function(profs) {
          mover(viewOfActiveTaskCard(profs, task));
        });
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
          profile.profilesOfTaskParticipants(task).done(function(profs) {
            mover(viewOfActiveTaskCard(profs, task), targetView);
          });
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
        profile.profilesOfTaskParticipants(task).done(function(profs) {
          $("#tasks").prepend(viewOfArchiveTaskCard(task));
        });
      });
    }
  }

  function showActiveTasks(data) {
    var view = $("#tasks");
    setTaskViewClass(view.children(), "archived-task");
    var deferredCards = list.map(data.tasks, function(task) {
      return profile.profilesOfTaskParticipants(task).then(function(profs) {
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
  }

  function showAllTasks(data) {
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
    loadSearch();
    loadMeetings();
    util.focus();
  };

  return mod;
}());
