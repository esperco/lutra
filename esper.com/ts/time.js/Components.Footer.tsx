/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="../lib/Api.ts" />
/// <reference path="../common/Login.ts" />

module Esper.Components {

  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  // On full-screen-ish views, we can set a class that makes the footer pop
  // up when we hover near the bottom
  interface FooterProps {
    hoverable?: boolean;
  }

  export class Footer extends Component<FooterProps, {}> {
    render() {
      return <div className={"footer" + (this.props.hoverable ?
                             " hoverable": "")}>
        <div className="container-fluid padded clearfix">
          <ul className="footer-links pull-left nav nav-pills">
            <li><a href="http://esper.com/">Home</a></li>
            <li><a href="http://esper.com/contact">Contact</a></li>
            <li><a href="http://esper.com/privacy-policy">Privacy</a></li>
            <li><a href="http://esper.com/terms-of-use">Terms</a></li>
            <li><a onClick={() => Login.goToLogout()}>Log Out</a></li>
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

