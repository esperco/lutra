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

  function loadTaskTitle(task) {
    var view = $("#task-title");
    view.children().remove();
    view.text(task.task_status.task_title);

    return view;
  }

  function loadGeneralTask(task) {
    var view = viewOfGeneralTask(task);
    placeView($("#gen-task"), view);
    taskTypeSelector.show("gen-task");
  }

  function loadSchedulingTask(task) {
    taskTypeSelector.hideAll();
    loadTaskTitle(task);
    sched.loadTask(task);
    taskTypeSelector.show("sched-task");
  }

  /* Load task data */
  mod.loadTask = function(task) {
    loadTaskTitle(task);

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

  /* Load task page from its task ID, if available */
  mod.load = function(tid) {
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
    $(".new-task-btn")
      .unbind("click")
      .click(function () {
        createAndLoadTask();
    });
  };

  return mod;
}());
