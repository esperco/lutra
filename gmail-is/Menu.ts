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
    function openSettings() {
      window.open(Conf.Api.url);
    }

    var settingsLink = makeActionLink("Edit Settings",
                                      openSettings, false);

    function openOptionsPage() {
      // Can't call Chrome API to open options page directly,
      // post to Event Script
      Message.post(Message.Type.OpenExtensionOptions);
    }

    var optionsLink = makeActionLink("Extension Options",
                                     openOptionsPage, false);

    var agendaLink = makeActionLink("Get Agenda", function() {
      var agendaModal = displayGetAgenda();
      $("body").append(agendaModal.view);
    }, false);

    var getTaskListLink = makeActionLink("Get Task List", function() {
      var taskListModal = displayGetTask();
      $("body").append(taskListModal.view);
    }, false);

    var hr = $("<hr>").addClass("esper-menu-hr");

    var helpLink = $("<a class='esper-a'>Get Help</a>")
      .attr("href", "mailto:support@esper.com");

    ul.children().remove();
    ul
      .append(agendaLink)
      .append(getTaskListLink)
      .append(settingsLink)
      .append(optionsLink)
      .append(hr)
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
    <div #tasksContainer class="esper-modal-content" style="height: calc(100% - 400px); overflow-y: auto;">
      <div #taskSpinner class="esper-events-list-loading">
        <div class="esper-spinner esper-list-spinner"/>
      </div>
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
              <textarea #recipientEmails rows="4" cols="50" />
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

    function closeDropdowns() {
      teamDropdown.removeClass("open");
      progressDropdown.removeClass("open");
      labelDropdown.removeClass("open");
    }

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
          },
          taskSpinner);
      });
    }

    teamSelectToggle.contents().first().replaceWith(currentTeam.get().team_name);
    teamSelect.click(renderTasks);
    progressSelect.click(renderTasks);
    labelSelect.click(renderTasks);

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

    List.iter(teams, function(team) {
      var teamEmails = _.map(team.team_assistants, function(uid: string){
        return Teams.getProfile(uid).email;
      });
      List.iter(teamEmails, addRecipientCheckboxes);
    });

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

  function displayGetAgenda() {
'''
<div #view class="esper-modal-bg esper">
  <div #modal class="esper-confirm-event-modal">
    <span #closeButton class="esper-modal-close esper-clickable">×</span>
    <div class="esper-modal-header">Agenda</div>
    <table class="esper-modal-content">
      <tr>
        <td>
          <label class="esper-agenda-title">
            Executive Team:
          </label>
        </td>
          <select #teamSelect class="esper-agenda-select"/>
        <td>
      </tr>
      <tr>
        <td>
          <label class="esper-agenda-title">
            Executive Timezone:
          </label>
        </td>
        <td>
          <select #tzSelect class="esper-agenda-select"/>
        </td>
      </tr>
      <tr>
        <td colspan="2">
          <input #timeFromDate type="text" class="esper-email-date-select"/>
          <i #timeFromIcon class="fa fa-lg fa-calendar esper-calendar-icon"></i>
          <span>to</span>
          <input #timeUntilDate type="text" class="esper-email-date-select"/>
          <i #timeUntilIcon class="fa fa-lg fa-calendar esper-calendar-icon"></i>
        </td>
      </tr>
      <tr>
        <td colspan="2">
          <label class="esper-agenda-title">
            Agenda Format:
          </label>
        </td>
      </tr>
      <tr>
        <td colspan="2">
          <div class="esper-agenda-format">
            <label>
              <input #htmlFormat type="radio" name="format" />
              HTML
            </label>
            <label>
              <input #textFormat type="radio" name="format" />
              Plain Text
            </label>
            <br/>
            <label>
              <input #includeTaskNotes type="checkbox" />
                Include task notes
            </label>
          </div>
        </td>
      </tr>
      <tr>
        <td colspan="2">
          <label class="esper-agenda-title">
            Send to:
            <div #recipients class="esper-agenda-section">
            </div>
          </label>
        </td>
      </tr>
    </table>
    <div class="esper-modal-footer esper-clearfix">
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

    htmlFormat.prop("checked", true);

    List.iter(teams, function(team) {
        var o = $("<option>")
            .text(team.team_name)
            .val(team.teamid);
        if (team === currentTeam.get()) {
            o.prop("selected", true);
        }
        o.appendTo(teamSelect);
    });

    function addRecipientCheckboxes(email, id) {
      var i = $("<input />")
        .attr({ "type": "checkbox", "id": "agenda-recipient" + id})
        .val(email);
      var l = $("<label>")
        .attr("for", "agenda-recipient" + id)
        .addClass("esper-agenda-recipient")
        .text(email);
      i.appendTo(recipients);
      l.appendTo(recipients);
      $("<br />").appendTo(recipients);
    }

    teamSelect.change(function() {
      var teamid = teamSelect.val();
      var prefs = Teams.getPreferences(teamid);
      var timezone = prefs.general.current_timezone;
      tzSelect.val(timezone);

      recipients.empty();
      var team = List.find(teams, function(team) { return team.teamid === teamid; });
      var teamEmails = List.union(
        [Teams.getProfile(team.team_executive).email],
        List.map(team.team_assistants, function(uid: string) {
          return Teams.getProfile(uid).email;
        }));
      List.iter(teamEmails, addRecipientCheckboxes);
    });

    var teamid = teamSelect.val();
    var timezones = ["US/Pacific", "US/Mountain", "US/Central", "US/Eastern"];
    var prefs = Teams.getPreferences(teamid);
    var timezone = prefs.general.current_timezone;
    var teamEmails = List.union(
      [Teams.getProfile(currentTeam.get().team_executive).email],
      List.map(currentTeam.get().team_assistants, function(uid) {
        return Teams.getProfile(uid).email;
      }));

    List.iter(teamEmails, addRecipientCheckboxes);

    List.iter(timezones, function(tz) {
      var o = $("<option>")
        .text(tz)
        .val(tz);
      if (tz === timezone) {
        o.prop("selected", true);
      }
      o.appendTo(tzSelect);
    });

    tzSelect.change(function() {
      var general = prefs.general;
      general.current_timezone = tzSelect.val();
      Api.setGeneralPreferences(teamid, general);
    });

    var date = new Date();
    timeFromDate.datepicker();
    timeUntilDate.datepicker();
    timeFromDate.datepicker("option", "dateFormat", "yy-mm-dd");
    timeUntilDate.datepicker("option", "dateFormat", "yy-mm-dd");
    timeFromDate.datepicker("setDate", date);
    timeUntilDate.datepicker("setDate", date);

    timeFromIcon.click(function() {
      timeFromDate.datepicker("show");
    });

    timeUntilIcon.click(function() {
      timeUntilDate.datepicker("show");
    });

    // Add an Esper class to help namespace CSS, especially since the
    // Datepicker widget seems to be absolutely positioned outside of
    // our DOM elements. Datepicker might actually be re-using the same
    // widget so we don't need to addClass twice, but whatever.
    timeFromDate.datepicker("widget").addClass("esper");
    timeUntilDate.datepicker("widget").addClass("esper");

    function cancel() { view.remove(); }

    view.click(cancel);
    closeButton.click(cancel);
    Util.preventClickPropagation(modal);
    cancelButton.click(cancel);
    sendButton.click(function() {
      errorMessages.empty();
      var format = htmlFormat.prop("checked");
      var i = includeTaskNotes.prop("checked");
      var f = timeFromDate.datepicker("getDate");
      var u = timeUntilDate.datepicker("getDate");
      var f_time = Math.floor(f.getTime() / 1000);
      var u_time = Math.floor(u.getTime() / 1000) + 86399;
      var r = List.map(recipients.children(":checked"), function(el: HTMLInputElement) {
        return el.value;
      });

      if (f > u) {
        var e = $("<span>")
          .addClass("esper-agenda-error")
          .html("Time From cannot be greater than Time Until");
        e.appendTo(errorMessages);
        return;
      }

      if (r.length == 0) {
        var e = $("<span>")
          .addClass("esper-agenda-error")
          .html("You must select at least one recipient");
        e.appendTo(errorMessages);
        return;
      }

      cancelButton.prop("disabled", true);
      sendButton.prop("disabled", true);
      recipients.children().prop("disabled", true);
      sendButton.text("Sending...");

      var pref = { recipients: r, html_format: format, include_task_notes: i};
      Api.sendAgenda(teamSelect.val(), f_time, u_time, pref).done(cancel);
    });

    return _view;
  }

  export interface Menu {
    view: JQuery;
    logo: JQuery;
    logoImg: JQuery;
    background: JQuery;
    menuDropdown: JQuery;
    menuDropdownContent: JQuery;
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
    var teams = Login.myTeams();

    if (currentTeam.get() === undefined) {
      currentTeam.set(teams[0]);
    }

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

    updateLinks(menuDropdownContent);

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
