/// <reference path="../marten/ts/ReactHelpers.ts" />
/// <reference path="./Store.ts" />
/// <reference path="./Views.ChangePass.tsx" />
/// <reference path="./Components.Invite.tsx" />

module Esper.Views {

  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  interface Props {
    header: string;
    esperProfile: ApiT.Profile;
    dirProfile: ApiT.DirProfile;
  }

  export class EditProfile extends Component<Props, ApiT.DirProfile> {
    createProfile(uid: string,
                  display_name: string,
                  other_emails: ApiT.LabelledItem[] = [],
                  other_names: ApiT.LabelledItem[] = [],
                  company: string = "",
                  company_location: string = "",
                  company_title: string = "",
                  phones: ApiT.LabelledItem[] = [],
                  addresses: ApiT.LabelledItem[] = [],
                  custom_entries: ApiT.LabelledItem[] = [],
                  image_url: string = "",
                  clean: boolean = false): ApiT.DirProfile {
      if (!clean) {
        if (other_emails.length === 0) other_emails = [{label:"Work", item:""}];
        if (phones.length === 0) phones = [{label:"Mobile", item:""}];
        if (addresses.length === 0) addresses = [{label:"Home", item:""}];
        if (custom_entries.length === 0) custom_entries = [{label:"Custom", item:""}];
      }
      return {
        uid,
        image_url,
        display_name,
        other_names,
        other_emails,
        company: company,
        company_location,
        company_title,
        phones,
        addresses,
        custom_entries
      };
    }

    constructor(props : Props) {
      super(props);
      var dirProfile = this.props.dirProfile;
      var esperProfile = this.props.esperProfile;

      if (dirProfile !== undefined) {
        var names = $.extend(true, [], dirProfile.other_names);
        names.unshift(undefined);
        this.state = this.createProfile(dirProfile.uid, dirProfile.display_name,
          dirProfile.other_emails, names, dirProfile.company,
          dirProfile.company_location, dirProfile.company_title, dirProfile.phones,
          dirProfile.addresses, dirProfile.custom_entries, dirProfile.image_url);
      } else if (esperProfile !== undefined) {
        var otherEmails: ApiT.LabelledItem[] = [];
        otherEmails.push({ label: "Work", item: esperProfile.email });
        esperProfile.other_emails.map(function(e) {
          var x = { label: "", item: e };
          otherEmails.push(x);
        });
        this.state = this.createProfile(esperProfile.profile_uid,
          esperProfile.display_name, otherEmails, [undefined]);
      } else { //shouldn't happen yet
        this.state = this.createProfile("", "", [], [undefined]);
      }
    }

    componentDidMount() {
      this.find('.dropdown-toggle').dropdown();
      if (this.props.header == "Create New Profile") {
        this.find("#myModal").modal('toggle');
      }
    }
    componentDidUpdate() {
      this.find('.dropdown-toggle').dropdown();
    }

    // Helpers for LabelledItem[] objects
    newLabelledItem = (key: string, defaultString: string) => {
      var labelledItem = {label: defaultString, item:""};
      this.setState(function(o) {
        var update: {[index: string]: ApiT.LabelledItem[];} = {};
        update[key] = o[key].concat([labelledItem]);
        return update as ApiT.DirProfile;
      });
    }
    removeLabelledItem = (key: string, i : number) => {
      this.setState(function(o) {
        var entries = $.extend(true, [], o[key]);
        delete entries[i];
        var update: { [index: string]: ApiT.LabelledItem[]; } = {};
        update[key] = entries;
        return update as ApiT.DirProfile;
      });
    }
    handleLabelList = (e: React.SyntheticEvent, key: string, i: number) => {
      var text = (e.target as HTMLInputElement).value;
      this.setState(function(o) {
        var entries = $.extend(true, [], o[key]);
        entries[i].label = text;
        var update: { [index: string]: ApiT.LabelledItem[]; } = {};
        update[key] = entries;
        return update as ApiT.DirProfile;
      });
    }
    handleItemList = (e: React.SyntheticEvent, key: string, i: number) => {
      var text = (e.target as HTMLInputElement).value;
      this.setState(function(o) {
        var entries = $.extend(true, [], o[key]);
        entries[i].item = text;
        var update: { [index: string]: ApiT.LabelledItem[]; } = {};
        update[key] = entries;
        return update as ApiT.DirProfile;
      });
    }

    //Regular item helpers
    handleItem = (e: React.SyntheticEvent, key: string) => {
      var update: { [index: string]: string; } = {};
      update[key] = (e.target as HTMLInputElement).value;
      this.setState(update as ApiT.DirProfile);
    }

    //profile picture helper
    changeProfile = () => {
      filepicker.pick(
        function(blob: Blob){
          this.setState({ image_url: blob.url } as ApiT.DirProfile);
        }.bind(this)
      );
    }

    cleanList = (list: ApiT.LabelledItem[]) => {
      var newList : ApiT.LabelledItem[] = [];
      for (var i=0; i < list.length; i++) {
        if (list[i] === undefined || list[i] === null || list[i].item === "") {
          continue;
        }
        newList.push(list[i]);
      }
      return newList;
    }

    saveProfile = () => {
      //clean up nulls and empty items
      var s = this.state;
      var profile = this.createProfile(s.uid, s.display_name,
        this.cleanList(s.other_emails), this.cleanList(s.other_names),
        s.company, s.company_location, s.company_title,
        this.cleanList(s.phones), this.cleanList(s.addresses),
        this.cleanList(s.custom_entries), s.image_url, true);
      Api.setDirProfile(profile).done(function() {
        DirProfile.Store.set(profile, { dataStatus: Model.DataStatus.READY });
        Route.nav.path("/profile");
      });
    }

