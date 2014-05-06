/*
  Task-related functions.
  Meetings have their own module, "sched".
*/

var task = (function() {

  var mod = {};

  /* display task */
  function viewOfGeneralTask(task) {
    function toggleTitle() {
      switch (task.task_status.task_progress) {
      case "Unread_by_organizer": return "Start";
      case "Closed":              return "Reopen";
      default:                    return "Done";
      }
    }
    var statusButton = $("<button/>")
      .addClass("btn btn-default")
      .text(toggleTitle());
    statusButton.click(function() {
      switch (task.task_status.task_progress) {
      case "Unread_by_organizer":
      case "Closed":
        task.task_status.task_progress = "Coordinating";
        break;
      default:
        task.task_status.task_progress = "Closed";
        break;
      }
      statusButton.addClass("disabled");
      api.postTask(task)
        .done(function() {
          statusButton
            .text(toggleTitle())
            .removeClass("disabled");
        });
    });
    return statusButton;
  }

  function placeView(parent, view) {
    parent.children().remove();
    view.appendTo(parent);
  }

  /* Create an empty scheduling task and display it */
  function createAndLoadTask() {
    var task_data = ["Scheduling", {}];
    var team = login.getTeam();
    var ta = {
      task_status: {
        task_title: "New Task",
        task_summary: ""
      },
      task_participants: {
        organized_by: team.team_organizers,
        organized_for: team.team_leaders
      },
      task_data: task_data
    };
    var async = api.createTask(ta);
    spinner.spin("Creating task...", async);
    async
      .done(function(ta) {
        mp.track("Start task");
        observable.onTaskCreated.notify(ta);
        /* change URL */
        window.location.hash = "#!task/" + ta.tid;
      });
  }

  var taskTypeSelector = show.create({
    "sched-task": {ids: ["sched-task", "task-title"]},
    "gen-task": {ids: ["gen-task", "task-title"]}
  });

  function loadGeneralTask(task) {
    var view = viewOfGeneralTask(task);
    placeView($("#gen-task"), view);
    taskTypeSelector.show("gen-task");
  }

  function loadSchedulingTask(task) {
    taskTypeSelector.hideAll();
    mod.loadTaskTitle(task);
    sched.loadTask(task);
    taskTypeSelector.show("sched-task");
  }

  function loadSidebar(task) {
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
  }

  mod.loadTaskTitle = function(task) {
    var title = task.task_status.task_title;
    var execName;
    profile.get(login.leader()).done(function(obsProf) {
      execName = profile.fullName(obsProf.prof);
    });
    document.title = title + " - " + execName;
    $(".meeting-path").removeClass("hide");
    $(".path-to").removeClass("hide");
    profile.profilesOfTaskParticipants(task).done(function(profs) {
      $(".page-title").text(sched.getMeetingTitle(profs, task));
    });
  }

  /* Load task data */
  mod.loadTask = function(task) {
    mod.loadTaskTitle(task);
    loadSidebar(task);

    switch (variant.cons(task.task_data)) {
    case "Questions":
      loadGeneralTask(task);
      break;
    case "Scheduling":
      loadSchedulingTask(task);
      break;
    default:
      log("Invalid task_data", task.task_data);
    }
    chat.loadTaskChats(task);
    util.focus();
  }

  var refresh = true;

  /* Load task page from its task ID, if available */
  mod.load = function(tid) {
    header.load();
    if (refresh) {
      api.loadActiveTasks().done(function(data) {
        header.populateToDoList(data.tasks);
        refresh = false;
      });
    }
    taskTypeSelector.hideAll();
    api.getTask(tid)
      .done(function(ta) {
        var team = list.find(login.getTeams(), function(x) {
          return x.teamid === ta.task_teamid;
        });
        if (util.isNotNull(team)) {
          login.setTeam(team);
        }
        mod.loadTask(ta);
      });
  };

  mod.init = function() {
    $(".new-meeting-btn")
      .unbind("click")
      .click(function () {
        createAndLoadTask();
    });
  };

  return mod;
}());
