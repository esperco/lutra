/*
  Component for requesting an exec to share calendar access (Nylas only)
*/

/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="./Esper.ts" />
/// <reference path="./Teams.ts" />

module Esper.Components {
  var Component = ReactHelpers.Component;

  interface RequestExecProps {
    onSave?: (p: JQueryPromise<ApiT.Team>) => void;
  }

  interface RequestExecState {
    busy?: boolean;
    error?: boolean;
  }

  export class RequestExec
    extends Component<RequestExecProps, RequestExecState>
  {
     _input: HTMLInputElement;

    constructor(props: RequestExecProps) {
      super(props);
      this.state = {};
    }

    render() {
      return <div className="form-group">
        <label className="control-label" htmlFor={this.getId("request-exec")}>
          Managing Time for Someone Else?
        </label>
        <p>
          If you're managing someone else's calendars, enter that person's
          e-mail address. We'll invite that person to Esper and set things up
          so that person can retain access to his or her Esper data if you
          decide to hand off calendar duties to someone else.
        </p>
        { this.state.error ?
          <div className="alert alert-danger">
            <i className="fa fa-fw fa-warning"></i>
            There was an error setting up calendar access for this e-mail
            address.{" "}<a href="https://esper.com/contact">Please contact us
            for assistance.</a>
          </div> :
          null
        }
        <div className="input-group">
          <input id={this.getId("request-exec")}
                 type="text" className="form-control"
                 ref={(c) => this._input = c}
                 onKeyDown={this.inputKeydown.bind(this)}
                 placeholder="tony.stark@example.com" />
          <span className="input-group-btn">
            <button className="btn btn-default" type="button"
                    disabled={this.state.busy}
                    onClick={this.submitInput.bind(this)}>
              <i className="fa fa-fw fa-send" />{" "}OK
            </button>
          </span>
        </div>
      </div>;
    }

    submitInput() {
      var input = $(this._input);
      var val = input.val().trim();
      if (val) {
        this.setState({
          busy: true,
          error: false
        })

        var p = Teams.createExecTeam(val);
        p.done(() => this.setState({
            busy: false,
            error: false
          }))
          .fail(() => this.setState({
            busy: false,
            error: true
          }));

        if (this.props.onSave) {
          this.props.onSave(p);
        }
      }
      input.val("");
    }

    // Catch enter key on input -- use jQuery to actual examine value
    inputKeydown(e: KeyboardEvent) {
      if (e.keyCode === 13) {
        e.preventDefault();
        this.submitInput();
      }
    }
  }
}
