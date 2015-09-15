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

    var settingsLink = makeActionLink("Settings", openSettings, false);

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
      .append(agendaLink)
      .append(getTaskListLink)
      .append(helpLink);
  }

  function displayGetTask() {
'''
<div #view class="esper-modal-bg">
  <div #modal class="esper-confirm-event-modal">
    <div class="esper-modal-header">Get Task List</div>
    <span #closeButton class="esper-modal-close esper-clickable">×</span>
    <table class="esper-modal-content">
      <tr>
        <td>
          <label class="esper-agenda-title">
            Executive Team:
          </label>
        </td>
        <td>
          <select #teamSelect class="esper-agenda-select"/>
        </td>
      </tr>
      <tr>
        <td>
          <label class="esper-agenda-title">
            Task Progress:
          </label>
        </td>
        <td #progressSelect class="esper-tl-progress-select">
          <span #new_ class="esper-tl-link esper-tl-progress"></span>
          <span #inProgress class="esper-tl-link esper-tl-progress esper-tl-selected"></span>
          <span #pending class="esper-tl-link esper-tl-progress"></span>
          <span #done class="esper-tl-link esper-tl-progress"></span>
          <span #canceled class="esper-tl-link esper-tl-progress"></span>
        </td>
      </tr>
      <tr>
        <td>
          <label class="esper-agenda-title">
            Task Labels:
          </label>
        </td>
        <td #labelSelect class="esper-tl-labels-select">
          <span #all class="esper-tl-link esper-tl-all esper-tl-selected">All</span>
          <span #urgent class="esper-tl-link esper-tl-urgent"></span>
        </td>
      </tr>
      <tr>
        <label class="esper-agenda-title">
          Task List Format:
        </label>
      </tr>
      <tr>
        <label>
          <input #htmlFormat type="radio" name="format" />
          HTML
        </label>
        <label>
          <input #textFormat type="radio" name="format" />
          Plain text
        </label>
      </tr>
      <tr>
        <label class="esper-agenda-title">
          Send to:
          <div #recipients class="esper-agenda-section" style="width: 100%">
          </div>
        </label>
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

    function bind(elt: JQuery, label: string, isProgress: boolean) {
      if (isProgress) {
        elt.attr("data-task-progress", label);
      } else {
        elt.attr("data-task-label", label)
      }
      elt.click(function() {
        if (elt.hasClass("esper-tl-selected")) {
          elt.removeClass("esper-tl-selected");
        } else {
          if (!isProgress) {
            all.removeClass("esper-tl-selected");
          }
          elt.addClass("esper-tl-selected");
          elt.attr("style", "cursor: pointer;");
        }
      });
    }

    bind(new_, "New", true);
    bind(inProgress, "In_progress", true);
    bind(pending, "Pending", true);
    bind(done, "Done", true);
    bind(canceled, "Canceled", true);
    bind(urgent, "urgent", false);

    all.attr("data-task-label", "all")
       .click(function() {
         if (all.hasClass("esper-tl-selected")) {
          all.removeClass("esper-tl-selected");
         } else {
          labelSelect.children().removeClass("esper-tl-selected");
          all.addClass("esper-tl-selected");
          all.attr("style", "cursor: pointer;");
         }
       });

    List.iter(currentTeam.get().team_labels, function(label) {
      var elt = $("<span>").addClass("esper-tl-link esper-tl-shared")
                    .attr("data-task-label", label)
                    .text(label);
      bind(elt, label, false);
      labelSelect.append(elt);
    });

    urgent.text(currentTeam.get().team_label_urgent);
    new_.text(currentTeam.get().team_label_new);
    inProgress.text(currentTeam.get().team_label_in_progress);
    pending.text(currentTeam.get().team_label_pending);
    done.text(currentTeam.get().team_label_done);
    canceled.text(currentTeam.get().team_label_canceled);

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
        .text(email)
        .append($("<br />"));
      i.appendTo(recipients);
      l.appendTo(recipients);
    }

    teamSelect.change(function() {
      var teamid = teamSelect.val();

      recipients.empty();
      var team = List.find(teams, function(team) { return team.teamid === teamid; });
      var teamEmails = List.union(
        [Teams.getProfile(team.team_executive).email],
        List.map(team.team_assistants, function(uid: string) {
          return Teams.getProfile(uid).email;
        }));
      List.iter(teamEmails, addRecipientCheckboxes);

      new_.text(team.team_label_new);
      inProgress.text(team.team_label_in_progress);
      pending.text(team.team_label_pending);
      done.text(team.team_label_done);
      canceled.text(team.team_label_canceled);

      all.detach();
      urgent.detach();
      labelSelect.empty();

      urgent.text(team.team_label_urgent);
      labelSelect.append(all).append(urgent);
      List.iter(team.team_labels, function(label) {
        var elt = $("<span>").addClass("esper-tl-link esper-tl-shared")
                    .attr("data-task-label", label)
                    .text(label);
        bind(elt, label, false);
        labelSelect.append(elt);
      });
    });

    var teamid = teamSelect.val();
    var prefs = Teams.getPreferences(teamid);
    var teamEmails = List.union(
      [Teams.getProfile(currentTeam.get().team_executive).email],
      List.map(currentTeam.get().team_assistants, function(uid) {
        return Teams.getProfile(uid).email;
      }));

    List.iter(teamEmails, addRecipientCheckboxes);

    function cancel() { view.remove(); }

    view.click(cancel);
    Util.preventClickPropagation(modal);
    cancelButton.click(cancel);
    sendButton.click(function() {
      errorMessages.empty();
      var l = List.map(labelSelect.children(".esper-tl-selected"), function(el: HTMLLabelElement){
        return el.getAttribute("data-task-label");
      });
      var p = List.map(progressSelect.children(".esper-tl-selected"), function(el: HTMLLabelElement){
        return el.getAttribute("data-task-progress");
      });
      var f = htmlFormat.prop("checked");
      var r = List.map(recipients.children(":checked"), function(el: HTMLInputElement) {
        return el.value;
      });

      function validateLists(list, arg) {
        if (list.length == 0) {
          var e = $("<span>")
            .addClass("esper-agenda-error")
            .html("You must select at least one " + arg);
          e.appendTo(errorMessages);
          return false;
        }
        return true;
      }

      if (!validateLists(p, "progress label")
          || !validateLists(l, "task label")
          || !validateLists(r, "recipient")) {
        return;
      }
      
      cancelButton.prop("disabled", true);
      sendButton.prop("disabled", true);
      recipients.children().prop("disabled", true);
      sendButton.text("Sending...");

      Api.sendTaskList(teamSelect.val(), l, p, f, r).done(cancel);
    });

    return _view;
  }

  function displayAgenda() {
'''
<div #view class="esper-modal-bg">
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
          <span>to</span>
          <input #timeUntilDate type="text" class="esper-email-date-select"/>
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

    view.currentTeamName
      .text(team.team_name)
      .click(function(event) {
        /*
          Other controls may hide the dropdown, so inspecting its visibility
          is the most reliable option.
        */
        if (view.teamsDropdown.is(":visible")) {
          Sidebar.dismissDropdowns();
        } else {
          Sidebar.dismissDropdowns();
          view.background.show();
          view.teamsCaret.show();
          view.teamsDropdown.show();
        }
        event.stopPropagation();
      });

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
    teamsCaret: JQuery;
    teamsDropdown: JQuery;
    currentTeamName: JQuery;
    teamSwitcherContent: JQuery;
    tasksButton: JQuery;
    background: JQuery;
    menuCaret: JQuery;
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

    logo.dropdown();
    // logo.click(function() {
    //   if (menuDropdown.is(":visible")) {
    //     Sidebar.dismissDropdowns();
    //   } else {
    //     Sidebar.dismissDropdowns();
    //     background.show();
    //     menuCaret.show();
    //     menuDropdown.show();
    //   }
    // });

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
