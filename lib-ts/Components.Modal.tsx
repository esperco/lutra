/*
  Generic Bootstrap modal wrapper
*/

/// <reference path="./ReactHelpers.ts" />

module Esper.Components {
  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  interface ModalProps {
    title?: string;
    busy?: boolean;
    icon?: string;
    small?: boolean;
    disableOk?: boolean;
    dismissText?: string;
    fixed?: boolean;
    okText?: string;
    showFooter?: boolean;
    okOnClick?: () => void;
    onHidden?: () => void;
    children?: JSX.Element[];
  }

  export class Modal extends Component<ModalProps, {}> {
    _mounted: boolean;

    render() {
      return (<div className="modal fade"
                   data-backdrop={this.props.fixed ? 'static' : 'true'}>
        <div className={"modal-dialog" + (this.props.small ? " modal-sm" : "")}>
          <div className="modal-content">
            {
              this.props.title ?
              <div className="modal-header">
                <h4 className="modal-title">
                  { this.props.fixed ? null :
                    <span className="action close-action pull-right"
                          data-dismiss="modal">
                      <span aria-hidden="true">
                        <i className="fa fa-fw fa-times" />
                      </span>
                    </span>
                  }
                  { this.props.icon ?
                    <span>
                      <i className={"fa fa-fw " + this.props.icon} />{" "}
                    </span> : ""
                  }
                  {this.props.title}
                </h4>
              </div> : null
            }
            <div className="modal-body">
              {this.props.children}
            </div>
            {
              (this.props.showFooter || this.props.okOnClick) ?
              <div className="modal-footer">
                {
                  this.props.busy ?
                  <span className="esper-spinner"></span> :
                  ""
                }
                { this.props.fixed ? null :
                  <button type="button" className="btn btn-default"
                      data-dismiss="modal">
                    {this.props.dismissText || "Close"}
                  </button>
                }
                {
                  this.props.okOnClick ?
                  <button type="button"
                      disabled={this.props.disableOk}
                      onClick={this.props.okOnClick}
                      className="btn btn-primary">
                    {this.props.okText || "OK"}
                  </button> : ""
                }
              </div>: ""
            }
          </div>
        </div>
      </div>);
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
}
