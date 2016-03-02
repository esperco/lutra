/*
  Modal to approve teams
*/

/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="../lib/Components.Modal.tsx" />
/// <reference path="../lib/Components.ErrorMsg.tsx" />
/// <reference path="../lib/ApiC.ts" />
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
      ApiC.getAllProfiles();
    }

    // Get data from external stores
    getData() {
      var fn = ApiC.getAllProfiles;
      var store = fn.store;
      var key = fn.strFunc([]);
      var meta = store.metadata(key);
      var val = store.val(key);
      return {
        profiles: val && val.profile_list,
        dataStatus: meta && meta.dataStatus
      };
    }

    renderWithData() {
      var data = this.getData();
      if (data.dataStatus) {
        var loading = data.dataStatus === Model.DataStatus.FETCHING;
        var error = (data.dataStatus === Model.DataStatus.FETCH_ERROR ||
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
      var data = this.getData();
      var profile = _.find(data.profiles,
        (profile) => profile.profile_uid === uid
      );
      if (profile) {
        if (profile.display_name === profile.email) {
          return profile.display_name;
        } else {
          return profile.display_name + " <" + profile.email + ">";
        }
      }
      return "Unknown User";
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
  export class ApproveTeamsModal extends Component<ApproveProps, {}> {
    render() {
      // Wrap onApprove to close modal
      var callback = (info: ApiT.LoginResponse,
                      removedTeams: ApiT.Team[]) => {
        this.props.callback(info, removedTeams);
        this.jQuery().modal('hide');
      };

      return <Components.Modal title="Approve Access" icon="fa-warning"
                               fixed={true}>
        { React.createElement(ApproveTeams, _.extend({}, this.props, {
            callback: callback
          }) as ApproveProps)
        }
      </Components.Modal>
    }
  }
}
