function reportStatus(msg, kind, details) {
  $("#status")
    .text(msg)
    .addClass("alert alert-" + kind)
    .removeClass("hide");
  util.log({
    status: msg,
    kind: kind,
    details: details
  });
}

// error status
function reportError(msg, details) {
  reportStatus(msg, "error", details);
}

function reportSuccess(msg) {
  reportStatus(msg, "success", {});
}

function clearStatus() {
  $("#error").addClass("hide");
}

// task queue view
function viewOfTaskQueue(tab, tasks) {
  var view = $("<div/>");
  var tasksView = $("<div/>");

  viewOfNewTaskButton(tab, tasksView)
    .appendTo(view);

  for (var i in tasks) {
    viewOfTask(tab, tasks[i].task).appendTo(tasksView);
  }
  tasksView.appendTo(view);

  return view;
}

// display task
function viewOfTask(tab, task) {
  var view = $("<div class='task'></div>");
  var buttons = $("<div class='buttons rightbox'></div>");

  var archiveButton = $("<button class='btn btn-primary'>Archive</button>");
  switch (tab) {
  case "queue":
    archiveButton
      .click(function() {
        api.queueRemove(
          task,
          function() { view.remove(); });
      });
    archiveButton.appendTo(buttons);
    break;
  case "archive":
    /* nothing */
  }

  var editButton = $("<button class='btn'>Edit</button>")
    .click(function() {
      editViewOfTask(tab, task, task.task_requests, {})
        .replaceAll(view);
    });
  editButton.appendTo(buttons);
  buttons.appendTo(view);

  var summary = task.task_status
              ? task.task_status.task_summary
              : null;
  if (summary) {
    viewOfTaskSummary(summary)
      .appendTo(view);
  }

  viewOfTaskRequests(task.task_requests)
    .appendTo(view);

  return view;
}

function viewOfTaskSummary(summary) {
  return $("<h4 class='tasksummary'/>")
    .text(summary);
}

function viewOfTaskRequests(requests) {
  var view = $("<div/>");
  for (var i in requests) {
    var q = requests[i];
    function appendRequest(node) {
      node
        .addClass("request")
        .appendTo(view);
    }
    if (q.req_kind.toLowerCase() === "message") {
      appendRequest(viewOfMessageRequest (q.req_question.message_q));
    } else {
      appendRequest(viewOfSelectorRequest(q));
    }
    if (0 < q.req_comments.length) {
      viewOfComments(q.req_comments).appendTo(view);
    }
  }
  return view;
}

function viewOfMessageRequest(q) {
  var view = $("<div/>");
  if ("" === q.msg_text) {
    view
      .addClass("requesttitle unasked")
      .text("no message");
  } else {
    view.text(q.msg_text);
  }
  return view;
}

function viewOfChoicesRequest(qsel) {
  var view = $("<div class='choices-readonly'/>");
  var choices = qsel.sel_choices;
  var radioGroupName = util.randomString();

  for (var i in choices) {
    var choice = choices[i];
    var label = choice.sel_label;

    var choiceView = $("<span class='choice'/>");

    var labelView = $("<label/>")
      .addClass(qsel.sel_multi ? "checkbox" : "radio")
      .text(label)
      .appendTo(choiceView);

    var inp = $("<input readonly/>")
      .attr("type", qsel.sel_multi ? "checkbox" : "radio")
      .attr("name", radioGroupName)
      .prop("disabled", true)
      .appendTo(labelView);

    if (chosen(label, qsel.sel_default))
      inp.prop("checked", true);

    choiceView.appendTo(view);
  }

  return view;
}

function viewOfSelectorRequest(q) {
  var view = $("<div/>");

  var question = $("<h5/>")
    .text(q.req_question.selector_q.sel_text);

  if ("" === question.text()) {
    question
      .addClass("unasked")
      .text("no question");
  }
  else
    question.addClass("requesttitle");

  var choices = viewOfChoicesRequest(q.req_question.selector_q);

  question.appendTo(view);
  choices.appendTo(view);

  var a = 0 < q.req_responses.length
        ? q.req_responses[0].response.selector_r : null;
  if (a) {
    for (var i in a.sel_selected) {
      $("<span class='answer'/>")
        .text(a.sel_selected[i])
        .appendTo(view);
    }
  } else {
    $("<span class='unanswered'/>")
      .text("no answer")
      .appendTo(view);
  }

  return view;
}

