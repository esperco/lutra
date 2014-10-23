/*
  Gmail thread view
*/
module Esper.Sidebar {
  export var currentThreadId : string;
  export var currentTeam : ApiT.Team;

  // Profiles of everyone on all the viewer's teams
  var profiles : ApiT.Profile[];

  export function dismissDropdowns() {
    $(".esper-ul").hide();
    $(".esper-menu-bg").hide();
    $(".esper-caret").hide();
    $(".esper-dropdown-btn").removeClass("open");
  }

  $(document).on('click', function(e) {
    if (!$(e.target).hasClass("esper-click-safe"))
      dismissDropdowns();
  });

  function removeEsperRoot() {
    $("#esper").remove();
  }

  function insertEsperRoot() {
    removeEsperRoot();
    var anchor = Gmail.findSidebarAnchor();
    if (anchor.length === 1) {
      var root = $("<div id='esper'/>");
      anchor.prepend(root);
      return root;
    }
  }

  function displayTeamSelector(teamsSection, myTeamId, team, onTeamSwitch) {
'''
<li #selector class="esper-click-safe esper-li">
  <object #teamListCheck class="esper-click-safe esper-team-list-checkmark"/>
  <div #teamListName class="esper-click-safe esper-team-list-name"/>
  <div #teamListExec class="esper-click-safe esper-team-list-exec"/>
</li>
'''
    var exec = List.find(profiles, function(prof) {
      return prof.profile_uid === team.team_executive;
    });
    teamListName.text(team.team_name);
    teamListExec.text(exec.display_name);

    if (team.teamid === myTeamId) {
      selector.addClass("esper-selected");
      teamListCheck.attr("data", Init.esperRootUrl + "img/check.svg");
    } else {
      teamListCheck.hide();
      selector.click(function() { onTeamSwitch(team); });
    }

    teamsSection.append(selector);
  }

