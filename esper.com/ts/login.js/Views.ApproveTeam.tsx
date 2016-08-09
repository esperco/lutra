/*
  Modal to approve teams
*/

/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="../lib/Components.Modal.tsx" />
/// <reference path="../lib/Components.ErrorMsg.tsx" />
/// <reference path="../lib/Stores.Profiles.ts" />
/// <reference path="./Login.Oauth.ts" />

module Esper.Views {
  var Component = ReactHelpers.Component;

  /*
    View for execs to approve team prior to logging in
  */
  interface ApproveProps {
    info: ApiT.LoginResponse;

    // Callback gets passed info with rejected teams removed, as well as a
    // list of the rejected teams
    callback: (info: ApiT.LoginResponse, removedTeams: ApiT.Team[]) => void;
  };

  export class ApproveTeams extends Component<ApproveProps, {
      saving?: boolean;
      error?: boolean;
    }>
  {
    constructor(props: ApproveProps) {
      super(props);
      this.state = {
        saving: false,
        error: false
      };
    }

    renderWithData() {
      var status = Stores.Profiles.status();
      if (status) {
        var loading = status === Model2.DataStatus.FETCHING;
        var error = (status === Model2.DataStatus.FETCH_ERROR ||
                     this.state.error);
      }

      return <div>
        { this.renderMain() }
        { this.renderFooter() }
      </div>;
    }

    getUnapprovedTeams(info: ApiT.LoginResponse) {
      return _.filter(info.teams,
        (team) => team.team_executive === Login.me() && !team.team_approved
      );
    }

    getApprovedTeams(info: ApiT.LoginResponse) {
      return _(info.teams).difference(this.getUnapprovedTeams(info)).value();
    }

    getName(uid: string) {
      return Stores.Profiles.get(uid).match({
        none: () => "Unknown User",
        some: (profile) => profile.display_name === profile.email ?
          profile.display_name : `${profile.display_name} <${profile.email}>`
      })
    }

    renderMain() {
      var status = Stores.Profiles.status();
      if (status) {
        var loading = status === Model2.DataStatus.FETCHING;
        var error = (status === Model2.DataStatus.FETCH_ERROR ||
                     this.state.error);
      }

      return <div>
        <div className="alert alert-warning">
          <p>
            Someone's created a team for you on Esper. We need you to approve
            the members on your team before we can continue. Please check the
            name and e-mail addresses below.
          </p>
          <p>
            If you do not recognize these team members,{" "}
            <strong>DO NOT APPROVE THIS TEAM</strong>{" "} and {" "}
            <a href="https://esper.com/contact">contact us for support</a>.

            Approving a team with unrecognized members may result in those
            members gaining access to your calendar and other information.
          </p>
        </div>
        <div>
          { error ? <Components.ErrorMsg /> : null }
          { loading ?
            <span className="esper-spinner esper-centered esper-medium" /> :
            _.map(this.getUnapprovedTeams(this.props.info), (team) =>
              <ul className="list-group" key={team.teamid}>
                { _.map(team.team_assistants, (asst) =>
                  <li className="list-group-item" key={asst}>
                    <i className="fa fa-fw fa-user"></i>{" "}
                    { this.getName(asst) }
                  </li>
                )}
              </ul>
            )
          }
        </div>
      </div>;
    }

    renderFooter() {
      return <div className="clearfix modal-footer">
        { this.state.saving ?
          <div className="esper-spinner" /> :
          null
        }
        <button className="btn btn-danger"
                disabled={this.state.saving}
                onClick={this.reject.bind(this)}>
          Reject
        </button>
        <button className="btn btn-success"
                disabled={this.state.saving}
                onClick={this.approve.bind(this)}>
          Approve
        </button>
      </div>;
    }

    approve() {
      this.makeBusy();

      var calls: JQueryPromise<any>[] = [];
      var infoWithAccepted = _.cloneDeep(this.props.info);
      _.each(infoWithAccepted.teams, (t) => {
        t.team_approved = true;
        calls.push(Api.approveTeam(t.teamid));
      });

      $.when.apply($, calls)
        .done(() => {
          this.props.callback(infoWithAccepted, []);
        })
        .fail(this.makeError.bind(this));
    }

    reject() {
      this.makeBusy();

      var infoWithRejected = _.cloneDeep(this.props.info);
      infoWithRejected.teams = this.getApprovedTeams(infoWithRejected);

      var execNameStr = Login.me() + " " + this.props.info.email;
      var teamNames = _.map(this.props.info.teams,
        (t) => `Team ${t.teamid} (${t.team_name})`
      );
      var teamNamesStr = teamNames.join("; ");

      var msg = `Executive ${execNameStr} rejected: ${teamNamesStr}. ` +
        `Shenanigans may be afoot. Please investigate.`;
      Api.sendSupportEmail(msg)
        .done(() => {
          this.props.callback(infoWithRejected,
            this.getUnapprovedTeams(this.props.info))
        })
        .fail(this.makeError.bind(this));
    }

    makeBusy() {
      this.setState({ saving: true, error: false });
    }

    makeError() {
      this.setState({ saving: false, error: true });
    }
  }

  /*
    Modal-ized version of the above
  */
  export class ApproveTeamsModal extends ApproveTeams {
    renderWithData() {
      // Wrap onApprove to close modal
      var callback = (info: ApiT.LoginResponse,
                      removedTeams: ApiT.Team[]) => {
        this.props.callback(info, removedTeams);
        this.jQuery().modal('hide');
      };

      return <Components.ModalBase fixed={true}>
        <Components.ModalHeader title="Approve Access"
          icon="fa-warning" fixed={true} />

        <div className="modal-body">
          { this.renderMain() }
        </div>

        { this.renderFooter() }
      </Components.ModalBase>;
    }
  }
}
