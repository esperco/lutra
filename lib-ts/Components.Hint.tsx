/*
  Component for displaying little bubbles of hints
*/

/// <reference path="./Components.Dropdown.tsx" />

module Esper.Components {
  interface Props {
    text: string|JSX.Element;
    nested?: boolean;
    dismissed?: boolean;
    style?: React.CSSProperties;
  }

  interface State {
    dismissed: boolean;
  }

  export class Hint extends ReactHelpers.Component<Props, State> {
    constructor(props: Props) {
      super(props);
      this.state = {
        dismissed: !!this.props.dismissed
      };
    }

    dismissHint() {
      this.mutateState((s) => s.dismissed = true);
    }

    render() {
      if (this.state.dismissed)
        return null;

      return <Dropdown nested={this.props.nested}>
        <div className="dropdown-toggle hint-bubble"
             style={this.props.style} />
        <div className="dropdown-menu esper-section">
          <div className="alert alert-info hint-text">
            { this.props.text }
          </div>

          <button className="btn btn-primary"
                  onClick={this.dismissHint.bind(this)}>
            Dismiss
          </button>
        </div>
      </Dropdown>;
    }
  }
}
