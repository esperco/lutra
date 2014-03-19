/*
  Timezone picker modal based on the location picker.
*/

var tzpicker = (function() {
  var mod = {};

  function createForm() {
'''
<div #tzPickerModal
     class="modal fade" tabindex="-1"
     role="dialog" aria-labelledby="tz-picker-title"
     aria-hidden="true">
  <div class="tz-picker-dialog modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <img class="tz-picker-icon svg" src="/assets/img/globe.svg">
        <div style="float:right" data-dismiss="modal">
          <img class="svg modal-close" src="/assets/img/x.svg">
        </div>
        <h3 #tzPickerTitle
            class="modal-title">
          Change Time Zone
        </h3>
      </div>
      <div #tzPickerBody class="modal-body"></div>
    </div>
  </div>
</div>
'''
    var id = util.randomString();
    tzPickerTitle.attr("id", id);
    tzPickerModal.attr("aria-labelledby", id);

    return _view;
  }

  /*
    Parameters:
    - onTimezoneChange(oldTz, newTz):
        called when the timezone is set (when the modal is closed)
   */
  mod.create = function(param) {
    var form = createForm();
    var modal = form.tzPickerModal;
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
