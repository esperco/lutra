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
    if (!$(e.target).hasClass("esper-click-safe")) {
      dismissDropdowns();
    }
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

  function displayTeamSelector(teamsSection,
                               team: ApiT.Team,
                               onTeamSwitch:
                                 (newTeam: ApiT.Team) => void) {
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

    CurrentThread.team.get().match({
      some : function (myTeam) {
        if (team.teamid === myTeam.teamid) {
          selector.addClass("esper-selected");
          teamCheck.attr("data", Init.esperRootUrl + "img/check.svg");
        } else {
          teamNotSelected()
        }
      },
      none : function () {
        teamNotSelected();
      }
    });

    function teamNotSelected() {
      teamCheck.hide();
      selector.click(function() { onTeamSwitch(team); });
    }

    teamsSection.append(selector);
  }

  function displayDock(rootElement, sidebar, isCorrectTeam: boolean) {
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

    function onTeamSwitch(toTeam: ApiT.Team) {
      CurrentThread.setTeam(Option.wrap(toTeam));

      dismissDropdowns();
      wrap.fadeOut(250);
      sizeIcon.removeClass("esper-minimize");
      sidebar.hide("slide", { direction: "down" }, 250);
      wrap.fadeIn(250);
      sizeIcon.addClass("esper-minimize");
      sidebar.show("slide", { direction: "down" }, 250);

      function afterAnimation() {
        displayTeamSidebar(rootElement, true, false);
      }
      setTimeout(afterAnimation, 250);
    }

    var teams = Login.myTeams().slice(0); // make a copy
    teams.sort(function(t1, t2) {
      if (t1.team_name > t2.team_name) return 1;
      else if (t2.team_name > t1.team_name) return -1;
      else return 0;
    });
    teams.forEach(function(team) {
      displayTeamSelector(teamsSection, team, onTeamSwitch);
    });

    CurrentThread.team.get().match({
      some : function (team) {
        // note if name is not set so that the assistant can fix it
        var name = team.team_name || "Team name not set";
        teamName.text(name);
      },
      none : function () {
        teamName.text("UNKNOWN TEAM");
      }
    });

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
      if (sidebar.css("display") !== "none") {
        sidebar.hide("slide", { direction: "down" }, 250);
      }
      view.fadeOut(250).delay(250);
      Login.logout();
      Menu.create();
    });

    CurrentThread.team.get().match({
      some : function (team) {
        Api.getCustomerStatus(team.teamid).done(function(customer) {
          var sub = customer.status;

          if (sub === "Past_due" || sub === "Canceled" ||
              sub === "Unpaid" || sub === undefined) {
            view.removeClass("esper-team-warning")
                .addClass("esper-team-danger");
          } else if (!isCorrectTeam) {
            view.addClass("esper-team-warning")
                .removeClass("esper-team-danger");
          } else {
            view.removeClass("esper-team-warning")
                .removeClass("esper-team-danger");
          }

          rootElement.append(view);
        });
      },
      none : function () {
        rootElement.append(view);
      }
    });
  }

  function displaySidebar(rootElement,
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

    CurrentThread.team.get().match({
      some : function  (team) {
        TaskTab.displayTaskTab(taskContent, team, threadId,
                               autoTask, linkedEvents);
        userContent.append(UserTab.viewOfUserTab(team).view);
        GroupScheduling.afterInitialize(function () {
          groupContent.append(GroupTab.container());
        });
      },
      none : function () {
        // Don't display sidebar if no team is set.
      }
    });

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
                              isCorrectTeam: boolean,
                              autoTask: boolean) {
    var threadId = CurrentThread.threadId.get();
    Log.d("displayTeamSidebar() for thread", threadId);

    rootElement.children().remove();
    Api.checkVersion().done(function(status_) {
      if (status_.must_upgrade) {
        displayUpdateDock(rootElement, status_.download_page);
      } else {
        CurrentThread.team.get().match({
          some : function (team) {
            Api.getLinkedEvents(team.teamid, threadId, team.team_calendars)
              .done(function(linkedEvents) {
                var sidebar = displaySidebar(rootElement, threadId, autoTask, linkedEvents);
                displayDock(rootElement, sidebar, isCorrectTeam);
                sidebar.show("slide", { direction: "down" }, 250);
              });
          },
          none : function () {
            var sidebar = displaySidebar(rootElement, threadId, autoTask, []);
            displayDock(rootElement, sidebar, isCorrectTeam);
            $(".esper-dock-wrap").hide();
          }
        });
      }
    });
  }

  /* We do something if we detect a new msg ID. */
  function maybeUpdateView() {
    function retry() {
      Log.d("Trying to display Esper sidebar...");
      var rootElement = insertEsperRoot();
      if (rootElement === undefined) {
        return false;
      } else {
        var threadId = CurrentThread.threadId.get();

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

        // TODO: Remove autotask logic from Sidebar.ts?
        var autoTask = CurrentThread.hasMessageFromExecutive();

        // TODO: Determine whether the team is "correct" (?)
        var correctTeam = true;

        CurrentThread.team.get().match({
          some : function (team) {
            displayTeamSidebar(rootElement, correctTeam, autoTask);
          },
          none : function () {
            if (teams.length === 1) {
              Log.w("Team not detected, using one and only team.");
              CurrentThread.setTeam(Option.wrap(teams[0]));
            }

            displayTeamSidebar(rootElement, correctTeam, autoTask);
          }
        });

        return true;
      }
    }

    Util.repeatUntil(20, 500, retry);
  }

  var initJob: JQueryPromise<void>;

  export function init(): JQueryPromise<void> {
    if (initJob) {
      return initJob;
    } else {
      Log.d("Initializing sidebar");
      initJob = Teams.initialize().done(function() {
        Log.d("Sidebar.init()");

        CurrentThread.threadId.watch(function (newThreadId) {
          maybeUpdateView();
        });

        maybeUpdateView();
      });

      return initJob;
    }
  }
}
