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
    $(".overlay-popover").css("display", "none");
    $(".overlay-popover input").val("");
    $(".overlay-popover .new-label-error").hide();
  }

  $(document).on('click', function(e) {
    if (!$(e.target).hasClass("click-safe"))
      dismissOverlays();
  });

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
        var options = [];
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
  <div class="esper-h1">Team Calendar</div>
  <div #description class="calendar-setting-description"/>
  <span #calendarSelector></span>
</div>
'''
    description
      .text("Select the calendar to be used by the team. " +
            "Newly created events will be saved to this calendar.");

    makeCalendarSelector(team, calendarSelector);

    return view;
  }

  function viewOfLabelRow(team, label, syncedLabelsList) {
'''
<li #row class="table-row labels-table clearfix">
  <div #labelText class="col-xs-5"/>
  <div #status class="col-xs-4">
    <div #dot class="sync-status-dot"/>
    <span #statusText class="gray"/>
  </div>
  <div class="col-xs-3 sync-action">
    <a #action href="#" class="link"/>
  </div>
</li>
'''
    labelText.text(label);

    function disable() {
      status.css("opacity", "0.5");
      action
        .css("opacity", "0.5")
        .css("pointer-events", "none");
    }

    function enable() {
      status.css("opacity", "1");
      action
        .css("opacity", "1")
        .css("pointer-events", "auto");
    }

    function showSyncing() {
      enable();
      dot.css("background", "#2bb673");
      statusText.text("Syncing");
      action.text("Stop syncing");
    }

    function showNotSyncing() {
      enable();
      dot.css("background", "#d9534f");
      statusText.text("Not syncing");
      action.text("Sync");
    }

    function toggleSync() {
      disable();
      api.getSyncedLabels(team.teamid).done(function(syncedLabels) {
        if (list.mem(syncedLabels.labels, label)) {
          var index = syncedLabels.labels.indexOf(label);
          if (index != undefined) {
            syncedLabels.labels.splice(index, 1);
          }
          api.putSyncedLabels(team.teamid, { labels: syncedLabels.labels })
            .done(function() { showNotSyncing(); });
        } else {
          syncedLabels.labels.push(label);
          api.putSyncedLabels(team.teamid, { labels: syncedLabels.labels })
            .done(function() { showSyncing(); });
        }
      });
    }

    if (list.mem(syncedLabelsList, label))
      showSyncing();
    else
      showNotSyncing();

    action.click(toggleSync);

    return row;
  }

  function viewOfLabelSyncTab(team) {
'''
<div #view>
  <div class="exec-profile clearfix">
    <div #labelSyncContainer />
    <div #description class="label-sync-description"/>
  </div>
  <div class="table-header">Shared Labels</div>
  <ul #labels class="assistants-list">
    <div #tableSpinner class="spinner table-spinner"/>
    <div #tableEmpty
         class="table-empty">There are no shared labels across this team.</div>
  </ul>
  <div class="clearfix">
    <div #labelIconContainer class="img-container-left"/>
    <a #create disabled
       class="link popover-trigger click-safe"
       style="float:left">Create new shared label</a>
  </div>
  <div #newLabelPopover class="new-label-popover overlay-popover click-safe">
    <div class="overlay-popover-header click-safe">New shared label</div>
    <div class="overlay-popover-body click-safe">
      <input #newLabel class="new-label-input click-safe"
             autofocus placeholder="Untitled label"/>
      <div class="clearfix click-safe">
        <div #error class="new-label-error click-safe">
          This label already exists.</div>
        <button #cancel class="button-secondary label-btn">Cancel</button>
        <button #save class="button-primary label-btn click-safe"
                disabled>Save</button>
        <div #inlineSpinner class="spinner inline-spinner"/>
    </div>
  </div>
