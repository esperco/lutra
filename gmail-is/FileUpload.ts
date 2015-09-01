/** A widget which lets people upload files to Google Drive. */
module Esper.FileUpload {
  export interface FileInfo {
    name : string;
    id   : string
  }
  
  export function uploadWidget(onUpload) {
'''
<div #attachmentsRow class="esper-ev-modal-row esper-clearfix">
  <div class="esper-ev-modal-left esper-bold">Attachments</div>
  <div class="esper-ev-modal-right">
    <input #attachmentPicker type="file" multiple> Attach files to event. </input>
    <button #uploadButton type="button"> Upload files </button>
    <span #uploadingMessage>Uploading...</span>
  </div>
</div>
'''
    uploadingMessage.hide();

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
      uploadingMessage.show();

      uploadFiles().done(function (fileInfos) {
        uploadButton.prop("disabled", false);
        uploadingMessage.hide();

        onUpload(fileInfos);
      });
    });

    return attachmentsRow;
  }
}