/*
  Esper menu that is accessible from any Gmail view.
  (on the right hand side of the top bar)
*/

/// <reference path="../common/Analytics.ts" />
/// <reference path="./Agenda.ts" />

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

  function makeActionLink(text: string,
                          action: () => void) {
    var link = $("<li class='esper-li'/>")
      .text(text)
      .click(action);

    return link;
  }

  function updateLinks(ul) {
    var loggedIn = Login.loggedIn();

    var signIOLink = loggedIn?
      makeActionLink("Sign out", Login.logout)
      : makeActionLink("Sign in", Init.login);

    function openSettings() {
      window.open(Conf.Api.url);
      Analytics.track(Analytics.Trackable.ClickMenuEditSettings);
    }

    var settingsLink = makeActionLink("Edit Settings",
                                      openSettings);

    function openOptionsPage() {
      // Can't call Chrome API to open options page directly,
      // post to Event Script
      Message.post(Message.Type.OpenExtensionOptions);
      Analytics.track(Analytics.Trackable.ClickMenuExtensionOptions);
    }

    var optionsLink = makeActionLink("Extension Options",
                                     openOptionsPage);

    var agendaLink = makeActionLink("Get Agenda", function() {
      var agendaModal = Agenda.renderModal(currentTeam.get());
      $("body").append(agendaModal.view);
      Analytics.track(Analytics.Trackable.ClickMenuGetAgenda);
    });

    var taskListLink = makeActionLink("Get Task List", function() {
      var taskListModal = TaskList.renderModal(currentTeam.get());
      $("body").append(taskListModal.view);
      Analytics.track(Analytics.Trackable.ClickMenuGetTaskList);
    });

    var hr = $("<hr>").addClass("esper-menu-hr");

    var getStartedLink = makeActionLink("Get Started", function() {
      Message.post(Message.Type.RenderGettingStarted);
      Analytics.track(Analytics.Trackable.ClickMenuGetStarted);
    });

    var helpLink = $("<a class='esper-a'>Get Help</a>")
      .attr("href", "mailto:support@esper.com")
      .click(function() {
        Analytics.track(Analytics.Trackable.ClickMenuGetHelp);
      });

    ul.children().remove();
    ul
      .append(agendaLink)
      .append(taskListLink)
      .append(settingsLink)
      .append(optionsLink)
      .append(hr)
      .append(getStartedLink)
      .append(helpLink)
      .append(signIOLink);
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

    if (currentTeam.get() === undefined && teams) {
      currentTeam.set(teams[0]);
    }

    var theme = $("div.gb_Dc.gb_sb");
    if (theme.hasClass("gb_l")) {
      logo.addClass("esper-menu-white");
      logoImg.attr("data", Init.esperRootUrl + "img/menu-logo-white.svg");
    } else {
      logo.addClass("esper-menu-purple");
      logoImg.attr("data", Init.esperRootUrl + "img/menu-logo-purple.svg");
    }

    /* Try to use the same color as Google, which depends on the theme. */
    var navbarTextColor = Gmail.getNavbarTextColor();

    updateLinks(menuDropdownContent);

    logo.dropdown();
    logo.click(function() {
      Analytics.track(Analytics.Trackable.ClickMenuEsperLogo);
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
