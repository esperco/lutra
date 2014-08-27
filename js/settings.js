/*
  Team settings page
*/

var settings = (function() {
  var mod = {};

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
  <div #spinner class="spinner modal-spinner"/>
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
  <div #emailContainer class="img-container-left"/>
  <a #invite class="link">Invite new team member</a>
  <ul #inviteOptions class="invite-options">
    <li>Select a role for this new team member:</li>
    <li><a #assistant href="#">Assistant</a></li>
    <li><a #executive href="#">Executive</a></li>
  </ul>
</div>
'''
    var email = $("<img class='svg-block invite-icon'/>")
      .appendTo(emailContainer);
    svg.loadImg(email, "/assets/img/email.svg");
    invite.click(function() { inviteOptions.toggle(); });
    assistant.click(function() { composeInviteForRole(team, "Assistant"); });
    executive.click(function() { composeInviteForRole(team, "Executive"); });

    return view;
  }

  function viewOfProfiles(team, profiles) {
'''
<div #view>
  <div class="exec-profile clearfix">
    <div #profilePic class="profile-pic"/>
    <div style="height: 31px">
      <span #execName class="profile-name exec-profile-name"/>
      <span #execStatusContainer class="exec-status"/>
    </div>
    <div #execEmail class="profile-email"/>
  </div>
  <div class="assistants-title">Assistants</div>
  <ul #assistants class="assistants-list"/>
</div>
'''
    list.iter(profiles, function(profile) {
'''
<li #row class="assistant-row clearfix">
  <div class="col-md-6">
    <div #name/>
    <div #email class="gray"/>
  </div>
  <div #statusContainer class="col-md-1 assistant-row-status"></div>
  <div #actions class="col-md-5 assistant-row-actions"></div>
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
      if (execUid === memberUid) {
        execName.text(profile.display_name);
        execEmail.text(profile.email)
        if (!profile.google_access) {
          var warning = $("<img class='svg-block'/>")
            .appendTo(execStatusContainer);
          svg.loadImg(warning, "/assets/img/warning.svg");
        }
      } else {
        name.text(profile.display_name);
        email.text(profile.email);
        if (!profile.google_access) {
          var warning = $("<img class='svg-block'/>")
            .appendTo(statusContainer);
          svg.loadImg(warning, "/assets/img/warning.svg");
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

        assistants.append(row);
      }
    });

    return view;
  }

  function viewOfMembersTab(team) {
'''
<div #view>
  <div #membersList/>
  <div #invitationRow/>
</div>
'''
    var members = list.union([team.team_executive], team.team_assistants);

    deferred.join(list.map(members, function(uid) {
      return api.getProfile(uid, team.teamid);
    }))
      .done(function(profiles) {
        viewOfProfiles(team, profiles)
          .appendTo(membersList);
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
          <img #labelSync class="svg-block esper-tab-icon"/>
          <span>LabelSync</span>
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
    // svg.loadImg(labelSync, "/assets/img/logo.svg");

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


  function viewOfTeam(team) {
'''
<div #view class="team-row">
  <div #cogContainer class="img-container-right"/>
  <div #name class="team-name"/>
  <div #email class="team-email gray"/>
</div>
'''
    var cog = $("<img class='svg-block team-cog'/>")  
      .appendTo(cogContainer);
    svg.loadImg(cog, "/assets/img/cog.svg");

    cogContainer.click(function() { showTeamSettings(team); });

    api.getProfile(team.team_executive, team.teamid)
      .done(function(profile) {
        name.text(profile.display_name);
        email.text(profile.email);
      });;

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
  <div class="install clearfix">
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
    <h4 class="settings-section-title">Profile</h4>
    <div class="clearfix">
      <div #profilePic class="profile-pic"/>
      <div #myName class="profile-name"/>
      <div #myEmail class="profile-email"/>
    </div>
    <div class="toggle-advanced">
      <a #toggleAdvanced href="#">Show advanced</a>
    </div>
    <div #advanced class="profile-advanced">
      <div #uid/>
      <a #revoke
         href="#"
         class="danger-link">Revoke Esper&apos;s access to my Google account</a>
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

    var chrome = $("<img class='svg-block chrome-logo'/>")
      .appendTo(chromeLogoContainer);
    svg.loadImg(chrome, "/assets/img/chrome.svg");

    myName.text("Johnny Appleseed");

    myEmail.text(login.myEmail());
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
