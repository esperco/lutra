/*
  Esper menu that is accessible from any Gmail view.
  (on the right hand side of the top bar)
*/

module Esper.Menu {
  /*
    The current team for the purpose of offering a default choice
    in the menu bar.
    Once initialized it must always be set to some team.

    The scope of this team is limited to the elements from the top menu.
  */
  var currentTeam = new Esper.Watchable.C<ApiT.Team>(
    isValidCurrentTeamValue,
    undefined
  );

  function isValidCurrentTeamValue(team: ApiT.Team): boolean {
    return team !== undefined && team !== null;
  }

  function replace(menu: JQuery) {
    var rightSibling = Gmail.findMenuAnchor();
    if (rightSibling.length === 1) {
      $("#esper-menu-root").remove();
      menu.insertBefore(rightSibling);
      return true;
    }
    else {
      return false;
    }
  }

  function makeActionLink(text, action, danger) {
    var link = $("<li class='esper-li'/>")
      .text(text)
      .click(action);

    if (danger) link.addClass("esper-danger");

    return link;
  }

  function updateLinks(ul) {
    var loggedIn = Login.loggedIn();

    var signInLink = loggedIn?
      makeActionLink("Sign out", Login.logout, true)
      : makeActionLink("Sign in", Init.login, false);

    function openSettings() {
      window.open(Conf.Api.url);
    }

    var settingsLink = makeActionLink("Team & Exec Settings",
                                      openSettings, false);

    function openOptionsPage() {
      // Can't call Chrome API to open options page directly,
      // post to Event Script
      Message.post(Message.Type.OpenExtensionOptions);
    }

    var optionsLink = makeActionLink("Extension Options",
                                     openOptionsPage, false);

    var agendaLink = makeActionLink("Agenda", function() {
      var agendaModal = displayAgenda();
      $("body").append(agendaModal.view);
    }, false);

    var getTaskListLink = makeActionLink("Task List", function() {
      var taskListModal = displayGetTask();
      $("body").append(taskListModal.view);
    }, false);

    var helpLink = $("<a class='esper-a'>Help</a>")
      .attr("href", "mailto:team@esper.com");

    ul.children().remove();
    ul
      .append(signInLink)
      .append(settingsLink)
      .append(optionsLink)
      .append(agendaLink)
      .append(getTaskListLink)
      .append(helpLink);
  }

