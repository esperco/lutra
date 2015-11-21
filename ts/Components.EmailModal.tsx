/*
  Displays login info or link to login via Otter
*/

/// <reference path="../marten/ts/ReactHelpers.ts" />
/// <reference path="../marten/ts/Api.ts" />
/// <reference path="./Components.Modal.tsx" />

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

      return <Modal
          title={this.props.title || "Send Us a Message"}
          busy={this.state.sending}
          disableOk={this.state.sending || this.state.success}
          dismissText="Cancel"
          okText="Send"
          okOnClick={this.send.bind(this)}>
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
      </Modal>;
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