/*
  A component that expands and closes when you click on the header
*/

/// <reference path="./ReactHelpers.ts" />

module Esper.Components {

  interface Props {
    initOpen?: boolean;
    header: JSX.Element|JSX.Element[]|string;
    onOpen?: () => void;
    onClose?: () => void;
    onToggle?: () => void;
    children?: JSX.Element[];

    /*
      An Expando group is a list you can pass to an Expando as a property to
      make an Expando close other Expandos when it closes. The group list
      should be initialized by the parent component's constructor, *not* in the
      render function (otherwise we get multiple groups referencing the same
      epxandos)
    */
    group?: Expando[];
  }

  interface State {
    open: boolean;
  }

  export class Expando extends ReactHelpers.Component<Props, State> {
    constructor(props: Props) {
      super(props);
      this.state = {
        open: !!props.initOpen
      }
    }

    render() {
      return <div className="esper-expando">
        <div className="esper-expando-header" onClick={() => this.toggle()}>
          <span className="esper-expando-caret">
            <i className={classNames("fa", "fa-fw", {
              "fa-caret-right": !this.state.open,
              "fa-caret-down": this.state.open
            })} />
          </span>
          {this.props.header}
        </div>
        <div className={classNames("esper-expando-body", {
          open: this.state.open
        })}>
          {this.props.children}
        </div>
      </div>
    }

    open() {
      this.setState({open: true});
      if (this.props.onOpen) { this.props.onOpen(); }
      if (this.props.group) {
        _.each(this.props.group, (g) => {
          if (g !== this) {
            g.close();
          }
        });
      }
    }

    close() {
      this.setState({open: false});
      if (this.props.onClose) { this.props.onClose(); }
    }

    toggle() {
      if (this.state.open) {
        this.close();
      } else {
        this.open();
      }
      if (this.props.onToggle) { this.props.onToggle(); }
    }


    /* Group management */

    componentDidMount() {
      this.props.group.push(this);
    }

    componentWillUnmount() {
      super.componentWillUnmount();
      if (this.props.group) {
        _.pull(this.props.group, this);
      }
    }
  }
}
