function log(x) {
  console.log(
    (typeof x === "String") ? x
      : JSON.stringify(x, undefined, 2)
  );
}

function reportStatus(msg, kind, details) {
  $("#status")
    .text(msg)
    .addClass("alert alert-" + kind)
    .removeClass("hide");
  log({
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
  for (var i in tasks) {
    viewOfTask(tab, tasks[i].task).appendTo(view);
  }
  viewOfNewTaskButton(tab, view).appendTo(view);
  return view;
}

// display task
function viewOfTask(tab, task) {
  var view = $("<div class='task'></div>");
  var buttons = $("<div class='buttons rightbox'></div>");

  var archiveButton = $("<button class='btn'></button>");
  switch (tab) {
  case "queue":
    archiveButton.text("Archive")
      .click(function() {
        apiQueueRemove(
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
  question.appendTo(view);

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

  function remove() {
    view.remove();

    for (var i in task.task_requests) {
      var q = task.task_requests[i];
      if (q.rid) {
        apiDeleteRequest(q.rid);
      }
    }
  }
  function stopEdit() {
    viewOfTask(tab, task)
      .replaceAll(view);
  }
  function save() {
    updateTaskRequests(task, reqEdits);
    stopEdit();
  }

  var buttons = $("<div class='buttons rightbox'/>")
    .appendTo(view);

  function updateTaskButtons(hasRequests) {
    if (! task.tid && ! hasRequests) {
      remove();
    }
    else {
      buttons.children().remove();
      if (hasRequests) {
        $("<button class='btn'>Save</button>")
          .click(save)
          .appendTo(buttons);
      }
      $("<button class='btn'>Cancel</button>")
        .click(task.tid ? stopEdit : remove)
        .appendTo(buttons);
    }
  }

  var summary = task.task_status
              ? task.task_status.task_summary
              : null;
  if (summary) {
    viewOfTaskSummary(summary)
      .appendTo(view);
  }

  var taskEdit = {update:updateTaskButtons, remove:remove, reqEdits:reqEdits};
  appendEditViewsOfTaskRequests(view, task, requests, taskEdit);

  return view;
}

function updateTaskRequests(task, reqEdits) {
  var qs = {};
  for (var i = task.task_requests.length; --i >=0;) {
    var q = task.task_requests[i];
    if (q.rid) {
      if (reqEdits[q.rid]) {
        qs[q.rid] = q;
      } else {
        task.task_requests.splice(i, 1);
        apiDeleteRequest(q.rid);
      }
    }
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
  if (0 < updated_requests.length) {
    if (task.tid) {
      apiPostTask(task, updated_requests);
    } else {
      apiCreateTask(task, updated_requests);
    }
  }
}

function appendEditViewsOfTaskRequests(taskView, task, requests, taskEdit) {
  var view = $("<div/>");

  var deleteTaskButton = $("<button class='btn'>Delete Task</button>")
    .click(taskEdit.remove);

  function updateTaskRequestButtons() {
    var hasRequests = view.children(0);

    taskEdit.update(hasRequests);

    if (hasRequests) {
      if (taskView === deleteTaskButton.parent()) {
        deleteTaskButton.remove();
      }
    } else {
      if (taskView !== deleteTaskButton.parent()) {
        taskView.insertBefore(deleteTaskButton);
      }
    }
  }

  function makeRequestView(qid, edit) {
    var deleteRequestButton = $("<button class='btn'>Delete request</button>");

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

  var kindLabels = ["message", "single choice", "multiple choices"];
  var kindValues = ["message", "single", "multiple"];
  for (var i in kindValues) {
    var option = $("<option/>")
      .attr("value", kindValues[i])
      .text(kindLabels[i]);
    option.appendTo(select);
  }
  select.val(kindValues[1]);

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
  var editStart, editStop;

  var inputViews = [];
  var labelViews = [];

  function viewOfSelLabel(forID, value) {
    return $("<label/>")
      .attr("for", forID)
      .text(value)
      .click(function() {
        editStart(view);
        return false;
      });
  }

  var qname = "sel-" + qid;
  function addChoice(choiceValue) {
    var index = inputViews.length;
    var choiceID = qname + "-" + index;

    var inp = $("<input/>")
      .attr("id", choiceID)
      .attr("name", qname)
      .attr("type", qsel.sel_multi ? "checkbox" : "radio")
      .prop("checked", chosen(choiceValue, qsel.sel_default));

    inputViews.push(inp);
    labelViews.push(viewOfSelLabel(choiceID, choiceValue));

    return index;
  }

  for (var i in qsel.sel_choices) {
    addChoice(qsel.sel_choices[i].sel_label);
  }

  function viewOfChoice(index) {
    var view = $("<span class='choice'/>");
    inputViews[index].appendTo(view);
    labelViews[index].appendTo(view);
    return view;
  }

  var addChoiceButton = $("<button class='btn'>New Choice</button>");
  function editNewChoice() {
    var index = addChoice("");
    viewOfChoice(index)
      .insertBefore(addChoiceButton);
    editStart(labelViews[index]);
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

    var choices = $("<div class='choices'/>");
    for (var i in inputViews) {
      viewOfChoice(i)
        .appendTo(choices);
    }
    addChoiceButton.appendTo(choices);
    choices.appendTo(view);

    return view;
  }

  this.focus = function() {
    if (0 >= inputViews.length) {
      editNewChoice();
    } else {
      quizView.focus();
    }
  }

  this.updateRequest = function() {
    editStop();

    var changed = qsel.sel_text !== quizView.value;
    qsel.sel_text = quizView.val();

    var old_choices = qsel.sel_choices;
    changed |= old_choices.length !== labelViews.length;
    qsel.sel_choices = [];
    for (var i in labelViews) {
      var value = labelViews[i].text();
      if (! changed) {
        changed = old_choices[i].sel_label !== value;
      }
      qsel.sel_choices.push({sel_label:value});
    }

    var old_default = qsel.sel_default;
    qsel.sel_default = [];
    for (var i in inputViews) {
      if (inputViews[i].prop("checked")) {
        var value = labelViews[i].text();
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

  function editViewOfSelLabel(label) {
    var view = $("<input/>")
      .attr("type", "text")
      .attr("value", label.textContent)
      .attr("placeholder", "Enter a choice")
      .blur(function () {
        editStop();
        return true;
      })
      .keypress(function(e) {
        var c = e.charCode || e.keyCode;
        if (13 === c) {
          editStop();
          return false;
        }
        return true;
      });
    return view;
  }

  var editInput, editLabel;
  editStop = function() {
    if (editInput) {
      var edit  = editInput;
      var label = editLabel;
      editInput = null;
      editLabel = null;

      if ("" === edit.val()) {
        // Remove the choice.
        var choiceView = edit.parent();
        choiceView.remove();
        var pos = labelViews.indexOf(label);
        labelViews.splice(pos, 1);
        inputViews.splice(pos, 1);
      } else {
        label
          .text(edit.val())
          .replaceAll(edit);
      }
    }
  }
  editStart = function(label) {
    var edit = editViewOfSelLabel(label)
      .replaceAll(label)
      .focus();

    editInput = edit;
    editLabel = label;
  }
}

// new task and request
function viewOfNewTaskButton(tab, queueView) {
  var buttons = $("<div class='buttons rightbox'/>");

  var requestSelect = selectOfRequestKind();
  var newTaskButton = $("<button class='btn'>New Task</button>")
    .click(function() {
      var reqEdits = {};
      viewOfNewTask(tab, requestSelect.val(), reqEdits)
        .insertBefore(buttons);
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

// HTTP
function jsonHttp(method, url, body, onError, onSuccess) {
  function error(jqXHR, status, error) {
    switch (status) {
    case 401: // Unauthorized - redirect to login screen
      navigate("/app/login");
      break;
    default:
      var details = {
        code: status.toString(),
        method: method,
        url: url,
        reqBody: body,
        respBody: jqXHR.responseText
      };
      reportError("Please try again later.", details);
      onError();
    }
  }

  $.ajax({
    url: url,
    type: method,
    data: body,
    dataType: "json",
    success: onSuccess,
    beforeSend: login.setHttpHeaders,
    error: error
  });
}

function jsonHttpGET(url, cont) {
  jsonHttp("GET", url, null, function(){}, cont);
}

function jsonHttpPOST(url, body, cont) {
  jsonHttp("POST", url, body, start, cont);
}

function jsonHttpDELETE(url) {
  jsonHttp("DELETE", url, null, start, function(http){});
}

// API
function api_q_prefix() {
  return "/api/q/" + login.data.uid;
}

function apiLoadTaskQueue() {
  jsonHttpGET(api_q_prefix() + "/queue", function(data) {
    placeView($("#queue"),
              viewOfTaskQueue("queue", data.queue_elements));
  });
}

function apiLoadTaskArchive() {
  jsonHttpGET(api_q_prefix() + "/archive", function(data) {
    placeView($("#archive"),
              viewOfTaskQueue("archive", data.archive_elements));
  });
}

function apiDeleteRequest(qid) {
  jsonHttpDELETE(api_q_prefix() + "/request/" + qid);
}

function apiCreateTask(task, updated_requests) {
  var updated_task = {task_status      : task.task_status,
                      task_participants: task.task_participants,
                      task_requests    : updated_requests};
  jsonHttpPOST(api_q_prefix() + "/task/create/" + login.data.team.teamid,
           JSON.stringify(updated_task),
           function(data) {
    task.tid               = data.tid;
    task.task_teamid       = data.task_teamid;
    task.task_created      = data.task_created;
    task.task_lastmod      = data.task_lastmod;
    task.task_status       = data.task_status;
    task.task_participants = data.task_participants;
    task.task_requests     = data.task_requests;
  });
}

function apiPostTask(task, updated_requests) {
  var updated_task = {task_status      : task.task_status,
                      task_participants: task.task_participants,
                      task_requests    : updated_requests};
  jsonHttpPOST(api_q_prefix() + "/task/" + task.tid,
           JSON.stringify(updated_task),
           function(json) {
             task.tid = json.tid;
             for (var i in json.rids) {
               updated_requests[i].rid = json.rids[i];
             }
           });
}

function apiQueueRemove(task, cont) {
  jsonHttpPOST(api_q_prefix() + "/queue/" + task.tid + "/remove",
           "",
           function(http) { cont(); }
          );
}

function showTaskQueue() {
  $("#archivetab").removeClass("active");
  $("#queuetab").addClass("active");
  $("#archive").addClass("hide");
  $("#queue").removeClass("hide");
}

function apiLogin(email, password, onSuccess) {
  // TODO call the login api
  login.pretendLogin();
  onSuccess();
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
        apiLogin(email, password, onSuccess);
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
  apiLoadTaskQueue();
  apiLoadTaskArchive();
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
    historyPushState("Esper login", path);
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
  login.pretendLogin();
  setupNavigation();
  navigate(window.location.pathname, true);
}

$(document).ready(start);
