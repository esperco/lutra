/*
  Team Settings - Account Tab
*/

module AccountTab {

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

  function generateInviteURL(team, role) {
    dismissOverlays();
    var invite = {
      from_uid: Login.me(),
      teamid: team.teamid,
      role: role
    };
    Log.p("Invite:", invite);
    return Api.inviteJoinTeam(invite);
  }

  function composeInviteWithURL(url) {
    var body =
      "Please click the link and sign in with your Google account:\n\n"
      + "  " + url;

    return GmailCompose.compose({
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
    Svg.loadImg(email, "/assets/img/email.svg");

    invite.click(function() { toggleOverlay(inviteOptions); });

    generateInviteURL(team, "Assistant")
      .done(function(x) {
        assistant.attr("href", composeInviteWithURL(x.url));
      });
    generateInviteURL(team, "Executive")
      .done(function(x) {
        executive.attr("href", composeInviteWithURL(x.url));
      });

    return view;
  }

  function displayAssistants(assistantsList, team, profiles) {
    List.iter(profiles, function(profile) {
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
        Svg.loadImg(warning, "/assets/img/warning.svg");
        (<any> statusContainer).tooltip(); // FIXME
      }

(function(){ // a block scope, a block scope, my kingdom for a block scope!
      if (memberUid !== Login.me()
          && List.mem(team.team_assistants, memberUid)) {
'''
<span #removeSpan>
  <a #removeLink href="#" class="danger-link">Remove</a>
</span>
'''
        removeLink.appendTo(actions)
        removeLink.click(function() {
          Api.removeAssistant(team.teamid, memberUid)
            .done(function() { refresh(); });
        });

        actions.append($("<span class='text-divider'>|</span>"));
      } else {
        name
          .text("")
          .append($("<span>" + profile.display_name + "</span>"))
          .append($("<span class='semibold'> (Me)</span>"));
      }
})();

(function(){
      if (memberUid !== execUid) {
'''
<span #makeExecSpan>
  <a #makeExecLink href="#" class="link">Make Executive</a>
</span>
'''
        makeExecSpan.appendTo(actions);
        makeExecLink.click(function() {
          Api.setExecutive(team.teamid, memberUid)
            .done(function() { refresh(); });
        });
      }
})();

      assistantsList.append(row);
    });
  }

  export function load(team) {
'''
<div #view>
  <div class="table-header">Membership & Billing</div>
  <div #payments class="table-list"></div>
  <div class="table-header">Assistants</div>
  <ul #assistantsList class="table-list">
    <div #spinner class="spinner table-spinner"/>
    <div #tableEmpty
         class="table-empty">There are no assistants on this team.</div>
  </ul>
  <div #invitationRow/>
</div>
'''
    spinner.show();

    Deferred.join(List.map(team.team_assistants, function(uid) {
      return Api.getProfile(uid, team.teamid);
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

}
