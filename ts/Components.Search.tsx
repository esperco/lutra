/// <reference path="../marten/ts/ReactHelpers.ts" />
/// <reference path="../marten/typings/react/react.d.ts" />
/// <reference path="./DirProfile.ts" />
/// <reference path="./Route.tsx" />

module Esper.Components {
  type SyntheticEvent = React.SyntheticEvent;

  var Component = ReactHelpers.Component;

  export class Search extends Component<{}, {}> {
    onSubmit(e: SyntheticEvent) {
      e.preventDefault();
      var query = $(event.target).find("input[name='query']").val();
      DirProfile.search(query);
      Route.nav.path("/search");
    }

    render() {
      return <form className="navbar-form navbar-left" role="search"
        onSubmit={this.onSubmit.bind(this)}>
        <input type="text" name="query"
          className="form-control search-input" placeholder="Search" />
        <button type="submit" className="btn btn-default">Submit</button>
      </form>;
    }
  }
}
