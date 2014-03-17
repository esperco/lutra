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

  function taskSubject(ta) {
    // get subject of the task's email conversation
    return "Email subject line goes here.";
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

    var viewLivePage = $("<a class='task-action disabled' target='blank'/>");
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
    var rescheduleAction = $("<a class='task-action disabled'/>");
    var rescheduleIconContainer = $("<div class='task-action-icon'/>")
      .appendTo(rescheduleAction);
    var rescheduleIcon = $("<img/>")
      .appendTo(rescheduleIconContainer);
    svg.loadImg(rescheduleIcon, "/assets/img/reschedule.svg");
    rescheduleAction.append(($("<span class='task-action-label'/>"))
                      .text("Reschedule..."))
                    .appendTo(view);
    var cancelAction = $("<a class='task-action disabled'/>");
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

    // rescheduleAction.click(function() {

    // })
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
        $("#stats").addClass("hide");
        $("#search-stats").addClass("hide");
        $("#task-actions").removeClass("hide");
        loadTaskActions(ta);
      })

    var newLabel = $("<div class='new-label hide'>NEW</div>");
    var unreadLabel = $("<div class='unread-label'></div>");
    var toDoLabel = $("<div class='to-do-label hide'/>");
    var toDoIcon = $("<img/>")
      .appendTo(toDoLabel);
    svg.loadImg(toDoIcon, "/assets/img/to-do.svg");
    var sentLabel = $("<div class='sent-label hide'/>");
    var sentIcon = $("<img/>")
      .appendTo(sentLabel);
    svg.loadImg(sentIcon, "/assets/img/reply.svg");
    var taskLabel = $("<div class='task-label'/>")
      .append(newLabel)
      .append(unreadLabel)
      .append(toDoLabel)
      .append(sentLabel)
      .appendTo(view);


    var taskDetails = $("<div class='task-details'></div>")
      .appendTo(view);

    var title = ta.task_status
      ? ta.task_status.task_title
      : null;

    if (title) {
      var guestsRow = $("<a href='#!task/" + ta.tid + "' class='task-guests link ellipsis'></a>")
        .text(title)
        .appendTo(taskDetails);

      var subjectRow = $("<div class='task-subject'/>")
        .append(taskSubject(ta))
        .appendTo(taskDetails);

      var statusRow = $("<div class='task-status-row'/>")
        .appendTo(taskDetails);
      var status = $("<div class='task-status-text'/>")
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
      var statusIcon = $("<div class='task-status-icon'/>")
        .append(guests)
        .append(email)
        .append(options)
        .append(calendar)
        .append(reminder)
        .appendTo(statusRow);
      statusRow.append(status);

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

    $('.show-in-progress-scheduling-tasks')
    .unbind('click')
    .click(function() {
      $('.show-in-progress-scheduling-tasks').addClass('active');
      $('.show-completed-scheduling-tasks').removeClass('active');
      $('#list-view')
        .attr('class', 'in-progress-scheduling-tasks task-list');
    });
    $('.show-completed-scheduling-tasks')
    .unbind('click')
    .click(function() {
      $('.show-in-progress-scheduling-tasks').removeClass('active');
      $('.show-completed-scheduling-tasks').addClass('active');
      $('#list-view')
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

  function moveContent(padding) {
    var view = $("#home-content");
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

  function loadStatusFilters() {
    var status = $("#status-filter");
    status.children().remove();
    $("<h5 class='filter-title'>Status</h5>")
      .appendTo(status);
    var checkCoordinating = $("<img class='filter-checkbox'/>");
    var statusCoordinating = $("<li class='filter checkbox-option clickable'></li>");
    var checkUpcoming = $("<img class='filter-checkbox'/>");
    var statusUpcoming = $("<li class='filter checkbox-option clickable'></li>");
    var checkPast = $("<img class='filter-checkbox'/>");
    var statusPast = $("<li class='filter checkbox-option clickable'></li>");
    var checkCanceled = $("<img class='filter-checkbox'/>");
    var statusCanceled = $("<li class='filter checkbox-option clickable'></li>");
    var statusOptions = $("<ul class=filter-list/>")
      .append(statusCoordinating
        .append(checkCoordinating)
        .append($("<span class='filter-checkbox-label'>Coordinating</span>")))
      .append(statusUpcoming
        .append(checkUpcoming)
        .append($("<span class='filter-checkbox-label'>Upcoming</span>")))
      .append(statusPast
        .append(checkPast)
        .append($("<span class='filter-checkbox-label'>Past</span>")))
      .append(statusCanceled
        .append(checkCanceled)
        .append($("<span class='filter-checkbox-label'>Canceled</span>")))
      .appendTo(status);
    svg.loadImg(checkCoordinating, "/assets/img/checkbox-sm.svg");
    svg.loadImg(checkUpcoming, "/assets/img/checkbox-sm.svg");
    svg.loadImg(checkPast, "/assets/img/checkbox-sm.svg");
    svg.loadImg(checkCanceled, "/assets/img/checkbox-sm.svg");
    statusCoordinating.click(function() {
      if($(this).hasClass("checkbox-selected")) {
        $(this).removeClass("checkbox-selected");
        // remove filter
      } else {
        $(this).addClass("checkbox-selected");
        // apply filter
      }
    })
    statusUpcoming.click(function() {
      if($(this).hasClass("checkbox-selected")) {
        $(this).removeClass("checkbox-selected");
        // remove filter
      } else {
        $(this).addClass("checkbox-selected");
        // apply filter
      }
    })
    statusPast.click(function() {
      if($(this).hasClass("checkbox-selected")) {
        $(this).removeClass("checkbox-selected");
        // remove filter
      } else {
        $(this).addClass("checkbox-selected");
        // apply filter
      }
    })
    statusCanceled.click(function() {
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
    var sortByToDo = $("<li class='filter sort-by-filter active'>To Do</li>");
    var sortByLastUpdated = $("<li class='filter sort-by-filter link'>Last Updated</li>");
    var sortByMeetingDate = $("<li class='filter sort-by-filter link'>Meeting Date</li>");
    var sortByOptions = $("<ul class=filter-list/>")
      .append(sortByToDo)
      .append(sortByLastUpdated)
      .append(sortByMeetingDate)
      .appendTo(sortBy);
    sortByToDo.click(function() {
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
    sortByMeetingDate.click(function() {
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
    var toggle = $("#toggle-filters");
    var label = $("#toggle-filters-label")
      .text("Show Filters");
    var caret = $("#filters-caret");
    var filters = $("#filters")
      .attr("style","display:none");

    loadSortByFilters();
    loadStatusFilters();
    loadWaitingOnFilters();
    loadAssignedToFilters();

    toggle.click(function() {
      if (filters.is(":hidden")) {
        label.text("Hide Filters");
        caret.removeClass("closed")
             .addClass("open");
        filters.slideDown("fast", function(){
          var contentPadding = $("#home-header").height();
          moveContent(contentPadding);
        });
      } else {
        label.text("Show Filters");
        caret.removeClass("open")
             .addClass("closed");
        filters.slideUp("fast", function() {
          $("#home-content")
            .attr("style","padding-top:163px");
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
        $("#home-title").text("Search");
      } else {
        clear.addClass("hide");
        $("#home-title").text("Meetings");
      }
    }

    util.afterTyping(search, 100, updateSearch);

    clear.click(function() {
      search.val("");
      updateSearch();
    })
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
      li.click(function() {
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

  function insertTeams() {
    var view = $("#popover-team-list");
    view.children().remove();
    var teams = sortTeams(login.getTeams());
    list.iter(list.rev(teams), function(team) {
      clickableViewOfTeam(team)
        .appendTo(view);
    });
  }

  function loadHeader() {
    var view = $("#account-circ");
    var info = $("#popover-account-info");
    var execName = $("#assisting-name");

    api.getProfile(login.me()).done(function(eaProf) {
      var fullName = profile.fullName(eaProf);
      var email = profile.email(eaProf);
      view.text(profile.shortenName(fullName).substring(0,1).toUpperCase());
      info.children().remove();
      info.append($("<div id='popover-account-name' class='ellipsis'/>")
            .text(fullName))
          .append($("<div id='popover-account-email' class='ellipsis'/>")
            .text(email));
    });

    profile.get(login.leader()).done(function(obsProf) {
      var p = obsProf.prof;
      var assisting = $("<span>assisting </span>");
      var fullName = $("<span id='exec-name'/>")
        .text(profile.fullName(p));
      execName.children().remove();
      execName.append(assisting)
              .append(fullName);
    });

    insertTeams();

    view.popover({
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
        && view.next('div.popover:visible').length) {
        view.click();
      }
    });

    $("#settings-nav").click(function() {
      view.click(); // BUG: not dismissing popover
      settings.load;
    })
}

  mod.load = function() {
    loadHeader();
    loadSearch();
    loadFilters();
    loadTasks();
    util.focus();
    $(document).click(function(event) {
      var target = $(event.target);
      if ((! target.parents("#tasks").length) &&
          (! target.parents("#home-tools").length)) {
        $(".task").each(function() {
          $(this).removeClass("selected");
        })
        $("#stats").removeClass("hide");
        $("#search-stats").addClass("hide");
        $("#task-actions").addClass("hide");
      }
    })
  };

  return mod;
}());
