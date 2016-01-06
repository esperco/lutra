/*
  Displays the current logged in user's profile
*/

/// <reference path="../marten/ts/ReactHelpers.ts" />
/// <reference path="./DirProfile.ts" />

module Esper.Views {
  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  interface ProfileState {
    dirProfile: ApiT.DirProfile;
    error: Error;
    hasError: boolean;
    busy: boolean;
  };

  export class Profile extends Component<{}, ProfileState> {
    editProfile = () => {
      Route.nav.path("/edit-profile")
    }

    createRows(items: ApiT.LabelledItem[], key: string, label = ""): JSX.Element[] {
      return _.map(items, function(item: ApiT.LabelledItem, i: number) {
        return <tr key={key + i}>
          <td>{item.label + label}</td>
          <td>{item.item}</td>
        </tr>;
      });
    }

    componentDidMount() {
      this.setSources([DirProfile.GuestStore]);
    }

    getState() {
      var dirProfile = DirProfile.GuestStore.val();
      var metadata = DirProfile.GuestStore.metadata();
      return {
        dirProfile: dirProfile,
        error: (metadata && metadata.lastError) || new Error("Cannot locate profile"),
        hasError: metadata && metadata.dataStatus === Model.DataStatus.FETCH_ERROR,
        busy: metadata && metadata.dataStatus === Model.DataStatus.FETCHING
      }
    }

    render() {
      if (this.state.busy) {
        return <div className="container esper-spinner" />;
      }

      if (this.state.hasError) {
        return <p className="container">
            An error has occurred while fetching your user profile.
            <br/>
            {this.state.error}
        </p>;
      }

      var profile = this.state.dirProfile;
      var otherNamesRows = this.createRows(profile.other_names, "other-name");
      var emailRows = this.createRows(profile.other_emails, "other-email", " Email");
      var phoneRows = this.createRows(profile.phones, "phone", " Phone");
      var addressRows = this.createRows(profile.addresses, "address", " Address");
      var customRows = this.createRows(profile.custom_entries, "custom-entry");

      return <div className="container">
        <div className="well">
          <div className="profile-header">
            { profile.image_url ?
              <img className="img-lg" src={profile.image_url} />
            : null }
            <div className="profile-title">
              <h1>{profile.display_name}</h1>
              <h3>{profile.company_title}</h3>
            </div>
          </div>
          <table className="profile-body">
            <tr>
              <td>
                <h4>Overview</h4>
              </td>
            </tr>
            {otherNamesRows}
            <tr>
              <td>Company</td>
              <td>{profile.company}</td>
            </tr>
            <tr>
              <td>Location</td>
              <td>{profile.company_location}</td>
            </tr>
            {emailRows}
            {phoneRows}
            {addressRows}
            {customRows}
          </table>
          {profile.uid === DirProfile.Store.val().uid ? <button className="btn btn-primary"
            onClick={this.editProfile}>Edit</button> :()=>{}}
        </div>
      </div>;
    }
  }
}
