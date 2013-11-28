/* Scheduling - step 2 */

var sched2 = (function() {
  var mod = {};

  function formalEmailBody(fromName, toName, when) {
    return
    "Dear "+toName+",\n\n"+

    "I'm writing on behalf of "+fromName+" who respectfully requests "+
    "a meeting with you. "+
    toName+"'s schedule has the below open times "+when+". "+
    "If any of these times are agreeable, please respond to this e-mail "+
    "with your choice.";
  }

  function viewOfOption(profs, calOption) {
    var view = $("<div/>")
      .attr("id", calOption.label);
    sched.viewOfSuggestion(calOption.slot)
      .appendTo(view);
    return view;
  }

  function viewOfOptions(profs, task, onSelect) {
    var view = $("<div/>");
    var state = sched.getState(task);

    var options = state.calendar_options;

    function showOne(id) {
      $("#" + id)
        .addClass("sched-highlight");
    }

    function hideOne(id) {
      $("#" + id)
        .removeClass("sched-highlight");
    }

    var idList = list.map(options, function(x) { return x.label; });
    var selector = show.create(idList, showOne, hideOne);

    list.iter(options, function(x) {
      viewOfOption(profs, x)
        .click(function() {
          selector.show(x.label);
          onSelect(x);
        })
        .appendTo(view);
    });

    return view;
  }

  function updateTask(profs, task, calOption) {
    var state = sched.getState(task);
    task.task_progress = "Confirmed";
    state.scheduling_stage = "Confirm";
    state.reserved = {
      slot: calOption.slot,
      notifs: []
    };
    api.postTask(task)
      .done(function () { sched.loadStep3(profs, task); });
  }

  mod.load = function(profs, task, view) {
    $("<h1>Select a final time.</h1>")
      .appendTo(view);

    var next = $("<button disabled class='btn btn-default'>Next</button>");
    var selected;

    function onSelect(x) {
      selected = x;
      next.attr("disabled", false);
    }

    viewOfOptions(profs, task, onSelect)
      .appendTo(view);

    next
      .appendTo(view)
      .click(function() {
        updateTask(profs, task, selected);
      });
  };

  return mod;
}());
