/*
  Gmail thread view
*/

/// <reference path="../marten/ts/JQStore.ts" />

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

  function removeEsperRoot() {
    $("#esper").remove();
  }

  function insertEsperRoot() {
    removeEsperRoot();
    var anchor = Gmail.findSidebarAnchor();
    if (anchor.length === 1) {
      var root = $("<div id='esper' class='esper'/>");
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

    CurrentThread.currentTeam.get().match({
      some : function (myTeam) {
        if (team.teamid === myTeam.teamid) {
          selector.addClass("esper-selected");
          teamCheck.attr("data", Init.esperRootUrl + "img/check.svg");
        } else {
          teamNotSelected();
        }
      },
      none : function () {
        teamNotSelected();
      }
    });

    function teamNotSelected() {
      teamCheck.hide();
      selector.click(function() {
        onTeamSwitch(team);
        Analytics.track(Analytics.Trackable.ChangeSidebarTeam);
      });
    }

    teamsSection.append(selector);
  }

  /* Check preferences on whether to display sidebar */
  function shouldDisplaySidebar(): boolean {
    var threadId = CurrentThread.threadId.get();
    if (!threadId) { return false; }

    var data = ThreadState.store.get(threadId);
    var show = ExtensionOptions.SidebarOpts.SHOW;
    if (data) {
      return data[0] === show;
    } else {
      var defaultState = ExtensionOptions.store.get();
      return (defaultState && defaultState[0].defaultSidebarState === show);
    }
  }

  // Module level references to jQuery sidebar elements (these get set by
  // the displayDock function and cleaned up on de-render so we don't have
  // to worry about memory leaks)
  var sidebarElms = {
    wrap:     new JQStore(),
    sizeIcon: new JQStore(),
    size:     new JQStore(),
    sidebar:  new JQStore()
  };

  function showSidebar() {
    var wrap = sidebarElms.wrap.get();
    var size = sidebarElms.size.get();
    var sizeIcon = sidebarElms.sizeIcon.get();
    var sidebar = sidebarElms.sidebar.get();

    if (!sidebar.is(":visible")) {
      wrap.fadeIn(250);
      sizeIcon.addClass("esper-minimize");
      size.tooltip("option", "content", "Minimize");
      sidebar.show("slide", { direction: "down" }, 250);
    }
  }

  function hideSidebar() {
    var wrap = sidebarElms.wrap.get();
    var size = sidebarElms.size.get();
    var sizeIcon = sidebarElms.sizeIcon.get();
    var sidebar = sidebarElms.sidebar.get();

    if (sidebar.is(":visible")) {
      wrap.fadeOut(250);
      sizeIcon.removeClass("esper-minimize");
      size.tooltip("option", "content", "Maximize");
      sidebar.hide("slide", { direction: "down" }, 250);
    }
  }

  /* Listen to ThreadState changes and hide/show sidebar as appropriate.
     Call during init.
  */
  function listenToThreadState() {
    ThreadState.store.addChangeListener(function() {
      if (shouldDisplaySidebar()) {
        showSidebar();
      } else {
        hideSidebar();
      }
    });
  }

  /* Manipulate ThreadState for current thread */
  function setCurrentThreadState(state: ExtensionOptions.SidebarOpts) {
    var currentThreadId = CurrentThread.threadId.get();
    if (currentThreadId) {
      ThreadState.store.upsert(currentThreadId, state);
    }
  }

  function toggleSidebar() {
    if (shouldDisplaySidebar()) {
      setCurrentThreadState(ExtensionOptions.SidebarOpts.HIDE);
      Analytics.track(Analytics.Trackable.MinimizeSidebar);
    } else {
      setCurrentThreadState(ExtensionOptions.SidebarOpts.SHOW);
      Analytics.track(Analytics.Trackable.MaximizeSidebar);
    }
  }

  function displayDock(rootElement, sidebar) {
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
        <a #privacy href="http://esper.com/privacypolicy.html">Privacy</a>
        <div class="esper-click-safe esper-dropdown-footer-divider"/>
        <a #terms href="http://esper.com/termsofuse.html">Terms</a>
        <div class="esper-click-safe esper-dropdown-footer-divider"/>
        <span class="esper-click-safe esper-copyright">&copy; 2015 Esper</span>
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

    sidebarElms.sidebar.set(sidebar);
    sidebarElms.wrap.set(wrap);
    sidebarElms.size.set(size);
    sidebarElms.sizeIcon.set(sizeIcon);

    function onTeamSwitch(toTeam: ApiT.Team) {
      CurrentThread.setTeam(Option.wrap(toTeam));
      CurrentThread.refreshTaskForThread(false);

      dismissDropdowns();
      var timeout = 0;
      if (sidebar.is(":visible")) {
        hideSidebar();
        timeout = 250;
      }

      // Team switch => treat as if user's explicitly chosen to show sidebar
      setCurrentThreadState(ExtensionOptions.SidebarOpts.SHOW);

      function afterAnimation() {
        displayTeamSidebar(rootElement);
      }
      setTimeout(afterAnimation, timeout);
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

    CurrentThread.currentTeam.get().match({
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
        Analytics.track(Analytics.Trackable.MinimizeSidebarOptions);
      } else {
        dismissDropdowns();
        options
          .addClass("esper-open")
          .tooltip("disable");
        dropdown.show();
        Analytics.track(Analytics.Trackable.MaximizeSidebarOptions);
      }
    }

    // Start with sidebar wrap in "off" state
    wrap.hide();

    options.click(toggleOptions);
    size.click(toggleSidebar);
    settings.click(function() {
      window.open(Conf.Api.url);
      Analytics.track(Analytics.Trackable.ClickSidebarOptionsSettings);
    })
    signOut.click(function() {
      if (sidebar.css("display") !== "none") {
        sidebar.hide("slide", { direction: "down" }, 250);
      }
      view.fadeOut(250).delay(250);
      Login.logout();
      Menu.create();
    });

    privacy.click(function() {
      Analytics.track(Analytics.Trackable.ClickSidebarPrivacyPolicy);
    });

    terms.click(function() {
      Analytics.track(Analytics.Trackable.ClickSidebarTermsOfUse);
    });

    var insertDock = function(someTeam=true) {
      rootElement.append(view);
      if (someTeam && shouldDisplaySidebar()) {
        showSidebar();
      } else {
        hideSidebar();
      }
    };

    CurrentThread.currentTeam.get().match({
      some : function (team) {
        insertDock(true);
      },
      none: function() {
        insertDock(false);
      }
    });
  }

  function displaySidebar(rootElement,
                          threadId: string,
                          linkedEvents: ApiT.TaskEvent[]) {
'''
<div #view class="esper-sidebar">
  <div class="esper-tabs-container">
    <ul class="esper-tab-links">
      <li #taskTab class="esper-active esper-first esper-sidebar-task-tab">Task</li>
      <li #peopleTab class="esper-sidebar-people-tab">People</li>
    </ul>
  </div>
  <div class="esper-tab-content">
    <div #taskContent class="esper-tab esper-active"/>
    <div #peopleContent class="esper-tab esper-people-tab-content"/>
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
      $(tab).click(function() { Log.d("Switch to tab " + i); switchTab(i); });
    });

    taskTab.click(function() {
      Analytics.track(Analytics.Trackable.ClickTaskTab);
    });

    peopleTab.click(function() {
      Analytics.track(Analytics.Trackable.ClickPeopleTab);
    });

    CurrentThread.currentTeam.get().match({
      some : function  (team) {
        Api.listWorkflows(team.teamid).done(function(response) {
          var workflows = response.workflows;
          var peopleTabContent = PeopleTab.viewOfPeopleTab(team);
          peopleContent.append(peopleTabContent.view);
          TaskTab.displayTaskTab(taskContent, team, threadId,
                                 linkedEvents,
                                 workflows, peopleTabContent);
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

  export function selectPeopleTab() {
    $(".esper-sidebar-people-tab").click();
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

  function displayTeamSidebar(rootElement) {
    var threadId = CurrentThread.threadId.get();
    Log.d("displayTeamSidebar() for thread", threadId);
    rootElement.children().remove();
    CurrentThread.currentTeam.get().match({
      some : function (team) {
        Api.getLinkedEvents(team.teamid, threadId, team.team_calendars)
          .done(function(linkedEvents) {
            var sidebar = displaySidebar(rootElement, threadId, linkedEvents);
            displayDock(rootElement, sidebar);
          });
      },
      none : function () {
        var sidebar = displaySidebar(rootElement, threadId, []);
        displayDock(rootElement, sidebar);
      }
    });
  }

  /* We do something if we detect a new msg ID. */
  function maybeUpdateView() {
    // Don't draw sidebar if opt out of displaying
    var defaultState = ExtensionOptions.store.val();
    if (defaultState && defaultState.defaultSidebarState ===
        ExtensionOptions.SidebarOpts.NONE) {
      return;
    }

    // Don't draw sidebar if no thread id
    var threadId = CurrentThread.threadId.get();
    if (! threadId) {
      Log.d("No threadId -- hiding Esper sidebar");
      removeEsperRoot();
      Gmail.composePopups().removeClass("esper-sidebar-active");
    }

    else {
      var rootElement = insertEsperRoot();
      if (rootElement === undefined) {
        return false;
      } else {
        Gmail.composePopups().addClass("esper-sidebar-active");
        var teams = Login.myTeams();
        CurrentThread.currentTeam.get().match({
          some : function (team) {
            displayTeamSidebar(rootElement);
          },
          none : function () {
            if (teams.length === 1) {
              Log.w("Team not detected, using one and only team.");
              CurrentThread.setTeam(Option.wrap(teams[0]));
            }

            displayTeamSidebar(rootElement);
          }
        });
      }
    }

    // Fix compose menu bar on popups -- run after everything else done
    // so offsets are correct before calling
    window.requestAnimationFrame(Gmail.adjustPopups);
  }

  var initJob: JQueryPromise<void>;

  export function init(): JQueryPromise<void> {
    $(document).on('click', function(e) {
      if (!$(e.target).hasClass("esper-click-safe")) {
        dismissDropdowns();
      }
    });

    if (initJob) {
      return initJob;
    } else {
      Log.d("Initializing sidebar");
      initJob = Teams.initialize().done(function() {
        Log.d("Sidebar.init()");

        CurrentThread.threadId.watch(function (newThreadId, v, oldThreadId) {
          if (newThreadId !== oldThreadId) {
            maybeUpdateView();
            Log.i("Thread id changed; updating view. " + newThreadId);
          }
        });
        listenToThreadState();

        CurrentThread.init();
      });

      return initJob;
    }
  }
}
