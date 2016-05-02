/*
  Page to show when loading fails for whatever reason
*/

module Esper.Views {
  export function LoadError(props: {}) {
    return <div id="load-error-page"
                className="esper-simple-content text-center">
      <div className="esper-center">
        <h2>Whoops.</h2>
        <p>
          There was an error loading Esper.<br />Please
          {" "}<a onClick={() => location.reload()}>try again</a>{" "}
          in a few minutes, or
          {" "}<a href="http://esper.com/contact">contact us</a>{" "}
          if you need help.
        </p>
      </div>
    </div>;
  }
}
