/// <reference path="./ReactHelpers.ts" />
/// <reference path="./Api.ts" />

module Esper.Components {

  var Component = ReactHelpers.Component;
  var noPhoto = "https://lh5.googleusercontent.com/-pF0uQT0oqjY/AAAAAAAAAAI/AAAAAAAADEU/QJr95ei0nx8/photo.jpg";

  interface ContactState {
    contactInfo: ApiT.ContactInfo;
    selected: { [index: string]: boolean; };
    name: string;
    email: string;
  }

  interface InviteProps {
    name?: string;
    email?: string;
  }

  export class Invite extends Component<InviteProps, ContactState> {
    constructor(props: InviteProps) {
      super(props);
      this.state = { contactInfo:{contact_list: [], next_link: "", prev_link: "" },
                     selected:{},
                     name:props.name,
                     email:props.email };
    }

    getContacts = () => {
      var self = this;
      Api.getGoogleContacts(this.state.email)
        .done(function(contacts: ApiT.ContactInfo) {
          $('#myModal').modal('show');
          self.setState({ contactInfo: contacts } as ContactState);
        })
    }

    componentDidMount = () => {
      var self = this;
      if (this.props.name === undefined || this.props.email === undefined) {
        Api.getMyProfile().done(function(profile) {
          self.setState({ name: profile.display_name, email: profile.email } as ContactState);
          self.getContacts();
        });
      } else {
        self.getContacts();
      }
    }

    sendInvites = () => {
      var emailList: string[] = [];
      _.map(this.state.selected, function(v, k) {
        if (v) emailList.push(k);
      });
      Api.postContactsInvite(this.state.name, {email_list:emailList});
      $("#myModal").modal('hide');
    }

    selectAll = (onOrOff: boolean) => {
      this.setState(function(o) {
        var newSelected = $.extend(true, {}, o.selected);
        _.map(o.contactInfo.contact_list, function(contact) {
          newSelected[contact.email] = onOrOff;
        });
        return { selected: newSelected } as ContactState;
      });
    }

    loadPage = (url: string) => {
      var self = this;
      Api.getGoogleContactsPage(url)
        .done(function(contacts: ApiT.ContactInfo) {
          self.setState({ contactInfo: contacts } as ContactState);
        })
    }

    clickContact = (email: string) => {
      this.setState(function(o) {
        var newSelected = $.extend(true, {}, o.selected);
        if(o.selected[email]) {
          newSelected[email] = false;
        } else {
          newSelected[email] = true;
        }
        return { selected: newSelected } as ContactState;
      });
    }

    showContacts = (contactList: ApiT.Contact[]) => {
      var self = this;
      return _.map(contactList, function(contact) {
        return <div className="media clickable-media"
                    onClick={self.clickContact.bind(self,contact.email)}>
          <div className="media-left">
            <img className="media-object" style={{ width: "64px", height: "64px"}} 
                 src={contact.picture !== "" ?
                      "data:image/JPEG;base64," + contact.picture :
                      noPhoto}/>
          </div>
          <div className="media-body">
            <h4 className="media-heading">{contact.name}</h4>
            {contact.email}
          </div>
          <div className="media-right" style={{verticalAlign:"middle"}}>
            <span className={self.state.selected[contact.email] ?
                             "glyphicon glyphicon-check" :
                             "glyphicon glyphicon-unchecked"}
                  style={{fontSize:"20px"}}></span>
          </div>
        </div>;
      });
    }

    render() {
      return <div className="modal fade" id="myModal" role="dialog">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <button type="button" className="close" data-dismiss="modal">
                <span aria-hidden="true">&times;</span>
              </button>
              <h4 className="modal-title">Invite others to join!</h4>
            </div>
            <div className="modal-body">
              {this.showContacts(this.state.contactInfo.contact_list)}
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={this.selectAll.bind(this, true)}
                      style={{ float: "left" }}>Select All</button>
              <button className="btn btn-default" onClick={this.selectAll.bind(this, false)}
                      style={{ float: "left" }}>Deselect All</button>
              {this.state.contactInfo.prev_link !== "" ?
                <button className="btn btn-default"
                        onClick={this.loadPage.bind(this,this.state.contactInfo.prev_link)}>
                                {"< Prev Page"}</button>:()=>{}
              }
              {this.state.contactInfo.next_link !== "" ?
                <button className="btn btn-default"
                        onClick={this.loadPage.bind(this,this.state.contactInfo.next_link)}>
                        Next Page ></button>:()=>{}
              }
              <button className="btn btn-primary"
                      onClick={this.sendInvites}>Send Invites</button>
            </div>
          </div>
        </div>
      </div>;
    }
  }
}