  function displayGetTask() {
'''
<div #view class="esper-modal-bg">
  <div #modal class="esper-tl-modal">
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
          Progress
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
    <div #tasksContainer class="esper-modal-content" style="height: 45%; overflow-y: auto;">
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
              <textarea #recipientEmails rows="6" cols="50" />
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

    urgent.children("label").append(currentTeam.get().team_label_urgent);
    new_.children("label").append(currentTeam.get().team_label_new);
    inProgress.children("label").append(currentTeam.get().team_label_in_progress);
    pending.children("label").append(currentTeam.get().team_label_pending);
    canceled.children("label").append(currentTeam.get().team_label_canceled);
    done.children("label").append(currentTeam.get().team_label_done);

    function cancel() { view.remove(); }

    function getCheckedValues(ul: JQuery) {
      return _.filter(_.map(ul.find("label > input:checked"), function(el) {
          return $(el).val();
        }), function(s) {
        return s !== "";
      });
    }

    function renderTasks() {
      tasksContainer.children(".esper-tl-list").remove();
      var teams = _.filter(Login.myTeams(), function(team) {
        // Filter all teams that the user is in, only returning
        // those who have the selected teamid in the checkboxes
        return _.some(getCheckedValues(teamSelect),
          function(teamid) {return team.teamid === teamid;} );
      });
      var progress = getCheckedValues(progressSelect);
      var labels = getCheckedValues(labelSelect);

      _.forEach(teams, function(team) {
        TaskList.displayList(team,
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
          });
      });
    }

    teamDropdown.click(renderTasks);
    progressDropdown.click(renderTasks);
    labelDropdown.click(renderTasks);

    TaskList.displayList(currentTeam.get(),
      tasksContainer,
      cancel,
      function(task) {return task.task_progress == "In_progress"});

    List.iter(currentTeam.get().team_labels, function(label, id) {
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
      if (team === currentTeam.get()) {
          i.prop("checked", true);
      }
      li.appendTo(teamSelect);
    });

    allProgress.change(function() {
      if (!$(this).is(":checked"))
        progressSelect.find("label > input").prop("checked", true);
    });

    allLabels.change(function() {
      if (!$(this).is(":checked"))
        labelSelect.find("label > input").prop("checked", true);
    });

    progressSelect.find("label > input[value!='']").change(function() {
      if (!$(this).is(":checked"))
        allProgress.find("label > input").prop("checked", false);
    });

    labelSelect.find("label > input[value!='all']").change(function() {
      if (!$(this).is(":checked"))
        allLabels.find("label > input").prop("checked", false);
    });

    function appendEmailToTextarea() {
      var emails = recipientEmails.val();
      if ($(this).is(":checked")) {
        if (emails.search(/(^\s*$)|(?:,\s*$)/) != -1)
          // If the current textarea of emails is blank
          // or if there is a comma at the end, don't prepend comma
          recipientEmails.val(emails + $(this).val() + ", ");
        else
          recipientEmails.val(emails + ", " + $(this).val() + ", ");
      } else {
        // Match against the email and the tailing comma and whitespaces
        var regex = new RegExp($(this).val() + ",? *", "i");
        recipientEmails.val(emails.replace(regex, ""));
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
      var l = $("<label>")
        .attr("for", "agenda-recipient" + id)
        .addClass("esper-agenda-recipient")
        .text(email)
        .appendTo(s);
      s.appendTo(recipients);
    }

    _.forEach(teams, function(team) {
      var teamEmails = _.map(team.team_assistants, function(uid: string){
        return Teams.getProfile(uid).email;
      });
      _.forEach(teamEmails, addRecipientCheckboxes);
    });

    view.click(cancel);
    Util.preventClickPropagation(modal);
    closeButton.click(cancel);
    cancelButton.click(cancel);
    sendButton.click(function() {
      errorMessages.empty();
      var t = getCheckedValues(teamSelect);
      var l = getCheckedValues(labelSelect);
      var p = getCheckedValues(progressSelect);
      var f = htmlFormat.prop("checked");
      var r = _.filter(recipientEmails.val().split(/, /),
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

      Api.sendTaskList(t, l, p, f, r).done(cancel);
    });

    return _view;
  }

  function displayAgenda() {
'''
<div #view class="esper-modal-bg">
  <div #modal class="esper-tl-modal">
    <div class="esper-modal-header"><h2 style="margin: 0px;">Agenda</h2></div>
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
          </li>
        </ul>
      </div>
      's agenda from
      <button #timeFromButton class="btn btn-default dropdown-toggle">
        <input #timeFromDate type="hidden"/>
        <i class="fa fa-calendar esper-calendar-icon"></i>
      </button>
      to
      <button #timeUntilButton class="btn btn-default dropdown-toggle">
        <input #timeUntilDate type="hidden"/>
        <i class="fa fa-calendar esper-calendar-icon"></i>
      </button>
      in
      <div #timezoneDropdown class="dropdown esper-dropdown">
        <button #timezoneSelectToggle class="btn btn-default dropdown-toggle" data-toggle="dropdown">
          Timezone
          <i class="fa fa-chevron-down"></i>
        </button>
        <ul #timezoneSelect class="dropdown-menu esper-dropdown-select">
        </ul>
      </div>
    </div>
    <div #eventsContainer class="esper-modal-content" style="height: 45%; overflow-y: auto;">
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
        <label>
          <input #includeTaskNotes type="checkbox" />
          Include task notes
        <label>
        <table>
           <tr>
            <td valign="top" align="left" style="padding: 0; min-width: 80px;">
              <label class="esper-agenda-title">
                To:
              </label>
            </td>
            <td>
              <div #recipients />
              <textarea #recipientEmails rows="6" cols="50" />
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
    timezoneSelectToggle.dropdown();

    function cancel() { view.remove(); }

    function getCheckedValues(ul: JQuery) {
      return _.filter(_.map(ul.find("label > input:checked"), function(el) {
          return $(el).val();
        }), function(s) {
        return s !== "";
      });
    }

    _.forEach(teams, function(team, id) {
      var i = $("<input>")
          .attr({"type": "checkbox", "id": "esper-modal-team" + id})
          .val(team.teamid);
      var l = $("<label>")
          .attr("for", "esper-modal-team" + id)
          .append(i)
          .append(team.team_name);
      var li = $("<li>").append(l);
      if (team === currentTeam.get()) {
          i.prop("checked", true);
      }
      li.appendTo(teamSelect);
    });

    var date = new Date();
    timeFromDate.datepicker({
      onSelect: function(dateText, inst) {
        $(this).parent().contents().first().replaceWith(dateText);
        // renderEvents();
      }
    });
    timeUntilDate.datepicker({
      onSelect: function(dateText, inst) {
        $(this).parent().contents().first().replaceWith(dateText);
        // renderEvents();
      }
    });

    timeFromDate.datepicker("option", "dateFormat", "yy-mm-dd");
    timeUntilDate.datepicker("option", "dateFormat", "yy-mm-dd");
    timeFromDate.datepicker("setDate", date);
    timeUntilDate.datepicker("setDate", date);

    timeFromButton
      .prepend(timeFromDate.val())
      .click(function() {
        timeFromDate.datepicker("show");
    });

    timeUntilButton
      .prepend(timeUntilDate.val())
      .click(function() {
        timeUntilDate.datepicker("show");
    });

    // Add an Esper class to help namespace CSS, especially since the
    // Datepicker widget seems to be absolutely positioned outside of
    // our DOM elements. Datepicker might actually be re-using the same
    // widget so we don't need to addClass twice, but whatever LOL.
    timeFromDate.datepicker("widget").addClass("esper");
    timeUntilDate.datepicker("widget").addClass("esper");

    var timezone = Teams.getPreferences(currentTeam.get().teamid).general.current_timezone;

    _.forEach(Timezone.commonTimezones, function(tz, id) {
      var i = $("<input>")
          .attr({"type": "radio",
            "id": "esper-modal-timezone"+id,
            "name": "esper-timezone"})
          .val(tz.id);
      var l = $("<label>")
        .attr("for", "esper-modal-timezone"+id)
        .append(i)
        .append(tz.name)
        .click(function() {
          timezoneSelectToggle.contents().first().replaceWith(tz.name);
        });
      if (tz.id === timezone) {
        i.prop("checked", true);
        timezoneSelectToggle.contents().first().replaceWith(tz.name);
      }
      var li = $("<li>").append(l);
      li.appendTo(timezoneSelect);
    });

    function appendEmailToTextarea() {
      var emails = recipientEmails.val();
      if ($(this).is(":checked")) {
        if (emails.search(/(^\s*$)|(?:,\s*$)/) != -1)
          // If the current textarea of emails is blank
          // or if there is a comma at the end, don't prepend comma
          recipientEmails.val(emails + $(this).val() + ", ");
        else
          recipientEmails.val(emails + ", " + $(this).val() + ", ");
      } else {
        // Match against the email and the tailing comma and whitespaces
        var regex = new RegExp($(this).val() + ",? *", "i");
        recipientEmails.val(emails.replace(regex, ""));
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
      var l = $("<label>")
        .attr("for", "agenda-recipient" + id)
        .addClass("esper-agenda-recipient")
        .text(email)
        .appendTo(s);
      s.appendTo(recipients);
    }

    _.forEach(teams, function(team) {
      var teamEmails = _.map(team.team_assistants, function(uid: string){
        return Teams.getProfile(uid).email;
      });
      _.forEach(teamEmails, addRecipientCheckboxes);
    });

    // Api.eventRange(currentTeam.get().teamid,
    //                currentTeam.get().team_calendars,
    //                Math.floor(timeFromDate.datepicker("getDate").getTime() / 1000),
    //                Math.floor(timeUntilDate.datepicker("getDate").getTime() / 1000 + 86399))
    //   .done(function(r) {
    //     console.log(r);
    //   });

    // function renderEvents() {
    //   eventsContainer.empty();
    //   var teamids = getCheckedValues(teamSelect);
    //   var teams = _.filter(Login.myTeams(), function(team: ApiT.Team) {
    //     return _.some(teamids, function(teamid) {
    //       return team.teamid === teamid;
    //     });
    //   });
    //   var f = timeFromDate.datepicker("getDate");
    //   var u = timeUntilDate.datepicker("getDate");
    //   _.forEach(teams, function(team: ApiT.Team) {
    //     Api.eventRange(team.teamid,
    //                    team.team_calendars,
    //                    Math.floor(f.getTime() / 1000),
    //                    Math.floor(u.getTime()/ 1000 + 86399))
    //       .done(function(result) {
    //         _.forEach(result.events, function(ev: ApiT.CalendarEvent) {
    //           eventsContainer.append(TaskList.renderEvent(team, ev));
    //         });
    //       });
    //   });
    // }

    view.click(cancel);
    Util.preventClickPropagation(modal);
    closeButton.click(cancel);
    cancelButton.click(cancel);
    sendButton.click(function() {
      errorMessages.empty();
      var t = getCheckedValues(teamSelect);
      var tz = _.first(getCheckedValues(timezoneSelect));
      var format = htmlFormat.prop("checked");
      var i = includeTaskNotes.prop("checked");
      var f = timeFromDate.datepicker("getDate");
      var u = timeUntilDate.datepicker("getDate");
      u.setHours(23, 59, 59, 999);
      var r = _.filter(recipientEmails.val().split(/, /),
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
          || !notEmpty(r, "recipient")
          || !validateEmails(r)) {
        return;
      }

      if (f > u) {
        var e = $("<span>")
          .addClass("esper-agenda-error")
          .html("Time From cannot be greater than Time Until");
        e.appendTo(errorMessages);
        return;
      }

      timeFromButton.prop("disabled", true);
      timeUntilButton.prop("disabled", true);
      cancelButton.prop("disabled", true);
      sendButton.prop("disabled", true);
      recipients.children().prop("disabled", true);
      sendButton.text("Sending...");

      Api.sendAgenda(t, tz, f.toJSON(), u.toJSON(), format, i, r).done(cancel);
    });

    return _view;
  }

  function displayTaskList(team: ApiT.Team,
                           tasksLayer: JQuery) {
    function closeList() {
      tasksLayer.addClass("esper-hide");
      return false;
    }

    tasksLayer.children().remove();
    tasksLayer.removeClass("esper-hide");
    TaskList.render(team, tasksLayer, closeList)
      .appendTo(tasksLayer);
    tasksLayer.click(closeList);
  }

  function setupTeamSwitcher(teams: ApiT.Team[],
                             view: Menu,
                             tasksLayer: JQuery) {

    var team = currentTeam.get();

    view.currentTeamName.text(team.team_name);
    currentTeam.watch(function(team, isValid) {
      if (isValid) {
        view.currentTeamName.text(team.team_name);
      } else {
        view.currentTeamName.text("UNKNOWN TEAM");
      }
    }, "team-switcher-current");

    List.iter(teams, function(team) {
      $("<li class='esper-li'>")
        .text(team.team_name)
        .click(function() {
          currentTeam.set(team);
          displayTaskList(team, tasksLayer);
        })
        .appendTo(view.teamSwitcherContent);
    });
  }

  function setupTaskListControls(view: Menu,
                                 tasksLayer: JQuery) {
    var teams = Login.myTeams();
    if (teams === undefined || teams.length === 0) {
      view.currentTeamName.addClass("esper-hide");
      view.tasksButton.addClass("esper-hide");
    } else {
      if (currentTeam.get() === undefined) {
        currentTeam.set(teams[0]);
      }
      setupTeamSwitcher(teams, view, tasksLayer);
      view.currentTeamName.removeClass("esper-hide");
      view.tasksButton
        .removeClass("esper-hide")
        .unbind("click")
        .click(function() { displayTaskList(currentTeam.get(), tasksLayer); });
    }
  }

  export interface Menu {
    view: JQuery;
    logo: JQuery;
    logoImg: JQuery;
    teamSwitcher: JQuery;
    teamsDropdown: JQuery;
    currentTeamName: JQuery;
    teamSwitcherContent: JQuery;
    tasksButton: JQuery;
    background: JQuery;
    menuDropdown: JQuery;
    menuDropdownContent: JQuery;
  }

  function createTasksLayer(): JQuery {
/*
   This overlay needs to be created near the document's root,
   otherwise the Google logo and search box are displayed on top of it.
*/
    $("#esper-tasks-layer").remove();
'''
<div #tasksLayer
     id="esper-tasks-layer"
     class="esper-hide esper-modal-bg">
</div>
'''
    $("body").append(tasksLayer);
    return tasksLayer;
  }

  /*
    Create and inject the Esper menu.
    It is safe to call this function multiple times. Any old Esper menu
    is removed first.
   */
  export function create() {
'''
<div #view id="esper-menu-root" class="esper-menu-root esper-bs">
  <!-- fixed elements -->
  <div #background class="esper-menu-bg"/>

  <div #teamSwitcher class="esper-tl-switcher dropdown">
    <div #currentTeamName data-toggle="dropdown"
         class="esper-clickable esper-tl-team"
         title="Select other team">
    </div>
    <ul #teamsDropdown class="dropdown-menu dropdown-arrow-top">
      <div #teamSwitcherContent class="esper-dropdown-section"/>
    </ul>
  </div>

  <div #tasksButton
       class="esper-hide esper-clickable esper-tl-button"
       title="View tasks for this team">
    Tasks
  </div>

  <div class="esper-menu dropdown">
    <div #logo data-toggle="dropdown"
         class="esper-clickable esper-menu-logo"
         title="Esper">
      <object #logoImg class="esper-svg"/>
    </div>
    <ul #menuDropdown
        class="dropdown-menu dropdown-menu-right dropdown-arrow-top">
      <div #menuDropdownContent class="esper-dropdown-section"/>
    </ul>
  </div>

</div>
'''

    var menuView = <Menu> _view;
    var tasksLayer = createTasksLayer();

    var theme = $("div.gb_Dc.gb_sb");
    if (theme.hasClass("gb_l")) {
      logo.addClass("esper-menu-white");
      logoImg.attr("data", Init.esperRootUrl + "img/menu-logo-white.svg");
    } else {
      logo.addClass("esper-menu-black");
      logoImg.attr("data", Init.esperRootUrl + "img/menu-logo-black.svg");
    }

    /* Try to use the same color as Google, which depends on the theme. */
    var navbarTextColor = Gmail.getNavbarTextColor();
    currentTeamName.css("color", navbarTextColor);
    tasksButton.css("color", navbarTextColor);

    updateLinks(menuDropdownContent);

    setupTaskListControls(menuView, tasksLayer);

    currentTeamName.dropdown();
    logo.dropdown();

    Util.repeatUntil(10, 1000, function() {
      Log.d("Inserting Esper menu...");
      var success = replace(view);
      if (success) {
        Log.d("Esper menu is now ready.");
      }
      return success;
    });
  }

  export function init() {
    Login.watchableInfo.watch(function(x: ApiT.LoginResponse) {
      create();
    });

    CurrentThread.currentTeam.watch(function(team: Option.T<ApiT.Team>) {
      team.match({
        some : function (team) {
          currentTeam.set(team);
        },
        none : function () {
          // do nothing
        }
      });
    });
  }
}
