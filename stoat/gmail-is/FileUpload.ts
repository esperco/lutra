/** A widget which lets people upload files to Google Drive. */
module Esper.FileUpload {
  export interface FileInfo {
    name : string;
    id   : string
  }

  export function uploadWidget(onUpload) {
'''
<div #attachmentsRow class="form-group clearfix">
<label class="control-label col-sm-2" for="esper-attachments">Attachments</label>
  <div class="col-sm-10">
    <div class="input-group">
      <input #attachmentPicker id="esper-attachments"
        type="file" class="form-control" multiple>
        Attach files to event</input>
      <span class="input-group-btn">
        <button #uploadButton type="button" class="btn btn-secondary">
          <span #busyMessage>Uploading &hellip;</span>
          <span #readyMessage>Upload Files</span>
        </button>
      </span>
    </div>
  </div>
</div>
'''
    busyMessage.hide();
    readyMessage.show();

    /** Upload all the files currently selected in attachmentPicker. */
    function uploadFiles() {
      // For some reason, .files is a FileList and not a normal Array :(
      var files = Array.prototype.slice.call(
        (<HTMLInputElement> attachmentPicker[0]).files);

      var promises = files.map(function (file) {
        var reader = new FileReader();
        var name = file.name;
        var promise = $.Deferred<{ name: string, id: string }>();

        reader.readAsDataURL(file);
        reader.addEventListener("loadend", function () {
          var result = reader.result;

          // base64 contents from the data URL, stripping the URL bits:
          result = result.replace(/data:[^;]*;base64,/, "");
          Api.putFiles(name, file.type, result).done(function (response) {
            promise.resolve({ id: response.id, name: "" }); // Name filled in below
          });
        });

        return promise.then(function (response) {
          return {
            name : name,
            id : response.id
          };
        });
      });

      return Promise.join(promises);
    }

    uploadButton.click(function () {
      uploadButton.prop("disabled", true);
      busyMessage.show();
      readyMessage.hide();

      uploadFiles().done(function (fileInfos) {
        uploadButton.prop("disabled", false);
        busyMessage.hide();
        readyMessage.show();

        onUpload(fileInfos);
      });
    });

    return attachmentsRow;
  }
}