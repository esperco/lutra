/*
  A component used to wrap modal contents with things like busy indicators
  and completion buttons that can also be used outside of a modal
*/

/// <reference path="./Types.ts" />
/// <reference path="./Components.ErrorMsg.tsx" />

module Esper.Components {
  export function ModalPanelFooter(props: Types.ModalPanelFooterProps) {
    if (!props.busy && !props.error && !props.onCancel && !props.onOK ) {
      return; // Don't show footer if nothing to show
    }

    return <div className="clearfix modal-footer">
      { (() => {
          if (props.busy) {
            return <div className="esper-spinner" />;
          }

          else if (props.error) {
            return <span className="pull-left esper-footer-text text-danger">
              { props.errorText || <span>
                <i className="fa fa-fw fa-warning" />
                {" "}Error
              </span> }
            </span>;
          }

          else if (props.success) {
            return <span className="pull-left esper-footer-text text-success">
              { props.successText || <span>
                <i className="fa fa-fw fa-check" />
                {" "}Saved
              </span> }
            </span>;
          }
        })()
      }
      {
        props.onCancel && !(props.busyText && props.busy) ?
        <button className="btn btn-default"
                onClick={props.onCancel}
                disabled={props.disableCancel}>
          {props.cancelText || "Cancel"}
        </button> :
        null
      }
      {
        props.onOK && !(props.busyText && props.busy) ?
        <button className="btn btn-primary"
                onClick={props.onOK}
                disabled={props.disableOK}>
          {props.okText || "OK"}
        </button> :
        null
      }
      { props.busy ? props.busyText : null }
    </div>;
  }
}
