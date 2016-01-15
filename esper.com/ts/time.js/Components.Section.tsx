/*
  Minimizable section
*/

/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="./Esper.ts" />

module Esper.Components {
  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  interface BorderlessSectionProps {
    title: string;
    icon?: string; // fa-*
    minimized?: boolean;
    toggleMinimized?: () => void;
    children?: any[];
  }

  interface BorderlessSectionState {
    minimized?: boolean;   // Used to track minimized state if props not set
  }

  export class BorderlessSection
    extends Component<BorderlessSectionProps, BorderlessSectionState>
  {
    constructor(props: BorderlessSectionProps) {
      super(props);
      this.state = {};
    }

    render() {
      var minimized = this.props.toggleMinimized ?
        this.props.minimized : this.state.minimized;
      var minIcon = <i className={"fa pull-right min-icon " +
        (minimized ? "fa-plus-square" : "fa-minus-square")
      } onClick={this.onClickMin.bind(this)} />;
      return <div className={"esper-borderless-section" +
          (minimized ? " minimized" : "")}>
        <h4 className="esper-header">
          {minIcon}
          {
            this.props.icon ?
            <i className={"fa fa-fw " + this.props.icon}></i> :
            ""
          }{" "}
          { this.props.title }
        </h4>
        <div className="esper-content">
          { minimized ? "" : this.props.children }
        </div>
      </div>;
    }

    onClickMin() {
      if (this.props.toggleMinimized) {
        this.props.toggleMinimized();
      } else {
        this.setState({
          minimized: !(this.state && this.state.minimized)
        })
      }
    }
  }
}
