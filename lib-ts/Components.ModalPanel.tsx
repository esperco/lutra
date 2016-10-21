/*
  A component used to wrap modal contents with things like busy indicators
  and completion buttons that can also be used outside of a modal
*/

/// <reference path="./Types.ts" />
/// <reference path="./Components.ErrorMsg.tsx" />

module Esper.Components {
  export interface ModalPanelFooterProps {
    // Show spinner?
    busy?: boolean;

    // Replaces buttons with text when busy
    busyText?: string|JSX.Element;

    // Show error icon?
    error?: boolean;

    // Element to show when error
    errorText?: string|JSX.Element;

    // Show success icon?
    success?: boolean;

    // Element to show when content on success, defaults to "saved"
    successText?: string|JSX.Element;

    // Cancel button options (subdued button)
    onCancel?: () => void;
    cancelText?: string|JSX.Element;
    disableCancel?: boolean;

    // OK button options (purple button)
    onOK?: () => void;
    okText?: string|JSX.Element;
    disableOK?: boolean;
  }

  export function ModalPanelFooter(props: ModalPanelFooterProps) {
    if (!props.busy && !props.error && !props.onCancel && !props.onOK ) {
      return <div></div>; // Don't show footer if nothing to show
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
          return <div></div>;
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
