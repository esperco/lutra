/*
  Entry point for the options.js script
*/

/// <reference path="../marten/typings/jquery/jquery.d.ts" />
/// <reference path="../marten/typings/jqueryui/jqueryui.d.ts" />
/// <reference path="../marten/typings/lodash/lodash.d.ts" />
/// <reference path="../marten/typings/chrome/chrome.d.ts" />

/// <reference path="../common/Esper.ts" />
/// <reference path="../common/ExtensionOptions.ts" />

module Esper.Main {

  /////////

  function setLoading(val?: boolean) {
    var elm = $('#load-status');
    if (val) {
      elm.show();
    } else {
      elm.hide();
    }
  }

  enum SaveStates { BLANK, SAVING, SAVED };

  function setSaving(state: SaveStates) {
    var elm = $('#save-status');
    switch(state) {
      case SaveStates.SAVING:
        elm.text("Saving ...");
        break;
      case SaveStates.SAVED:
        elm.text("Saved");
        break;
      default:
        elm.text("");
    }

    var btn = $('#save-btn');
    switch(state) {
      case SaveStates.SAVING:
        btn.prop("disabled", true);
        break;
      default:
        btn.prop("disabled", false);
    }
  };


  /////////

  // Inspect form and save elements
  function save(e: JQueryEventObject): void {
    e.preventDefault();
    setSaving(SaveStates.SAVING);

    var defaultSidebarState: ExtensionOptions.SidebarOpts;
    if ($('#default-sidebar-hide').prop("checked")) {
      defaultSidebarState = ExtensionOptions.SidebarOpts.HIDE;
    } else {
      defaultSidebarState = ExtensionOptions.SidebarOpts.SHOW;
    }

    var opts: ExtensionOptions.Options = {
      defaultSidebarState: defaultSidebarState
    };

    ExtensionOptions.save(opts, function() {
      setSaving(SaveStates.SAVED);
    });
  }


  /////////

  function load() {
    setLoading(true);
    ExtensionOptions.load(function(opts) {
      if (opts.defaultSidebarState === ExtensionOptions.SidebarOpts.HIDE) {
        $('#default-sidebar-hide').prop("checked", true)
      } else { // show
        $('#default-sidebar-show').prop("checked", true);
      }
      setLoading(false);
    });
  }

  export function init() {
    load();
    $('#options-form').submit(save);
  }
}

/* Called once per page, but wait for vendor files to load */
if (Esper.vendorReady) {
  Esper.Main.init();
} else {
  Esper.onVendorReady = Esper.Main.init;
}
