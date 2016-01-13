/*
  Refactored Login widget with various login options
*/

/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="../lib/Components.Modal.tsx" />
/// <reference path="../lib/Components.ErrorMsg.tsx" />
/// <reference path="../lib/ApiC.ts" />
/// <reference path="../lib/Util.ts" />
/// <reference path="../common/Login.Oauth.ts" />

module Esper.Components {
  var Component = ReactHelpers.Component;

  interface LoginProps {
    children?: JSX.Element[];

    // Show the Google button (uses Google API directly)
    showGoogle?: boolean;

    // Show the Microsoft button (uses Nylas)
    showExchange?: boolean;

    // Show the "Other Provider" button (uses Nylas)
    showNylas?: boolean;

    // Redirect after login
    landingUrl?: string;

    // Variables passed along to handle token issues or login prompt
    inviteCode?: string;
    email?: string;
  }

  interface LoginState {
    showNylasInput?: boolean; // For both Exchange and Other Nylas
    busy?: boolean;
    inputError?: boolean;
    serverError?: boolean;
  }

  export class LoginPrompt extends Component<LoginProps, LoginState> {
    _nylasInput: HTMLInputElement;

    constructor(props: LoginProps) {
      super(props);
      this.state = {
        busy: false
      };
    }

    render() {
      return <div id="esper-login">
        { this.state.busy ?
          <div className="esper-spinner esper-centered esper-medium" /> :
          ( this.state.serverError ?
            <div className="alert alert-danger text-center">
              We were unable to log you in. Please
              {" "}<a href="https://esper.com/contact">contact us</a>{" "}
              for support.
            </div> :
            this.props.children
          )
        }

        <div className={"buttons-container" +
                        (this.state.showNylasInput ? " shifted" : "")}>
          { this.props.showGoogle ? this.renderGoogleButton() : null }
          { this.props.showExchange ? this.renderExchangeButton() : null }
          { this.props.showNylas ? this.renderNylasButton() : null }
          { this.renderNylasInput() }
        </div>

        <div className="esper-advisory text-center"><p>
          By signing in, you agree to Esper&apos;s{" "}
          <a href="https://esper.com/terms-of-use">Terms of Use.</a>
        </p></div>

        <div className="sign-in-footer esper-advisory">
          <div className="esper-copyright">
            &copy; {" "}{ (new Date()).getFullYear() }{" "}
            Esper Technologies, Inc.{" "}
            <span className="esper-one-line">All rights reserved.</span>
          </div>
          <div>
            <a href="https://esper.com/contact"
               className="esper-link">Contact</a>
            <div className="esper-inline-divider" />
            <a href="https://esper.com/privacypolicy.html"
               target="blank"
               className="esper-link">Privacy</a>
            <div className="esper-inline-divider" />
            <a href="https://esper.com/termsofuse.html"
               target="blank"
               className="esper-link">
                 Terms
            </a>
          </div>
        </div>
      </div>;
    }

    renderGoogleButton() {
      return <button className="btn btn-primary sign-in-btn google-btn"
                     disabled={this.state.busy}
                     onClick={this.loginToGoogle.bind(this)}>
        <div className="sign-in-icon">
          <i className="fa fa-fw fa-google" />
        </div>
        <div className="sign-in-text">Google Account</div>
      </button>;
    }

    loginToGoogle(email?: string) {
      this.setState({busy: true, serverError: false});
      Login.loginWithGoogle({
        landingUrl: this.props.landingUrl,
        inviteCode: this.props.inviteCode,
        email: email || this.props.email
      }).fail(() => this.setState({busy: false, serverError: true}))
    }

    renderExchangeButton() {
      return <button className="btn btn-primary sign-in-btn exchange-btn"
                     onClick={this.showNylasInput.bind(this)}
                     disabled={this.state.busy}>
        <div className="sign-in-icon">
          <img src="img/exchange.svg" />
        </div>
        <div className="sign-in-text">Microsoft Exchange</div>
      </button>;
    }

    renderNylasButton() {
      return <button className="btn btn-primary sign-in-btn"
                     onClick={this.showNylasInput.bind(this)}
                     disabled={this.state.busy}>
        <div className="sign-in-icon">
          <i className="fa fa-fw fa-envelope" />
        </div>
        <div className="sign-in-text">Other Provider</div>
      </button>;
    }

    // Used for both Exchange and "Other"
    renderNylasInput() {
      var inputId = this.getId("nylas-email");
      return <div className="nylas-form">
        <div className={"form-group" + (
             this.state.inputError ? " has-error" : "")}>
          <a onClick={this.hideNylasInput.bind(this)}>
            <i className="fa fa-fw fa-arrow-circle-left" />
          </a>{" "}
          <label id={inputId} className="control-label">
            What's Your Email Address?
          </label>
          <input htmlFor={inputId} className="form-control"
                 ref={(c) => this._nylasInput = c }
                 onKeyDown={this.nylasKeydown.bind(this)}
                 disabled={this.state.busy}
                 defaultValue={this.props.email}
                 placeholder="name@email.com" />
        </div>
        <button className="btn btn-primary" disabled={this.state.busy}
                onClick={this.submitNylas.bind(this)}>
          Continue{" "}
          <i className="fa fa-fw fa-arrow-circle-right" />
        </button>
      </div>;
    }

    showNylasInput() {
      this.setState({showNylasInput: true, inputError: false});
      window.requestAnimationFrame(() => {
        $(this._nylasInput).focus();
      })
    }

    hideNylasInput() {
      this.setState({showNylasInput: false});
      $(this._nylasInput).blur();
    }

    submitNylas() {
      var val = $(this._nylasInput).val();
      if (Util.validateEmailAddress(val)) {
        this.setState({busy: true, serverError: false, inputError: false});
        Login.loginWithNylas({
          email: val,
          landingUrl: this.props.landingUrl,
          inviteCode: this.props.inviteCode
        }).fail((xhr: JQueryXHR) => {
          if (xhr.responseText && xhr.responseText.indexOf('Google') >= 0) {
            this.loginToGoogle(val);
          } else {
            this.setState({busy: false, serverError: true});
          }
        });
      } else {
        this.setState({busy: false, serverError: false, inputError: true});
      }
    }

    nylasKeydown(e: KeyboardEvent) {
      if (e.keyCode === 13) {
        e.preventDefault();
        this.submitNylas();
      }
    }
  }


  /*
    View for execs to approve team prior to logging in
  */
  interface ApproveProps {
    info: ApiT.LoginResponse;
    onApprove: (info: ApiT.LoginResponse) => void;
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

    getUnapprovedTeams(info?: ApiT.LoginResponse) {
      return _.filter(info.teams,
        (team) => team.team_executive === Login.me() && !team.team_approved
      );
    }

    getApprovedTeams(info?: ApiT.LoginResponse) {
      return _.difference(info.teams, this.getUnapprovedTeams(info));
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
          this.props.onApprove(infoWithAccepted);
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
          this.props.onApprove(infoWithRejected);
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
      var onApprove = (info: ApiT.LoginResponse) => {
        this.props.onApprove(info);
        this.jQuery().modal('hide');
      };

      return <Modal title="Approve Access" icon="fa-warning" fixed={true}>
        { React.createElement(ApproveTeams, _.extend({}, this.props, {
            onApprove: onApprove
          }) as ApproveProps)
        }
      </Modal>
    }
  }
}
