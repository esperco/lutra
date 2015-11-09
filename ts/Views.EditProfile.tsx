/// <reference path="../marten/ts/ReactHelpers.ts" />

module Esper.Views {

  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  interface stateStuff {
    header: string;
    display_name: string;
    more_names_list: ApiT.LabelledItem[];
    primary_email: string;
    more_emails_list: ApiT.LabelledItem[];
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
          more_names_list: dirProfile.more_names_list,
          primary_email: dirProfile.primary_email,
          more_emails_list: dirProfile.more_emails_list,
        };
      } else if (esperProfile !== undefined) {
        var otherEmails : ApiT.LabelledItem[] = [];
        esperProfile.other_emails.map(function(e) {
          var x = { label: "", item: e };
          otherEmails.push(x);
        });
        
        this.state = {
          header: "Create New Profile",
          display_name: esperProfile.display_name,
          more_names_list: otherEmails,
          primary_email: esperProfile.email,
          more_emails_list: otherEmails
        };
      } else { //shouldn't happen
        this.state = {
          header: "Create New Profile",
          display_name: "",
          more_names_list: [],
          primary_email: "",
          more_emails_list: []
        };
      }
    }

    entryHTML() {
      return <div className="input-group">
        <span className="input-group-addon">Display Name</span>
        <input type="text" className="form-control" />
        <div className="input-group-btn">
          <button className="btn btn-default" type="button">
            &nbsp; <span className="glyphicon glyphicon-plus"></span>
          </button>
        </div>
      </div>;
    }

    render() {
      return <div className="container">
        <h1>{this.state.header}</h1>
        <div><br/></div>
        <div className="input-group name">
          <span className="input-group-addon">Display Name</span>
          <input type="text" className="form-control" 
            defaultValue={this.state.display_name}/>
          <div className="input-group-btn">
            <button className="btn btn-default" type="button">
              &nbsp;<span className="glyphicon glyphicon-plus"></span>
            </button>
          </div>
        </div>
        <div><br/></div>
        <div className="input-group">
          <span className="input-group-addon">Email</span>
          <input type="text" className="form-control" defaultValue={this.state.primary_email}/>
          <div className="input-group-btn">
            <button className="btn btn-default" type="button">
              &nbsp;<span className="glyphicon glyphicon-plus"></span>
            </button>
          </div>
        </div>
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