function viewOfComments(comments) {
  var view = $("<div class='comments'/>");

  var title = $("<h6/>")
    .text("Comments")
    .appendTo(view);

  for (var i in comments) {
    var a = comments[i];
    if ("string" === typeof a.comment_audio) {
      viewOfAudioComment(a.comment_audio)
        .appendTo(view);
    }
    if ("string" === typeof a.comment_text) {
      viewOfTextComment(a.comment_text)
        .appendTo(view);
    }
  }
  return view;
}

function viewOfTextComment(comment) {
  return $("<div class='comment'/>")
    .text(comment);
}

/*
  TODO: for wider browser support we should offer both an mp3 and an ogg
  version of each audio recording.
  Sample sounds for testing:
  http://www.w3schools.com/html/horse.mp3
  http://www.w3schools.com/html/horse.ogg
*/
function viewOfAudioComment(audioLink) {
  var view = $("<div class='comment'/>");

  var player = $("<audio/>")
    .prop("controls", true)
    .text("Your browser doesn't support the audio element.")
    .appendTo(view);

  var source = $("<source/>")
    .attr("src", audioLink)
  //.attr("type", "audio/ogg")
    .appendTo(player);

  return view;
}

// edit task
function editViewOfTask(tab, task, requests, reqEdits) {
  var view = $("<div class='task'/>");

  var summary = task.task_status
              ? task.task_status.task_summary
              : null;
  var summaryView = editViewOfTaskSummary(summary);
  if (task.task_status && task.task_status.task_summary) {
    summaryView.text(task.task_status.task_summary);
  }
  summaryView.appendTo(view);

  function remove() {
    view.remove();

    if (task.tid) {
      api.deleteTask(task.tid);
    }
  }
  function stopEdit() {
    viewOfTask(tab, task)
      .replaceAll(view);
  }
  function save() {
    var hasRequests = false;
    for (var qid in reqEdits) {
      hasRequests = true;
      break;
    }
    if (hasRequests) {
      updateTaskRequests(task, summaryView.val(), reqEdits);
      stopEdit();
    } else {
      remove();
    }
  }

  var buttons = $("<div class='buttons'/>");

  function updateTaskButtons(hasRequests) {
    if (! task.tid && ! hasRequests) {
      remove();
    }
    else {
      buttons.children().remove();
      if (hasRequests) {
        $("<button class='btn btn-primary'>Save</button>")
          .click(save)
          .appendTo(buttons);
      }
      $("<button class='btn'>Cancel</button>")
        .click(task.tid ? stopEdit : remove)
        .appendTo(buttons);
    }
  }

  var taskEdit = {update:updateTaskButtons, remove:remove, reqEdits:reqEdits};

  appendEditViewsOfTaskRequests(view, task, requests, taskEdit);
  buttons.appendTo(view);

  return view;
}

function updateTaskRequests(task, summaryEdit, reqEdits) {
  var qs = {};
  for (var i = task.task_requests.length; --i >=0;) {
    var q = task.task_requests[i];
    if (q.rid) {
      if (reqEdits[q.rid]) {
        qs[q.rid] = q;
      } else {
        task.task_requests.splice(i, 1);
        api.deleteRequest(q.rid);
      }
    }
  }

  var summaryChanged = false;
  if (task.task_status) {
    summaryChanged = task.task_status.task_summary !== summaryEdit;
    task.task_status.task_summary = summaryEdit;
  } else if (summaryEdit && "" !== summaryEdit) {
    summaryChanged = true;
    task.task_status = {task_open:true, task_summary:summaryEdit};
  }

  var updated_requests = [];
  for (var qid in reqEdits) {
    var edit = reqEdits[qid];
    var changed = edit.updateRequest();
    var q = qs[qid];
    if (! q) {
      q = edit.makeRequest();
      task.task_requests.push(q);
      updated_requests.push(q);
    } else if (changed) {
      updated_requests.push(q);
    }
  }
  if (summaryChanged || 0 < updated_requests.length) {
    if (task.tid) {
      api.postTask(task, updated_requests);
    } else {
      api.createTask(task, updated_requests);
    }
  }
}

function editViewOfTaskSummary(summary) {
  var view = $("<textarea class='quiz'/>").attr("placeholder", "Subject");
  if (summary) {
    view.text(summary);
  }
  return view;
}

