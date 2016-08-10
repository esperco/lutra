/*
  Generic Bootstrap modal wrapper
*/

/// <reference path="./Components.ModalPanel.tsx" />
/// <reference path="./ReactHelpers.ts" />

module Esper.Components {
  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  /*
    Use ModalBase to provide custom header / footer
  */

  interface ModalBaseProps {
    children?: JSX.Element[];
    fixed?: boolean;
    small?: boolean;
    onHidden?: () => void;
  }

  export class ModalBase extends Component<ModalBaseProps, {}> {
     _mounted: boolean;

    render() {
      return (<div className="modal fade"
                   data-backdrop={this.props.fixed ? 'static' : 'true'}>
        <div className={"modal-dialog" + (this.props.small ? " modal-sm" : "")}>
          <div className="modal-content">
            { this.props.children }
          </div>
        </div>
      </div>);
    }

    close() {
      this.jQuery().modal('hide');
    }

    componentDidMount() {
      this._mounted = true;
      this.jQuery().on('hidden.bs.modal', () => {
        if (this.props.onHidden) {
          this.props.onHidden();
        }
        if (this._mounted) {
          this.jQuery().parent().remove();
        }
      });
      this.jQuery().on('shown.bs.modal', () => {
        this.find('.esper-modal-focus:first').focus();
      });
    }

    componentWillUnmount() {
      this._mounted = false;
      super.componentWillUnmount();
    }
  }


  interface ModalHeaderProps {
    fixed?: boolean;
    icon?: string;
    title: JSX.Element|string;
  }

  export function ModalHeader(props: ModalHeaderProps) {
    return <div className="modal-header">
      <h4 className="modal-title">
        { props.fixed ? null :
          <span className="action close-action pull-right"
                data-dismiss="modal">
            <span aria-hidden="true">
              <i className="fa fa-fw fa-times" />
            </span>
          </span>
        }
        { props.icon ?
          <span>
            <i className={"fa fa-fw " + props.icon} />{" "}
          </span> : ""
        }
        {props.title}
      </h4>
    </div>;
  }


  interface ModalFooterProps {
    busy?: boolean;
    fixed?: boolean;
    dismissText?: string;
    disableOk?: boolean;
    okText?: string;
    okOnClick?: () => void;
  }

  export function ModalFooter(props: ModalFooterProps) {
    return <div className="modal-footer">
      {
        props.busy ?
        <span className="esper-spinner"></span> :
        ""
      }
      { props.fixed ? null :
        <button type="button" className="btn btn-default"
                data-dismiss="modal">
          {props.dismissText || "Close"}
        </button>
      }
      {
        props.okOnClick ?
        <button type="button"
            disabled={props.disableOk}
            onClick={props.okOnClick}
            className="btn btn-primary">
          {props.okText || "OK"}
        </button> : ""
      }
    </div>;
  }


  /*
    Use Modal component for standard header with icon + footer with spinner
    and dismiss button
  */

  interface ModalProps extends ModalBaseProps, ModalHeaderProps {
    footer?: ModalPanelFooterProps
  }

  export class Modal extends Component<ModalProps, {}> {
    _modalBase: ModalBase;

    render() {
      return <ModalBase
        ref={(c) => this._modalBase = c}
        fixed={this.props.fixed}
        small={this.props.small}
        onHidden={this.props.onHidden}
      >
        {
          this.props.title ?
          <ModalHeader
            title={this.props.title}
            icon={this.props.icon}
            fixed={this.props.fixed}
          /> : null
        }
        <div className="modal-body">
          {this.props.children}
        </div>
        { this.props.footer ? this.renderFooter() : null }
      </ModalBase>;
    }

    renderFooter() {
      // Wrap footer callbacks so they close modal
      let footerProps = _.clone(this.props.footer);
      if (footerProps.onCancel) {
        let origFn = footerProps.onCancel;
        footerProps.onCancel = () => {
          this._modalBase.close();
          origFn();
        };
      }

      if (footerProps.onOK) {
        let origFn = footerProps.onOK;
        footerProps.onOK = () => {
          this._modalBase.close();
          origFn();
        };
      }

      return React.createElement(ModalPanelFooter, footerProps);
    }
  }
}
