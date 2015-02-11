/*
  Gmail thread view
*/
module Esper.Sidebar {

  // TODO: Move this somewhere more logical!
  export var profiles : ApiT.Profile[];

  // TODO: ditto
  export function customizeSelectArrow(selector) {
    var imageUrl = Init.esperRootUrl + "img/select-arrow.svg";
    selector.css("background-image", "url(" + imageUrl + ")");
  }

  export function toggleList(container) {
    if (container.css("display") === "none") {
      container.slideDown("fast");
    } else {
      container.slideUp("fast");
    }
  }

  /* This is a global operation that affects all the possible dropdowns.
     TODO: move to a module with global stuff
     TODO: let each module provide its own local dismissDropdowns()
           (we should not depend on their implementation details here)
  */
  export function dismissDropdowns() {
    $(".esper-drop-ul").hide();
    $(".esper-menu-bg").hide();
    $(".esper-menu-caret").hide();
    $(".esper-tl-caret").hide();
    $(".esper-dropdown-btn").removeClass("esper-open");
  }

  $(document).on('click', function(e) {
    if (!$(e.target).hasClass("esper-click-safe"))
      dismissDropdowns();
  });

  function removeEsperRoot() {
    $("#esper").remove();
  }

  function insertEsperRoot() {
    Gmail.removeWebClipBanner();
    removeEsperRoot();
    var anchor = Gmail.findSidebarAnchor();
    if (anchor.length === 1) {
      var root = $("<div id='esper'/>");
      anchor.prepend(root);
      return root;
    }
  }

  function displayTeamSelector(teamsSection, myTeam, team, onTeamSwitch) {
'''
<li #selector class="esper-click-safe esper-li">
  <object #teamCheck class="esper-svg esper-click-safe esper-team-checkmark"/>
  <div #teamName class="esper-click-safe"/>
  <div #teamExecEmail class="esper-click-safe esper-team-exec-email"/>
</li>
'''
    var exec = List.find(profiles, function(prof) {
      return prof.profile_uid === team.team_executive;
    });
    teamName.text(team.team_name);
    teamExecEmail.text(exec.email);

    if (myTeam !== undefined && team.teamid === myTeam.teamid) {
      selector.addClass("esper-selected");
      teamCheck.attr("data", Init.esperRootUrl + "img/check.svg");
    } else {
      teamCheck.hide();
      selector.click(function() { onTeamSwitch(team); });
    }

    teamsSection.append(selector);
  }

