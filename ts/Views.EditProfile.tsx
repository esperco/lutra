/// <reference path="../marten/ts/ReactHelpers.ts" />

module Esper.Views {

  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  interface stateStuff {
    header: string;
    display_name: string;
    email: string;
    gender: string;
    image_url: string;
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
          email: dirProfile.email,
          gender: "",
          image_url: dirProfile.image_url
        };
      } else if (esperProfile !== undefined) {
        this.state = {
          header: "Create New Profile",
          display_name: esperProfile.display_name,
          email: esperProfile.email,
          gender: "",
          image_url: esperProfile.image_url
        };
      } else { //shouldn't happen
        this.state = {
          header: "Create New Profile",
          display_name: "",
          email: "",
          gender: "",
          image_url: ""
        };
      }
    }

    entryHTML() {
      return <div className="input-group name">
        <span className="input-group-addon">Display Name</span>
        <input type="text" className="form-control" placeholder="Name" />
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
          <input type="text" className="form-control" defaultValue={this.state.email}/>
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
      </div>;
    }
  }
}
