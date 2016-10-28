/*
  Component for displaying little bubbles of hints
*/

/// <reference path="./Components.Dropdown.tsx" />

module Esper.Components {
  const OVERLAY_PREFIX = "hint-";

  interface Props {
    text: string|JSX.Element;
    anchorId: string;
    dismissed?: boolean;
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

      let anchor = $("#" + this.props.anchorId);
      let offset = anchor.offset() || { left: 0, top: 0 };
      let left = offset.left - $(window).scrollLeft() + anchor.width();
      let top = offset.top - $(window).scrollTop() + (anchor.height()/2);
      let style = { left, top };

      return <Dropdown>
        <Overlay id={this.props.anchorId}>
          <div className="dropdown-toggle hint-bubble"
               style={style} />
          <div className="dropdown-menu esper-section">
            <div className="alert alert-info hint-text compact">
              { this.props.text }
            </div>

            <button className="btn btn-default form-control"
                    onClick={this.dismissHint.bind(this)}>
              Dismiss
            </button>
          </div>
        </Overlay>
      </Dropdown>;
    }
  }
}
