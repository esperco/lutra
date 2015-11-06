/// <reference path="../marten/ts/ReactHelpers.ts" />

module Esper.Views {

  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  export class EditProfile extends Component<{}, {}> {
    render() {

      return <div className="container">
        <h1>Edit Profile</h1>
        <div><br/></div>
        <div className="input-group">
          <span className="input-group-addon">Display Name</span>
          <input type="text" className="form-control" placeholder="Name"/>
          <div className="input-group-btn">
            <button className="btn btn-default" type="button">
              &nbsp;<span className="glyphicon glyphicon-plus"></span>
            </button>
          </div>
        </div>
        <div><br/></div>
        <div className="input-group">
          <span className="input-group-addon">Email</span>
          <input type="text" className="form-control" placeholder="Username"/>
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
