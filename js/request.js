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

function viewOfSelectorResponse(selResp, respondent, confirmed) {
  var view = $("<div class='response'/>");

  var byUid = respondent.resp_by;
  var forUid = respondent.resp_for;

  profile.get(byUid).done(function(obs_prof_by) {
    profile.get(forUid).done(function(obs_prof_for) {
      if (obs_prof_by && obs_prof_for) {

        var authorView = $("<span/>")
          .append(profile.view.respondent(obs_prof_by, obs_prof_for, confirmed))
          .appendTo(view);

        function onChange(ev, attr, how, newVal, oldVal) {
          authorView
            .children()
            .replaceWith(profile.view.respondent(obs_prof_by,
                                                 obs_prof_for,
                                                 confirmed));
        }

        /* update the view automatically when either profile changes */
        obs_prof_by.bind("change", onChange);
        obs_prof_for.bind("change", onChange);

        for (var i in selResp.sel_selected) {
          $("<span class='answer'/>")
            .text(selResp.sel_selected[i])
            .appendTo(view);
        }
      }
    });
  });

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
  var responses = q.req_responses;
  if (responses.length === 0) {
    $("<span class='unanswered'/>")
      .text("no answer")
      .appendTo(view);
  }
  else {
    for (var i in responses) {
      var resp = responses[i];
      if (resp.response) {
        viewOfSelectorResponse(resp.response.selector_r,
                               resp.respondent,
                               resp.response_confirmed)
          .appendTo(view);
      }
    }
  }

  return view;
}

function selectOfRequestKind() {
  var select = $("<select size=1/>");

  var kindLabels = [
    "Multiple Choices (multiple answers)",
    "Multiple Choices (only one answer)",
    "Message (no answer needed)"
  ];
  var kindValues = ["multiple", "single", "message"];
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
      .keydown(function(e) {
        var c = e.which;
        // Enter or Tab
        if (13 === c || 9 === c) {
          if (e.shiftKey)
            moveToPrevLabel(view);
          else
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
  var addChoiceButton =
    $("<button class='btn btn-default'>New Choice</button>");

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

function makeRequest(qid, kind, question) {
  return {rid:qid, req_kind:kind, req_question:question,
          req_status:{req_open:true, req_participants:[]},
          req_responses:[], req_comments:[]};
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
