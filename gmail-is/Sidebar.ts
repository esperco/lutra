/*
  Gmail thread view
*/
module Esper.Sidebar {
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
    var profile = Teams.getProfile(team.team_executive);
    var email = profile && profile.email;

    teamName.text(team.team_name);
    teamExecEmail.text(email || "unknown email");

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
                       isCorrectTeam: boolean) {
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
      CurrentThread.setTeam(toTeam);

      dismissDropdowns();
      wrap.fadeOut(250);
      sizeIcon.removeClass("esper-minimize");
      sidebar.hide("slide", { direction: "down" }, 250);
      wrap.fadeIn(250);
      sizeIcon.addClass("esper-minimize");
      sidebar.show("slide", { direction: "down" }, 250);

      function afterAnimation() {
        displayTeamSidebar(rootElement, toTeam, true, false, threadId);
      }
      setTimeout(afterAnimation, 250);
    }

    var teams = Login.myTeams().slice(0); // make a copy
    teams.sort(function(t1, t2) {
      if (t1.team_name > t2.team_name) return 1;
      else if (t2.team_name > t1.team_name) return -1;
      else return 0;
    });
    teams.forEach(function(otherTeam) {
      displayTeamSelector(teamsSection, team, otherTeam, onTeamSwitch);
    });


    if (team === undefined)
      teamName.text("UNKNOWN TEAM");
    else {
      // note if name is not set so that the assistant can fix it
      var name = team.team_name || "Team name not set";
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
      <li class="esper-active esper-first esper-sidebar-task-tab">Task</li>
      <li class="esper-sidebar-user-tab">User</li>
      <li class="esper-last esper-sidebar-group-tab">Group</li>
    </ul>
  </div>
  <div class="esper-tab-content">
    <div #taskContent class="esper-tab esper-active"/>
    <div #userContent class="esper-tab"/>
    <div #groupContent class="esper-tab"/>
  </div>
</div>
'''
    var tabs = view.find(".esper-tab-links > li");
    var tabContents = view.find(".esper-tab-content > div");

    function switchTab(active: number) {
      tabs.each(function (i, tab) {
        tabContents.eq(i).hide().removeClass("esper-active");
        $(tab).removeClass("esper-active");
      });
      
      tabContents.eq(active).show().addClass("esper-active");
      tabs.eq(active).addClass("esper-active");
    }

    tabs.each(function (i, tab) {
      $(tab).click(function () { console.log(i); switchTab(i) });
    });

    if (team !== undefined) {
      TaskTab.displayTaskTab(taskContent, team, threadId, autoTask, linkedEvents);
      userContent.append(UserTab.viewOfUserTab(team).view);
      GroupScheduling.afterInitialize(function () {
        groupContent.append(GroupTab.container());
      });
    }

    rootElement.append(view);

    return view;
  }

  export function selectTaskTab() {
    $(".esper-sidebar-task-tab").click();
  }

  export function selectUserTab() {
    $(".esper-sidebar-user-tab").click();
  }

  export function selectGroupTab() {
    $(".esper-sidebar-group-tab").click();
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
                              threadId) {
    Log.d("displayTeamSidebar()");
    if (team !== undefined) CurrentThread.setTeam(team);
    rootElement.children().remove();
    Api.checkVersion().done(function(status_) {
      if (status_.must_upgrade === true) {
        displayUpdateDock(rootElement, status_.download_page);
      } else if (team === undefined) {
        var sidebar = displaySidebar(rootElement, team, threadId,
                                     autoTask, []);
        displayDock(rootElement, sidebar, team, threadId, isCorrectTeam);
        $(".esper-dock-wrap").hide();
      } else {
        Api.getLinkedEvents(team.teamid, threadId, team.team_calendars)
          .done(function(linkedEvents) {
            var sidebar = displaySidebar(rootElement, team, threadId,
                                         autoTask,
                                         linkedEvents);
            displayDock(rootElement, sidebar, team, threadId, isCorrectTeam);
            sidebar.show("slide", { direction: "down" }, 250);
        });
      }
    });
  }

  /* Look for a team that has a task for the given thread.
   * If there are multiple such teams, return the first one. */
  export function findTeamWithTask(teams : ApiT.Team[], threadId : string) {
    return Api.getTaskListForThread(threadId, false, false)
      .then(function(tasks) {
        var hasTask = tasks.length > 0;
        if (hasTask) {
          var task = tasks[0];
          return List.find(teams, function(team) {
            return team.teamid === task.task_teamid;
          });
        }
        else
          return undefined;
      });
  }

  /* We do something if we detect a new msg ID. */
  function maybeUpdateView() {
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
          CurrentThread.setThreadId(threadId);
          var subject = emailData.subject;
          Log.d("Using new thread ID " + threadId + "; Subject: " + subject);
          ActiveThreads.handleNewActiveThread(threadId, subject);

          var links = $("div").find("a");
          var threadLinks = List.filter(links, function(link) {
            var url = $(link).attr("href");
            if (typeof url === "string") {
              return url.substring(0,30) === "http://mail.google.com/mail/u/";
            } else {
              return false;
            }
          });
          List.iter(threadLinks, function(link) {
            var url = $(link).attr("href");
            var len = url.length;
            $(link).click(function(e) {
              e.stopPropagation();
              window.location.hash = "#all/" + url.substring(len - 16, len);
              return false;
            });
          });

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
                  displayTeamSidebar(rootElement, team, correctTeam, autoTask, threadId);
                });
              } else if (correctTeam) {
                displayTeamSidebar(rootElement, team, correctTeam, autoTask, threadId);
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

  function listen() {
    esperGmail.on.open_email(function(id, url, body, xhr) {
      Log.d("Opened email " + id, url, body);
      maybeUpdateView();
    });
    window.onhashchange = function() {
      Log.d("URL changed");
      CurrentThread.setThreadId(null);
      maybeUpdateView();
    };
  }

  var alreadyInitialized = false;

  export function init() {
    if (!alreadyInitialized) {
      alreadyInitialized = true;
      Teams.initialize();
      Log.d("Sidebar.init()");
      listen();
      maybeUpdateView();
    }
  }
}