    /*deleteProfile = () => {
      Api.removeDirProfile();
      DirProfile.Store.set(null, { dataStatus: Model.DataStatus.READY });
    }*/

    changeOption = (search: string, text: string) => {
      $("#" + search).val(text);
      var event = new Event('input', { bubbles: true });
      $("#" + search).get(0).dispatchEvent(event);
    }

    selectLabel = (search: string, text: string) => {
      $("#" + search).val(text);
      $("#" + search).select();
      var event = new Event('input', { bubbles: true });
      $("#" + search).get(0).dispatchEvent(event);
    }

    //fixes the unique id problem
    incr = (function() {
      var i = 1;
      return function() {
        return i++;
      }
    })();

    editPassword = () => {
      return <div>
        <button className="btn btn-primary"
          onClick={() => Layout.render(<Views.ChangePass />) }>
          Change Password
        </button>    
      </div>
    }

    renderList = (key: string, dropList: string[]) => {
      var self = this;
      return _.map(this.state[key], function(entry: ApiT.LabelledItem, i: number) {
        var uid = "id" + self.incr();
        var chooseFunction = self.removeLabelledItem.bind(self, key, i);
        var plusOrMinus = "glyphicon glyphicon-minus";
        if (i === 0) {
          chooseFunction = self.newLabelledItem.bind(self, key, dropList[0]);
          plusOrMinus = "glyphicon glyphicon-plus";
        }
        if (entry !== undefined) {
          return <div className="row">
            <div className="col-xs-2">
              <div className="input-group">
                <input type="text" id={uid} className="form-control" onChange={function(e) { self.handleLabelList(e,key,i) } }
                  defaultValue={entry.label}/>
                <div className="input-group-btn">
                  <button className="btn btn-default dropdown-toggle" data-toggle="dropdown">
                    &nbsp;<span className="caret"></span>&nbsp;
                  </button>
                  <ul className="dropdown-menu dropdown-menu-right">
                    {_.map(dropList, function(option, i) {
                      return <li><a onClick={function() { self.changeOption(uid, option) } }>{option}</a></li>;
                    })}
                    <li><a onClick={function() { self.selectLabel(uid, "Custom") } }>Custom</a></li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="col-xs-10">
              <div className="input-group">
                <input type="text" className="form-control" onChange={function(e) { self.handleItemList(e,key,i) }}
                  defaultValue={entry.item}/>
                <div className="input-group-btn">
                  <button className="btn btn-default" onClick={chooseFunction}>
                    &nbsp;<span className={plusOrMinus}></span>&nbsp;
                  </button>
                </div>
              </div>
            </div>
          </div>
        }
      });
    }

    render() {
      return <div className="container">
        <h1>{this.props.header}</h1>
        <div><br/></div>
        {(Store.get("uid") === undefined) ? "" : this.editPassword()}
        <div>
          <button className="btn btn-primary"
            onClick={() => Api.removeDirProfile(Login.myUid())}>
            Delete Profile
          </button>
        </div>
        {(this.props.header === "Create New Profile") ?
          <Components.Invite email={this.props.esperProfile.email}/> : ""}
        <label>Profile Picture</label>
        <div className="media">
          <div className="media-left">
            <a onClick={this.changeProfile}>
              <img className="media-object edit-profile-image" src={this.state.image_url === "" ? "https://lh5.googleusercontent.com/-pF0uQT0oqjY/AAAAAAAAAAI/AAAAAAAADEU/QJr95ei0nx8/photo.jpg" : this.state.image_url}/>
            </a>
          </div>
        </div>
        <div><br/></div>
        <label>Name</label>
        <div className="input-group">
          <span className="input-group-addon">Display Name:</span>
          <input type="text" className="form-control" onChange={(e) => this.handleItem(e, "display_name")}
            defaultValue={this.state.display_name}/>
          <div className="input-group-btn">
            <button className="btn btn-default" onClick={() => this.newLabelledItem("other_names", "Nickname")}>
              &nbsp;<span className="glyphicon glyphicon-plus"></span>&nbsp;
            </button>
          </div>
        </div>
        {this.renderList("other_names", ["Nickname", "Phonetic"]) }
        <div><br/></div>
        <label>Email</label>
        {this.renderList("other_emails", ["Work", "Home"])}
        <div><br/></div>
        <label>Company Info</label>
        <div className="input-group">
          <span className="input-group-addon">Company:</span>
          <input type="text" className="form-control" defaultValue={this.state.company}
            onChange={(e) => this.handleItem(e, "company")}/>
        </div>
        <div className="input-group">
          <span className="input-group-addon">Job Title:</span>
          <input type="text" className="form-control" defaultValue={this.state.company_title}
            onChange={(e) => this.handleItem(e, "company_title") }/>
        </div>
        <div className="input-group">
          <span className="input-group-addon">Company Location:</span>
          <input type="text" className="form-control" defaultValue={this.state.company_location}
            onChange={(e) => this.handleItem(e, "company_location") }/>
        </div>
        <div><br/></div>
        <label>Phone</label>
        {this.renderList("phones", ["Mobile","Work","Home"])}
        <div><br/></div>
        <label>Address</label>
        {this.renderList("addresses", ["Work", "Home"]) }
        <div><br/></div>
        <label>Custom Entries</label>
        {this.renderList("custom_entries", ["Custom"]) }
        <div><br/></div>
        <button className="btn btn-primary"
          onClick={() => this.saveProfile()}>Save</button>
      </div>;
    }
  }
}
