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
    return "Email subject line";
  }

  function loadTaskActions(ta) {
    var view = $("#task-actions");
    view.children().remove();

    log("about to load");

    var rescheduleAction = $("<div class='task-action'/>");
    var rescheduleIcon = $("<img/>")
      .appendTo(rescheduleAction);
    svg.loadImg(rescheduleIcon, "/assets/img/to-do.svg");
    rescheduleAction.append(($("<span class='task-action-label'/>"))
                      .text("Reschedule..."))
                    .appendTo(view);
    var cancelAction = $("<div class='task-action'/>");
    var cancelIcon = $("<img/>")
      .appendTo(cancelAction);
    svg.loadImg(cancelIcon, "/assets/img/to-do.svg");
    cancelAction.append(($("<span class='task-action-label'/>"))
                  .text("Cancel..."))
                .appendTo(view);
    var deleteAction = $("<div class='task-action'/>");
    var deleteIcon = $("<img/>")
      .appendTo(deleteAction);
    svg.loadImg(deleteIcon, "/assets/img/to-do.svg");
    deleteAction.append(($("<span class='task-action-label'/>"))
                  .text("Delete..."))
                .appendTo(view);

    // rescheduleAction.click(function() {

    // })
    // cancelAction.click(function() {

    // })
    deleteAction.click(function() {
      api.archiveTask(ta.tid);
      observable.onTaskArchived.notify(ta.tid);
    })
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

      var statusRow = $("<div class='task-status'/>")
        .appendTo(taskDetails);
      var guests = $("<div class='status-icon guests-status-icon'/>");
      var guestsIcon = $("<img/>")
        .appendTo(guests);
      svg.loadImg(guestsIcon, "/assets/img/group.svg");
      var email = $("<div class='status-icon email-status-icon hide'/>");
      var emailIcon = $("<img/>")
        .appendTo(email);
      svg.loadImg(emailIcon, "/assets/img/email.svg");
      var options = $("<div class='status-icon options-status-icon hide'/>");
      var optionsIcon = $("<img/>")
        .appendTo(options);
      svg.loadImg(optionsIcon, "/assets/img/to-do.svg");
      var calendar = $("<div class='status-icon calendar-status-icon hide'/>");
      var calendarIcon = $("<img/>")
        .appendTo(calendar);
      svg.loadImg(calendarIcon, "/assets/img/reply.svg");
      var reminder = $("<div class='status-icon reminder-status-icon hide'/>");
      var reminderIcon = $("<img/>")
        .appendTo(reminder);
      svg.loadImg(reminderIcon, "/assets/img/to-do.svg");
      var statusIcon = $("<div class='task-status-icon'/>")
        .append(guests)
        .append(email)
        .append(options)
        .append(calendar)
        .append(reminder)
        .appendTo(statusRow);
      statusRow.append(taskStatus(ta));

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

  // function loadNavHeader() {
  //   $(".nav-header").each(function() {
  //     var view = $(this);
  //     view.children().remove();
  //     var initialsView = $("<div id='exec-circ'/>")
  //       .appendTo(view);
  //     var execNameView = $("<div id='exec-name' class='ellipsis'/>");
  //     profile.get(login.leader())
  //       .done(function(obsProf) {
  //         var p = obsProf.prof;
  //         execNameView.text(profile.fullName(p));
  //         initialsView.text(profile.veryShortNameOfProfile(p));
  //       });
  //     var exec = $("<div id='exec-name-div'></div>")
  //       .append($("<div id='assisting'>ASSISTING</div>"))
  //       .append(execNameView)
  //       .appendTo(view);
  //     var caretDiv = $("<div id='exec-caret'></div>")
  //       .appendTo(view);
  //     var caret = $("<img/>")
  //       .appendTo(caretDiv);
  //     svg.loadImg(caret, "/assets/img/caret.svg");
  //     $(".account-block").each(function() {
  //       if (! $(this).hasClass("hide"))
  //         $(this).addClass("hide");
  //     });
  //     $(".team-block").each(function() {
  //       if (! $(this).hasClass("hide"))
  //         $(this).addClass("hide");
  //     });
  //     $(".account-divider-div").each(function() {
  //       if (! $(this).hasClass("hide"))
  //         $(this).addClass("hide");
  //     });
  //     view.click(function() {
  //       if (caretDiv.hasClass("account-nav-open")) {
  //         caretDiv.removeClass("account-nav-open");
  //         caretDiv.addClass("account-nav-closed");
  //         $(".account-block").each(function() {
  //           $(this).addClass("hide");
  //         });
  //         $(".team-block").each(function() {
  //           $(this).addClass("hide");
  //         });
  //         $(".account-divider-div").each(function() {
  //           $(this).addClass("hide");
  //         });
  //       } else {
  //         caretDiv.removeClass("account-nav-closed");
  //         caretDiv.addClass("account-nav-open");
  //         $(".account-block").each(function() {
  //           $(this).removeClass("hide");
  //         });
  //         $(".team-block").each(function() {
  //           $(this).removeClass("hide");
  //         });
  //         $(".account-divider-div").each(function() {
  //           $(this).removeClass("hide");
  //         });
  //       }
  //     });
  //   });

  //   insertLoggedIn();
  //   insertTeams();
  // }

  function moveContent(padding) {
    var view = $("#home-content");
    view.attr("style","-webkit-transform: translate(0px, " + padding + "px)")
        .attr("style","-moz-transform: translate(0px, " + padding + "px)")
        .attr("style","-ms-transform: translate(0px, " + padding + "px)")
        .attr("style","-o-transform: translate(0px, " + padding + "px)")
        .attr("style","-transform: translate(0px, " + padding + "px)")
        .attr("style","padding-top:" + padding + "px");
  }

  function loadFilters() {
    var toggle = $("#toggle-filters");
    var label = $("#toggle-filters-label")
      .text("Show Filters");
    var caret = $("#filters-caret");
    var filters = $("#filters")
      .attr("style","display:none");
    var sortBy = $("#sort-by-filter");
    var status = $("#status-filter");
    var waitingOn = $("#waiting-on-filter");
    var assignedTo = $("#assigned-to-filter");

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

    // if there's more than 1 EA, remove "hide" class from assignedTo
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
    svg.loadImg(checkGuests, "/assets/img/checkbox-sm.svg");
    assignedToMe.click(function() {
      if($(this).hasClass("checkbox-selected")) {
        $(this).removeClass("checkbox-selected");
        // remove filter
      } else {
        $(this).addClass("checkbox-selected");
        // apply filter
      }
    })

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

  function loadHeader() {
    var eaName = $("#account-name");
    var execName = $("#assisting-name");
    var search = $("#search-meetings-input");
    var clear = $("#clear-search");

    api.getProfile(login.me()).done(function(eaProf) {
      var fullName = profile.fullName(eaProf);
      eaName.text(fullName);
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

    // $(".nav-header").each(function() {
    //   var view = $(this);
    //   view.children().remove();
    //   var initialsView = $("<div id='exec-circ'/>")
    //     .appendTo(view);
    //   var execNameView = $("<div id='exec-name' class='ellipsis'/>");
    //   profile.get(login.leader())
    //     .done(function(obsProf) {
    //       var p = obsProf.prof;
    //       execNameView.text(profile.fullName(p));
    //       initialsView.text(profile.veryShortNameOfProfile(p));
    //     });
    //   var exec = $("<div id='exec-name-div'></div>")
    //     .append($("<div id='assisting'>ASSISTING</div>"))
    //     .append(execNameView)
    //     .appendTo(view);
    //   var caretDiv = $("<div id='exec-caret'></div>")
    //     .appendTo(view);
    //   var caret = $("<img/>")
    //     .appendTo(caretDiv);
    //   svg.loadImg(caret, "/assets/img/caret.svg");
    //   $(".account-block").each(function() {
    //     if (! $(this).hasClass("hide"))
    //       $(this).addClass("hide");
    //   });
    //   $(".team-block").each(function() {
    //     if (! $(this).hasClass("hide"))
    //       $(this).addClass("hide");
    //   });
    //   $(".account-divider-div").each(function() {
    //     if (! $(this).hasClass("hide"))
    //       $(this).addClass("hide");
    //   });
    //   view.click(function() {
    //     if (caretDiv.hasClass("account-nav-open")) {
    //       caretDiv.removeClass("account-nav-open");
    //       caretDiv.addClass("account-nav-closed");
    //       $(".account-block").each(function() {
    //         $(this).addClass("hide");
    //       });
    //       $(".team-block").each(function() {
    //         $(this).addClass("hide");
    //       });
    //       $(".account-divider-div").each(function() {
    //         $(this).addClass("hide");
    //       });
    //     } else {
    //       caretDiv.removeClass("account-nav-closed");
    //       caretDiv.addClass("account-nav-open");
    //       $(".account-block").each(function() {
    //         $(this).removeClass("hide");
    //       });
    //       $(".team-block").each(function() {
    //         $(this).removeClass("hide");
    //       });
    //       $(".account-divider-div").each(function() {
    //         $(this).removeClass("hide");
    //       });
    //     }
    //   });
    // });

    // insertLoggedIn();
    // insertTeams();
  }


  mod.load = function() {
    loadHeader();
    loadFilters();
    loadTasks();
    $(".settings-nav")
      .off('click')
      .click(settings.load);
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
