/*
  Module for managing the onboarding flow within the extension
*/

/// <reference path="../marten/ts/Model.StoreOne.ts" />

module Esper.Onboarding {
  // Sort of annoying but needed to make namespaced React work with JSX
  var React = Esper.React;

  // Store for currentSlide that non-React code can tap into
  export var CurrentSlide = new Model.StoreOne<number>();

  // Initialize
  CurrentSlide.set(0);

  function nextSlide() {
    CurrentSlide.set(function(oldVal) {
      return Math.min(oldVal + 1, slides.length - 1);
    });
  }

  function prevSlide() {
    CurrentSlide.set(function(oldVal) {
      return Math.max(oldVal - 1, 0);
    });
  }

  // Call this function when we have login data
  export function handleLogin() {
    CurrentSlide.set(2);
  }

  // The state of the current slide used by React -- currently just reference
  // the slide number
  interface OnboardingState {
    currentSlide: number;
  }

  export class OnboardingModal
      extends ReactHelpers.Component<Types.Account, OnboardingState> {
    static stores = [CurrentSlide];

    render() {
      var slideElm = React.createElement(slides[this.state.currentSlide], {
        // Assign key attribute so React can efficiently modify
        key: "slide-" + this.state.currentSlide,
        account: this.props,
        parent: this
      });
      var lastSlide = slides.length > (this.state.currentSlide + 1);
      var progress = Math.floor(
        ((this.state.currentSlide + 1) / slides.length) * 100);

      return (<div id="esper-onboarding" className="modal fade esper">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <i className="fa fa-close close btn btn-secondary" data-dismiss="modal"></i>
              <h4 className="modal-title">
                <img className="esper-modal-icon esper-brand-icon"
                     src={chrome.extension.getURL("img/menu-logo-black.svg")} />
                Thanks for Installing Esper!
              </h4>
            </div>
            <div className="modal-body esper-onboarding">
              {slideElm}
            </div>
            <div className="progress skinny">
              <div className="progress-bar" role="progressbar"
                   style={{width: progress + "%"}}>
              </div>
            </div>
            <div className="modal-footer">
              <span className="esper-spinner"></span>
              <button type="button" className="btn btn-default"
                  onClick={prevSlide}
                  style={this.state.currentSlide ? {} : {display: "none"}}>
                Back
              </button>
              <button type="button"
                  className="btn btn-primary btn-onboarding-next"
                  onClick={this.handleNext.bind(this)}>
                {lastSlide ? "Next" : "Finish"}
              </button>
            </div>
          </div>
        </div>
      </div>);
    }

    handleNext() {
      var slideCls = slides[this.state.currentSlide];
      var lastSlide = slides.length <= (this.state.currentSlide + 1);
      var self = this;

      this.makeBusy();
      slideCls.handleSubmit(this)
        .done(function() {
          if (lastSlide) {
            self.find('#esper-onboarding').modal('hide');
          } else {
            nextSlide();
          }
        })
        .fail(function() {
          // Show error message?
        })
        .always(this.unmakeBusy.bind(this));
    }

    // Toggle spinners and whatnot
    makeBusy() {
      this.find(".btn-onboarding-next").prop("disabled", true);
      this.find(".esper-spinner").show();
    }

    // Undo makeBusy
    unmakeBusy() {
      this.find(".btn-onboarding-next").prop("disabled", false);
      this.find(".esper-spinner").hide();
    }

    // Open modal on launch -- also add class to body so shading appears
    // in the background
    componentDidMount() {
      super.componentDidMount();

      $('html').addClass('esper-bs');
      var elm = this.find('#esper-onboarding')
      elm.modal();

      var self = this;
      elm.on('hidden.bs.modal', function() {
        self.removeSelf();
        $('html').removeClass('esper-bs');
      });
    }

    // Get slide state
    getState() {
      return {
        currentSlide: CurrentSlide.val() || 0
      };
    }
  }

  // Interface for onboarding properties
  interface OnboardingProps {
    key?: string,
    parent: OnboardingModal,
    account: Types.Account
  }

  // Base class for slides
  class OnboardingSlide extends ReactHelpers.Component<OnboardingProps, {}> {
    // Static function to override in subclasses, handles hitting the next
    // button -- recieves a component reference. Can return a promise that
    // delays next slide until resolved.
    static handleSubmit<T>(instance: OnboardingModal):JQueryPromise<T> {
      return $.Deferred<any>();
    }

    componentDidMount() {
      super.componentDidMount();
      this.props.parent.unmakeBusy();
    }
  }

  // Slide 0 => welcome slide
  class WelcomeSlide extends OnboardingSlide {
    static handleSubmit<T>(instance: OnboardingModal):JQueryPromise<T> {
      var d = $.Deferred<any>();
      d.resolve(1);
      return d.promise();
    }

    render() {
      return <div>Hello World.</div>;
    }
  }

  // Slide 1 => get permissions
  class PermissionSlide extends OnboardingSlide {
    static handleSubmit<T>(instance: OnboardingModal):JQueryPromise<T> {
      var d = $.Deferred<any>();
      d.resolve(1);
      return d.promise();
    }

    render() {
      var content: JSX.Element;
      if (Auth.loggedIn) {
        content = (<div>
          You are logged in as {this.props.account.googleAccountId}.
        </div>);
      } else {
        content = (<div>
          Waiting for {this.props.account.googleAccountId} to sign in.
          <br /><br />

          <button className="btn btn-primary sign-in-btn google-btn">
            <div className="sign-in-text">Sign In With Google</div>
          </button>
        </div>);
      }

      return (<div className="text-center">{content}</div>);
    }

    componentDidMount() {
      super.componentDidMount();

      // Open a new page for Google OAuth if we're not logged in
      if (! Auth.loggedIn) {
        this.props.parent.makeBusy();
        Auth.openLoginTab(this.props.account.googleAccountId);
      }
    }
  }

  // Slide 2 => set calendar
  class CalendarSlide extends OnboardingSlide {
    static handleSubmit<T>(instance: OnboardingModal):JQueryPromise<T> {
      var d = $.Deferred<any>();
      setTimeout(function() {
        d.resolve(1);
      }, 3000);
      return d.promise();
    }

    render() {
      return <div>Calendar stuff goes here.</div>;
    }
  }

  // Slide 3 => videos + final stuff
  class FinishSlide extends OnboardingSlide {
    static handleSubmit<T>(instance: OnboardingModal):JQueryPromise<T> {
      var d = $.Deferred<any>();
      d.resolve(1);
      return d.promise();
    }

    render() {
      return <div>This is the last slide.</div>;
    }
  }

  // Index of slides
  var slides: (typeof OnboardingSlide)[] = [
    WelcomeSlide, PermissionSlide, CalendarSlide, FinishSlide
  ];
}