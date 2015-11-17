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
    test = () => {
      Route.nav.path("/edit-profile")
    }
    render() {
      if (this.state.busy) {
        return <div className="container esper-spinner" />;
      }

      if (this.state.hasError) {
        return <div className="container">
          <div className="well">
            An error has occurred while fetching your user profile.
            <br/>
            {this.state.error}
          </div>
        </div>;
      }

      var profile = this.state.dirProfile;
      var otherNamesRows: JSX.Element[] = [];
      var emailRows: JSX.Element[] = [];
      var phoneRows: JSX.Element[] = [];
      var addressRows: JSX.Element[] = [];
      var customRows: JSX.Element[] = [];

      for (var i = 0; i < profile.other_names.length; i++) {
        otherNamesRows.push(<tr key={"other-name" + i}>
          <td>{profile.other_names[i].label}</td>
          <td>{profile.other_names[i].item}</td>
        </tr>);
      }
      for (var i = 0; i < profile.other_emails.length; i++) {
        emailRows.push(<tr key={"other-email" + i}>
          <td>{profile.other_emails[i].label} Email</td>
          <td>{profile.other_emails[i].item}</td>
        </tr>);
      }
      for (var i = 0; i < profile.phones.length; i++) {
        phoneRows.push(<tr key={"phone" + i}>
          <td>{profile.phones[i].label} Phone</td>
          <td>{profile.phones[i].item}</td>
        </tr>);
      }
      for (var i = 0; i < profile.addresses.length; i++) {
        addressRows.push(<tr key={"address" + i}>
          <td>{profile.addresses[i].label} Address</td>
          <td>{profile.addresses[i].item}</td>
        </tr>);
      }
      for (var i = 0; i < profile.custom_entries.length; i++) {
        customRows.push(<tr key={"custom-entry" + i}>
          <td>{profile.custom_entries[i].label}</td>
          <td>{profile.custom_entries[i].item}</td>
        </tr>);
      }

      return <div className="container">
        <div className="well">
          <div className="profile-header">
            { profile.image_url ? <img src={profile.image_url} /> : null }
            <div className="profile-title">
              <h1>{profile.display_name}</h1>
              <h3>{profile.company_title}</h3>
            </div>
          </div>
          <table className="profile-body">
            <tr>
              <td >
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
          <button className="btn btn-primary"
            onClick={() => this.test() }>Edit</button>
        </div>
      </div>;
    }

    componentDidMount() {
      this.setSources([DirProfile.Store]);
    }

    getState() {
      var tuple = DirProfile.Store.get();
      var dirProfile = tuple[0];
      var metadata = tuple[1];
      return {
        dirProfile: dirProfile,
        error: metadata.lastError,
        hasError: metadata && metadata.dataStatus === Model.DataStatus.FETCH_ERROR,
        busy: metadata && metadata.dataStatus === Model.DataStatus.FETCHING
      }
    }
  }
}
