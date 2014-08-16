/*
  Gmail thread view
*/
module Esper.MsgView {
  export var currentThreadId : string;

  export function popWindow(url, width, height) {
    /* Allow for borders. */
    var leftPosition = (window.screen.width / 2) - ((width / 2) + 10);
    /* Allow for title and status bars. */
    var topPosition = (window.screen.height / 2) - ((height / 2) + 50);

    window.open(
      url, "Window2", "status=no,height="
        + height + ",width=" + width + ",resizable=yes,left="
        + leftPosition + ",top=" + topPosition + ",screenX="
        + leftPosition + ",screenY=" + topPosition
        + ",toolbar=no,menubar=no,scrollbars=no,location=no,directories=no");
  }

  export function dismissDropdowns() {
    $(".esper-ul").css("display", "none");
    $(".esper-menu-bg").css("display", "none");
    $(".esper-caret").css("display", "none");
    $(".esper-dropdown-btn").removeClass("open");
  }

  $(document).on('click', function(e) {
    if (!$(e.target).hasClass("esper-click-safe"))
      dismissDropdowns();
  });

  /* Find a good insertion point, on the right-hand side of the page. */
  function findAnchor() {
    var anchor = $(".nH.g.id");
    if (anchor.length !== 1) {
      Log.e("Cannot find anchor point for the Esper thread controls.");
      return $();
    }
    else
      return anchor;
  }

  function removeEsperRoot() {
    $("#esper").remove();
  }

  function insertEsperRoot() {
    removeEsperRoot();
    var anchor = findAnchor();
    var root = $("<div id='esper'/>");
    anchor.prepend(root);
    return root;
  }

