/// <reference path="../marten/ts/ReactHelpers.ts" />
/// <reference path="../marten/typings/react/react.d.ts" />

module Esper.Components {

  var Component = ReactHelpers.Component;

  interface AccountState {
    esperProfile: ApiT.Profile;
  }

  export class Invite extends Component<AccountState, {}> {
    constructor(props: AccountState) {
      super(props);
    }

    componentDidMount() {
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
