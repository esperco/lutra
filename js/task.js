/*
  Task-related functions.
  Meetings have their own module, "sched".
*/

var task = (function() {

  var mod = {};

  function Observable() {
    var listeners = {};
    this.observe = function(key, fn) {
      listeners[key] = fn;
    };
    this.stopObserve = function(key) {
      delete listeners[key];
    };
    this.notify = function(v,w,x,y,z) {
      for (var key in listeners) {
        listeners[key](v,w,x,y,z);
      }
    };
  }

  mod.onTaskCreated = new Observable();
  mod.onTaskModified = new Observable();
  mod.onTaskParticipantsChanged = new Observable();
  mod.onChatPosting = new Observable();
  mod.onChatPosted = new Observable();

  /* extract all user IDs contained in the task; this is used to
     pre-fetch all the profiles. */
  mod.extractAllUids = function(ta) {
    var acc = [];

    var taskPar = ta.task_participants;
    acc = list.union(acc, taskPar.organized_by);
    acc = list.union(acc, taskPar.organized_for);

    list.iter(ta.task_chats, function(chat) {
      var uids = list.map(chat.chat_participants, function(x) {
        return x.par_uid;
      });
      acc = list.union(acc, uids);
    });

    return acc;
  }

  /*
    fetch the profiles of everyone involved in the task
    (deferred map from uid to profile)
  */
  mod.profilesOfEveryone = function(ta) {
    var par = ta.task_participants;
    var everyone = mod.extractAllUids(ta);
    return profile.mget(everyone)
      .then(function(a) {
        var b = {};
        list.iter(a, function(obsProf) {
          if (obsProf !== null) {
            b[obsProf.prof.profile_uid] = obsProf;
          }
        });
        return b;
      });
  };

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

  var taskTypeSelector = show.create({
    "new-task": {ids: ["new-task"]},
    "sched-task": {ids: ["sched-task", "task-title"]},
    "gen-task": {ids: ["gen-task", "task-title"]}
  });

  function initTaskData() {
    if ($("#workflow-sched").is(":checked")) {
      return ["Scheduling", {}];
    }
    else if ($("#workflow-gen").is(":checked")) {
      return "Questions";
    }
  }

  function loadNewTask(task) {
    var startTaskButton = $("#start-task");
    var newTaskTitle = $("#new-task-title");

    function isValidTitle(s) {
      return s.length > 0;
    }

    function updateUI() {
      if (isValidTitle(newTaskTitle.val()))
        startTaskButton.removeClass("disabled");
      else
        startTaskButton.addClass("disabled");
    }

    function loadWorkflowOptions() {
      var v = $("#workflow-options");
      v.children().remove();

      var sched = $("<div id='workflow-sched-temp' class='workflow-row'></div>")
        .appendTo(v);
      var radio = $("<img class='workflow-radio'/>")
        .appendTo(sched);
      svg.loadImg(radio, "/assets/img/radio.svg");
      var schedDetails = $("<div class='workflow-details'></div>")
        .appendTo(sched);
      var schedIcon = $("<img id='sched-workflow-icon'/>")
        .appendTo(schedDetails);
      svg.loadImg(schedIcon, "/assets/img/scheduling.svg");
      schedDetails.append("<span id='sched-workflow-text'>Scheduling</span>");
      schedDetails.append("<div>Arrange one-on-one and group meetings.</div>");

      var gen = $("<div id='workflow-gen-temp' class='workflow-row'></div>")
        .appendTo(v);
      var radio = $("<img class='workflow-radio'/>")
        .appendTo(gen);
      svg.loadImg(radio, "/assets/img/radio.svg");
      var genDetails = $("<div class='workflow-details'></div>")
        .appendTo(gen);
      var genIcon = $("<img id='gen-workflow-icon'/>")
        .appendTo(genDetails);
      svg.loadImg(genIcon, "/assets/img/general.svg");
      genDetails.append("<span id='gen-workflow-text'>General</span>");
      genDetails.append("<div>Do general stuff.</div>");
    }

    function initUI() {
      loadWorkflowOptions();
      if (task) {
        newTaskTitle.val(task.task_status.task_title);
        switch (variant.cons(task.task_data)) {
        case "Questions":
          $("#workflow-gen").prop("checked", true);
          break;
        case "Scheduling":
          $("#workflow-sched").prop("checked", true);
          break;
        default:
          log("Invalid task_data", task.task_data);
        }
      } else {
        newTaskTitle.val("");
      }
      updateUI();
      util.afterTyping(newTaskTitle, 250, updateUI);
      util.changeFocus(newTaskTitle);
    }

    function onClicked() {
      var title = $("#new-task-title").val();
      if (title.length > 0) {
        if (task) {
          task.task_data = initTaskData();
          task.task_status.task_title = title;
          task.task_status.task_progress = "Coordinating";
          api.postTask(task)
            .done(function(task) {
              mod.onTaskModified.notify(task);
              loadTask(task);
            });
        }
        else {
          var task_data = initTaskData();
          task = {
            task_status: {
              task_title: title,
              task_summary: ""
            },
            task_participants: {
              organized_by: login.data.team.team_organizers,
              organized_for: login.data.team.team_leaders
            },
            task_data: task_data
          };
          api.createTask(task)
            .done(function(task) {
              mod.onTaskCreated.notify(task);
              /* change URL */
              window.location.hash = "#!task/" + task.tid;
            });
        }
      }
    }

    /* initialization */
    initUI();

    startTaskButton
      .unbind('click')
      .click(onClicked);

    taskTypeSelector.show("new-task");
    util.focus();
  }

  function loadTaskTitle(task) {
    var view = $("#task-title");
    view.children().remove();

    view.val(task.task_status.task_title);
    view.change(function() {
      if (task.task_status.task_title !== view.val()) {
        task.task_status.task_title = view.val();
        api.postTask(task);
      }
    });

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

  function loadTask(task) {
    loadTaskTitle(task);

    if ("Unread_by_organizer" === task.task_status.task_progress) {
      loadNewTask(task);
    }
    else {
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
    }
    chat.loadTaskChats(task);
    util.focus();
  }

  /* Load task page */
  mod.load = function(optTid) {
    taskTypeSelector.hideAll();
    if (!optTid) {
      loadNewTask(null);
      chat.clearTaskChats();
    } else {
      api.getTask(optTid)
        .done(loadTask);
    }

    mod.onTaskParticipantsChanged.observe("chat-tabs", chat.loadTaskChats);
  }

  mod.init = function() {
    $("#new-task-btn-mobile").click(function () {
      window.location.hash = "!task";
    });
    $("#new-task-btn").click(function () {
      window.location.hash = "!task";
    });
    $("#new-gen-task-btn").click(function () {
      $("#workflow-gen").prop("checked", true);
      window.location.hash = "!task";
    });
    $("#new-sched-task-btn").click(function () {
      $("#workflow-sched").prop("checked", true);
      window.location.hash = "!task";
    });
  }

  return mod;
}());