function appendEditViewsOfTaskRequests(taskView, task, requests, taskEdit) {
  var view = $("<div/>");

  var deleteTaskButton = $("<button class='btn'>Delete Task</button>")
    .click(taskEdit.remove);

  function updateTaskRequestButtons() {
    var hasRequests = 0 < view.children(0).length;

    taskEdit.update(hasRequests);

    if (hasRequests) {
      if (taskView === deleteTaskButton.parent()) {
        deleteTaskButton.remove();
      }
    } else {
      if (taskView !== deleteTaskButton.parent()) {
        deleteTaskButton.appendTo(taskView);
      }
    }
  }

  function makeRequestView(qid, edit) {
    var deleteRequestButton =
      $("<button class='btn btn-danger'>Delete request</button>");

    taskEdit.reqEdits[qid] = edit;
    var requestView = edit.viewOfRequest(deleteRequestButton)
      .appendTo(view);

    deleteRequestButton
      .click(function() {
        delete taskEdit.reqEdits[qid];
        requestView.remove();
        updateTaskRequestButtons();
      });
  }

  for (var i in requests) {
    var q = requests[i];
    var edit = q.req_kind.toLowerCase() === "message"
             ? new EditMessageRequest(q.rid, q.req_question.message_q)
             : new EditChoicesRequest(q.rid, q.req_question.selector_q);
    makeRequestView(q.rid ? q.rid : idForNewRequest(), edit);
  }

  view.appendTo(taskView);
  updateTaskRequestButtons();

  var requestSelect = selectOfRequestKind();
  var addRequestButton =
    $("<button class='btn'>Create follow-up request</button>")
    .click(function() {
      var kind = requestSelect.val();
      var edit = "message" === kind
      ? new EditMessageRequest(null, {msg_text:""})
      : new EditChoicesRequest(null, newSelector("multiple" === kind));
      makeRequestView(idForNewRequest(), edit);
      updateTaskRequestButtons();
      edit.focus();
    });

  var bbox = $("<p class='buttons rightbox'/>");
  requestSelect.appendTo(bbox);
  addRequestButton.appendTo(bbox);
  bbox.appendTo(taskView);
}

function selectOfRequestKind() {
  var select = $("<select size=1/>");

  var kindLabels = [
    "Multiple Choices (only one answer)",
    "Multiple Choices (multiple answers)",
    "Message (no answer needed)"
  ];
  var kindValues = ["single", "multiple", "message"];
  for (var i in kindValues) {
    var option = $("<option/>")
      .attr("value", kindValues[i])
      .text(kindLabels[i]);
    option.appendTo(select);
  }
  select.val(kindValues[0]);

  return select;
}

function EditMessageRequest(qid, qmessage) {
  var quizView = $("<textarea class='quiz'/>")
    .attr("placeholder", "Enter your question or request")
    .text(qmessage.msg_text);

  this.viewOfRequest = function(deleteRequestButton) {
    var view = $("<div class='request buttons'/>");
    quizView.appendTo(view);
    deleteRequestButton.appendTo(view);
    return view;
  }

  this.focus = function() {
    quizView.focus();
  }

  this.updateRequest = function() {
    var changed = qmessage.msg_text !== quizView.val();
    qmessage.msg_text = quizView.val();
    return changed;
  }

  this.makeRequest = function() {
    return makeRequest(qid, "Message", {message_q:qmessage});
  }
}

