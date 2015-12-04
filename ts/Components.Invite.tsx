/// <reference path="../marten/ts/ReactHelpers.ts" />
/// <reference path="../marten/typings/react/react.d.ts" />

module Esper.Components {

  var Component = ReactHelpers.Component;

  export class Invite extends Component<{email: string}, ApiT.ContactInfo> {
    constructor(props: {email:string}) {
      super(props);
      this.state = { contact_list: [], next_link: "", prev_link: "" };
    }

    componentDidMount() {
      Api.getGoogleContacts(this.props.email)
        .done(function(contactInfo: ApiT.ContactInfo) {
          this.state = contactInfo;
        });
    }

    showContacts = (contactList: ApiT.Contact[]) => {
    }

    render() {
      return <div className="modal fade" id="myModal" role="dialog">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <button type="button" className="close" data-dismiss="modal">
                <span aria-hidden="true">&times;</span>
              </button>
              <h4 className="modal-title">Modal title</h4>
            </div>
            <div className="modal-body">
              <p>One fine body&hellip;</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-default" data-dismiss="modal">Close</button>
              <button type="button" className="btn btn-primary">Save changes</button>
            </div>
          </div>
        </div>
      </div>;
    }
  }
}
