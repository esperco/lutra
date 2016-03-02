/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="../lib/Api.ts" />
/// <reference path="../common/Login.ts" />

module Esper.Views {

  export class Footer extends ReactHelpers.Component<{}, {}> {
    renderWithData() {
      return <div className="footer">
        <div className="container-fluid padded clearfix">
          <ul className="footer-links pull-left nav nav-pills">
            <li><a href="/" target="_blank">Home</a></li>
            <li><a href="/contact" target="_blank">Contact</a></li>
            <li><a href="/privacy-policy" target="_blank">Privacy</a></li>
            <li><a href="/terms-of-use" target="_blank">Terms</a></li>
          </ul>
          <div className="pull-right navbar-text"
               onDoubleClick={this.testError}>
            &copy; {new Date().getFullYear()} Esper
          </div>
        </div>
      </div>;
    }

    /*
      This function intentionally throws an error (use for testing error
      catching
    */
    testError() {
      var x: any = window;
      x.explode();
    }
  }
}

