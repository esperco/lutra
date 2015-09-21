/** A module for quickly creating various styles of modal dialogs. */
module Esper.Modal {
  export interface Modal {
    view    : JQuery;
    modal   : JQuery;
    header  : JQuery;
    content : JQuery;
    footer  : JQuery;
  }

  /** Returns a modal with no header, contents or buttons. */
  export function empty() : Modal {
'''
<div #view class="esper-modal-bg">
  <div #modal class="esper-modal-default">
    <div #header class="esper-modal-header"> </div>
    <div #content class="esper-modal-conent"> </div>
    <div #footer class="esper-modal-footer esper-clearfix"> </div>
  </div>
</div>
'''
    return {
      view    : view,
      modal   : modal,
      header  : header,
      content : content,
      footer  : footer
    };
  }

  /** Like a normal alert with a single Ok button. */
  export function alert(title : string, body : JQuery, onClose? : () => void) : Modal {
'''
<button #okButton class="esper-btn esper-btn-primary modal-primary">
  Ok
</button>
'''
    var modal = empty();

    modal.header.text(title);
    modal.content.append(body);

    modal.footer.append(okButton);

    function closeView() {
      if (onClose) {
        onClose();
      }

      modal.view.remove();
    }
    okButton.click(closeView);
    modal.view.click(closeView);

    return modal;
  }

  function makeCloseBox() {
'''
<span #closeBox class="esper-tl-close esper-clickable">×</span>
'''
    return closeBox;
  }

  /** Dialog box with a single Ok button. */
  export function dialog(title : string, body : JQuery,
                         onClose? : () => boolean) : Modal {
'''
<button #okButton class="esper-btn esper-btn-primary modal-primary">
  Ok
</button>
'''
    var closeBox = makeCloseBox();
    var modal = empty();

    modal.header.text(title);
    modal.header.append(closeBox);
    modal.content.append(body);

    modal.footer.append(okButton);

    function closeView() {
      if (! onClose || onClose()) {
        modal.view.remove();
      }
    }
    okButton.click(closeView);
    closeBox.click(closeView);

    return modal;
  }
}