/*
  Esper menu that is accessible from any Gmail view.
  (on the right hand side of the top bar)
*/

module Esper.Menu {
  /*
    The global current team, valid even if there is no current task or thread.

    Switching team in the sidebar results in changing the global team.
    However, changing the global team does not affect the sidebar.
  */
  export var currentTeam = new Esper.Watchable.C<ApiT.Team>(
    function(team) { return team !== undefined && team !== null; },
    undefined
  );

  function replace(menu: JQuery) {
    var rightSibling = Gmail.findMenuAnchor();
    if (rightSibling.length === 1) {
      $("#esper-menu").remove();
      menu.insertBefore(rightSibling);
      return true;
    }
    else
      return false;
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

    var helpLink = $("<a class='esper-a'>Help</a>")
      .attr("href", "mailto:team@esper.com");

    ul.children().remove();
    ul
      .append(signInLink)
      .append(settingsLink)
      .append(helpLink);
  }

  function setupTeamSwitcher(teams: ApiT.Team[],
                             view: Menu) {

    var team = currentTeam.get();
    view.currentTeamName
      .text(team.team_name)
      .click();

    List.iter(teams, function(team) {
      $("<li class=''>")
        .text(team.team_name)
        .click(function() {
          currentTeam.set(team);
          TaskList.display(team, view.tasksLayer);
        })
        .appendTo(view.teamSwitcherContent);
    });
  }

  function setupTaskListControls(view: Menu) {
    var teams = Login.myTeams();
    if (teams === undefined || teams.length === 0) {
      view.teamSwitcher.addClass("esper-hide");
      view.tasksButton.addClass("esper-hide");
    } else {
      if (currentTeam.get() === undefined) {
        currentTeam.set(teams[0]);
      }
      var team = currentTeam.get();
      setupTeamSwitcher(teams, view);
      view.teamSwitcher.removeClass("esper-hide");
      view.tasksButton
        .removeClass("esper-hide")
        .unbind("click")
        .click(function() { TaskList.display(team, view.tasksLayer); });
    }
  }

  export interface Menu {
    view: JQuery;
    logo: JQuery;
    logoImg: JQuery;
    teamsCaret: JQuery;
    teamSwitcher: JQuery;
    currentTeamName: JQuery;
    teamSwitcherContent: JQuery;
    tasksButton: JQuery;
    tasksLayer: JQuery;
    background: JQuery;
    menuCaret: JQuery;
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
<div #view id="esper-menu" class="esper-menu">
  <div #logo class="esper-click-safe esper-dropdown-btn esper-menu-logo">
    <object #logoImg class="esper-svg"/>
  </div>
  <object #teamsCaret class="esper-svg esper-click-safe esper-caret"/>
  <ul #teamSwitcher class="esper-hide esper-ul esper-menu-dropdown">
    <span #currentTeamName></span>
    <div #teamSwitcherContent class="esper-dropdown-section"/>
  </ul>
  <button #tasksButton class="esper-hide">Tasks</button>
  <div #tasksLayer></div>
  <div #background class="esper-menu-bg"/>
  <object #menuCaret class="esper-svg esper-click-safe esper-caret"/>
  <ul #menuDropdown class="esper-ul esper-menu-dropdown">
    <div #menuDropdownContent class="esper-dropdown-section"/>
  </ul>
</div>
'''

    var menuView = <Menu> _view;

    var theme = $("div.gb_Dc.gb_sb");
    if (theme.hasClass("gb_l")) {
      logo.addClass("esper-menu-white");
      logoImg.attr("data", Init.esperRootUrl + "img/menu-logo-white.svg");
    } else {
      logo.addClass("esper-menu-black");
      logoImg.attr("data", Init.esperRootUrl + "img/menu-logo-black.svg");
    }

    menuCaret.attr("data", Init.esperRootUrl + "img/caret.svg");
    updateLinks(menuDropdownContent);

    teamsCaret.attr("data", Init.esperRootUrl + "img/caret.svg");
    setupTaskListControls(menuView);

    logo.click(function() {
      if (logo.hasClass("open")) {
        Sidebar.dismissDropdowns();
      } else {
        Sidebar.dismissDropdowns();
        background.toggle();
        menuCaret.toggle();
        menuDropdown.toggle();
        logo.addClass("open");
      }
    });

    Util.repeatUntil(10, 1000, function() {
      Log.d("Inserting Esper menu...");
      var success = replace(view);
      if (success)
        Log.d("Esper menu is now ready.");
      return success;
    });
  }

  export function init() {
    Login.watchableInfo.watch(function(x: ApiT.LoginResponse) {
      Menu.create();
    });
  }
}
