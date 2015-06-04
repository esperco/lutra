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
  export function empty(onClose? : () => void) : Modal {
'''
<div #view class="esper-modal-bg">
  <div #modal class="esper-modal-default">
    <div #header class="esper-modal-header"> </div>
    <div #content class="esper-modal-conent"> </div>
    <div #footer class="esper-modal-footer esper-clearfix"> </div>
  </div>
</div>
'''
    view.click(function () {
      if (onClose) {
        onClose();
      }

      view.remove();
    });

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
    var modal = empty(onClose);

    modal.header.text(title);
    modal.content.append(body);

    modal.footer.append(okButton);
    okButton.click(function () {
      if (onClose) {
        onClose();
      }

      modal.view.remove();
    });

    return modal;
  }
}