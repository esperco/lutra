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

    var helpLink = $("<a class='esper-a'>Help</a>")
      .attr("href", "mailto:team@esper.com");

    ul.children().remove();
    ul
      .append(signInLink)
      .append(settingsLink)
      .append(agendaLink)
      .append(helpLink);
  }

  function displayAgenda() {
'''
<div #view class="esper-modal-bg">
  <div #modal class="esper-confirm-event-modal">
    <div class="esper-modal-header">Send Agenda</div>
    <div class="esper-modal-content">
      <label class="esper-agenda-title">
        Team:
        <select #teamSelect class="esper-agenda-select"/>
      </label>
      <br/>
      <label class="esper-agenda-title">
        Exec Timezone:
        <select #tzSelect class="esper-agenda-select"/>
      </label>
      <br/>
      <label class="esper-agenda-title">
        Time From:
        <input #timeFromDate type="text" class="esper-email-date-select"/>
      </label>
      <br/>
      <label class="esper-agenda-title">
        Time Until:
        <input #timeUntilDate type="text" class="esper-email-date-select"/>
      </label>
      <br/>
      <label class="esper-agenda-title">
        Send to:
        <div #recipients class="esper-agenda-section">
        </div>
      </label>
    </div>
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

    List.iter(teams, function(team) {
        var o = $("<option>")
            .text(team.team_name)
            .val(team.teamid);
        if (team === currentTeam.get()) {
            o.attr("selected", true);
        }
        o.appendTo(teamSelect);
    });

    function addRecipientCheckboxes(email, id) {
      var i = $("<input />")
        .attr({ "type": "checkbox", "id": "agenda-recipient" + id})
        .val(email);
      var l = $("<label>")
        .attr("for", "agenda-recipient" + id)
        .text(email)
        .append($("<br />"));
      i.appendTo(recipients);
      l.appendTo(recipients);
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
        o.attr("selected", true);
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

    function cancel() { view.remove(); }

    view.click(cancel);
    Util.preventClickPropagation(modal);
    cancelButton.click(cancel);
    sendButton.click(function() {
      errorMessages.empty();
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

      cancelButton.attr("disabled", true);
      sendButton.attr("disabled", true);
      recipients.children().attr("disabled", true);
      sendButton.text("Sending...");

      console.log(r);
      Api.sendAgenda(teamSelect.val(), f_time, u_time, r).done(cancel);
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
<div #view id="esper-menu-root" class="esper-menu-root">
  <!-- fixed elements -->
  <div #background class="esper-menu-bg"/>

  <div #teamSwitcher class="esper-tl-switcher">
    <div #currentTeamName
         class="esper-clickable esper-tl-team esper-dropdown-btn"
         title="Select other team">
    </div>
    <object #teamsCaret class="esper-svg esper-click-safe esper-tl-caret"/>
    <ul #teamsDropdown class="esper-drop-ul esper-tl-dropdown">
      <div #teamSwitcherContent class="esper-dropdown-section"/>
    </ul>
  </div>

  <div #tasksButton
       class="esper-hide esper-clickable esper-tl-button"
       title="View tasks for this team">
    Tasks
  </div>

  <div class="esper-menu">
    <div #logo
         class="esper-click-safe esper-clickable
                esper-dropdown-btn esper-menu-logo"
         title="Esper">
      <object #logoImg class="esper-svg"/>
    </div>
    <object #menuCaret class="esper-svg esper-click-safe esper-menu-caret"/>
    <ul #menuDropdown class="esper-drop-ul esper-menu-dropdown">
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

    menuCaret.attr("data", Init.esperRootUrl + "img/caret.svg");
    updateLinks(menuDropdownContent);

    teamsCaret.attr("data", Init.esperRootUrl + "img/caret.svg");
    setupTaskListControls(menuView, tasksLayer);

    logo.click(function() {
      if (menuDropdown.is(":visible")) {
        Sidebar.dismissDropdowns();
      } else {
        Sidebar.dismissDropdowns();
        background.show();
        menuCaret.show();
        menuDropdown.show();
      }
    });

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
