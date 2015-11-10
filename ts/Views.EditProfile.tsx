/// <reference path="../marten/ts/ReactHelpers.ts" />

module Esper.Views {

  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  interface stateStuff {
    header: string;
    profile: ApiT.DirProfile;
  }

  interface propStuff {
    esperProfile: ApiT.Profile;
    dirProfile: ApiT.DirProfile;
  }

  export class EditProfile extends Component<propStuff, stateStuff> {
    createProfile(display_name: string, primary_email: string,
                  other_emails: ApiT.LabelledItem[] = [],
                  other_names: ApiT.LabelledItem[] = [],
                  company: string = "",
                  company_location: string = "",
                  company_title: string = "",
                  phones: ApiT.LabelledItem[] = [],
                  addresses: ApiT.LabelledItem[] = [],
                  custom_entries: ApiT.LabelledItem[] = []): ApiT.DirProfile {
      return {
        display_name: display_name,
        other_names: other_names,
        primary_email: primary_email,
        other_emails: other_emails,
        company: company,
        company_location: company_location,
        company_title: company_title,
        phones: phones,
        addresses: addresses,
        custom_entries: custom_entries
      };
    }

    constructor(props : propStuff) {
      super(props);
      var dirProfile = this.props.dirProfile;
      var esperProfile = this.props.esperProfile;

      if (dirProfile !== undefined) {
        this.state = {
          header: "Edit Profile",
          profile: dirProfile
        };
      } else if (esperProfile !== undefined) {
        var otherEmails: ApiT.LabelledItem[] = [];
        esperProfile.other_emails.map(function(e) {
          var x = { label: "", item: e };
          otherEmails.push(x);
        });
        this.state = {
          header: "Create New Profile",
          profile: this.createProfile(esperProfile.display_name,
                                      esperProfile.email, otherEmails)
        };
      } else { //shouldn't happen
        this.state = {
          header: "Create New Profile",
          profile: this.createProfile("","")
        };
      }
    }

    newName() {
      var name = { label: "", item: "" };
      this.setState(function(oldState) {
        var o = oldState.profile;
        return {
          header: oldState.header,
          profile: this.createProfile(o.display_name, o.primary_email,
            o.other_emails, o.other_names.concat([name]), o.company,
            o.company_location, o.company_title, o.phones, o.addresses,
            o.custom_entries)
        };
      });
    }

    removeName(i : number) {
      this.setState(function(oldState) {
        var o = oldState.profile;
        var names = o.other_names.slice();
        delete names[i];
        return {
          header: oldState.header,
          profile: this.createProfile(o.display_name, o.primary_email,
            o.other_emails, names, o.company, o.company_location,
            o.company_title, o.phones, o.addresses, o.custom_entries)
        };
      });
    }

    newEmail() {
      var email = { label: "", item: "" };
      this.setState(function(oldState) {
        var o = oldState.profile;
        return {
          header: oldState.header,
          profile: this.createProfile(o.display_name, o.primary_email,
            o.other_emails.concat([email]), o.other_names, o.company,
            o.company_location, o.company_title, o.phones, o.addresses,
            o.custom_entries)
        };
      });
    }

    removeEmail(i: number) {
      this.setState(function(oldState) {
        var o = oldState.profile;
        var emails = o.other_emails.slice();
        delete emails[i];
        return {
          header: oldState.header,
          profile: this.createProfile(o.display_name, o.primary_email,
            emails, o.other_names, o.company, o.company_location,
            o.company_title, o.phones, o.addresses, o.custom_entries)
        };
      });
    }

    saveProfile() {
      Api.setDirProfile(this.state.profile);
      Login.dirProfile.set(this.state.profile, { dataStatus: Model.DataStatus.READY });
    }

    render() {
      var thisArg = this;
      var names = _.map(this.state.profile.other_names, function(name, i) {
        if (name !== undefined) {
          return <div className="input-group">
            <input type="text" className="form-control"
              defaultValue={name.label} placeholder="Add name description"/>
            <div className="input-group-addon">:</div>
            <input type="text" className="form-control" defaultValue={name.item}/>
            <div className="input-group-btn">
              <button className="btn btn-default" onClick={() => thisArg.removeName(i) }>
                &nbsp;<span className="glyphicon glyphicon-minus"></span>
              </button>
            </div>
          </div>;
        }
      });

      var emails = _.map(this.state.profile.other_emails, function(email,i) {
        if (email !== undefined) {
          return <div className="input-group">
            <input type="text" className="form-control"
              defaultValue={email.label} placeholder="Add email description"/>
            <span className="input-group-addon">:</span>
            <input type="text" className="form-control" defaultValue={email.item}/>
            <div className="input-group-btn">
              <button className="btn btn-default" onClick={() => thisArg.removeEmail(i)}>
                &nbsp;<span className="glyphicon glyphicon-minus"></span>
              </button>
            </div>
          </div>;
        }
      });

      return <div className="container">
        <h1>{this.state.header}</h1>
        <div><br/></div>
        <div className="input-group">
          <span className="input-group-addon">Display Name:</span>
          <input type="text" className="form-control" 
            defaultValue={this.state.profile.display_name}/>
          <div className="input-group-btn">
            <button className="btn btn-default" type="button" onClick={() => this.newName()}>
              &nbsp;<span className="glyphicon glyphicon-plus"></span>
            </button>
          </div>
        </div>
        {names}
        <div><br/></div>
        <div className="input-group">
          <span className="input-group-addon">Email:</span>
          <input type="text" className="form-control"
            defaultValue={this.state.profile.primary_email}/>
          <div className="input-group-btn">
            <button className="btn btn-default" onClick={() => this.newEmail() } >
              &nbsp;<span className="glyphicon glyphicon-plus"></span>
            </button>
          </div>
        </div>
        {emails}
        <div><br/></div>
        <div className="input-group">
          <span className="input-group-addon">Company:</span>
          <input type="text" className="form-control" placeholder="Username"/>
        </div>
        <div><br/></div>
        <button className="btn btn-primary"
          onClick={() => this.saveProfile()}>Save</button>
        <button className="btn btn-primary">Delete</button>
      </div>;
    }
  }
}
