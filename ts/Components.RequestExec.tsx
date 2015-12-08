/*
  Component for requesting an exec to share calendar access (Nylas only)
*/

/// <reference path="../marten/ts/ReactHelpers.ts" />
/// <reference path="../marten/ts/Api.ts" />
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
      extends Component<RequestExecProps, RequestExecState> {
     _input: React.Component<any, any>;

    constructor(props: RequestExecProps) {
      super(props);
      this.state = {};
    }

    render() {
      return <div className="form-group">
        <label className="control-label" htmlFor={this.getId("request-exec")}>
          Request Calendar Access From Someone Else
        </label>
        <p>
          Don't see the calendar you want? Enter the e-mail address of the
          calendar owner to have Esper request permission to access it on
          your behalf.
        </p>
        { this.state.error ?
          <div className="alert alert-danger">
            <i className="fa fa-fw fa-warning"></i>
            There was an error requesting calendar access for this e-mail
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
              { this.state.busy ?
                <span>
                  Sending &hellip;
                </span> :
                <span>
                  <i className="fa fa-fw fa-send" />{" "}Request
                </span>
              }
            </button>
          </span>
        </div>
      </div>;
    }

    submitInput() {
      var input = $(React.findDOMNode(this._input));
      var val = input.val().trim();
      if (val) {
        this.setState({
          busy: true,
          error: false
        })

        var p = Teams.saveNylasExecTeam(val);
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