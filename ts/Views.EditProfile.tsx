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

      if (other_emails.length === 0) other_emails = [{label:"Work", item:""}];
      if (phones.length === 0) phones = [{label:"Mobile", item:""}];
      if (addresses.length === 0) addresses = [{label:"Home", item:""}];
      if (custom_entries.length === 0) custom_entries = [{label:"Custom", item:""}];
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
        dirProfile.other_names.unshift(undefined);
        this.state = this.createProfile(dirProfile.display_name, dirProfile.primary_email,
          dirProfile.other_emails, dirProfile.other_names, dirProfile.company,
          dirProfile.company_location, dirProfile.company_title, dirProfile.phones,
          dirProfile.addresses, dirProfile.custom_entries);
      } else if (esperProfile !== undefined) {
        var otherNames: ApiT.LabelledItem[] = [];
        otherNames.unshift(undefined);
        var otherEmails: ApiT.LabelledItem[] = [];
        otherEmails.push({ label: "Work", item: esperProfile.email });
        esperProfile.other_emails.map(function(e) {
          var x = { label: "", item: e };
          otherEmails.push(x);
        });
        this.state = this.createProfile(esperProfile.display_name,
          "", otherEmails, otherNames);
      } else { //shouldn't happen yet
        this.state = this.createProfile("", "", [], [undefined]);
      }
    }

    componentDidMount() {
      $('.dropdown-toggle').dropdown();
    }
    componentDidUpdate() {
      $('.dropdown-toggle').dropdown();
    }

    // Name Helpers
    newName = () => {
      var name = {label:"Nickname", item:""};
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
      var email = { label: "Work", item: "" };
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

    //Phone Helpers
    newPhone = () => {
      var phone = {label:"Mobile", item:""};
      this.setState(function(o) {
        return this.createProfile(o.display_name, o.primary_email,
            o.other_emails, o.other_names, o.company, o.company_location,
            o.company_title, o.phones.concat([phone]), o.addresses,
            o.custom_entries);
      });
    }
    removePhone = (i: number) => {
      this.setState(function(o) {
        var phones = $.extend(true, [], o.phones);
        delete phones[i];
        return this.createProfile(o.display_name, o.primary_email,
          o.other_emails, o.other_names, o.company, o.company_location,
          o.company_title, phones, o.addresses, o.custom_entries);
      });
    }
    handlePhoneLabel = (e, i) => {
      var text = e.target.value;
      this.setState(function(o) {
        var phones = $.extend(true, [], o.phones);
        phones[i].label = text;
        return this.createProfile(o.display_name, o.primary_email,
          o.other_emails, o.other_names, o.company, o.company_location,
          o.company_title, phones, o.addresses, o.custom_entries);
      });
    }
    handlePhoneItem = (e, i) => {
      var text = e.target.value;
      this.setState(function(o) {
        var phones = $.extend(true, [], o.phones);
        phones[i].item = text;
        return this.createProfile(o.display_name, o.primary_email,
          o.other_emails, o.other_names, o.company, o.company_location,
          o.company_title, phones, o.addresses, o.custom_entries);
      });
    }

    //Address Helpers
    newAddress = () => {
      var address = { label: "Work", item: "" };
      this.setState(function(o) {
        return this.createProfile(o.display_name, o.primary_email,
          o.other_emails, o.other_names, o.company, o.company_location,
          o.company_title, o.phones, o.addresses.concat([address]),
          o.custom_entries);
      });
    }
    removeAddress = (i: number) => {
      this.setState(function(o) {
        var addresses = $.extend(true, [], o.addresses);
        delete addresses[i];
        return this.createProfile(o.display_name, o.primary_email,
          o.other_emails, o.other_names, o.company, o.company_location,
          o.company_title, o.phones, addresses, o.custom_entries);
      });
    }
    handleAddressLabel = (e, i) => {
      var text = e.target.value;
      this.setState(function(o) {
        var addresses = $.extend(true, [], o.addresses);
        addresses[i].label = text;
        return this.createProfile(o.display_name, o.primary_email,
          o.other_emails, o.other_names, o.company, o.company_location,
          o.company_title, o.phones, addresses, o.custom_entries);
      });
    }
    handleAddressItem = (e, i) => {
      var text = e.target.value;
      this.setState(function(o) {
        var addresses = $.extend(true, [], o.addresses);
        addresses[i].item = text;
        return this.createProfile(o.display_name, o.primary_email,
          o.other_emails, o.other_names, o.company, o.company_location,
          o.company_title, o.phones, addresses, o.custom_entries);
      });
    }

    //Custom Entry Helpers
    newCustom = () => {
      var entry = { label: "Custom", item: "" };
      this.setState(function(o) {
        return this.createProfile(o.display_name, o.primary_email,
          o.other_emails, o.other_names, o.company, o.company_location,
          o.company_title, o.phones, o.addresses,
          o.custom_entries.concat([entry]));
      });
    }
    removeCustom = (i: number) => {
      this.setState(function(o) {
        var entries = $.extend(true, [], o.custom_entries);
        delete entries[i];
        return this.createProfile(o.display_name, o.primary_email,
          o.other_emails, o.other_names, o.company, o.company_location,
          o.company_title, o.phones, o.addresses, entries);
      });
    }
    handleCustomLabel = (e, i) => {
      var text = e.target.value;
      this.setState(function(o) {
        var entries = $.extend(true, [], o.custom_entries);
        entries[i].label = text;
        return this.createProfile(o.display_name, o.primary_email,
          o.other_emails, o.other_names, o.company, o.company_location,
          o.company_title, o.phones, o.addresses, entries);
      });
    }
    handleCustomItem = (e, i) => {
      var text = e.target.value;
      this.setState(function(o) {
        var entries = $.extend(true, [], o.custom_entries);
        entries[i].item = text;
        return this.createProfile(o.display_name, o.primary_email,
          o.other_emails, o.other_names, o.company, o.company_location,
          o.company_title, o.phones, o.addresses, entries);
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

    renderList = (list: ApiT.LabelledItem[], handleLabel, handleItem, removeEntry, addEntry, dropList: string[]) => {
      var thisArg = this;
      return _.map(list, function(entry, i) {
        var uid = "id" + thisArg.incr();
        var chooseFunction = removeEntry;
        var plusOrMinus = "glyphicon glyphicon-minus";
        if (i === 0) {
          chooseFunction = addEntry;
          plusOrMinus = "glyphicon glyphicon-plus";
        }
        if (entry !== undefined) {
          return <div className="row">
            <div className="col-xs-2">
              <div className="input-group">
                <input type="text" id={uid} className="form-control" onChange={function(e) { handleLabel(e,i) } }
                  defaultValue={entry.label}/>
                <div className="input-group-btn">
                  <button className="btn btn-default dropdown-toggle" data-toggle="dropdown">
                    &nbsp;<span className="caret"></span>&nbsp;
                  </button>
                  <ul className="dropdown-menu dropdown-menu-right">
                    {_.map(dropList, function(option, i) {
                      return <li><a onClick={function() { thisArg.changeOption(uid, option) } }>{option}</a></li>;
                    })}
                    <li><a onClick={function() { thisArg.selectLabel(uid, "Custom") } }>Custom</a></li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="col-xs-10">
              <div className="input-group">
                <input type="text" className="form-control" onChange={function(e) { handleItem(e, i) }}
                  defaultValue={entry.item}/>
                <div className="input-group-btn">
                  <button className="btn btn-default" onClick={function() { chooseFunction(i) }}>
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
      var a = false;
      return <div className="container">
        <h1>{this.props.header}</h1>
        <div><br/></div>
        <label>Name</label>
        <div className="input-group">
          <span className="input-group-addon">Display Name:</span>
          <input type="text" className="form-control" onChange={(e) => this.handleDisplayName(e)}
            defaultValue={this.state.display_name}/>
          <div className="input-group-btn">
            <button className="btn btn-default" onClick={this.newName}>
              &nbsp;<span className="glyphicon glyphicon-plus"></span>&nbsp;
            </button>
          </div>
        </div>
        {this.renderList(this.state.other_names, this.handleNameLabel, this.handleNameItem, this.removeName, this.newName, ["Nickname", "Phonetic"]) }
        <div><br/></div>
        <label>Email</label>
        {this.renderList(this.state.other_emails, this.handleEmailLabel, this.handleEmailItem, this.removeEmail, this.newEmail, ["Work", "Home"])}
        <div><br/></div>
        <label>Company Info</label>
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
        <label>Phone</label>
        {this.renderList(this.state.phones, this.handlePhoneLabel, this.handlePhoneItem, this.removePhone, this.newPhone, ["Mobile","Work","Home"])}
        <div><br/></div>
        <label>Address</label>
        {this.renderList(this.state.addresses, this.handleAddressLabel, this.handleAddressItem, this.removeAddress, this.newAddress, ["Work", "Home"]) }
        <div><br/></div>
        <label>Custom Entries</label>
        {this.renderList(this.state.custom_entries, this.handleCustomLabel, this.handleCustomItem, this.removeCustom, this.newCustom, []) }
        <div><br/></div>
        <button className="btn btn-primary"
          onClick={() => this.saveProfile()}>Save</button>
        <button className="btn btn-primary"
          onClick={() => this.deleteProfile()}>Delete</button>
      </div>;
    }
  }
}
