/*
  Gmail thread view
*/
module Esper.MsgView {
  export var currentThreadId : string;

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
  <div #wrapLeft class="esper-dock-wrap-left"/>
  <div #wrapRight class="esper-dock-wrap-right"/>
  <div class="esper-dock">
    <div #teamName class="esper-team-name"/>
    <div #overflow class="esper-dock-action">
      <div #overflowIcon class="esper-dock-action-icon"/>
    </div>
    <div #size class="esper-dock-action">
      <div #sizeIcon
           class="esper-dock-action-icon esper-size-icon minimize"/>
    </div>
  </div>
  <div class="esper-overflow" style="display:none">
    <a href="http://esper.com">
      <img #sidebarLogo class="esper-footer-logo"/>
    </a>
    <div class="esper-footer-links">
      <a href="mailto:team@esper.com">Help</a>
      <div class="esper-footer-divider"/>
      <a href="http://esper.com/privacypolicy.html">Privacy</a>
      <div class="esper-footer-divider"/>
      <a href="https://app.esper.com">Settings</a>
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

    size.click(function() {
      if (sidebar.css("display") === "none") {
        wrapLeft.fadeIn(250);
        wrapRight.fadeIn(250);
        sizeIcon.addClass("minimize");
        sidebar.show("slide", { direction: "down" }, 250);
      } else {
        wrapLeft.fadeOut(250);
        wrapRight.fadeOut(250);
        sizeIcon.removeClass("minimize");
        sidebar.hide("slide", { direction: "down" }, 250);
      }
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
    <li class="active"><a #tab1 href="#tab1">Events</a></li>
    <li><a #tab2 href="#tab2">Polls</a></li>
    <li><a #tab3 href="#tab3">People</a></li>
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

    function switchTab(tab) {
      var currentAttrValue = tab.attr("href");
      $('.esper-tab-content ' + currentAttrValue).show().siblings().hide();
      tab.parent('li').addClass('active').siblings().removeClass('active');
    };

    EvTab.displayLinkedEvents(content1, team, profiles, linkedEvents);

    rootElement.append(view);

    return view;
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
  function maybeUpdateView(maxRetries) {
    Log.d("maybeUpdateView("+maxRetries+")");
    var emailData = gmail.get.email_data();
    if (emailData !== undefined && emailData.first_email !== undefined) {
      var threadId = emailData.first_email;
      if (currentThreadId !== threadId) {
        currentThreadId = threadId;
        Log.d("Using new thread ID " + currentThreadId);
        var rootElement = insertEsperRoot();
        Login.myTeams().forEach(function(team) {
          getTeamProfiles(team).done(function(profiles) {
            Api.getLinkedEvents(team.teamid, currentThreadId)
              .done(function(linkedEvents) {
                var sidebar = displaySidebar(rootElement, team,
                                             profiles, linkedEvents);
                displayDock(rootElement, sidebar, team, profiles);
                sidebar.show("slide", { direction: "down" }, 250);
              });
          });
        });
      }
    }
    else {
      /* retry every second, up to 10 times. */
      if (maxRetries > 0)
        setTimeout(maybeUpdateView, 1000, maxRetries - 1);
    }
  }

  function listen() {
    gmail.on.open_email(function(id, url, body, xhr) {
      Log.d("Opened email " + id, url, body);
      maybeUpdateView(10);
    });
    window.onhashchange = function() {
      // TODO Actually check hash?
      Log.d("Left email message view");
      currentThreadId = null;
    };
  }

  var alreadyInitialized = false;

  export function init() {
    if (! alreadyInitialized) {
      alreadyInitialized = true;
      Log.d("MsgView.init()");
      listen();
      maybeUpdateView(10);
    }
  }
}