  function displayDock(rootElement,
                       sidebar,
                       team: ApiT.Team,
                       profiles : ApiT.Profile[]) {
'''
<div #view class="esper-dock-container">
  <div #wrap class="esper-dock-wrap">
    <div #wrapLeft class="esper-dock-wrap-left"/>
    <div #wrapRight class="esper-dock-wrap-right"/>
  </div>
  <ul #dropdown class="esper-ul esper-options-menu">
    <div class="esper-dropdown-section">
      <li class="esper-click-safe esper-li disabled esper-team-list-title">
        TEAMS
      </li>
      <li class="esper-click-safe esper-li selected">
        <img #teamListCheck class="esper-click-safe esper-team-list-checkmark"/>
        <div #teamListName class="esper-click-safe esper-team-list-name"/>
        <div #teamListEmail class="esper-click-safe esper-team-list-email"/>
      </li>
      <li #example class="esper-li example">
        <img #teamListCheckEx class="esper-team-list-checkmark"/>
        <div class="esper-team-list-name">Another Exec</div>
        <div class="esper-team-list-email">anotherexec@company.com</div>
      </li>
    </div>
    <div class="esper-click-safe esper-ul-divider"/>
    <div class="esper-dropdown-section">
      <li #settings class="esper-li">Settings</li>
      <a #help class="esper-a" href="mailto:team@esper.com">Help</a>
      <li #signOut class="esper-li danger">Sign out</li>
    </div>
    <div class="esper-click-safe esper-ul-divider"/>
    <div class="esper-click-safe esper-dropdown-section esper-dropdown-footer">
      <a href="http://esper.com">
        <img #footerLogo class="esper-click-safe esper-footer-logo"/>
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
      <div #sizeIcon class="esper-dock-action-icon esper-size-icon minimize"/>
    </div>
  </div>
</div>
'''
  
    var name = team.team_name;
    if (name === null || name === undefined || name === "") {
      var exec = List.find(profiles, function(prof) {
        return prof.profile_uid === team.team_executive;
      });
      name = exec.display_name;
    }
    teamName.text(name);
    teamListName.text(name);
    teamListEmail.text("exec@company.com");
    teamListCheck.attr("src", Init.esperRootUrl + "img/check.png");
    teamListCheckEx.attr("src", Init.esperRootUrl + "img/check.png");
    teamListCheckEx.css("display", "none");

    footerLogo.attr("src", Init.esperRootUrl + "img/footer-logo.png");

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
        dropdown.toggle();
        options
          .addClass("open")
          .tooltip("disable");
      }
    }

    function toggleSidebar() {
      if (sidebar.css("display") === "none") {
        wrap.fadeIn(250);
        sizeIcon.addClass("minimize");
        size.tooltip("option", "content", "Minimize");
        sidebar.show("slide", { direction: "down" }, 250);
      } else {
        wrap.fadeOut(250);
        sizeIcon.removeClass("minimize");
        size.tooltip("option", "content", "Maximize");
        sidebar.hide("slide", { direction: "down" }, 250);
      }
    }

    options.click(toggleOptions);
    size.click(toggleSidebar);

    example.click(function() {
      wrap.fadeOut(250);
      sizeIcon.removeClass("minimize");
      sidebar.hide("slide", { direction: "down" }, 250);
      wrap.fadeIn(250);
      sizeIcon.addClass("minimize");
      sidebar.show("slide", { direction: "down" }, 250);
    })

    settings.click(function() {
      popWindow(Conf.Api.url, 545, 433);
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
                          profiles : ApiT.Profile[],
                          linkedEvents: ApiT.LinkedCalendarEvents) {
'''
<div #view class="esper-sidebar">
  <ul class="esper-tab-links">
    <li class="active"><a #tab1 href="#tab1">
      <img #calendar class="esper-tab-icon"/>
    </a></li>
    <li><a #tab2 href="#tab2"><img #polls class="esper-tab-icon"/></a></li>
    <li><a #tab3 href="#tab3"><img #person class="esper-tab-icon"/></a></li>
  </ul>
  <div class="esper-tab-content">
    <div #content1 id="tab1" class="tab active"/>
    <div #content2 id="tab2" class="tab"/>
    <div #content3 id="tab3" class="tab"/>
  </div>
</div>
'''

    tab1.click(function() {
      switchTab(tab1);
    })
    tab2.click(function() {
      switchTab(tab2);
    })
    tab3.click(function() {
      switchTab(tab3);
    })

    calendar.attr("src", Init.esperRootUrl + "img/calendar.png");
    polls.attr("src", Init.esperRootUrl + "img/polls.png");
    person.attr("src", Init.esperRootUrl + "img/person.png");

    function switchTab(tab) {
      var currentAttrValue = tab.attr("href");
      $('.esper-tab-content ' + currentAttrValue).show().siblings().hide();
      tab.parent('li').addClass('active').siblings().removeClass('active');
    };

    EvTab.displayLinkedEvents(content1, team, profiles, linkedEvents);
    Tab2Content.displayTab2ComingSoon(content2);
    Tab3Content.displayTab3ComingSoon(content3);

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

  function getTeamProfiles(team: ApiT.Team): JQueryDeferred<ApiT.Profile[]> {
    var teamMembers = List.copy(team.team_assistants);
    teamMembers.push(team.team_executive);
    var l =
      List.map(teamMembers, function(uid) {
        return Api.getProfile(uid, team.teamid);
      });
    return Deferred.join(l);
  }

  /* We do something if we detect a new msg ID. */
  function maybeUpdateView() {
    function retry() {
      Log.d("Trying to display Esper sidebar...");
      var emailData = gmail.get.email_data();

      if (emailData !== undefined && emailData.first_email !== undefined) {
        var threadId = emailData.first_email;
        currentThreadId = threadId;
        Log.d("Using new thread ID " + threadId);
        var rootElement = insertEsperRoot();
        if (rootElement === undefined) {
          return false;
        }
        else {
          Login.myTeams().forEach(function(team) {
            getTeamProfiles(team).done(function(profiles) {
              Api.getLinkedEvents(team.teamid, threadId)
                .done(function(linkedEvents) {
                  Api.checkVersion().done(function(status) {
                    if (status.must_upgrade === true) {
                      displayUpdateDock(rootElement, status.download_page);
                    } else {
                      var sidebar = displaySidebar(rootElement, team,
                                                   profiles, linkedEvents);
                      displayDock(rootElement, sidebar, team, profiles);
                      sidebar.show("slide", { direction: "down" }, 250);
                    }
                  });
                });
            });
          });
          return true;
        }
      }
      else
        return false;
    }

    Util.repeatUntil(30, 300, retry);
  }

  function listen() {
    gmail.on.open_email(function(id, url, body, xhr) {
      Log.d("Opened email " + id, url, body);
      maybeUpdateView();
    });
    window.onhashchange = function() {
      Log.d("URL changed");
      currentThreadId = null;
      maybeUpdateView();
    };
  }

  var alreadyInitialized = false;

  export function init() {
    if (! alreadyInitialized) {
      alreadyInitialized = true;
      Log.d("MsgView.init()");
      listen();
      maybeUpdateView();
    }
  }
}
