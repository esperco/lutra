/*
  Component for displaying little bubbles of hints
*/

/// <reference path="./Components.Dropdown.tsx" />

module Esper.Components {
  interface Props {
    className?: string;
    text: string|JSX.Element;
    dismissed?: boolean;
    children?: string|JSX.Element|JSX.Element[];
    preserve?: boolean;
  }

  interface State {
    dismissed: boolean;
  }

  export class Hint extends ReactHelpers.Component<Props, State> {
    _wrapper: HTMLDivElement;

    constructor(props: Props) {
      super(props);
      this.state = {
        dismissed: !!this.props.dismissed
      };
    }

    dismissHint() {
      this.mutateState((s) => s.dismissed = true);
    }

    autoDismiss() {
      if (! this.props.preserve) {
        this.dismissHint();
      }
    }

    render() {
      return <span className={classNames("hint-wrapper", this.props.className)}>
        <span className="hint-children"
              onClick={() => this.autoDismiss()}>
          { this.props.children }
        </span>
        { this.state.dismissed ? null : <div className="dropdown-hint">
          <Dropdown onClose={() => this.autoDismiss()}>
            <div className="dropdown-toggle hint-bubble" />
            <div className="dropdown-menu esper-section">
              <div className="alert alert-info hint-text compact">
                { this.props.text }
              </div>
              <button className="btn btn-default form-control"
                      onClick={() => this.dismissHint()}>
                Dismiss
              </button>
            </div>
          </Dropdown>
        </div> }
      </span>;
    }
  }
}
