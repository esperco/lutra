/// <reference path="../marten/ts/ReactHelpers.ts" />
/// <reference path="../marten/ts/ApiT.ts" />

module Esper.Views {
  var Component = ReactHelpers.Component;

  interface SearchState {
    results: ApiT.DirProfileSearchResults;
    error: Error;
    busy: boolean;
    hasError: boolean;
  }

export class Search extends Component<{}, SearchState> {
    componentDidMount() {
      this.setSources([DirProfile.SearchStore]);
    }

    getState() {
      var results = DirProfile.SearchStore.val();
      var metadata = DirProfile.SearchStore.metadata();
      return {
        results: results,
        error: (metadata && metadata.lastError) || new Error("No search query given"),
        busy: metadata && metadata.dataStatus === Model.DataStatus.FETCHING,
        hasError: !metadata || metadata.dataStatus === Model.DataStatus.FETCH_ERROR
      };
    }

    showProfile(profile: ApiT.DirProfile) {
      DirProfile.GuestStore.set(profile, {
        dataStatus: Model.DataStatus.READY,
        lastError: undefined
      });
      Route.nav.path("/profile/" + profile.uid);
    }

    render() {
      if (this.state.busy) {
        return <div className="container esper-spinner" />;
      }

      if (this.state.hasError) {
        return <h4 className="container text-danger">
          An error occurred while searching for \"{DirProfile.lastSearchQuery}\".
          <br/>
          {this.state.error.toString()}
        </h4>;
      }

      var results = this.state.results;

      if (results.search_count == 0) {
        return <div className="container">
          <h4>Search returned no results.</h4>
        </div>;
      }

      var weighted_results = results.search_results;
      var self = this;

      var resultRows = _.map(weighted_results, function(result: ApiT.WeightedDirProfile) {
        var profile = result.profile_data;
        return <div className="well search-result-row">
          <div className="profile-header" onClick={self.showProfile.bind(this, profile)}>
            <img className="img-md" src={profile.image_url} />
            <div className="profile-title">
              <h3>{profile.display_name}</h3>
              <span>{profile.company_title}</span>
              <span>{profile.company}</span>
            </div>
          </div>
        </div>;
      });

      return <div className="container">
        <h4>
          Search returned {results.search_count} results.
        </h4>
        {resultRows}
      </div>;
    }
  }
}
