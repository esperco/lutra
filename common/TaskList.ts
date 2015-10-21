module Esper.TaskList {

  function renderThreads(threads: ApiT.EmailThread[],
                         closeTaskListLayer: () => void,
                         parent: JQuery) {
    List.iter(threads, function(thread) {
      var threadLink = $("<div class='esper-link esper-tl-thread'/>")
        .text(thread.subject)
        .attr("title", "Jump to this conversation");
      threadLink
        .click(function(e) {
          closeTaskListLayer();
          window.location.hash = "#all/" + thread.gmail_thrid;
          return false;
        })
        .appendTo(parent);
    });
  }

  export function renderEvent(team: ApiT.Team, e: ApiT.CalendarEvent) {
'''
<div #view class="esper-tl-event">
  <div #weekday class="esper-ev-weekday"/>
  <div #date title class="esper-ev-date">
    <div #month class="esper-ev-month"/>
    <div #day class="esper-ev-day"/>
  </div>
  <div>
    <div class="esper-ev-title"><span #title/></div>
    <div #time class="esper-ev-times">
      <span #startTime class="esper-ev-start"/>
      &rarr;
      <span #endTime class="esper-ev-end"/>
      <span #timezone class="esper-ev-tz"/>
    </div>
  </div>
</div>
'''
    var start = XDate.ofString(e.start.local);
    var end = XDate.ofString(e.end ? e.end.local : e.start.local);

    weekday.text(XDate.fullWeekDay(start));
    month.text(XDate.month(start).toUpperCase());
    day.text(XDate.day(start).toString());
    startTime.text(XDate.utcToLocalTimeOnly(start));
    endTime.text(XDate.utcToLocalTimeOnly(end));

    var calendar = List.find(team.team_calendars, function(cal) {
      return cal.google_cal_id === e.google_cal_id;
    });
    //timezone.text(CalPicker.zoneAbbr(calendar.calendar_timezone));

    if (e.title !== undefined) {
      title.text(e.title);
    } else {
      title.text("Untitled event");
    }

    if (e.google_cal_url !== undefined) {
      date
        .addClass("esper-clickable")
        .click(function() {
          open(e.google_cal_url, "_blank");
        })
        .tooltip({
          show: { delay: 500, effect: "none" },
          hide: { effect: "none" },
          "content": "Open in Google Calendar",
          "position": { my: 'center bottom', at: 'center top-1' },
          "tooltipClass": "esper-top esper-tooltip"
        });
      title
        .addClass("esper-link-black")
        .click(function() {
          open(e.google_cal_url, "_blank");
        });
    }

    return view;
  }

  function renderEvents(team: ApiT.Team,
                        events: ApiT.TaskEvent[],
                        parent: JQuery) {
    List.iter(events, function(event) {
      renderEvent(team, event.task_event)
        .appendTo(parent);
    });
  }

  function renderTaskNotes(notes: string,
                           notesQuill: string,
                           parent: JQuery) {
'''
<div #taskNotes />
'''  
    if (notesQuill !== "" && notesQuill !== undefined) {
      var editor = new quill(taskNotes.get(0));
      editor.setContents(JSON.parse(notesQuill));
      $("<p/>")
        .html(editor.getHTML())
        .appendTo(parent);
    }
    else if (notes !== "" && notes !== undefined) {
      $("<p/>")
        .html(notes)
        .appendTo(parent);
    }
  }

  function getProgressLabel(team: ApiT.Team,
                            task: ApiT.Task) {
    switch (task.task_progress) {
    case "New":
      return team.team_label_new;
    case "In_progress":
      return team.team_label_in_progress;
    case "Pending":
      return team.team_label_pending;
    case "Done":
      return team.team_label_done;
    case "Canceled":
      return team.team_label_canceled;
    default:
      Log.e("Unknown task progress: " + task.task_progress);
      return "?";
    }
  }

  function getKnownLabels(team: ApiT.Team) {
    return [
      team.team_label_urgent,
      team.team_label_new,
      team.team_label_in_progress,
      team.team_label_done,
      team.team_label_canceled
    ];
  }

  function getTeamLabels(team: ApiT.Team) {
    return List.union(team.team_labels, getKnownLabels(team));
  }

  /* Labels shared by the team excluding those with a known meaning */
  function getUnknownTeamLabels(team: ApiT.Team) {
    return List.diff(team.team_labels, getKnownLabels(team));
  }

  function sortLabels(l: string[]) {
    return List.sortStrings(l);
  }

  function renderTask(team: ApiT.Team,
                      task: ApiT.Task,
                      closeTaskListLayer: () => void) {
'''
<div #view class="esper-tl-task">
  <div>
    <span #title class="esper-tl-task-title"></span>
    <span #urgent class="esper-tl-urgent"></span>
    <select #progress class="esper-tl-progress"/>
    <span #archiveButton
          class="esper-clickable esper-link-danger"
          title="Archive this task">
      Archive
    </span>
  </div>
  <div #otherTeamLabels></div>
  <div #linkedThreadContainer class="esper-tl-threads"></div>
  <div #linkedEventContainer class="esper-tl-events"></div>
  <div #taskNotesContainer class="esper-tl-task-notes"></div>
</div>
'''

    title.text(task.task_title);
    archiveButton.click(function() {
      Api.archiveTask(task.taskid);
      view.remove();
    });

    urgent.text(team.team_label_urgent);
    if (!task.task_urgent) {
      urgent.remove();
    }

    var progressChoices = [
      { label: team.team_label_new, value: "New" },
      { label: team.team_label_in_progress, value: "In_progress" },
      { label: team.team_label_pending, value: "Pending" },
      { label: team.team_label_done, value: "Done" },
      { label: team.team_label_canceled, value: "Canceled" }
    ];
    List.iter(progressChoices, function(choice) {
      $("<option value='" + choice.value + "'>" + choice.label + "</option>")
        .appendTo(progress);
    });
    progress.val(task.task_progress);
    progress.change(function() {
      var progressValue = $(this).val();
      Api.setTaskProgress(task.taskid, progressValue);
      task.task_progress = progressValue;
    });

    var shared = List.inter(task.task_labels, getUnknownTeamLabels(team));
    List.iter(sortLabels(shared), function(label: string) {
      $("<span>")
        .addClass("esper-tl-shared")
        .text(label)
        .attr("title", "Shared label, visible by the executive")
        .appendTo(otherTeamLabels);
      otherTeamLabels.append(" ");
    });

    renderThreads(task.task_threads, closeTaskListLayer, linkedThreadContainer);
    renderEvents(team, task.task_events, linkedEventContainer);
    renderTaskNotes(task.task_notes, task.task_notes_quill, taskNotesContainer);

    return view;
  }

  function isVisible(elt: JQuery,
                     container: JQuery) {
    /* Compute offset down from the top of the viewport */
    var eltTop = elt.offset().top;
    var containerBottom = container.offset().top + container.outerHeight();
    return (eltTop < containerBottom);
  }

  export function displayList(team: ApiT.Team,
                              parentContainer: JQuery,
                              closeTaskListLayer: () => void,
                              filter: (task: ApiT.Task) => boolean,
                              spinnerEl?: JQuery,
                              noTasksMsgEl?: JQuery) {

'''
<div #listContainer class="esper-tl-list"></div>
'''
    parentContainer.append(listContainer);
    if (spinnerEl !== undefined) {
      spinnerEl.show();
    }
    if (noTasksMsgEl !== undefined) {
      noTasksMsgEl.hide();
    }

    var withEvents = true; // turning this off speeds things up
    var withThreads = true;
    var pageSize = 10;     // number of items to fetch at once
    var fetchAhead = 10;   // minimum number of hidden items

    function refillIfNeeded(triggerElt, url) {
      var done = false;
      return function() {
        if (!done) {
          if (isVisible(triggerElt, parentContainer)) {
            done = true;
            Api.getTaskPage(url).done(function(x) {
              appendPage(x, closeTaskListLayer);
            });
          }
        }
      }
    }

    function appendPage(x: ApiT.TaskList,
                        closeTaskListLayer: () => void) {
      /* Index of the element which, when visible, triggers the API call
         that fetches a new page. */
      var tasks = _.filter(x.tasks, filter);
      var scrollTrigger =
        Math.min(tasks.length - 1,
                 Math.max(0, tasks.length - fetchAhead));

      var nextUrl = x.next_page;
      if (tasks.length === 0 && nextUrl !== undefined) {
        /* This is a problematic case, in which the server returned
           an empty page but promises more results.
           We fetch the next page right away. */
        Api.getTaskPage(nextUrl).done(function(x) {
          appendPage(x, closeTaskListLayer);
        });
      } else {
        if (tasks.length === 0) {
          if (noTasksMsgEl !== undefined)
            noTasksMsgEl.show();
        } else {
          if (noTasksMsgEl !== undefined)
            noTasksMsgEl.hide();
        }
        List.iter(tasks, function(task, i) {
          var elt = renderTask(team, task, closeTaskListLayer);
          elt.appendTo(listContainer);
          $("<hr>").appendTo(listContainer);
          if (nextUrl !== undefined && i === scrollTrigger) {
            var lazyRefill = refillIfNeeded(elt, nextUrl);

            /* Next page may have to be displayed right way or will
               be triggered after some scrolling. */
            lazyRefill();
            parentContainer.off("scroll");
            parentContainer.scroll(lazyRefill);
          }
        });
        if (spinnerEl !== undefined)
          spinnerEl.hide();
      }
    }

    /* First page */
    Api.getTaskList(team.teamid, pageSize, withEvents, withThreads)
      .done(function(x) {
        appendPage(x, closeTaskListLayer);
      });
  }

  export function renderModal(currentTeam: ApiT.Team) {
'''
<div #view class="esper-modal-bg">
  <div #modal class="esper-tl-modal esper-modal-flexbox">
    <div class="esper-modal-header"><h2 style="margin: 0px;">Task List</h2></div>
    <span #closeButton class="esper-modal-close esper-clickable">×</span>
    <div class="esper-modal-filter esper-bs esper">
      Show
      <div #teamDropdown class="dropdown esper-dropdown">
        <button #teamSelectToggle class="btn btn-default dropdown-toggle" data-toggle="dropdown">
          Team
          <i class="fa fa-chevron-down"></i>
        </button>
        <ul #teamSelect class="dropdown-menu esper-dropdown-select">
          <li #allTeams>
            <label for="esper-modal-team-all">
              <input id="esper-modal-team-all" type="checkbox" value="" />
              (Select All)
            </label>
        </ul>
      </div>
      's tasks that are
      <div #progressDropdown class="dropdown esper-dropdown">
        <button #progressSelectToggle class="btn btn-default dropdown-toggle" data-toggle="dropdown">
          In Progress
          <i class="fa fa-chevron-down"></i>
        </button>
        <ul #progressSelect class="dropdown-menu esper-dropdown-select" >
          <li #allProgress>
            <label for="esper-modal-progress-all">
              <input id="esper-modal-progress-all" type="checkbox" value="" />
              (Select All)
            </label>
          </li>
          <li #new_>
            <label for="esper-modal-progress-new">
              <input id="esper-modal-progress-new" type="checkbox" value="New" />
            </label>
          </li>
          <li #inProgress>
            <label for="esper-modal-progress-in-progress">
              <input id="esper-modal-progress-in-progress" type="checkbox" value="In_progress" checked />
            </label>
          </li>
          <li #pending>
            <label for="esper-modal-progress-pending">
              <input id="esper-modal-progress-pending" type="checkbox" value="Pending" />
            </label>
          </li>
          <li #canceled>
            <label for="esper-modal-progress-canceled">
              <input id="esper-modal-progress-canceled" type="checkbox" value="Canceled" />
            </label>
          </li>
          <li #done>
            <label for="esper-modal-progress-done">
              <input id="esper-modal-progress-done" type="checkbox" value="Done" />
            </label>
          </li>
        </ul>
      </div>
      and
      <div #labelDropdown class="dropdown esper-dropdown">
        <button #labelSelectToggle class="btn btn-default dropdown-toggle" data-toggle="dropdown">
          Label
          <i class="fa fa-chevron-down"></i>
        </button>
        <ul #labelSelect class="dropdown-menu esper-dropdown-select">
          <li #allLabels>
            <label for="esper-modal-label-all">
              <input id="esper-modal-label-all" type="checkbox" value="all" checked />
              (Select All)
            </label>
          </li>
          <li #urgent>
            <label for="esper-modal-label-urgent">
              <input id="esper-modal-label-urgent" type="checkbox" value="urgent" checked />
            </label>
          </li>
        </ul>
      </div>
    </div>
    <div #tasksContainer class="esper-modal-content">
      <div #taskSpinner class="esper-events-list-loading">
        <div class="esper-spinner esper-list-spinner"/>
      </div>
      <span #noTasks>No tasks matched this search.</span>
    </div>
    <div class="esper-modal-footer esper-clearfix" style="text-align: left;">
      <div #recipientsContainer class="esper-modal-recipients">
        <label class="esper-agenda-title">
          Task List Format:
        </label>
        <label>
          <input #htmlFormat type="radio" name="format" checked />
          HTML
        </label>
        <label>
          <input #textFormat type="radio" name="format" />
          Plain text
        </label>
        <br />
        <table>
          <tr>
            <td valign="top" align="left" style="padding: 0; min-width: 80px;">
              <label class="esper-agenda-title">
                To:
              </label>
            </td>
            <td>
              <div #recipients />
              <textarea #recipientTextArea rows="2" cols="50" />
            </td>
          </tr>
        </table>
      </div>
      <div #errorMessages>
      </div>
      <button #sendButton class="esper-btn esper-btn-primary modal-primary">
        Send Now
      </button>
      <button #cancelButton class="esper-btn esper-btn-secondary modal-cancel">
        Cancel
      </button>
    </div>
  </div>
</div>
'''
    var teams = Login.myTeams();
    teamSelectToggle.dropdown();
    progressSelectToggle.dropdown();
    labelSelectToggle.dropdown();

    urgent.children("label").append(currentTeam.team_label_urgent);
    new_.children("label").append(currentTeam.team_label_new);
    inProgress.children("label").append(currentTeam.team_label_in_progress);
    pending.children("label").append(currentTeam.team_label_pending);
    canceled.children("label").append(currentTeam.team_label_canceled);
    done.children("label").append(currentTeam.team_label_done);

    function cancel() { view.remove(); }

    function closeDropdowns() {
      teamDropdown.removeClass("open");
      progressDropdown.removeClass("open");
      labelDropdown.removeClass("open");
    }

    function getCheckedBoxes(ul: JQuery): HTMLInputElement[] {
      return _.map(ul.find("label > input:checked"), function(el) {
          return el;
        });
    }

    function renderTasks() {
      tasksContainer.children(".esper-tl-list").remove();
      var teams = _.filter(Login.myTeams(), function(team) {
        // Filter all teams that the user is in, only returning
        // those who have the selected teamid in the checkboxes
        return _.some(getCheckedBoxes(teamSelect),
          function(box) {return team.teamid === box.value;} );
      });
      var progressBoxes = getCheckedBoxes(progressSelect);
      var labelBoxes = getCheckedBoxes(labelSelect);

      if (teams.length === 0) {
        teamSelectToggle.contents().first().replaceWith("Team");
      } else if (teams.length === 1) {
        teamSelectToggle.contents().first().replaceWith(teams[0].team_name);
      } else {
        teamSelectToggle.contents().first().replaceWith("Multiple teams");
      }

      if (progressBoxes.length === 0) {
        progressSelectToggle.contents().first().replaceWith("Status");
      } else if (progressBoxes.length === 1) {
        // This extracts the text from the text node that follows the label.
        // If the text node position changes, this will have to be updated accordingly.
        progressSelectToggle.contents().first().replaceWith(progressBoxes[0].parentElement.textContent.trim());
      } else {
        progressSelectToggle.contents().first().replaceWith("Multiple statuses");
      }

      if (labelBoxes.length === 0) {
        labelSelectToggle.contents().first().replaceWith("Label");
      } else if (labelBoxes.length === 1) {
        // This extracts the text from the text node that follows the label.
        // If the text node position changes, this will have to be updated accordingly.
        labelSelectToggle.contents().first().replaceWith(labelBoxes[0].parentElement.textContent.trim());
      } else {
        labelSelectToggle.contents().first().replaceWith("Multiple labels");
      }

      var progress = _.map(progressBoxes, function(box) {
        return box.value;
      });
      var labels = _.map(labelBoxes, function(box) {
        return box.value;
      });

      _.forEach(teams, function(team) {
        displayList(team,
          tasksContainer,
          cancel,
          function(task) {
            return _.some(progress, function(p) {
              // If the task matches at least one of the checked
              // process labels
              return task.task_progress === p;
            }) && _.some(labels, function(l) {
              if (l === "all")
                // User wants all tasks regardless of task labels
                return true;
              else if (l === "urgent")
                // User only wants tasks that are urgent
                return task.task_urgent;
              else
                // If there is at least one task label that is in
                // one of the selected task labels in the checkboxes
                return _.some(task.task_labels,
                  function(label) {return label === l});
            });
          },
          taskSpinner,
          noTasks);
      });
    }

    teamSelectToggle.contents().first().replaceWith(currentTeam.team_name);
    teamSelect.click(renderTasks);
    progressSelect.click(renderTasks);
    labelSelect.click(renderTasks);

    List.iter(currentTeam.team_labels, function(label, id) {
      var l = $("<label>")
          .attr("for", "esper-modal-label" + id)
          .append($("<input>")
            .attr({"type": "checkbox", "id": "esper-modal-label" + id})
            .val(label)
            .prop("checked", true)
          ).append(label);
      var li = $("<li>")
          .append(l)
          .appendTo(labelSelect);
    });

    List.iter(teams, function(team, id) {
      var i = $("<input>")
          .attr({"type": "checkbox", "id": "esper-modal-team" + id})
          .val(team.teamid);
      var l = $("<label>")
          .attr("for", "esper-modal-team" + id)
          .append(i)
          .append(team.team_name);
      var li = $("<li>")
          .append(l);
      if (team === currentTeam) {
          i.prop("checked", true);
      }
      li.appendTo(teamSelect);
    });

    allTeams.find("label > input").change(function(e) {
      e.stopPropagation();
      teamSelect.find("label > input").prop("checked", this.checked);
      renderTasks();
    });

    allProgress.find("label > input").change(function(e) {
      e.stopPropagation();
      progressSelect.find("label > input").prop("checked", this.checked);
      renderTasks();
    });

    allLabels.find("label > input").change(function(e) {
      e.stopPropagation();
      labelSelect.find("label > input").prop("checked", this.checked);
      renderTasks();
    });

    progressSelect.find("label > input[value!='']").change(function() {
      if (!$(this).is(":checked"))
        allProgress.find("label > input").prop("checked", false);
    });

    labelSelect.find("label > input[value!='all']").change(function() {
      if (!$(this).is(":checked"))
        allLabels.find("label > input").prop("checked", false);
    });

    teamSelect.find("label > input[value!='']").change(function() {
      if (!$(this).is(":checked"))
        allTeams.find("label > input").prop("checked", false);
    });

    recipientTextArea.val(Login.myEmail() + ", ");

    function appendEmailToTextarea() {
      var emails = recipientTextArea.val();
      if ($(this).is(":checked")) {
        if (emails.search(/(^\s*$)|(?:,\s*$)/) != -1)
          // If the current textarea of emails is blank
          // or if there is a comma at the end, don't prepend comma
          recipientTextArea.val(emails + $(this).val() + ", ");
        else
          recipientTextArea.val(emails + ", " + $(this).val() + ", ");
      } else {
        // Match against the email and the tailing comma and whitespaces
        var regex = new RegExp($(this).val() + ",? *", "i");
        recipientTextArea.val(emails.replace(regex, ""));
      }
    }

    function addRecipientCheckboxes(email, id) {
      var s = $("<span>")
        .css("display", "inline-block");
      var i = $("<input>")
        .attr({ "type": "checkbox", "id": "agenda-recipient" + id})
        .val(email)
        .change(appendEmailToTextarea)
        .appendTo(s);
      if (Login.myEmail() === email) {
        i.prop("checked", true);
      }
      var l = $("<label>")
        .attr("for", "agenda-recipient" + id)
        .addClass("esper-agenda-recipient")
        .text(email)
        .appendTo(s);
      s.appendTo(recipients);
    }

    var recipientEmails = _.uniq(
      _.flatten(
        _.map(teams, function(team: ApiT.Team) {
          return _.map(team.team_assistants, function(uid: string) {
            return Teams.getProfile(uid).email;
          });
        })
      )
    );
    _.forEach(recipientEmails, addRecipientCheckboxes);

    renderTasks();
    view.click(cancel);
    modal.click(closeDropdowns);
    Util.preventClickPropagation(teamDropdown);
    Util.preventClickPropagation(progressDropdown);
    Util.preventClickPropagation(labelDropdown);
    Util.preventClickPropagation(modal);
    closeButton.click(cancel);
    cancelButton.click(cancel);
    sendButton.click(function() {
      errorMessages.empty();
      var t = _.map(getCheckedBoxes(teamSelect), function(box) {
        return box.value;
      });
      var l = _.map(getCheckedBoxes(labelSelect), function(box) {
        return box.value;
      });
      var p = _.map(getCheckedBoxes(progressSelect), function(box) {
        return box.value;
      });
      var f = htmlFormat.prop("checked");
      var r = _.filter(recipientTextArea.val().split(/, /),
        function(s: string) { return s !== ""; });

      function notEmpty(list, arg) {
        if (list.length == 0) {
          var e = $("<span>")
            .addClass("esper-agenda-error")
            .html("You must select at least one " + arg);
          e.appendTo(errorMessages);
          return false;
        }
        return true;
      }

      function validateEmails(arr: string[]) {
        return _.every(arr, function(s) {
          if (s.match(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i) === null) {
            var e = $("<span>")
              .addClass("esper-agenda-error")
              .html("Invalid email address: " + s);
            e.appendTo(errorMessages);
            return false;
          }
          return true;
        });
      }

      if (!notEmpty(t, "team")
          || !notEmpty(p, "progress label")
          || !notEmpty(l, "task label")
          || !notEmpty(r, "recipient")
          || !validateEmails(r)) {
        return;
      }
      
      cancelButton.prop("disabled", true);
      sendButton.prop("disabled", true);
      recipients.children().prop("disabled", true);
      sendButton.text("Sending...");
      Analytics.track(Analytics.Trackable.ClickModalSendTaskList);

      Api.sendTaskList(t, l, p, f, r).done(cancel);
    });

    return _view;
  }

}