function EditChoicesRequest(qid, qsel) {
  var labelViews = [];
  var radioGroupName = util.randomString();

  function removeLabel(labelView) {
    moveToPrevLabel(labelView);
    labelView.remove();
    var index = labelViews.indexOf(labelView);
    if (index > -1)
      labelViews.splice(index, 1);
  }

  function removeLabelIfEmpty(labelView) {
    if (inputOfSelLabel(labelView).val() == "") {
      removeLabel(labelView);
      return true;
    }
    else
      return false;
  }

  function moveToNextLabel(origLabelView) {
    var labelView = origLabelView.next();
    if (labelView.length === 0)
      labelView = editNewChoice();
    inputOfSelLabel(labelView).focus();
  }

  function moveToPrevLabel(origLabelView) {
    var labelView = origLabelView.prev();
    if (labelView.length === 0)
      labelView = editNewChoice();
    inputOfSelLabel(labelView).focus();
  }

  function viewOfSelLabel(value) {
    var view = $("<label class='choice'/>")
      .addClass(qsel.sel_multi ? "checkbox" : "radio");

    var textView = $("<input type='text' class='sel-text'/>")
      .attr("value", value)
      .attr("placeholder", "Enter a choice")
      .keypress(function(e) {
        var c = e.charCode || e.keyCode;
        // Enter or Tab
        if (13 === c || 9 === c) {
          if (! removeLabelIfEmpty(view))
            moveToNextLabel(view);
          return false;
        }
        // Backspace
        else if (8 === c) {
          if (removeLabelIfEmpty(view))
            return false;
          else
            return true;
        }
        else
          return true;
      })
      .appendTo(view);

    return view;
  }

  function boxOfSelLabel(label) {
    return $(label).find(".sel-box");
  }

  function inputOfSelLabel(label) {
    return $(label).find(".sel-text");
  }

  function addChoice(choiceValue) {
    var labelView = viewOfSelLabel(choiceValue);
    var inp = $("<input class='sel-box'/>")
      .attr("type", qsel.sel_multi ? "checkbox" : "radio")
      .attr("name", radioGroupName)
      .prop("checked", chosen(choiceValue, qsel.sel_default))
      .appendTo(labelView);

    labelViews.push(labelView);

    return (labelViews.length - 1);
  }

  for (var i in qsel.sel_choices) {
    addChoice(qsel.sel_choices[i].sel_label);
  }

  function viewOfChoice(index) {
    return labelViews[index];
  }

  var choicesView = $("<div class='choices'/>");
  var addChoiceButton = $("<button class='btn'>New Choice</button>");

  function editNewChoice() {
    var index = addChoice("");
    return viewOfChoice(index)
      .appendTo(choicesView);
  }
  addChoiceButton.click(editNewChoice);

  var quizView = $("<textarea class='quiz'/>")
    .attr("placeholder", "Enter your question or request")
    .text(qsel.sel_text);

  this.viewOfRequest = function(deleteRequestButton) {
    var view = $("<div class='request'/>");

    var qbox = $("<div class='buttons'/>");
    quizView.appendTo(qbox);
    deleteRequestButton.appendTo(qbox);
    qbox.appendTo(view);

    for (var i in labelViews) {
      viewOfChoice(i)
        .appendTo(choicesView);
    }

    choicesView.appendTo(view);
    addChoiceButton.appendTo(view);

    return view;
  }

  this.focus = function() {
    if (0 >= labelViews.length) {
      editNewChoice();
    } else {
      quizView.focus();
    }
  }

  this.updateRequest = function() {
    var changed = qsel.sel_text !== quizView.value;
    qsel.sel_text = quizView.val();

    var old_choices = qsel.sel_choices;
    changed |= old_choices.length !== labelViews.length;
    qsel.sel_choices = [];
    for (var i in labelViews) {
      var value = inputOfSelLabel(labelViews[i]).val();
      if (! changed) {
        changed = old_choices[i].sel_label !== value;
      }
      qsel.sel_choices.push({sel_label:value});
    }

    var old_default = qsel.sel_default;
    qsel.sel_default = [];
    for (var i in labelViews) {
      var box = boxOfSelLabel(labelViews[i]);
      var inp = inputOfSelLabel(labelViews[i]);
      if (box.prop("checked")) {
        var value = inp.val();
        changed |= old_default.length <= qsel.sel_default.length
                || old_default[qsel.sel_default.length] !== value;
        qsel.sel_default.push(value);
      }
    }
    changed |= old_default.length !== qsel.sel_default.length;

    return changed;
  }

  this.makeRequest = function() {
    return makeRequest(qid, "Selector", {selector_q:qsel});
  }
}

// new task and request
function viewOfNewTaskButton(tab, tasksView) {
  var buttons = $("<div class='buttons'/>");

  var requestSelect = selectOfRequestKind();
  var newTaskButton = $("<button class='btn'>New Task</button>")
    .click(function() {
      var reqEdits = {};
      tasksView
        .prepend(viewOfNewTask(tab, requestSelect.val(), reqEdits));
      for (var qid in reqEdits) { // actually only one request in the new task
        reqEdits[qid].focus();
        break;
      }
    });

  requestSelect.appendTo(buttons);
  newTaskButton.appendTo(buttons);
  return buttons;
}

