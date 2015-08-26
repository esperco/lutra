module Esper {
  export var Test = (function() {
    var exports: any = {};
    if (! __ESPER_PRODUCTION__) {
      exports.getTestFrame = function() {
        return $("#esper-test-frame");
      };

      exports.goTo = function(href: string,
                              done?: (event: JQueryEventObject) => void) {
        var frame = this.getTestFrame();
        if (done) {
          frame.one("load", done);
        }
        frame.attr("src", href);
      }
    }
    return exports;
  })();
}