  function displayDock(rootElement, sidebar,
                       team: ApiT.Team, isCorrectTeam: boolean, profiles) {
'''
<div #view class="esper-dock-container">
  <div #wrap class="esper-dock-wrap">
    <div #wrapLeft class="esper-dock-wrap-left"/>
    <div #wrapRight class="esper-dock-wrap-right"/>
  </div>
  <ul #dropdown class="esper-ul esper-options-menu">
    <div #teamsSection class="esper-dropdown-section">
      <li class="esper-click-safe esper-li
                 esper-disabled esper-team-list-title">
        TEAMS
      </li>
    </div>
    <div class="esper-click-safe esper-ul-divider"/>
    <div class="esper-dropdown-section">
      <li #settings class="esper-li">Settings</li>
      <a #help class="esper-a" href="mailto:team@esper.com">Help</a>
      <li #signOut class="esper-li esper-danger">Sign out</li>
    </div>
    <div class="esper-click-safe esper-ul-divider"/>
    <div class="esper-click-safe esper-dropdown-section esper-dropdown-footer">
      <a href="http://esper.com">
        <object #footerLogo class="esper-click-safe esper-footer-logo"/>
      </a>
      <div class="esper-click-safe esper-dropdown-footer-links">
        <a href="http://esper.com/privacypolicy.html">Privacy</a>
        <div class="esper-click-safe esper-dropdown-footer-divider"/>
        <a href="http://esper.com/termsofuse.html">Terms</a>
        <div class="esper-click-safe esper-dropdown-footer-divider"/>
        <span class="esper-click-safe esper-copyright">&copy; 2014 Esper</span>
      </div>
    </div>
  </ul>
  <div #dock class="esper-dock">
    <div #options title
         class="esper-click-safe esper-dock-action
                esper-dropdown-btn esper-options">
      <div #optionsIcon
           class="esper-click-safe esper-dock-action-icon esper-options-icon"/>
    </div>
    <div #teamName class="esper-team-name"/>
    <div #size title class="esper-dock-action esper-size">
      <div #sizeIcon class="esper-dock-action-icon esper-size-icon
                            esper-minimize"/>
    </div>
  </div>
</div>
'''
    dropdown.css("max-height", $(window).height());
    dropdown.css("overflow", "auto");

    function onTeamSwitch(toTeam) {
      dismissDropdowns();
      wrap.fadeOut(250);
      sizeIcon.removeClass("esper-minimize");
      sidebar.hide("slide", { direction: "down" }, 250);
      wrap.fadeIn(250);
      sizeIcon.addClass("esper-minimize");
      sidebar.show("slide", { direction: "down" }, 250);
      function afterAnimation() {
        displayTeamSidebar(rootElement, toTeam, true,
                           currentThreadId, profiles);
      }
      setTimeout(afterAnimation, 250);
    }

    Login.myTeams().forEach(function(otherTeam) {
      displayTeamSelector(teamsSection, team.teamid, otherTeam, onTeamSwitch);
    });


    var name = team.team_name;
    if (name === null || name === undefined) {
      var execProf = profiles[team.team_executive];
      if (execProf !== null && execProf !== undefined)
        name = execProf.display_name;
    }
    teamName.text(name);
    if (isCorrectTeam)
      teamName.removeClass("esper-team-name-danger");
    else
      teamName.addClass("esper-team-name-danger");

    footerLogo.attr("data", Init.esperRootUrl + "img/footer-logo.svg");

    options.tooltip({
      show: { delay: 500, effect: "none" },
      hide: { effect: "none" },
      "content": "Options",
      "position": { my: 'center bottom', at: 'center top-1' },
      "tooltipClass": "top esper-tooltip"
    });

    size.tooltip({
      show: { delay: 500, effect: "none" },
      hide: { effect: "none" },
      "content": "Minimize",
      "position": { my: 'center bottom', at: 'center top-1' },
      "tooltipClass": "top esper-tooltip"
    });

    function toggleOptions() {
      if (options.hasClass("open")) {
        dismissDropdowns();
        options.tooltip("enable");
      } else {
        dismissDropdowns();
        options
          .addClass("open")
          .tooltip("disable");
        dropdown.show();
      }
    }

    function toggleSidebar() {
      if (sidebar.css("display") === "none") {
        wrap.fadeIn(250);
        sizeIcon.addClass("esper-minimize");
        size.tooltip("option", "content", "Minimize");
        sidebar.show("slide", { direction: "down" }, 250);
      } else {
        wrap.fadeOut(250);
        sizeIcon.removeClass("esper-minimize");
        size.tooltip("option", "content", "Maximize");
        sidebar.hide("slide", { direction: "down" }, 250);
      }
    }

    options.click(toggleOptions);
    size.click(toggleSidebar);

    settings.click(function() {
      window.open(Conf.Api.url);
    })
    signOut.click(function() {
      if (sidebar.css("display") !== "none")
        sidebar.hide("slide", { direction: "down" }, 250);
      view.fadeOut(250).delay(250);
      Login.logout();
      Menu.create();
    });

    rootElement.append(view);
  }

  function displaySidebar(rootElement,
                          team: ApiT.Team,
                          linkedEvents: ApiT.LinkedCalendarEvents) {
'''
<div #view class="esper-sidebar">
  <div class="esper-tabs-container">
    <ul class="esper-tab-links">
      <li #tab1 class="esper-active esper-first">
        <object #calendar class="esper-svg esper-tab-icon"/>
      </li>
      <li #tab2>
        <object #polls class="esper-svg esper-tab-icon"/>
      </li>
      <li #tab3 class="esper-last">
        <object #person class="esper-svg esper-tab-icon"/>
      </li>
    </ul>
  </div>
  <div class="esper-tab-content">
    <div #content1 class="esper-tab esper-active"/>
    <div #content2 class="esper-tab"/>
    <div #content3 class="esper-tab"/>
  </div>
</div>
'''
    var tabs = [tab1, tab2, tab3];
    var tabContents = [content1, content2, content3];

    function switchTab(on: number, off: number[]) {
      List.iter(off, function(i) {
        tabContents[i].hide().removeClass("esper-active");
        tabs[i].removeClass("esper-active");
      });
      tabContents[on].show().addClass("esper-active");
      tabs[on].addClass("esper-active");
    }

    tab1.click(function() {
      switchTab(0, [1,2]);
    });
    tab2.click(function() {
      switchTab(1, [0,2]);
    });
    tab3.click(function() {
      switchTab(2, [0,1]);
    });

    calendar.attr("data", Init.esperRootUrl + "img/calendar.svg");
    polls.attr("data", Init.esperRootUrl + "img/polls.svg");
    person.attr("data", Init.esperRootUrl + "img/person.svg");

    CalTab.displayCalendarTab(content1, team, profiles, linkedEvents);
    Tab2Content.displayTab2ComingSoon(content2);
    Tab3Content.displayPreferencesTab(content3, team, profiles);

    rootElement.append(view);

    return view;
  }

