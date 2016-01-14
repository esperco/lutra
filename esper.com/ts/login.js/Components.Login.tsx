/*
  Refactored Login widget with various login options
*/

/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="../lib/Util.ts" />
/// <reference path="./Login.Oauth.ts" />

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
}
