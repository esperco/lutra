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
    seeSample?: boolean;
  }

  export class EmailModal extends Component<EmailModalProps, EmailModalState> {
    componentDidMount = () => {
      twttr.widgets.createHashtagButton("Esper", $("#tweet-button").get(0), { text: "Show me how I'm spending my time @esper_co", size: "large" });
      twttr.events.bind('click', (ev) => { this.send() });
    }

    setSampleState = () => {
      this.setState({
        sending: this.state.sending,
        seeSample: true
      });
    }

    render() {
      var sending = this.state.sending;

      return <Modal
          title={this.props.title || "Send Us a Message"}
          icon="fa-envelope"
          busy={this.state.sending}
          showFooter={false}>
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
        <div id='modal-anchor'/>
        <textarea className="form-control esper-modal-focus" rows={3}
          disabled={this.state.sending || this.state.success} />
        <br/>
        <div id="tweet-button"></div>
        <br/>
        { this.state.seeSample ?
          <div id="carousel-example-generic" className="carousel slide" data-ride="carousel">
            <ol className="carousel-indicators">
              <li data-target="#carousel-example-generic" data-slide-to="0" className="active"></li>
              <li data-target="#carousel-example-generic" data-slide-to="1"></li>
              <li data-target="#carousel-example-generic" data-slide-to="2"></li>
            </ol>

            <div className="carousel-inner" role="listbox">
              <div className="item active">
                <img src="img/eg1.PNG"/>
              </div>
              <div className="item">
                <img src="img/eg2.PNG"/>
              </div>
              <div className="item">
                <img src="img/eg4.PNG"/>
              </div>
            </div>

            <a className="left carousel-control" href="#carousel-example-generic" role="button" data-slide="prev">
              <span className="glyphicon glyphicon-chevron-left" aria-hidden="true"></span>
              <span className="sr-only">Previous</span>
            </a>
            <a className="right carousel-control" href="#carousel-example-generic" role="button" data-slide="next">
              <span className="glyphicon glyphicon-chevron-right" aria-hidden="true"></span>
              <span className="sr-only">Next</span>
            </a>
          </div> : ""
        }
        <div className="modal-footer">
          <button onClick={this.setSampleState}
                  className="btn btn-default">See Example</button>
          <button data-dismiss="modal" className="btn btn-default">Close</button>
        </div>
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