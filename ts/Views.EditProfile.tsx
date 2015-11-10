/// <reference path="../marten/ts/ReactHelpers.ts" />

module Esper.Views {

  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  interface stateStuff {
    header: string;
    display_name: string;
    other_names: ApiT.LabelledItem[];
    primary_email: string;
    other_emails: ApiT.LabelledItem[];
  }

  interface propStuff {
    esperProfile: ApiT.Profile;
    dirProfile: ApiT.DirProfile;
  }

  export class EditProfile extends Component<propStuff, stateStuff> {
    constructor(props : propStuff) {

      super(props);
      var dirProfile = this.props.dirProfile;
      var esperProfile = this.props.esperProfile;
      if (dirProfile !== undefined) {
        this.state = {
          header: "Edit Profile",
          display_name: dirProfile.display_name,
          other_names: dirProfile.other_names,
          primary_email: dirProfile.primary_email,
          other_emails: dirProfile.other_emails,
        };
      } else if (esperProfile !== undefined) {
        var otherEmails: ApiT.LabelledItem[] = [];
        esperProfile.other_emails.map(function(e) {
          var x = { label: "", item: e };
          otherEmails.push(x);
        });

        this.state = {
          header: "Create New Profile",
          display_name: esperProfile.display_name,
          other_names: otherEmails,
          primary_email: esperProfile.email,
          other_emails: otherEmails
        };
      } else { //shouldn't happen
        this.state = {
          header: "Create New Profile",
          display_name: "",
          other_names: [],
          primary_email: "",
          other_emails: []
        };
      }
    }

    newName() {
      var name = { label: "", item: "" };
      this.setState(function(oldState) {
        return {
          header: oldState.header,
          display_name: oldState.display_name,
          other_names: oldState.other_names.concat([name]),
          primary_email: oldState.primary_email,
          other_emails: oldState.other_emails
        };
      });
    }

    removeName(i : number) {
      this.setState(function(oldState) {
        var names = oldState.other_names.slice();
        delete names[i];
        return {
          header: oldState.header,
          display_name: oldState.display_name,
          other_names: names,
          primary_email: oldState.primary_email,
          other_emails: oldState.other_emails
        };
      });
    }

    newEmail() {
      var email = { label: "", item: "" };
      this.setState(function(oldState) {
        return {
          header: oldState.header,
          display_name: oldState.display_name,
          other_names: oldState.other_names,
          primary_email: oldState.primary_email,
          other_emails: oldState.other_emails.concat([email])
        };
      });
    }

    removeEmail(i: number) {
      this.setState(function(oldState) {
        var emails = oldState.other_emails.slice();
        delete emails[i];
        return {
          header: oldState.header,
          display_name: oldState.display_name,
          other_names: oldState.other_names,
          primary_email: oldState.primary_email,
          other_emails: emails
        };
      });
    }

    render() {
      var thisArg = this;
      var names = _.map(this.state.other_names, function(name, i) {
        if (name !== undefined) {
          return <div className="input-group">
            <span className="input-group-addon">Display Name</span>
            <input type="text" className="form-control"
              defaultValue={name.item}/>
            <div className="input-group-btn">
              <button className="btn btn-default" onClick={() => thisArg.removeName(i) }>
                &nbsp;<span className="glyphicon glyphicon-minus"></span>
              </button>
            </div>
          </div>;
        }
      });

      var emails = _.map(this.state.other_emails, function(email,i) {
        if (email !== undefined) {
          return <div className="input-group">
            <span className="input-group-addon">Email</span>
            <input type="text" className="form-control"
              defaultValue={email.item}/>
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
          <span className="input-group-addon">Display Name</span>
          <input type="text" className="form-control" 
            defaultValue={this.state.display_name}/>
          <div className="input-group-btn">
            <button className="btn btn-default" type="button" onClick={() => this.newName()}>
              &nbsp;<span className="glyphicon glyphicon-plus"></span>
            </button>
          </div>
        </div>
        {names}
        <div><br/></div>
        <div className="input-group">
          <span className="input-group-addon">Email</span>
          <input type="text" className="form-control" defaultValue={this.state.primary_email}/>
          <div className="input-group-btn">
            <button className="btn btn-default" onClick={() => this.newEmail() } >
              &nbsp;<span className="glyphicon glyphicon-plus"></span>
            </button>
          </div>
        </div>
        {emails}
        <div><br/></div>
        <div className="input-group">
          <span className="input-group-addon">Company</span>
          <input type="text" className="form-control" placeholder="Username"/>
        </div>
        <div><br/></div>
        <button className="btn btn-primary">Save</button>
        <button className="btn btn-primary">Delete</button>
      </div>;
    }
  }
}