  function displayDock(rootElement, sidebar,
                       team: ApiT.Team,
                       threadId: string,
                       isCorrectTeam: boolean,
                       profiles) {
'''
<div #view class="esper-dock-container">
  <div #wrap class="esper-dock-wrap">
    <div #wrapLeft class="esper-dock-wrap-left"/>
    <div #wrapRight class="esper-dock-wrap-right"/>
  </div>
  <ul #dropdown class="esper-drop-ul esper-options-menu">
    <div #teamsSection class="esper-dropdown-section">
      <li class="esper-click-safe esper-li esper-bold
                 esper-disabled esper-team-list-title">
        Users
      </li>
    </div>
    <div class="esper-click-safe esper-drop-ul-divider"/>
    <div class="esper-dropdown-section">
      <li #settings class="esper-li">Settings</li>
      <a #help class="esper-a" href="mailto:team@esper.com">Help</a>
      <li #signOut class="esper-li esper-danger">Sign out</li>
    </div>
    <div class="esper-click-safe esper-drop-ul-divider"/>
    <div class="esper-click-safe esper-dropdown-section esper-dropdown-footer">
      <object #logo
              class="esper-svg esper-click-safe esper-dropdown-footer-logo"/>
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
    dropdown.css("max-height", $(window).height() - 100);
    dropdown.css("overflow", "auto");

    function onTeamSwitch(toTeam) {
      CurrentThread.team.set(toTeam);

      dismissDropdowns();
      wrap.fadeOut(250);
      sizeIcon.removeClass("esper-minimize");
      sidebar.hide("slide", { direction: "down" }, 250);
      wrap.fadeIn(250);
      sizeIcon.addClass("esper-minimize");
      sidebar.show("slide", { direction: "down" }, 250);

      function afterAnimation() {
        displayTeamSidebar(rootElement, toTeam, true, false,
                           threadId, profiles);
      }
      setTimeout(afterAnimation, 250);
    }

    Login.myTeams().forEach(function(otherTeam) {
      displayTeamSelector(teamsSection, team, otherTeam, onTeamSwitch);
    });


    if (team === undefined)
      teamName.text("UNKNOWN TEAM");
    else {
      var name = team.team_name;
      if (name === null || name === undefined) {
        var execProf = profiles[team.team_executive];
        if (execProf !== null && execProf !== undefined)
          name = execProf.display_name;
      }
      teamName.text(name);
    }

    logo.attr("data", Init.esperRootUrl + "img/footer-logo.svg");

    options.tooltip({
      show: { delay: 500, effect: "none" },
      hide: { effect: "none" },
      "content": "Options",
      "position": { my: 'center bottom', at: 'center top-1' },
      "tooltipClass": "esper-top esper-tooltip"
    });

    size.tooltip({
      show: { delay: 500, effect: "none" },
      hide: { effect: "none" },
      "content": "Minimize",
      "position": { my: 'center bottom', at: 'center top-1' },
      "tooltipClass": "esper-top esper-tooltip"
    });

    function toggleOptions() {
      if (options.hasClass("esper-open")) {
        dismissDropdowns();
        options.tooltip("enable");
      } else {
        dismissDropdowns();
        options
          .addClass("esper-open")
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

    if (team !== undefined) {
      Api.getCustomerStatus(team.teamid).done(function(customer) {
        var sub = customer.status;
        if (sub === "Past_due" || sub === "Canceled"
            || sub === "Unpaid" || sub === undefined)
          view.removeClass("esper-team-warning")
              .addClass("esper-team-danger");
        else if (!isCorrectTeam)
          view.addClass("esper-team-warning")
              .removeClass("esper-team-danger");
        else
          view.removeClass("esper-team-warning")
              .removeClass("esper-team-danger");

        rootElement.append(view);
      });
    } else {
      rootElement.append(view);
    }
  }

  function displaySidebar(rootElement,
                          team: ApiT.Team,
                          threadId: string,
                          autoTask: boolean,
                          linkedEvents: ApiT.EventWithSyncInfo[]) {
'''
<div #view class="esper-sidebar">
  <div class="esper-tabs-container">
    <ul class="esper-tab-links">
      <li #tab1 class="esper-active esper-first">Task</li>
      <li #tab2 class="esper-last">User</li>
    </ul>
  </div>
  <div class="esper-tab-content">
    <div #content1 class="esper-tab esper-active"/>
    <div #content2 class="esper-tab"/>
  </div>
</div>
'''
    var tabs = [tab1, tab2];
    var tabContents = [content1, content2];

    function switchTab(on: number, off: number[]) {
      List.iter(off, function(i) {
        tabContents[i].hide().removeClass("esper-active");
        tabs[i].removeClass("esper-active");
      });
      tabContents[on].show().addClass("esper-active");
      tabs[on].addClass("esper-active");
    }

    tab1.click(function() {
      switchTab(0, [1]);
    });
    tab2.click(function() {
      switchTab(1, [0]);
    });

    if (team !== undefined) {
      TaskTab.displayTaskTab(content1, team, threadId,
                             autoTask, profiles, linkedEvents);
      content2.append(UserTab.viewOfUserTab(team, profiles).view);
    }

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

  function displayTeamSidebar(rootElement,
                              team: ApiT.Team,
                              isCorrectTeam: boolean,
                              autoTask: boolean,
                              threadId,
                              profiles) {
    Log.d("displayTeamSidebar()");
    if (team !== undefined) CurrentThread.team.set(team);
    rootElement.children().remove();
    Api.checkVersion().done(function(status_) {
      if (status_.must_upgrade === true) {
        displayUpdateDock(rootElement, status_.download_page);
      } else if (team === undefined) {
        var sidebar = displaySidebar(rootElement, team, threadId,
                                     autoTask, []);
        displayDock(rootElement, sidebar, team, threadId,
                    isCorrectTeam, profiles);
        $(".esper-dock-wrap").hide();
      } else {
        Api.getLinkedEvents(team.teamid, threadId, team.team_calendars)
          .done(function(linkedEvents) {
            var sidebar = displaySidebar(rootElement, team, threadId,
                                         autoTask,
                                         linkedEvents);
            displayDock(rootElement, sidebar, team, threadId,
                        isCorrectTeam, profiles);
            sidebar.show("slide", { direction: "down" }, 250);
        });
      }
    });
  }

  /* Look for a team that has a task for the given thread.
   * If there are multiple such teams, return the first one. */
  function findTeamWithTask(teams : ApiT.Team[], threadId : string) {
    var getTaskCalls = List.map(teams, function(team) {
      return Api.getTaskForThread(team.teamid, threadId, false, false);
    });
    return Promise.join(getTaskCalls).then(function(teamTasks) {
      var hasTask = List.find(teamTasks, function(taskOpt) {
        return taskOpt !== undefined;
      });
      if (hasTask !== null)
        return List.find(teams, function(team) {
          return team.teamid === hasTask.task_teamid;
        });
      else return undefined;
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
          CurrentThread.threadId.set(threadId);
          var subject = emailData.subject;
          Log.d("Using new thread ID " + threadId + "; Subject: " + subject);
          ActiveThreads.handleNewActiveThread(threadId, subject);

          var teams = Login.myTeams();
          Thread.detectTeam(teams, emailData)
            .done(function(x: Thread.DetectedTeam) {
              Log.d("Detected team:", x);
              var team =
                x === undefined ? undefined : x.team;
              var hasMsgFromExec =
                x === undefined ? false : x.hasMsgFromExec;

              var autoTask = hasMsgFromExec;

              if (team === undefined && teams.length === 1) {
                Log.w("Team not detected, using one and only team.");
                team = teams[0];
              }

              var correctTeam = team !== undefined;

              if (!correctTeam && teams.length >= 1) {
                /* If we can't detect the team based on the sender's email,
                 * check if one of our teams has an existing task for this
                 * thread. */
                findTeamWithTask(teams, threadId).done(function(foundTeam) {
                  if (foundTeam === undefined) {
                    Log.w("Team not detected.");
                  } else {
                    Log.w("Selected team based on already existing task.");
                    correctTeam = true;
                    team = foundTeam;
                  }
                  displayTeamSidebar(rootElement, team, correctTeam,
                                     autoTask, threadId, profiles);
                });
              } else if (team !== undefined) {
                displayTeamSidebar(rootElement, team, correctTeam,
                                   autoTask, threadId, profiles);
              }
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
      CurrentThread.threadId.set(null);
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
