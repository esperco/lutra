/// <reference path="../marten/ts/ReactHelpers.ts" />
/// <reference path="../marten/typings/react/react.d.ts" />

module Esper.Components {

  var Component = ReactHelpers.Component;

  export class Invite extends Component<{email: string}, ApiT.ContactInfo> {
    constructor(props: {email:string}) {
      super(props);
      this.state = { contact_list: [], next_link: "", prev_link: "" };
    }

    componentDidMount = () => {
      var self = this;
      Api.getGoogleContacts(this.props.email)
        .done(function(contactInfo: ApiT.ContactInfo) {
          self.setState(contactInfo);
        });
    }

    loadPage = (url: string) => {
      var self = this;
      Api.getGoogleContactsPage(url)
        .done(function(contactInfo: ApiT.ContactInfo) {
          self.setState(contactInfo);
        })
    }

    showContacts = (contactList: ApiT.Contact[]) => {
      return _.map(contactList, function(contact) {
        debugger;
        return <div className="media">
          <div className="media-left">
            <img className="media-object" style={{ width: "64px", height: "64px"}} src={contact.picture !== "" ? "data:image/JPEG;base64," + contact.picture : "https://lh5.googleusercontent.com/-pF0uQT0oqjY/AAAAAAAAAAI/AAAAAAAADEU/QJr95ei0nx8/photo.jpg"}/>
          </div>
          <div className="media-body">
            <h4 className="media-heading">{contact.name}</h4>
            {contact.email}
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
              {this.showContacts(this.state.contact_list)}
            </div>
            <div className="modal-footer">
              {this.state.prev_link !== "" ?
                <button className="btn btn-default" onClick={() => this.loadPage(this.state.prev_link)}>{"< Prev Page"}</button> :
                ""
              }
              {this.state.next_link !== "" ?
                <button className="btn btn-default">Next Page ></button> :
                ""
              }
              <button className="btn btn-primary">Send Invites</button>
            </div>
          </div>
        </div>
      </div>;
    }
  }
}