</div>
'''
    var labelSync = $("<img class='svg-block label-sync-icon'/>")
      .appendTo(labelSyncContainer);
    svg.loadImg(labelSync, "/assets/img/LabelSync.svg");

    var labelIcon = $("<img class='svg-block label-icon'/>")
      .appendTo(labelIconContainer);
    svg.loadImg(labelIcon, "/assets/img/new-label.svg");

    description
      .text("LabelSync lets you share email labels across your team. Below " +
        "are labels that currently appear in every team member's account.");

    tableSpinner.show();

    // local array for keyup function
    var sharedLabelsList;

    api.getSharedLabels(team.teamid).done(function(sharedLabels) {
      api.getSyncedLabels(team.teamid).done(function(syncedLabels) {
        sharedLabelsList = sharedLabels.labels;
        var allLabels = list.union(sharedLabels.labels, syncedLabels.labels);
        tableSpinner.hide();
        if (allLabels.length > 0) {
          labels.children().remove();
          allLabels.sort();
          list.iter(allLabels, function(label) {
            labels.append(viewOfLabelRow(team, label, syncedLabels.labels));
          });
        } else {
          tableEmpty.show();
        }
        create.click(function() {
          toggleOverlay(newLabelPopover);
          newLabel.focus();
        });
      });
    });

    newLabel.keyup(function() {
      console.log(newLabel.val());
      if (newLabel.val() != "") {
        if (sharedLabelsList.indexOf(newLabel.val()) > -1) {
          save.attr("disabled", "true");
          error.css("display", "inline-block");
        } else {
          save.removeAttr("disabled");
          error.hide();
        }
      }
      else
        save.attr("disabled", "true");
    });

    save.click(function() {
      inlineSpinner.show();
      newLabel.addClass("disabled");
      save.attr("disabled", "true");
      var label = newLabel.val();
      api.getSyncedLabels(team.teamid).done(function(syncedLabels) {
        sharedLabelsList.push(label);
        syncedLabels.labels.push(label);
        api.putSyncedLabels(team.teamid, { labels: syncedLabels.labels })
          .done(function() {
            inlineSpinner.hide();
            toggleOverlay(newLabelPopover);
            newLabel
              .val("")
              .removeClass("disabled");
            tableEmpty.hide();
            var newRow = viewOfLabelRow(team, label, syncedLabels.labels);
            labels.prepend(newRow);
            newRow.addClass("purple-flash");
          });
      });
    });

    cancel.click(function() {
      toggleOverlay(newLabelPopover);
      newLabel.val("");
      error.hide();
    })

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

    var subject, body;
    api.inviteJoinTeam(invite)
      .done(function(x) {
        var url = x.url;
        var body =
          "Please click the link and sign in with your Google account:\n\n"
          + "  " + url;
      });

    return gmailCompose.compose({
      subject: "Join my team on Esper",
      body: body
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
    <li class="unselectable click-safe">Select a role:</li>
    <li><a #assistant href="#" target="_blank"
           class="click-safe">Assistant</a></li>
    <li><a #executive href="#" target="_blank"
           class="click-safe">Executive</a></li>
  </ul>
</div>
'''
    var email = $("<img class='svg-block invite-icon'/>")
      .appendTo(emailContainer);
    svg.loadImg(email, "/assets/img/email.svg");

    invite.click(function() { toggleOverlay(inviteOptions); });
    assistant.attr("href", composeInviteForRole(team, "Assistant"));
    executive.attr("href", composeInviteForRole(team, "Executive"));

    return view;
  }

  function displayAssistants(assistantsList, team, profiles) {
    list.iter(profiles, function(profile) {
'''
<li #row class="table-row assistants-table clearfix">
  <div class="col-xs-6">
    <div #name/>
    <div #email class="gray"/>
  </div>
  <div class="col-xs-1 assistant-row-status">
    <div #statusContainer
         data-toggle="tooltip"
         data-placement="right"
         title="Reauthorization required."/>
  </div>
  <div #actions class="col-xs-5 assistant-row-actions"/>
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
          .append($("<span class='semibold'> (Me)</span>"));
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
      <span class="exec-label">EXECUTIVE</span>
      <span #execStatusContainer
       class="exec-status"
       data-toggle="tooltip"
       data-placement="right"
       title="Reauthorization required."/>
    </div>
    <div #execEmail class="profile-email gray"/>
  </div>
  <div class="table-header">Assistants</div>
  <ul #assistantsList class="assistants-list">
    <div #spinner class="spinner table-spinner"/>
    <div #tableEmpty
         class="table-empty">There are no assistants on this team.</div>
  </ul>
  <div #invitationRow/>
</div>
'''
    spinner.show();

    api.getProfile(team.team_executive, team.teamid)
      .done(function(exec) {
        profilePic.css("background-image", "url('" + exec.image_url + "')");
        if (team.team_executive === login.me()) {
          execName
            .append($("<span>" + exec.display_name + "</span>"))
            .append($("<span class='semibold'> (Me)</span>"));
        } else {
          execName.text(exec.display_name);
        }
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
        if (profiles.length > 0)
          displayAssistants(assistantsList, team, profiles);
        else
          tableEmpty.show();
      });

    invitationRow.append(renderInviteDialog(team));

    return view;
  }

  function showTeamSettings(team) {
'''
<div #modal
     class="modal fade" tabindex="-1"
     role="dialog">
  <div class="modal-dialog team-settings">
    <div class="modal-content">
      <div style="text-align:center">
        <ul class="esper-tab-links">
          <li class="active"><a #tab1 href="#" id="tab1" class="first">
            <img #members class="svg-block esper-tab-icon"/>
            <span>Members</span>
          </a></li>
          <li><a #tab2 href="#" id="tab2">
            <img #labelSync class="svg-block esper-tab-icon"/>
            <span>LabelSync</span>
          </a></li>
          <li><a #tab3 href="#" id="tab3" class="last">
            <img #calendar class="svg-block esper-tab-icon"/>
            <span>Calendar</span>
          </a></li>
        </ul>
      </div>
      <div class="esper-tab-content">
        <div #content1 id="tab1" class="tab active"/>
        <div #content2 id="tab2" class="tab"/>
        <div #content3 id="tab3" class="tab"/>
      </div>
      <div class="modal-footer">
        <button #done class="button-primary">Done</button>
      </div>
    </div>
  </div>
</div>
'''

    tab1.click(function() { switchTab(tab1); });
    tab2.click(function() { switchTab(tab2); });
    tab3.click(function() { switchTab(tab3); });

    function switchTab(tab) {
      var currentAttrValue = "#" + tab.attr("id");
      $('.esper-tab-content ' + currentAttrValue).show().siblings().hide();
      tab.parent('li').addClass('active').siblings().removeClass('active');
    };

    content1.append(viewOfMembersTab(team));
    content2.append(viewOfLabelSyncTab(team));
    content3.append(viewOfCalendarTab(team));

    done.click(function() { modal.modal("hide") });

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
            .append($("<span class='semibold'> (Me)</span>"));
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
<div #view style="margin-top:16px">
  <div class="esper-h2">New Team Invitation URL</div>
  <div class="generate-row clearfix">
    <button #button
            class="button-primary col-xs-3 generate">Generate</button>
    <input #url class="generate-input col-xs-9 disabled"
           onclick="this.select();"/>
  </div>
  <div>
    <a href="#" #clearSync class="danger-link">Log out of all Esper accounts</a>
  </div>
</div>
'''
    clearSync.click(function() {
      login.clearAllLoginInfo();
      signin.signin(function(){});
    });

    button.click(function() {
      api.inviteCreateTeam()
        .done(function(x) {
          url
            .val(x.url)
            .removeClass("disabled")
            .select();
        });
    });

    return view;
  }

  mod.load = function() {
'''
<div #view class="settings-container">
  <div class="header clearfix">
    <a #logoContainer href="http://esper.com" target="_blank"
       class="img-container-left"/>
    <div class="header-title">Settings</div>
    <span #signOut class="header-signout clickable">Sign out</span>
  </div>
  <div class="divider"/>
  <div #install class="install clearfix">
    <div #closeContainer class="img-container-right close clickable"/>
    <div #chromeLogoContainer
         class="img-container-right chrome-logo-container animated fadeIn"/>
    <div class="esper-h1 install-h1 gray animated fadeInLeft">
      Bring your inbox and calendar closer together.
    </div>
    <div class="esper-h2 install-h2 animated fadeInLeft">
      <a href="https://chrome.google.com/webstore/detail/esper/jabkchbdomjjlbahjdjemnnghkakfcog"
         target="_blank">Install the Esper Chrome extension</a>
      <span #arrowContainer class="img-container-inline"/>
    </div>
  </div>
  <div #main class="clearfix">
    <div class="leftCol settings-section col-sm-6">
      <div class="esper-h1 settings-section-title">My Profile</div>
      <div class="clearfix" style="margin-top:16px">
        <div #profilePic class="profile-pic"/>
        <div #myName class="profile-name"/>
        <div #myEmail class="profile-email gray"/>
      </div>
      <div class="toggle-advanced">
        <a #toggleAdvanced href="#" class="link">Show advanced</a>
      </div>
      <div #advanced class="profile-advanced">
        <div #uid/>
        <a #revoke
           href="#"
           class="danger-link">Deauthorize this account</a>
      </div>
      <div #adminSection class="admin hide">
        <div class="esper-h1 settings-section-title">Admin Tools</div>
        <div #adminBody/>
      </div>
    </div>
    <div class="rightCol settings-section col-sm-6">
      <div class="esper-h1 settings-section-title">Executive Teams</div>
      <div #teams class="team-list"/>
    </div>
  </div>
  <div class="footer clearfix">
    <ul class="col-xs-2">
      <li class="footer-header">Esper</li>
      <li><a href="https://chrome.google.com/webstore/detail/esper/jabkchbdomjjlbahjdjemnnghkakfcog"
             target="_blank" class="gray-link">Install</a></li>
      <li><a href="http://esper.com/aboutus.html" target="_blank"
             class="gray-link">About us</a></li>
      <li><a href="http://blog.esper.com" target="_blank"
             class="gray-link">Blog</a></li>
      <li><a href="http://esper.com/jobs.html" target="_blank"
             class="gray-link">Jobs</a></li>
    </ul>
    <ul class="col-xs-2">
      <li class="footer-header">Support</li>
      <li><a href="http://esper.com" target="_blank"
             class="gray-link">Getting started</a></li>
      <li><a href="http://esper.com/privacypolicy.html" target="_blank"
             class="gray-link">Privacy</a></li>
      <li><a href="http://esper.com/termsofuse.html" target="_blank"
             class="gray-link">Terms</a></li>
      <li><a #contact href="#" class="gray-link">Contact us</a></li>
    </ul>
    <div class="col-xs-8">
      <a #wordMarkContainer href="http://esper.com" target="_blank"
         class="img-container-right"/>
    </div>
  </div>
</div>
'''
    var root = $("#settings-page");
    root.children().remove();
    root.append(view);
    document.title = "Settings - Esper";

    var logo = $("<img class='svg-block header-logo'/>")
      .appendTo(logoContainer);
    svg.loadImg(logo, "/assets/img/logo.svg");

    var close = $("<img class='svg-block'/>")
      .appendTo(closeContainer);
    svg.loadImg(close, "/assets/img/close.svg");

    var chrome = $("<img class='svg-block chrome-logo'/>")
      .appendTo(chromeLogoContainer);
    svg.loadImg(chrome, "/assets/img/chrome.svg");

    var arrowEast = $("<img class='svg-block arrow-east'/>")
      .appendTo(arrowContainer);
    svg.loadImg(arrowEast, "/assets/img/arrow-east.svg");

    var wordMark = $("<img class='svg-block word-mark'/>")
      .appendTo(wordMarkContainer);
    svg.loadImg(wordMark, "/assets/img/word-mark.svg");

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

    contact.click(function() {
      gmailCompose.compose({ to: "team@esper.com" });
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
