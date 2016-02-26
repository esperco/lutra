/*
  A component used to wrap modal contents with things like busy indicators
  and completion buttons that can also be used outside of a modal
*/

/// <reference path="../lib/Components.ErrorMsg.tsx" />

module Esper.Components {
  interface FooterProps {
    busy?: boolean;
    onCancel?: () => void;
    cancelText?: string|JSX.Element;
    disableCancel?: boolean;
    onOK?: () => void;
    okText?: string|JSX.Element;
    disableOK?: boolean;
  }

  interface ModalPanelProps extends FooterProps {
    error?: boolean;
    children?: JSX.Element[];
  }

  export function ModalPanel(props: ModalPanelProps) {
    return <div>
      { props.error ? <Components.ErrorMsg /> : null }
      { props.children }
      { ModalPanelFooter(props) }
    </div>;
  }

  export function ModalPanelFooter(props: FooterProps) {
    return <div className="clearfix modal-footer">
      { props.busy ? <div className="esper-spinner" /> : null }
      {
        props.onCancel ?
        <button className="btn btn-default"
                onClick={props.onCancel}
                disabled={props.disableCancel}>
          {props.cancelText || "Cancel"}
        </button> :
        null
      }
      {
        props.onOK ?
        <button className="btn btn-primary"
                onClick={props.onOK}
                disabled={props.disableOK}>
          {props.okText || "OK"}
        </button> :
        null
      }
    </div>;
  }
}
