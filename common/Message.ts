module Esper.Message {

  // Types used by Message
  export enum Type { // NB: Start at 1 so all types are truthy
    // Request and push updates to extension settings
    RequestSettings = 1,
    SettingsUpdate,

    // Request and push updates to Gmail ThreadState
    RequestThreadState,  // Request thread state from storage
    ThreadStateData,     // Data from storage
    ThreadStateUpdate,    // Update from user to save to storage

    // Open Extension options page
    OpenExtensionOptions,

    // Focus on the tab sending this message
    FocusOnSender,

    // Post an analytics tracking call
    Track,

    // Post call from CS to IS that location hash has changed
    LocationUpdate,

    // Instruct CS to render oonboarding modal again from IS
    RenderOnboarding
  }

  export interface Message {
    sender: string;       // "Esper"
    type: string|Type;    // Ideally should only use enum, but keep str for
                          // compatability reasons
    value: any;
  }

  // NB: Use a different sender so previous string-based options don't log
  // annoying error message
  var senderName = "EsperTyped";

  // Helper function for listening and responding to Esper messages
  export function listen(type: Type, callback: (value: any)=>void) {
    window.addEventListener("message", function(event) {
      var request: Message.Message = event.data;
      if (request && request.sender === senderName && request.type === type) {
        callback(request.value);
      }
    });
  }

  // Helper function for sending Esper messages
  export function post(type: Type, value?: any) {
    var esperMessage : Message.Message = {
      sender: senderName,
      type: type,
      value: value
    };

    /*
      TODO: "*" isn't the safest way to post a message, but this doesn't seem
      to work if we post a more specific domain. Fortunately, only scripts with
      access to the window object can view this data, and Gmail and Gcal
      doesn't permit embedding in iFrames or easy access to this object. The
      exception to this is that other Chrome extensions CAN access this data
      though, so we should find a way to hash or encrypt or otherwise limit
      visibility to posted messages
    */
    window.postMessage(esperMessage, "*");
  }
}
