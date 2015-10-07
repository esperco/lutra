module Esper.ApproveTeam {
  export function load() {
    var teamToApprove = <ApiT.Team> _.find(Login.data.teams,
      function(team: ApiT.Team) {
        return team.team_executive === Login.me() && !team.team_approved;
      });
    if (teamToApprove) {
      renderView(approveTeamView(teamToApprove));
    } else {
      renderView(alreadyApprovedView());
    }
  }

  function renderView(view: JQuery) {
    var container = $(`<div #view class="container simple-content" />`);
    container.append(view);
    var root = $("#approve-team");
    root.empty().append(container);
  }

  function approveTeamView(team: ApiT.Team) {
'''
<div #view class="panel panel-primary" >
  <div class="panel-heading" >
    <h3 class="panel-title">
      Verify Team Members
    </h3>
  </div>
  <div class="panel-body">
    <p>
      Someone's created a team for you on Esper. We need you to approve
      the members on your team before we can continue. Please check the
      name and e-mail addresses below.
    </p>
    <p>
      If you do not recognize these team memembers,
      <strong>DO NOT APPROVE THIS TEAM</strong> and
      <a href="http://esper.com/contact">contact us for support</a>.

      Approving a team with unrecognized people may result in them gaining
      access to your calendar and other information.
    </p>
    <div>
      <ul #memberList class="list-group">
        <li #memberListLoading class="list-group-item">Loading &hellip;</li>
      </ul>
    </div>
    <hr />
    <div class="pull-left">
      <div #actionSpinner class="spinner footer-spinner" />
    </div>
    <div class="pull-right">
      <button #rejectBtn class="btn btn-danger">
        <i class="fa fa-fw fa-close"></i> Reject
      </button>
      <button #approveBtn class="btn btn-primary">
        <i class="fa fa-fw fa-check"></i> Approve
      </button>
    </div>
  </div>
</div>
'''
    Api.getAllProfiles().done(function(profiles) {
      memberListLoading.hide();
      _.each(profiles.profile_list, function(profile) {
        if (_.contains(team.team_assistants, profile.profile_uid)) {
          memberList.append($(`<li class="list-group-item">` +
            `<i class="fa fa-fw fa-user"></i>` +
            `${profile.display_name} (${profile.email})` +
          `</li>`));
        }
      });
    });

    function makeBusy() {
      actionSpinner.show();
      rejectBtn.prop("disabled", true);
      approveBtn.prop("disabled", true);
    }

    function unmakeBusy() {
      actionSpinner.hide();
      rejectBtn.prop("disabled", false);
      approveBtn.prop("disabled", false);
    }

    rejectBtn.click(function() {
      makeBusy();
      Api.sendSupportEmail(`Team ${team.teamid} (${team.team_name}) ` +
          `was not approved. Shenanigans may be afoot. Please investigate.`)
        .done(function() {
          renderView(rejectionMsgView());
        })
        .always(unmakeBusy);
    });

    approveBtn.click(function() {
      makeBusy();
      Api.approveTeam(team.teamid)
        .done(function() {
          renderView(alreadyApprovedView());
        })
        .always(unmakeBusy)
    });

    return view;
  }

  function alreadyApprovedView() {
'''
<div #view class="panel panel-success">
  <div class="panel-heading" >
    <h3 class="panel-title">
      Esper Team Approved
    </h3>
  </div>
  <div class="panel-body">
    <p>
      Your team has been been approved.
      <a href="#!/settings">Click here to go to the settings page.</a>
    </p>
  </div>
</div>
'''
    return view;
  }

  function rejectionMsgView() {
'''
<div #view class="panel panel-info" >
  <div class="panel-heading" >
    <h3 class="panel-title">
      Message Sent
    </h3>
  </div>
  <div class="panel-body">
    <p>
      OK, we're looking into this. We'll get back to you soon.
      If you have additional information or concerns,
      <a href="http://esper.com/contact">click here to contact us</a>.
    </p>
  </div>
</div>
'''
    return view;
  }
}