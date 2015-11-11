/// <reference path="../marten/ts/ReactHelpers.ts" />

module Esper.Views {

  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  interface propStuff {
    header: string;
    esperProfile: ApiT.Profile;
    dirProfile: ApiT.DirProfile;
  }

  export class EditProfile extends Component<propStuff, ApiT.DirProfile> {
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
        this.state = dirProfile;
      } else if (esperProfile !== undefined) {
        var otherEmails: ApiT.LabelledItem[] = [];
        esperProfile.other_emails.map(function(e) {
          var x = { label: "", item: e };
          otherEmails.push(x);
        });
        this.state = this.createProfile(esperProfile.display_name,
                                        esperProfile.email, otherEmails)
      } else { //shouldn't happen
        this.state = this.createProfile("","")
      }
    }

    // Name Helpers
    newName = () => {
      var name = {label:"", item:""};
      this.setState(function(o) {
        return this.createProfile(o.display_name, o.primary_email,
            o.other_emails, o.other_names.concat([name]), o.company,
            o.company_location, o.company_title, o.phones, o.addresses,
            o.custom_entries);
      });
    }
    removeName = (i : number) => {
      this.setState(function(o) {
        var names = o.other_names.slice();
        delete names[i];
        return this.createProfile(o.display_name, o.primary_email,
            o.other_emails, names, o.company, o.company_location,
            o.company_title, o.phones, o.addresses, o.custom_entries);
      });
    }
    handleNameLabel = (e, i) => {
      var text = e.target.value;
      this.setState(function(o) {
        var names = $.extend(true, [], o.other_names);
        names[i].label = text;
        return this.createProfile(o.display_name, o.primary_email,
            o.other_emails, names, o.company, o.company_location,
            o.company_title, o.phones, o.addresses, o.custom_entries);
      });
    }
    handleNameItem = (e, i) => {
      var text = e.target.value;
      this.setState(function(o) {
        var names = $.extend(true, [], o.other_names);
        names[i].item = text;
        return this.createProfile(o.display_name, o.primary_email,
            o.other_emails, names, o.company, o.company_location,
            o.company_title, o.phones, o.addresses, o.custom_entries);
      });
    }
    handleDisplayName = (e) => {
      var text = e.target.value;
      this.setState(function(o) {
        return this.createProfile(text, o.primary_email,
            o.other_emails, o.other_names, o.company, o.company_location,
            o.company_title, o.phones, o.addresses, o.custom_entries);
      });
    }

    // Email Helpers
    newEmail = () => {
      var email = { label: "", item: "" };
      this.setState(function(o) {
        return this.createProfile(o.display_name, o.primary_email,
            o.other_emails.concat([email]), o.other_names, o.company,
            o.company_location, o.company_title, o.phones, o.addresses,
            o.custom_entries);
      });
    }
    removeEmail = (i: number) => {
      this.setState(function(o) {
        var emails = $.extend(true, [], o.other_emails);
        delete emails[i];
        return this.createProfile(o.display_name, o.primary_email,
            emails, o.other_names, o.company, o.company_location,
            o.company_title, o.phones, o.addresses, o.custom_entries);
      });
    }
    handleEmailLabel = (e, i) => {
      var text = e.target.value;
      this.setState(function(o) {
        var emails = $.extend(true, [], o.other_emails);
        emails[i].label = text;
        return this.createProfile(o.display_name, o.primary_email,
            emails, o.other_names, o.company, o.company_location,
            o.company_title, o.phones, o.addresses, o.custom_entries);
      });
    }
    handleEmailItem = (e, i) => {
      var text = e.target.value;
      this.setState(function(o) {
        var emails = $.extend(true, [], o.other_emails);
        emails[i].item = text;
        return this.createProfile(o.display_name, o.primary_email,
            emails, o.other_names, o.company, o.company_location,
            o.company_title, o.phones, o.addresses, o.custom_entries);
      });
    }

    cleanList = (list: ApiT.LabelledItem[]) => {
      var newList : ApiT.LabelledItem[] = [];
      for (var i=0; i < list.length; i++) {
        if (list[i] == undefined || list[i] === null || list[i].item === "") {
          break;
        }
        newList.push(list[i]);
      }
      return newList;
    }

    saveProfile = () => {
      //clean up nulls and empty items
      var s = this.state;
      var profile = this.createProfile(s.display_name, s.primary_email,
        this.cleanList(s.other_emails), this.cleanList(s.other_names),
        s.company, s.company_location, s.company_title,
        this.cleanList(s.phones), this.cleanList(s.addresses), this.cleanList(s.custom_entries));
      Api.setDirProfile(profile);
      Login.dirProfile.set(profile, { dataStatus: Model.DataStatus.READY });
    }

    deleteProfile = () => {
      Api.removeDirProfile();
      Login.dirProfile.set(null, { dataStatus: Model.DataStatus.READY });
    }

    renderList = (list: ApiT.LabelledItem[], handleLabel, handleItem, removeEntry, placeHolder) => {
      var thisArg = this;
      return _.map(list, function(entry, i) {
        if (entry !== undefined) {
          return <div className="input-group">
            <input type="text" className="form-control"
              onChange={function(e) {handleLabel(e, i)}}
              defaultValue={entry.label} placeholder={placeHolder}/>
            <div className="input-group-addon">:</div>
            <input type="text" className="form-control"
              onChange={function(e) {handleItem(e, i)}}
              defaultValue={entry.item}/>
            <div className="input-group-btn">
              <button className="btn btn-default" onClick={function() {removeEntry(i)}}>
                &nbsp;<span className="glyphicon glyphicon-minus"></span>
              </button>
            </div>
          </div>;
        }
      });
    }

    render() {
      var thisArg = this;
      return <div className="container">
        <h1>{this.props.header}</h1>
        <div><br/></div>
        <div className="input-group">
          <span className="input-group-addon">*Display Name:</span>
          <input type="text" className="form-control" onChange={(e) => this.handleDisplayName(e)}
            defaultValue={this.state.display_name}/>
          <div className="input-group-btn">
            <button className="btn btn-default" onClick={this.newName}>
              &nbsp;<span className="glyphicon glyphicon-plus"></span>
            </button>
          </div>
        </div>
        {this.renderList(this.state.other_names, this.handleNameLabel, this.handleNameItem, this.removeName, "Add name description")}
        <div><br/></div>
        <div className="input-group">
          <span className="input-group-addon">*Email:</span>
          <input type="text" className="form-control"
            defaultValue={this.state.primary_email}/>
          <div className="input-group-btn">
            <button className="btn btn-default" onClick={() => this.newEmail() } >
              &nbsp;<span className="glyphicon glyphicon-plus"></span>
            </button>
          </div>
        </div>
        {this.renderList(this.state.other_emails, this.handleEmailLabel, this.handleEmailItem, this.removeEmail, "Add name description")}
        <div><br/></div>
        <div className="input-group">
          <span className="input-group-addon">Company:</span>
          <input type="text" className="form-control"/>
        </div>
        <div className="input-group">
          <span className="input-group-addon">Job Title:</span>
          <input type="text" className="form-control"/>
        </div>
        <div className="input-group">
          <span className="input-group-addon">Company Location:</span>
          <input type="text" className="form-control"/>
        </div>
        <div><br/></div>
        <button className="btn btn-primary"
          onClick={() => this.saveProfile()}>Save</button>
        <button className="btn btn-primary"
          onClick={() => this.deleteProfile()}>Delete</button>
      </div>;
    }
  }
}
