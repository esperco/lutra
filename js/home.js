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

  function loadAssignToPopover(ta, x) {
    var view = $("#popover-ea-list");
    view.children().remove();

    var team_organizers = login.organizers();
    // if (team_organizers.length > 1) {
      profile.mget(team_organizers).done(function(profs) {
        list.iter(team_organizers, function(organizer_uid, i) {
          var v = $("<li/>");
          var checkbox = $("<div class='assign-to-checkbox'/>");
          var img = $("<img/>")
            .appendTo(checkbox);
          svg.loadImg(img, "/assets/img/checkbox-sm.svg");
          var eaName = $("<div class='assign-to-name'/>")
            .text(profile.fullName(profs[i].prof));
          if (list.mem(ta.task_participants.organized_by, organizer_uid)) {
            v.addClass("checkbox-selected");
          }
          v.append(checkbox)
           .append(eaName)
           .appendTo(view);

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
    // }

    x.attr({
      "data-toggle":"popover",
      "data-contentwrapper":"#assign-to-popover"
    });

    x.popover({
      html:true,
      placement:'bottom',
      content:function(){
        return $($(this).data('contentwrapper')).html();
      }
    });

    $('body').on('click', function (e) {
      if ($(e.target).data('toggle') !== 'popover'
        && $(e.target).parents('[data-toggle="popover"]').length === 0
        && $(e.target).parents('.popover.in').length === 0
        && x.next('div.popover:visible').length) {
        x.click();
      }
    });
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

  function viewOfTaskRow(ta) {
    var view = $("<div/>",{id:"task-" + ta.tid})
      .click(function() {
        $(".task").each(function() {
          $(this).removeClass("selected");
        })
        $(this).addClass("selected");
        $("#new-message-stats").addClass("hide");
        $("#task-actions").removeClass("hide");
        loadTaskActions(ta);
      })

    if (ta.task_status) {
      var typeRow = $("<div class='meeting-type'/>")
        .append(meetingType(ta))
        .appendTo(view);

      var guestsSection = $("<a href='#!task/" + ta.tid + "' class='meeting-guests link ellipsis'></a>")
        .appendTo(view);
      var guest1 = $("<div class='meeting-guest-name'/>")
        .text("Christopher Christopherson")
        .appendTo(guestsSection);
      var guest2 = $("<div class='meeting-guest-name'/>")
        .text("Christopher Christopherson")
        .appendTo(guestsSection);
      var guest3 = $("<div/>")
        .text("+2 more")
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
    var stats = $("#new-message-stats");
    var count = 0;

    setTaskViewClass(view.children(), "archived-task");
    list.iter(data.tasks, function(task) {
      var taskView = $("#task-" + task.tid);
      if (taskView.length > 0) {
        taskView.replaceWith(viewOfActiveTaskRow(task));
      } else {
        view.append(viewOfActiveTaskRow(task));
      }
    });

    stats.children().remove();
    var email = $("<div id='new-message-icon' class='status-icon email-status-icon'/>");
    var emailIcon = $("<img/>")
      .appendTo(email);
    svg.loadImg(emailIcon, "/assets/img/status-email.svg");
    var statsText = $("<div id='new-message-count'/>");
    if (count > 0) {
      statsText.text(count + " unread messages");
    } else {
      statsText.text("No new messages");
    }
    stats.append(email)
         .append(statsText);
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

  function moveContent(padding) {
    var view = $("#tasks");
    view.attr("style","-webkit-transform: translate(0px, " + padding + "px)")
        .attr("style","-moz-transform: translate(0px, " + padding + "px)")
        .attr("style","-ms-transform: translate(0px, " + padding + "px)")
        .attr("style","-o-transform: translate(0px, " + padding + "px)")
        .attr("style","-transform: translate(0px, " + padding + "px)")
        .attr("style","padding-top:" + padding + "px");
  }

  function loadAssignedToFilters() {
    // only do this if there's more than 1 EA on the team
    var assignedTo = $("#assigned-to-filter");
    assignedTo.children().remove();
    $("<h5 class='filter-title'>Waiting On</h5>")
      .appendTo(assignedTo);
    var checkAssignedToMe = $("<img class='filter-checkbox'/>");
    var assignedToMe = $("<li class='filter checkbox-option clickable'></li>");
    // add other EA's on team here
    var assignedTo = $("<ul class=filter-list/>")
      .append(assignedToMe
        .append(checkAssignedToMe)
        .append($("<span class='filter-checkbox-label'>Me</span>")))
      .appendTo(assignedTo);
    svg.loadImg(checkAssignedToMe, "/assets/img/checkbox-sm.svg");
    assignedToMe.click(function() {
      if($(this).hasClass("checkbox-selected")) {
        $(this).removeClass("checkbox-selected");
        // remove filter
      } else {
        $(this).addClass("checkbox-selected");
        // apply filter
      }
    })
  }

  function loadWaitingOnFilters() {
    var waitingOn = $("#waiting-on-filter");
    waitingOn.children().remove();
    $("<h5 class='filter-title'>Waiting On</h5>")
      .appendTo(waitingOn);
    var checkWaitingOnMe = $("<img class='filter-checkbox'/>");
    var waitingOnMe = $("<li class='filter checkbox-option clickable'></li>");
    // add other EA's on team here
    var checkGuests = $("<img class='filter-checkbox'/>");
    var waitingOnGuests = $("<li class='filter checkbox-option clickable'></li>");
    var waitingOnOptions = $("<ul class=filter-list/>")
      .append(waitingOnMe
        .append(checkWaitingOnMe)
        .append($("<span class='filter-checkbox-label'>Me</span>")))
      .append(waitingOnGuests
        .append(checkGuests)
        .append($("<span class='filter-checkbox-label'>Guests</span>")))
      .appendTo(waitingOn);
    svg.loadImg(checkWaitingOnMe, "/assets/img/checkbox-sm.svg");
    svg.loadImg(checkGuests, "/assets/img/checkbox-sm.svg");
    waitingOnMe.click(function() {
      if($(this).hasClass("checkbox-selected")) {
        $(this).removeClass("checkbox-selected");
        // remove filter
      } else {
        $(this).addClass("checkbox-selected");
        // apply filter
      }
    })
    waitingOnGuests.click(function() {
      if($(this).hasClass("checkbox-selected")) {
        $(this).removeClass("checkbox-selected");
        // remove filter
      } else {
        $(this).addClass("checkbox-selected");
        // apply filter
      }
    })
  }

  function loadSortByFilters() {
    var sortBy = $("#sort-by-filter");
    sortBy.children().remove();
    $("<h5 class='filter-title'>Sort By</h5>")
      .appendTo(sortBy);
    var sortByLastUpdated = $("<li class='filter sort-by-filter active'>Last Updated</li>");
    var sortByUrgency = $("<li class='filter sort-by-filter link'>Meeting Date</li>");
    var sortByOptions = $("<ul class=filter-list/>")
      .append(sortByLastUpdated)
      .append(sortByUrgency)
      .appendTo(sortBy);
    sortByLastUpdated.click(function() {
      if(! $(this).hasClass("active")) {
        $(".sort-by-filter").each(function() {
          if ($(this).hasClass("active")) {
            $(this).removeClass("active")
                   .addClass("link");
            // clear filter
          }
        })
        $(this).removeClass("link")
               .addClass("active");
        // apply filter
      }
    })
    sortByUrgency.click(function() {
      if(! $(this).hasClass("active")) {
        $(".sort-by-filter").each(function() {
          if ($(this).hasClass("active")) {
            $(this).removeClass("active")
                   .addClass("link");
            // clear filter
          }
        })
        $(this).removeClass("link")
               .addClass("active");
        // apply filter
      }
    })
  }

  function loadFilters() {
    var toggle = $("#filters-toggle");
    var label = $("#filters-toggle-label")
      .text("Show Filters");
    var caret = $("#filters-caret");
    var filters = $("#filters")
      .attr("style","display:none");

    loadSortByFilters();
    loadWaitingOnFilters();
    loadAssignedToFilters();

    toggle.click(function() {
      if (filters.is(":hidden")) {
        toggle.removeClass("closed");
        label.text("Hide Filters");
        caret.removeClass("closed")
             .addClass("open");
        filters.slideDown("fast", function(){
          var contentPadding = $("#meetings-tools").height();
          log(contentPadding);
          moveContent(contentPadding);
        });
      } else {
        toggle.addClass("closed");
        label.text("Show Filters");
        caret.removeClass("open")
             .addClass("closed");
        filters.slideUp("fast", function() {
          $("#tasks")
            .attr("style","padding-top:113px");
        });
      }
    })
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

  function switchTeam(team) {
    log("Switching");
    login.setTeam(team);
    mod.load();
  }

  function labelOfTeam(team) {
    var label = team.team_label;
    if (! util.isString(label) || label === "")
      label = team.teamname;
    return label;
  }

  function clickableViewOfTeam(team) {
    var isActive = login.getTeam().teamname === team.teamname;
    var label = labelOfTeam(team);
    var li = $("<li/>");
    var a = $("<a href='#' data-toggle='pill'/>")
      .appendTo(li);
    var pic = $("<div class='team-list-circ'/>")
      .text(profile.shortenName(label).substring(0,1))
      .appendTo(a);
    var div = $("<div class='team-list-name ellipsis'/>")
      .text(label)
      .appendTo(a);

    if (isActive) {
      li.addClass("active");
      a.addClass("active");
      pic.addClass("active");
    } else {
      log("Not active");
      li.click(function() {
        log("switch");
        switchTeam(team);
      });
    }

    return li;
  }

  function sortTeams(a) {
    return list.sort(a, function(t1, t2) {
      var l1 = labelOfTeam(t1);
      var l2 = labelOfTeam(t2);
      return l1.localeCompare(l2);
    });
  }

  function insertTeams(view) {
    view.children().remove();
    var teams = sortTeams(login.getTeams());
    list.iter(list.rev(teams), function(team) {
      clickableViewOfTeam(team)
        .appendTo(view);
    });
  }

  function loadHeader(popover) {
'''
<div #view class="home-header">
  <div class="header-accent"></div>
  <a href="#" class="home-icon-container" data-toggle="tab">
    <img class="svg svg-block home-icon" src="assets/img/esper-mark.svg">
  </a>
  <div id="page-title"></div>
  <div #menu class="account-menu">
    <img id="account-menu-caret" class="svg" src="/assets/img/arrow-south.svg">
    <div id="assisting-name"></div>
    <div id="assisting-circ"></div>
  </div>
</div>
'''
    profile.get(login.leader()).done(function(obsProf) {
      var circ = $("#assisting-circ");
      var name = $("#assisting-name");
      var p = obsProf.prof;
      var fullName = profile.fullName(p);
      circ.text(profile.shortenName(fullName).substring(0,1).toUpperCase());
      name.children().remove();
      name.text(fullName);
    });

    menu.click(function() {
      if (popover.hasClass("open")) {
        popover.removeClass("open")
               .attr("style","display:none");
      } else {
        popover.addClass("open")
               .attr("style","display:block");
      }
    })

    $('body').on('click', function (e) {
      if ($(e.target) == popover) {
        menu.click();
      }
    });
  }

  function loadAccountPopover() {
'''
<div #view style="display:none">
  <div #accountInfo/>
  <ul #teamList class="popover-list"></ul>
  <ul #accountActions" class="popover-list">
    <li>
      <a href="#!settings" data-toggle="tab">Settings</a>
    </li>
    <li>
      <a href="#!logout">Sign out</a>
    </li>
  </ul>
</div>
'''
    api.getProfile(login.me()).done(function(eaProf) {
      var name = profile.fullName(eaProf);
      var email = profile.email(eaProf);
      accountInfo.children().remove();
      accountInfo.append($("<div id='popover-account-name' class='ellipsis'/>")
                   .text(name))
                 .append($("<div id='popover-account-email' class='ellipsis'/>")
                   .text(email));
    });

    insertTeams(teamList);

    loadHeader(view);
  }

  mod.load = function() {
    document.title = "Meetings - Esper";
    $("#page-title").text("Meetings");
    header.load();
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