function viewOfNewTask(tab, kind, reqEdits) {
  var q = "message" === kind
        ? makeRequest(null, "Message", {message_q:{msg_text:""}})
        : makeRequest(null, "Selector",{selector_q:newSelector("multiple" === kind)});
  var task = {task_requests:[],
              task_status:{task_open:true, task_summary:null},
              task_participants:{organized_by : login.data.team.team_organizers,
                                 organized_for: login.data.team.team_leaders}};
  return editViewOfTask(tab, task, [q], reqEdits);
}

function makeRequest(qid, kind, question) {
  return {rid:qid, req_kind:kind, req_question:question,
          req_status:{req_open:true, req_participants:[]},
          req_responses:[], req_comments:[]};
}

function newSelector(sel_multi) {
  return {sel_text:"", sel_choices:[], sel_default:[], sel_multi:sel_multi};
}

var iNewRequest = 0;
function idForNewRequest() {
  ++iNewRequest;
  return "q" + iNewRequest;
}

// utilities
function chosen(v, vs) {
  v = v.toLowerCase();
  for (var i in vs) {
    if (v === vs[i].toLowerCase()) {
      return true;
    }
  }
  return false;
}

function placeView(parent, view) {
  parent.children().remove();
  view.appendTo(parent);
}

function showTaskQueue() {
  $("#archivetab").removeClass("active");
  $("#queuetab").addClass("active");
  $("#archive").addClass("hide");
  $("#queue").removeClass("hide");
}

function showTaskArchive() {
  $("#queuetab").removeClass("active");
  $("#archivetab").addClass("active");
  $("#queue").addClass("hide");
  $("#archive").removeClass("hide");
}

// Login screen
function showLogin(redirPath) {
  $("#login-button")
    .click(function() {
      function onSuccess() { navigate(redirPath); }
      var email = $("#login-email").val();
      var password = $("#login-password").val();
      if (email !== "" && password !== "")
        login.login(email, password, onSuccess);
    });
  $("#login-page").removeClass("hide");
}

function clearPage() {
  $("#login-page").addClass("hide");
  $("#tabbed-tasks-page").addClass("hide");
}

/* Different types of pages */

function pageHome() {
  clearPage();
  api.loadTaskQueue();
  api.loadTaskArchive();
  showTaskQueue();
  $("#tabbed-tasks-page").removeClass("hide");
}

function pageTask(tid) {
  clearPage();
}

function pageLogin(redirState) {
  clearPage();
  showLogin(redirState);
}

/* URL-based dispatching */

function unsupportedPath(path) {
  alert("unsupported path: " + path);
}

/*
  A model path is given as an array where gaps are indicated by nulls.
  The subject path must have the same length as the model and must match
  the model except for the null positions, which are returned
  as an array of strings extracted from the subject path.

  matchPath(["", "x", null, "y", null], ["", "x", "123", "y", "abc"])
  -> ["123", "abc"]
*/
function matchPath(model, path) {
  var args = [];
  if (path.length !== model.length)
    return null;
  for (var i in model) {
    if (model[i] !== null) {
      if (model[i] !== path[i])
        return null;
    }
    else
      args.push(path[i]);
  }
  return args;
}

/*
  Change URL and load matching page.
  ignoreHistory needs to be true if we don't want to add the page to the
  browser's navigation history (typically because it is already there).
*/
function navigate(path, ignoreHistory) {
  util.log("navigate " + path);
  var p = path.split('/');
  var args = [];
  function historyPushState(title, path) {
    if (!ignoreHistory)
      window.history.pushState({}, title, path);
  }
  if (matchPath(["", "app"], p)) {
    historyPushState("Esper", path);
    pageHome();
  }
  else if (args = matchPath(["", "app", "login"], p)) {
    var redirPath = window.location.pathname;
    if (redirPath === path)
      redirPath = "/app";
    pageLogin(redirPath);
  }
  else if (args = matchPath(["", "app", "task", null], p)) {
    var tid = args[0];
    historyPushState("Esper task " + tid, path);
    pageTask(tid);
  }
  else {
    // Invalid path, redirect to home page
    historyPushState("Esper", "/app");
    pageHome();
  }
}

// Load the proper view when user hits Back or Forward.
function setupNavigation() {
/*
  window.onpopstate = function(event) {
    navigate(window.location.pathname, true);
  };
*/
}

function start() {
  setupNavigation();
  login.initLoginInfo();
  if (!login.data)
    navigate("/app/login");
  else {
    util.log("login.data " + login.data);
    navigate(window.location.pathname, true);
  }
}

$(document).ready(start);
