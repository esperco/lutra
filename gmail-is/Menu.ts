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
      $("#esper-menu-root").remove();
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
                             view: Menu,
                             tasksLayer: JQuery) {

    var team = currentTeam.get();

    view.currentTeamName
      .text(team.team_name)
      .click(function() {
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
        return false; // prevents click event from bubbling up
      });

    currentTeam.watch(function(team) {
      view.currentTeamName
        .text(team.team_name);
    }, "team-switcher-current");

    List.iter(teams, function(team) {
      $("<li class='esper-li'>")
        .text(team.team_name)
        .click(function() {
          currentTeam.set(team);
          TaskList.display(team, tasksLayer);
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
      var team = currentTeam.get();
      setupTeamSwitcher(teams, view, tasksLayer);
      view.currentTeamName.removeClass("esper-hide");
      view.tasksButton
        .removeClass("esper-hide")
        .unbind("click")
        .click(function() { TaskList.display(team, tasksLayer); });
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
     class="esper-hide esper-tl-tasks-layer">
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
