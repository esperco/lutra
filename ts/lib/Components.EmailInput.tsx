/*
  Refactored component for requesting an e-mail address / sending e-mail
*/

/// <reference path="./Components.ErrorMsg.tsx" />
/// <reference path="./ReactHelpers.ts" />

module Esper.Components {
  interface Props {
    label?: string|JSX.Element|JSX.Element[];
    successMsg?: string|JSX.Element|JSX.Element[];
    errorMsg?: string|JSX.Element|JSX.Element[];
    onSubmit: (email: string) => JQueryPromise<any>;
  }

  export class EmailInput extends ReactHelpers.Component<Props, {
    busy?: boolean;
    error?: boolean;
    success?: boolean;
    validationError?: boolean;
  }> {
    _input: HTMLInputElement;

    constructor(props: Props) {
      super(props);
      this.state = {
        busy: false,
        error: false,
        success: false,
        validationError: false
      };
    }

    render() {
      return <div>
        { this.state.success && this.props.successMsg ?
          <div className="alert alert-success text-center">
            <i className="fa fa-fw fa-check" />{" "}
            { this.props.successMsg }
          </div> : null }

        { this.state.error ?
          <Components.ErrorMsg msg={this.props.errorMsg} /> : null }

        <div className={classNames({"has-error": this.state.validationError})}>
          { this.props.label ? <label htmlFor={this.getId("email")}>
            { this.props.label }
          </label> : null }
          <div className="input-group">
            <input ref={(c) => this._input = c} id={this.getId("email")}
                   type="text" className="form-control"
                   onKeyDown={(e) => this.inputKeydown(e)}
                   disabled={this.state.busy}
                   placeholder="someone@email.com" />
            <span className="input-group-btn">
              <button className="btn btn-default" type="button"
                      onClick={() => this.send()} disabled={this.state.busy}>
                <i className="fa fa-fw fa-send" />
              </button>
            </span>
          </div>
        </div>
      </div>;
    }

    // Catch enter / up / down keys
    inputKeydown(e: __React.KeyboardEvent) {
      var val = (e.target as HTMLInputElement).value;
      if (e.keyCode === 13) {         // Enter
        e.preventDefault();
        this.send();
      } else if (e.keyCode === 27) {  // ESC
        e.preventDefault();
        $(e.target as HTMLInputElement).val("");
      }
    }

    send() {
      var value: string = $(this._input).val();
      if (Util.validateEmailAddress(value)) {
        this.setState({
          busy: true,
          error: false,
          success: false,
          validationError: false
        });

        this.props.onSubmit(value)
          .done(() => {
            $(this._input).val("");
            this.setState({ busy: false, success: true });
          })
          .fail(() => this.setState({ busy: false, error: true }));
      }

      // Invalid email address
      else {
        this.setState({
          busy: false,
          error: false,
          success: false,
          validationError: true
        });
      }
    }
  }
}
