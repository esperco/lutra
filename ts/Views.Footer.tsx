/// <reference path="../marten/ts/ReactHelpers.ts" />

module Esper.Views {

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
          <div className="footer-links pull-left">
            <a href="http://esper.com/">Home</a>
            <a href="http://esper.com/contact">Contact</a>
            <a href="http://esper.com/privacy-policy">Privacy</a>
            <a href="http://esper.com/terms-of-use">Terms</a>
          </div>
          <div className="pull-right">
            &copy; {new Date().getFullYear()} Esper
          </div>
        </div>
      </div>;
    }
  }
}

