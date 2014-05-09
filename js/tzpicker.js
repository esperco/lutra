/*
  Timezone picker modal based on the location picker.
*/

var tzpicker = (function() {
  var mod = {};

  function createForm() {
'''
<div #view
     class="modal fade"
     tabindex="-1"
     role="dialog"
     aria-hidden="true">
  <div #dialog
       class="modal-dialog tz-picker-modal">
    <div #content
         class="modal-content tz-picker-modal">
      <div class="modal-header">
        <div #iconContainer
             class="modal-icon tz-picker-modal-icon"/>
        <div #closeContainer
             class="modal-close"
             data-dismiss="modal"/>
        <div #tzPickerTitle
            class="modal-title">
          Change Time Zone
        </div>
      </div>
      <div #tzPickerBody class="modal-body"/>
    </div>
  </div>
</div>
'''
    var icon = $("<img class='svg-block'/>")
      .appendTo(iconContainer);
    svg.loadImg(icon, "/assets/img/globe-modal.svg");

    var close = $("<img class='svg-block'/>")
      .appendTo(closeContainer);
    svg.loadImg(close, "/assets/img/x.svg");

    var id = util.randomString();
    tzPickerTitle.attr("id", id);
    view.attr("aria-labelledby", id);

    closeContainer.click(function() {
      view.modal("hide");
    })

    return _view;
  }

  /*
    Parameters:
    - onTimezoneChange(oldTz, newTz):
        called when the timezone is set (when the modal is closed)
   */
  mod.create = function(param) {
    var form = createForm();
    var modal = form.view;
    var body = form.tzPickerBody;

    function close() {
      modal.modal("hide");
    }

    function onTimezoneChange(oldTz, newTz) {
      close();
      param.onTimezoneChange(oldTz, newTz);
    }

    var picker = locpicker.create({
      onLocationSet: function() {},
      onTimezoneChange: onTimezoneChange,
      showDetails: false
    });

    body.append(picker.view);

    modal.modal({});

    modal
      .on("shown.bs.modal", function() {
        picker.focus();
      });

    return {
      view: modal,
      close: close
    };
  };

  return mod;
})();
