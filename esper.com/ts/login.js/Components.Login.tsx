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

    // Callback for Google login click
    onGoogleLogin?: () => JQueryPromise<any>;

    // Callback for Nylas login click
    onNylasLogin?: (email: string) => JQueryPromise<any>;

    // If platform is known, can default to e-mail input as appropriate
    platform?: string; // Google / Exchange / Nylas

    // Pre-populate email input with this address
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
        showNylasInput: (
          this.props.platform === "exchange" ||
          this.props.platform === "nylas"),
        busy: false
      };

      if (this.state.showNylasInput) {
        window.requestAnimationFrame(() => {
          $(this._nylasInput).focus();
        });
      }
    }

    render() {
      return <div id="esper-login">
        { this.state.busy ?
          <div className="spinner" /> :
          ( this.state.serverError ?
            <div className="alert danger text-center">
              We were unable to log you in. Please
              {" "}<a href="https://esper.com/contact">contact us</a>{" "}
              for support.
            </div> :
            this.props.children
          )
        }

        { this.state.showNylasInput ?
          this.renderNylasInput() :
          <div className="buttons-container">
            { this.props.onGoogleLogin ? this.renderGoogleButton() : null }
            { this.props.onNylasLogin ? this.renderExchangeButton() : null }
            { this.props.onNylasLogin ? this.renderNylasButton() : null }
          </div> }

        <div className="note"><p>
          By signing in, you agree to Esper&apos;s&nbsp;
          <a href="/terms-of-use">Terms&nbsp;of&nbsp;Use.</a>
        </p></div>
      </div>;
    }

    renderGoogleButton() {
      return <button className="cta primary sign-in-btn google-btn"
                     disabled={this.state.busy}
                     onClick={this.loginToGoogle.bind(this)}>
        <div className="sign-in-icon">
          <i className="fa fa-fw fa-google" />
        </div>
        <div className="sign-in-text">Google Calendar</div>
      </button>;
    }

    loginToGoogle() {
      this.setState({busy: true, serverError: false});
      this.props.onGoogleLogin()
        .fail(() => this.setState({busy: false, serverError: true}));
    }

    renderExchangeButton() {
      return <button className="cta primary sign-in-btn exchange-btn"
                     onClick={this.showNylasInput.bind(this)}
                     disabled={this.state.busy}>
        <div className="sign-in-icon">
          <img src="img/exchange.svg" />
        </div>
        <div className="sign-in-text">Microsoft Exchange</div>
      </button>;
    }

    renderNylasButton() {
      return <button className="cta primary sign-in-btn"
                     onClick={this.showNylasInput.bind(this)}
                     disabled={this.state.busy}>
        <div className="sign-in-icon">
          <i className="fa fa-fw fa-calendar-o" />
        </div>
        <div className="sign-in-text">Other Calendar</div>
      </button>;
    }

    // Used for both Exchange and "Other"
    renderNylasInput() {
      var inputId = this.getId("nylas-email");
      return <div className="nylas-form">
        <div className={"form-group" + (
             this.state.inputError ? " has-error" : "")}>
          <button onClick={this.hideNylasInput.bind(this)}>
            <i className="fa fa-fw fa-arrow-circle-left" />
          </button>{" "}
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
        <button className="cta primary" disabled={this.state.busy}
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
        this.props.onNylasLogin(val)
          .fail(() => this.setState({busy: false, serverError: true}));
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
