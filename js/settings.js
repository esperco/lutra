/*
  Team settings page
*/

var settings = (function() {
  var mod = {};

  function toggleOverlay(overlay) {
    if (overlay.css("display") === "none")
      overlay.css("display", "inline-block");
    else
      overlay.css("display", "none");
  }

  function dismissOverlays() {
    $(".overlay-list").css("display", "none");
  }

  $(document).on('click', function(e) {
    if (!$(e.target).hasClass("click-safe"))
      dismissOverlays();
  });

  function showLabelSettingsModal(team) {
'''
<div #modal
     class="modal fade" tabindex="-1"
     role="dialog">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header clearfix">
        <button #updateButton
                type="button" class="btn btn-primary"
                style="float:right" disabled>Update</button>
        <h3 #modalTitle
            class="modal-title">Team Settings</h3>
      </div>
      <div #body
           class="modal-body">
        <table>
          <thead>
            <tr>
              <td>Shared Labels</td>
              <td>Sync</td>
            </tr>
          </thead>
          <tbody #labels/>
        </table>
        <p #loading>Loading...</p>
      </div>
    </div>
  </div>
</div>
'''
    api.getSharedLabels(team.teamid).done(function(sharedLabels) {
      api.getSyncedLabels(team.teamid).done(function(syncedLabels) {
        loading.hide();

        var allLabels = list.union(sharedLabels.labels, syncedLabels.labels);
        allLabels.sort();
        list.iter(allLabels, function(label) {
          var checkbox = $("<input type='checkbox' class='labelSync'/>")
            .data("label", label);
          if (list.mem(syncedLabels.labels, label))
            checkbox.prop("checked", true);
          $("<tr><td>" + label + "</td><td>")
            .append(checkbox)
            .append("</td></tr>")
            .appendTo(labels);
        });

        var newLabelDiv = $("<div/>")
          .appendTo(body);
        var newLabelLink = $("<a href='#'>+ New shared label</a>")
          .appendTo(newLabelDiv);
        newLabelLink
          .click(function() {
            $("<div><input type='text' class='labelNew'/></div>")
              .prependTo(newLabelDiv);
          });
        updateButton.prop("disabled", false);
      });
    });

    updateButton.click(function() {
      var syncedLabels = [];
      $(".labelSync").each(function(i, x) {
        if ($(x).is(":checked"))
          syncedLabels.push($(x).data("label"));
      });
      $(".labelNew").each(function(i, x) {
        syncedLabels.push($(x).val());
      });
      api.putSyncedLabels(team.teamid, { labels: syncedLabels })
        .done(function() {
          modal.modal("hide");
        });
    });
    modal.modal({});
  }

  function setTeamCalendar(team, calId) {
    return api.setTeamCalendar(team.teamid, calId)
      .done(function() {
        log("Successfully set team calendar to " + calId);
      });
  }

  function makeCalendarSelector(team, root) {
    api.getCalendarList(login.me(), null)
      .done(function(x) {
        var cal = team.team_calendar;
        var calId =
          cal !== null && cal !== undefined ? cal.google_calendar_id : null;
        var options = [ { label: "Select calendar" } ];
        list.iter(x.items, function(calInfo) {
          options.push({ label: calInfo.summary, value: calInfo.id });
        });
        var sel = select.create({
          initialKey: calId,
          defaultAction: function(v) {
            calId = v;
            log("Selected calendar is: " + calId);
            if (util.isString(calId))
              setTeamCalendar(team, calId);
          },
          options: options
        });
        root.append(sel.view);
      });
  }

  function viewOfCalendarTab(team) {
'''
<div #view>
  Team calendar: <span #calendarSelector></span>
</div>
'''
    makeCalendarSelector(team, calendarSelector);

    return view;
  }

  function viewOfLabelsTab(team) {
'''
<div #view>
  <div #spinner class="spinner labels-spinner"/>
  <div class="table-header clearfix">
    <div class="col-sm-10">Shared Label</div>
    <div class="col-sm-2 sync-col">Sync</div>
  </div>
  <div #labels/>
  <button #updateButton
          type="button" class="btn btn-primary"
          style="float:left" disabled>Update</button>
</div>
'''
    spinner.show();
    api.getSharedLabels(team.teamid).done(function(sharedLabels) {
      api.getSyncedLabels(team.teamid).done(function(syncedLabels) {
        spinner.hide();

        var allLabels = list.union(sharedLabels.labels, syncedLabels.labels);
        allLabels.sort();
        list.iter(allLabels, function(label) {
          var checkbox = $("<input type='checkbox' class='labelSync'/>")
            .data("label", label);
          if (list.mem(syncedLabels.labels, label))
            checkbox.prop("checked", true);
          $("<div class='label-row clearfix'/>")
            .append($("<div class='col-sm-10'>" + label + "</div>"))
            .append($("<div class='col-sm-2 sync-col'/>")
              .append(checkbox))
            .appendTo(labels);
        });

        var newLabelDiv = $("<div/>")
          .appendTo(view);
        var newLabelLink = $("<a href='#'>+ New shared label</a>")
          .appendTo(newLabelDiv);
        newLabelLink
          .click(function() {
            $("<div><input type='text' class='labelNew'/></div>")
              .prependTo(newLabelDiv);
          });
        updateButton.prop("disabled", false);
      });
    });

    updateButton.click(function() {
      var syncedLabels = [];
      $(".labelSync").each(function(i, x) {
        if ($(x).is(":checked"))
          syncedLabels.push($(x).data("label"));
      });
      $(".labelNew").each(function(i, x) {
        syncedLabels.push($(x).val());
      });
      api.putSyncedLabels(team.teamid, { labels: syncedLabels })
        .done(function() {
          modal.modal("hide");
        });
    });

    return view;
  }

  function composeInviteForRole(team, role) {
    dismissOverlays();
    var invite = {
      from_uid: login.me(),
      teamid: team.teamid,
      role: role
    };
    log("Invite:", invite);
    api.inviteJoinTeam(invite)
      .done(function(x) {
        var url = x.url;
        var body =
          "Please click the link and sign in with your Google account:\n\n"
          + "  " + url;

        gmailCompose.compose({
          subject: "Join my team on Esper",
          body: body
        });
      });
  }

  function renderInviteDialog(team) {
'''
<div #view class="member-row">
  <div class="clearfix">
    <div #emailContainer class="img-container-left"/>
    <div #invite class="invite-action clickable">
      <a class="link click-safe" style="float:left">Invite new team member</a>
      <span class="caret-south click-safe"/>
    </div>
  </div>
  <ul #inviteOptions class="invite-options overlay-list click-safe">
    <li class="gray unselectable click-safe">Select a role:</li>
    <li><a #assistant href="#" class="click-safe">Assistant</a></li>
    <li><a #executive href="#" class="click-safe">Executive</a></li>
  </ul>
</div>
'''
    var email = $("<img class='svg-block invite-icon'/>")
      .appendTo(emailContainer);
    svg.loadImg(email, "/assets/img/email.svg");

    invite.click(function() { toggleOverlay(inviteOptions); });
    assistant.click(function() { composeInviteForRole(team, "Assistant"); });
    executive.click(function() { composeInviteForRole(team, "Executive"); });

    return view;
  }

  function displayAssistants(assistantsList, team, profiles) {
    list.iter(profiles, function(profile) {
'''
<li #row class="assistant-row clearfix">
  <div class="col-md-6">
    <div #name/>
    <div #email class="gray"/>
  </div>
  <div class="col-md-1 assistant-row-status">
    <div #statusContainer
         data-toggle="tooltip"
         data-placement="right"
         title="Reauthorization required."/>
  </div>
  <div #actions class="col-md-5 assistant-row-actions"/>
</li>
'''
      function refresh() {
        /*
          Reload the whole document.
          It could be improved but the team structure known by the login module
          would need to be refreshed.
        */
        location.reload(true);
      }

      var execUid = team.team_executive;
      var memberUid = profile.profile_uid;

      name.text(profile.display_name);
      email.text(profile.email);

      if (!profile.google_access) {
        var warning = $("<img class='svg-block'/>")
          .appendTo(statusContainer);
        svg.loadImg(warning, "/assets/img/warning.svg");
        statusContainer.tooltip();
      }

      if (memberUid !== login.me()
          && list.mem(team.team_assistants, memberUid)) {
'''
<span #removeSpan>
  <a #removeLink href="#" class="danger-link">Remove</a>
</span>
'''
        removeLink.appendTo(actions)
        removeLink.click(function() {
          api.removeAssistant(team.teamid, memberUid)
            .done(function() { refresh(); });
        });

        actions.append($("<span class='text-divider'>|</span>"));
      } else {
        name
          .text("")
          .append($("<span>" + profile.display_name + "</span>"))
          .append($("<span class='bold'> (Me)</span>"));
      }

      if (memberUid !== execUid) {
'''
<span #makeExecSpan>
  <a #makeExecLink href="#" class="link">Make Executive</a>
</span>
'''
        makeExecSpan.appendTo(actions);
        makeExecLink.click(function() {
          api.setExecutive(team.teamid, memberUid)
            .done(function() { refresh(); });
        });
      }

      assistantsList.append(row);
    });
  }

  function viewOfMembersTab(team) {
'''
<div #view>
  <div class="exec-profile clearfix">
    <div #profilePic class="profile-pic"/>
    <div style="height: 27px">
      <span #execName class="profile-name exec-profile-name"/>
      <span #execStatusContainer
       class="exec-status"
       data-toggle="tooltip"
       data-placement="right"
       title="Reauthorization required."/>
    </div>
    <div #execEmail class="profile-email"/>
  </div>
  <div class="assistants-title">Assistants</div>
  <ul #assistantsList class="assistants-list">
    <div #spinner class="spinner members-spinner"/>
  </ul>
  <div #invitationRow/>
</div>
'''
    spinner.show();
    
    api.getProfile(team.team_executive, team.teamid)
      .done(function(exec) {
        profilePic.css("background-image", "url('" + exec.image_url + "')");
        execName.text(exec.display_name);
        execEmail.text(exec.email);
        if (!exec.google_access) {
          var warning = $("<img class='svg-block'/>")
            .appendTo(execStatusContainer);
          svg.loadImg(warning, "/assets/img/warning.svg");
          execStatusContainer.tooltip();
        }
      });    

    deferred.join(list.map(team.team_assistants, function(uid) {
      return api.getProfile(uid, team.teamid);
    }))
      .done(function(profiles) {
        spinner.hide();
        displayAssistants(assistantsList, team, profiles);
      });

    invitationRow.append(renderInviteDialog(team));

    return view;
  }

  function showTeamSettings(team) {
'''
<div #modal
     class="modal fade" tabindex="-1"
     role="dialog">
  <div class="modal-dialog">
    <div class="modal-content">
      <ul class="esper-tab-links">
        <li class="active"><a #tab1 href="#" id="tab1">
          <img #members class="svg-block esper-tab-icon"/>
          <span>Members</span>
        </a></li>
        <li><a #tab2 href="#" id="tab2">
          <img #labels class="svg-block esper-tab-icon"/>
          <span>Labels</span>
        </a></li>
        <li><a #tab3 href="#" id="tab3">
          <img #calendar class="svg-block esper-tab-icon"/>
          <span>Calendar</span>
        </a></li>
      </ul>
      <div class="esper-tab-content">
        <div #content1 id="tab1" class="tab active"/>
        <div #content2 id="tab2" class="tab"/>
        <div #content3 id="tab3" class="tab"/>
      </div>
    </div>
  </div>
</div>
'''

    tab1.click(function() { switchTab(tab1); });
    tab2.click(function() { switchTab(tab2); });
    tab3.click(function() { switchTab(tab3); });

    // svg.loadImg(calendar, "/assets/img/logo.svg");
    // svg.loadImg(members, "/assets/img/logo.svg");
    // svg.loadImg(labels, "/assets/img/logo.svg");

    function switchTab(tab) {
      var currentAttrValue = "#" + tab.attr("id");
      $('.esper-tab-content ' + currentAttrValue).show().siblings().hide();
      tab.parent('li').addClass('active').siblings().removeClass('active');
    };

    content1.append(viewOfMembersTab(team));
    content2.append(viewOfLabelsTab(team));
    content3.append(viewOfCalendarTab(team));

    modal.modal({});
  }

  function checkTeamStatus(profiles, statusContainer) {
    var error = false;
    list.iter(profiles, function(profile) {
      if (!profile.google_access) {
        error = true;
      }
    });
    if (error) {
      var warning = $("<img class='svg-block'/>")
        .appendTo(statusContainer);
      svg.loadImg(warning, "/assets/img/warning.svg");
      statusContainer.tooltip();
    }
  }

  function viewOfTeam(team) {
'''
<div #view class="team-row clearfix">
  <div #cogContainer class="img-container-right"/>
  <div #statusContainer
       class="img-container-right team-status"
       data-toggle="tooltip"
       data-placement="left"
       title="Some team members may need to be reauthorized."/>
  <div #profilePic class="profile-pic"/>
  <div #name class="profile-name"/>
  <div #email class="profile-email gray"/>
</div>
'''
    var cog = $("<img class='svg-block team-cog clickable'/>")  
      .appendTo(cogContainer);
    svg.loadImg(cog, "/assets/img/cog.svg");

    var members = list.union([team.team_executive], team.team_assistants);
    deferred.join(list.map(members, function(uid) {
      return api.getProfile(uid, team.teamid);
    }))
      .done(function(profiles) { checkTeamStatus(profiles, statusContainer); });

    api.getProfile(team.team_executive, team.teamid)
      .done(function(profile) {
        profilePic.css("background-image", "url('" + profile.image_url + "')");
        if (team.team_executive === login.me()) {
          name
            .append($("<span>" + profile.display_name + "</span>"))
            .append($("<span class='bold'> (Me)</span>"));
        } else {
          name.text(profile.display_name);
        }
        email.text(profile.email);
      });;

    cogContainer.click(function() { showTeamSettings(team); });

    return view;
  }

  function renderAdminSection() {
'''
<div #view>
  <div>
    <a href="#" #clearSync>Log out all Esper accounts</a>
  </div> 
  <button #button
          class="btn btn-default">Generate new team invite</button>
  <code #url></code>
</div>
'''
    clearSync.click(function() {
      login.clearAllLoginInfo();
      signin.signin(function(){});
    });

    button.click(function() {
      api.inviteCreateTeam()
        .done(function(x) {
          url.text(x.url);
        });
    });

    return view;
  }

  mod.load = function() {
'''
<div #view class="settings-container">
  <div class="header clearfix">
    <div #logoContainer class="img-container-left"/>
    <div class="header-title">Settings</div>
    <span #signOut class="header-signout clickable">Sign out</span>
  </div>
  <div class="divider"/>
  <div #install class="install clearfix">
    <div #closeContainer class="img-container-right close clickable"/>
    <div #chromeLogoContainer
         class="img-container-right chrome-logo-container animated fadeIn"/>
    <div class="install-h1 animated fadeInLeft">
      Bring your inbox and calendar closer together.
    </div>
    <div class="install-h2 animated fadeInLeft">
      <a href="https://chrome.google.com/webstore/detail/esper/jabkchbdomjjlbahjdjemnnghkakfcog"
         target="_blank">Install the Esper Chrome extension</a>
      <span>></span>
    </div>
  </div>
  <div class="profile settings-section col-sm-6">
    <h4 class="settings-section-title">My Profile</h4>
    <div class="clearfix" style="margin-top:16px">
      <div #profilePic class="profile-pic"/>
      <div #myName class="profile-name"/>
      <div #myEmail class="profile-email gray"/>
    </div>
    <div class="toggle-advanced">
      <a #toggleAdvanced href="#">Show advanced</a>
    </div>
    <div #advanced class="profile-advanced">
      <div #uid/>
      <a #revoke
         href="#"
         class="danger-link">Deauthorize this account</a>
    </div>
    <div #adminSection class="hide settings-block">
      <h2>Admin</h2>
      <div #adminBody />
    </div>
  </div>
  <div class="teams settings-section col-sm-6">
    <h4 class="settings-section-title">Executive Teams</h4>
    <div #teams class="team-list"/>
  </div>
</div>
'''
    var root = $("#settings-page");
    root.children().remove();
    root.append(view);

    var logo = $("<img class='svg-block header-logo'/>")
      .appendTo(logoContainer);
    svg.loadImg(logo, "/assets/img/logo.svg");

    var close = $("<img class='svg-block'/>")
      .appendTo(closeContainer);
    svg.loadImg(close, "/assets/img/close.svg");

    var chrome = $("<img class='svg-block chrome-logo'/>")
      .appendTo(chromeLogoContainer);
    svg.loadImg(chrome, "/assets/img/chrome.svg");

    api.getMyProfile()
      .done(function(profile){
        profilePic.css("background-image", "url('" + profile.image_url + "')");
        myName.text(profile.display_name);
        myEmail.text(login.myEmail());
      });
    
    uid
      .append("<span>UID: </span>")
      .append("<span class='gray'>" + login.me() + "</span>");

    list.iter(login.getTeams(), function(team) {
      teams.append(viewOfTeam(team));
    });

    signOut.click(function() {
      login.clearLoginInfo();
      signin.signin(function(){});
      return false;
    });

    closeContainer.click(function() { install.slideUp(); });

    toggleAdvanced.click(function() {
      if (advanced.css("display") === "none") {
        advanced.slideDown("fast");
        toggleAdvanced.text("Hide advanced");
      } else {
        advanced.slideUp("fast");
        toggleAdvanced.text("Show advanced");
      }
    })

    revoke.click(function() {
      api.postGoogleAuthRevoke()
        .done(function() {
          signOut.click();
        });
      return false;
    });

    api.getGoogleAuthInfo(document.URL)
      .done(function(info) {
        if (info.has_token)
          revoke.removeClass("hide");
        else {
          window.url = info.google_auth_url;
        }
      });

    if (login.isAdmin()) {
      adminBody.append(renderAdminSection());
      adminSection.removeClass("hide");
    }
  }

  return mod;
})();
