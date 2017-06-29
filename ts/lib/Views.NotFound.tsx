/// <reference path="./Paths.ts" />
/// <reference path="./ReactHelpers.ts" />

/*
  Our "404" page
*/
module Esper.Views {

  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  export class NotFound extends Component<{}, {}> {
    render() {
      return <div id="not-found-page"
                  className="esper-simple-content text-center">
        <div className="esper-center">
          <h2>Whoops.</h2>
          <p>
            We can't find what you're looking for. Please
            {" "}<a href={Paths.Landing.contact().href}>
              contact us
            </a>{" "}if you need help.
          </p>
        </div>
      </div>;
    }
  }
}

