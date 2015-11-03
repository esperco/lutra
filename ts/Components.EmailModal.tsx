/*
  Displays login info or link to login via Otter
*/

/// <reference path="../marten/ts/ReactHelpers.ts" />
/// <reference path="../marten/ts/Api.ts" />

module Esper.Components {
  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  interface EmailModalProps {
    title?: string;
    children?: JSX.Element[];
  }

  interface EmailModalState {
    sending: boolean;
    success?: boolean;
    error?: boolean;
  }

  export class EmailModal extends Component<EmailModalProps, EmailModalState> {
    render() {
      var sending = this.state.sending;

      return (<div className="modal fade">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <button type="button" className="close" data-dismiss="modal">
                <span aria-hidden="true">&times;</span>
              </button>
              <h4 className="modal-title">{
                this.props.title || "Send Us a Message"
              }</h4>
            </div>
            <div className="modal-body">
              {
                this.state.success ?
                <div className="alert compact alert-success" role="alert">
                  <i className="fa fa-fw fa-check"></i>{" "}
                  Sent! We'll get back to you soon.
                </div> : ""
              }
              {
                this.state.error ?
                <div className="alert compact alert-danger" role="alert">
                  <i className="fa fa-fw fa-warning"></i>{" "}
                  Whoops. Something broke.{" "}
                  <a href="http://esper.com/contact">
                    Please try contacting us at esper.com/contact.
                  </a>
                </div> : ""
              }
              {this.props.children}
              <textarea className="form-control" rows={3}
                disabled={this.state.sending || this.state.success} />
            </div>
            <div className="modal-footer">
              {
                this.state.sending ?
                <span className="esper-spinner"></span> :
                ""
              }
              <button type="button" className="btn btn-default"
                  data-dismiss="modal">
                Cancel
              </button>
              <button type="button"
                  disabled={this.state.sending || this.state.success}
                  onClick={this.send.bind(this)}
                  className="btn btn-primary">
                Send
              </button>
            </div>
          </div>
        </div>
      </div>);
    }

    send() {
      var val = this.find('textarea').val();
      if (val) {
        this.setState({ sending: true });
        Api.sendSupportEmail(val)
          .done(() => {
            this.setState({
              sending: false,
              success: true,
              error: false
            });

            var self = this;
            setTimeout(function() {
              self.jQuery().modal('hide');
            }, 2000);
          })
          .fail(() => {
            this.setState({
              sending: false,
              success: false,
              error: true
            });
          });
      }
    }

    componentDidMount() {
      this.jQuery().on('hidden.bs.modal', () => {
        this.jQuery().parent().empty();
      });
      this.jQuery().on('shown.bs.modal', () => {
        this.find('textarea').focus();
      });
    }

    // Initialize with something, but we don't have any listeners that auto-
    // call this on change
    getState() {
      if (this.state) {
        return this.state;
      }
      return {
        sending: false
      };
    }
  }
}