  function displayUpdateDock(rootElement, url) {
'''
<div #view class="esper-dock-container">
  <div #dock class="esper-dock esper-update">
    Click here to update Esper.
  </div>
</div>
'''

    dock.click(function() {
      open(url, "_blank");
    });

    rootElement.append(view);
  }

  function getTeamProfiles(team: ApiT.Team): JQueryPromise<ApiT.Profile[]> {
    var teamMembers = List.copy(team.team_assistants);
    teamMembers.push(team.team_executive);
    var l =
      List.map(teamMembers, function(uid) {
        return Api.getProfile(uid, team.teamid);
      });
    return Promise.join(l);
  }

  function getAllProfiles(teams : ApiT.Team[])
    : JQueryPromise<ApiT.Profile[][]>
  {
    var profileLists =
      List.map(teams, function(team) {
        return getTeamProfiles(team);
      });
    return Promise.join(profileLists);
  }

  function displayTeamSidebar(rootElement,
                              team: ApiT.Team,
                              isCorrectTeam: boolean,
                              threadId,
                              profiles) {
    Log.d("displayTeamSidebar()");
    currentTeam = team;
    rootElement.children().remove();
    Api.checkVersion().done(function(status_) {
      if (status_.must_upgrade === true) {
        displayUpdateDock(rootElement, status_.download_page);
      } else {
        Api.getLinkedEvents(team.teamid, threadId, team.team_calendars)
          .done(function(linkedEvents) {
            var sidebar = displaySidebar(rootElement, team, linkedEvents);
            displayDock(rootElement, sidebar, team, isCorrectTeam, profiles);
            sidebar.show("slide", { direction: "down" }, 250);
        });
      }
    });
  }

  /* We do something if we detect a new msg ID. */
  function maybeUpdateView(profiles) {
    function retry() {
      Log.d("Trying to display Esper sidebar...");
      var emailData = esperGmail.get.email_data();

      if (emailData !== undefined && emailData.first_email !== undefined) {

        var rootElement = insertEsperRoot();
        if (rootElement === undefined) {
          return false;
        }
        else {
          var threadId = emailData.first_email;
          currentThreadId = threadId;
          var subject = emailData.subject;
          Log.d("Using new thread ID " + threadId + "; Subject: " + subject);
          ActiveThreads.handleNewActiveThread(threadId, subject);

          var teams = Login.myTeams();
          Thread.detectTeam(teams, emailData)
            .done(function(team) {
              Log.d("Detected team:", team);

              if (team === undefined && teams.length === 1) {
                Log.w("Team not detected, using one and only team.");
                team = teams[0];
              }

              var correctTeam = team !== undefined;

              if (!correctTeam && teams.length >= 1) {
                Log.w("Team not detected, defaulting to arbitrary team.");
                team = teams[0];
              }

              if (team !== undefined)
                displayTeamSidebar(rootElement, team,
                                   correctTeam, threadId, profiles);
            });
          return true;
        }
      }
      else
        return false;
    }

    Util.repeatUntil(20, 500, retry);
  }

  function listen(profiles) {
    esperGmail.on.open_email(function(id, url, body, xhr) {
      Log.d("Opened email " + id, url, body);
      maybeUpdateView(profiles);
    });
    window.onhashchange = function() {
      Log.d("URL changed");
      currentThreadId = null;
      maybeUpdateView(profiles);
    };
  }

  var alreadyInitialized = false;

  export function init() {
    if (! alreadyInitialized) {
      alreadyInitialized = true;
      Log.d("Sidebar.init()");
      Profile.getAllProfiles(Login.myTeams()).done(function(profLists) {
        profiles = List.concat(profLists);
        Log.d(profiles);
        listen(profiles);
        maybeUpdateView(profiles);
      });
    }
  }
}
