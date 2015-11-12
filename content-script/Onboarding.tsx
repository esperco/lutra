/*
  Module for managing the onboarding flow within the extension
*/

/// <reference path="../common/Esper.ts" />
/// <reference path="../common/Api.ts" />
/// <reference path="../common/Promise.ts" />
/// <reference path="../common/Types.ts" />
/// <reference path="../common/HostUrl.ts" />
/// <reference path="../common/Analytics.ts" />
/// <reference path="../marten/ts/Log.ts" />
/// <reference path="../marten/ts/Model.ts" />
/// <reference path="../marten/ts/Model.StoreOne.ts" />
/// <reference path="../marten/ts/ReactHelpers.ts" />
/// <reference path="../marten/ts/ApiC.ts" />
/// <reference path="./Auth.ts" />

module Esper.Onboarding {
  // Sort of annoying but needed to make namespaced React work with JSX
  var React = Esper.React;

  // Store for currentSlide that non-React code can tap into
  export var CurrentSlide = new Model.StoreOne<number>();
  CurrentSlide.set(0); // Initialize

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

  // This function gest called when we have login data
  export function handleLogin() {
    CurrentSlide.set(2);
    track(Analytics.Trackable.OnboardingLoginSuccess);
  }


  //////////////

  // Interface for team creation requests
  enum TeamRequestError {
    Duplicate = 1, // Exec already exists
    Unknown        // Unknown error
  }

  interface TeamRequest {
    teamid?: string;       // _id server responds with after team creation
    name?: string;         // team name
    email?: string;        // e-mail address for sec
    defaultCal?: string;   // google_cal_id of primary calendar
    calendars?: [string];  // google_cal_ids of all other calendars

    // Why last save request failed
    error?: TeamRequestError

    createdOn: Date;       // For sorting purposes
  }

  // Class for storing teamRequests
  class TeamStore extends Model.Store<TeamRequest> {
    // Initialize with a request object
    constructor() {
      super();
      this.add();
    }

    // Create a new blank request
    add() {
      var request: TeamRequest = {
        createdOn: new Date()
      };
      this.insert(request, {
        _id: Util.randomString(),
        dataStatus: Model.DataStatus.UNSAVED
      });
    }
  }


  // Analytics helpers
  function track(trackable: Analytics.Trackable,
                 account?: Types.Account, props?: any) {
    props = props || {};
    account = account || Login.getAccount();
    if (account) {
      props.googleAccountId = account.googleAccountId;
    }

    var googlePage: string;
    if (HostUrl.isGcal(document.URL)) {
      props.googlePage = "Gmail";
    } else if (HostUrl.isGcal(document.URL)) {
      props.googlePage = "Gcal";
    } else {
      props.googlePage = document.URL;
    }

    Analytics.track(trackable, props);
  }


  /////////////

  // State elements that slide logic cannot (directly) change
  interface ModalState {
    slideIndex: number;
  }

  interface OnboardingModalProps {
    account: Types.Account,
    hideProgressBar: boolean,
    hideFooter: boolean
  }

  export class OnboardingModal
      extends ReactHelpers.Component<OnboardingModalProps, ModalState> {
    private teamStore: TeamStore;
    private supportsExecutive: Model.StoreOne<boolean>;

    constructor(props) {
      super(props);

      /*
        Create singleton instances of stores and queries we can pass around
        via props. These ares are only used for onboarding, so attach them
        to this component instance so they get cleaned up when the onboarding
        flow is complete.
      */

      // Store of pending / completed requests to create new teams
      this.teamStore = new TeamStore();

      // Store of whether the user is a single-user team or supports an exec
      this.supportsExecutive = new Model.StoreOne<boolean>();
    }

    render() {
      var self = this;
      var slideLogic = slides[this.state.slideIndex];
      var slideWrapper = React.createElement(SlideWrapper, {
        view: slideLogic.view,
        title: slideLogic.title,
        next: slideLogic.next,
        getState: slideLogic.getState,
        getSources: slideLogic.getSources,
        account: this.props.account,
        index: this.state.slideIndex,
        hideProgressBar: this.props.hideProgressBar,
        hideFooter: this.props.hideFooter,
        onFinish: function() {
          // Reload page to force injected script to reload data
          location.reload();
        },

        data: {
          teamStore: this.teamStore,
          supportsExecutive: this.supportsExecutive
        }
      });

      return (<div id="esper-onboarding" className="modal fade esper">
        <div className="modal-dialog">
          {slideWrapper}
        </div>
      </div>);
    }

    // Open modal on launch -- also add class to body so shading appears
    // in the background
    componentDidMount() {
      this.setSources([CurrentSlide]);

      $('html').addClass('esper-bs');
      var elm = this.jQuery();
      elm.modal({
        backdrop: 'static'
      });

      var self = this;
      elm.on('hidden.bs.modal', function() {
        self.jQuery().parent().remove();
        $('html').removeClass('esper-bs');
      });

      if (!this.props.hideFooter && !this.props.hideProgressBar) {
        track(Analytics.Trackable.OnboardingModalOpen, this.props.account);
      }
    }

    // Get slide state -- mix in slide-specific state as well
    getState() {
      return {
        slideIndex: CurrentSlide.val() || 0
      };
    }
  }


  ////////

  interface SlideLogic {
    // Class for main display component
    view: typeof Slide;

    // Return title of modal
    title?: string;

    /*
      NB: It'd be nice to call the functions below with the actual
      SlideWrapper instance as "this" but TypeScript is currently unable
      to reason about that. So explicit argument it is.
    */

    // Function for processing async calls when the next button is clicked.
    next?: (instance: SlideWrapper) => JQueryPromise<any>;

    // Function to update state
    getState?: (instance: SlideWrapper) => SlideWrapperState;

    // Sources that trigger state updates
    getSources?: (instance: SlideWrapper) => Emit.EmitBase[];
  }

  interface DataSources {
    teamStore: TeamStore;
    supportsExecutive: Model.StoreOne<boolean>;
  }

  interface SlideWrapperProps extends SlideLogic {
    index: number;
    onFinish: () => void;
    account: Types.Account;
    hideProgressBar: boolean;
    hideFooter: boolean;
    data: DataSources;
  }

  interface SlideWrapperState {
    busy: boolean;
    blocked: boolean;
  }

  interface SlideProps {
    busy: boolean;
    account: Types.Account;
    data: DataSources;
    close: () => void;
  }

  /*
    SlideWrapper component changes behavior based on SlideLogic elements.
    We use SlideLogic to alter component behavior rather than rendering
    a new component altogether to preserve animation and get other benefits
    from not chucking out existing DOM elements.
  */
  class SlideWrapper
      extends ReactHelpers.Component<SlideWrapperProps, SlideWrapperState> {
    currentSlide: Slide<any>;

    constructor(props) {
      super(props)
      this.setSources(this.props.getSources ?
        this.props.getSources(this) : []);
    }

    getState() {
      return (this.props.getState ?
        this.props.getState(this) : { busy: false, blocked: false });
    }

    componentWillReceiveProps(nextProps) {
      if (nextProps.getState) {
        this.setState(nextProps.getState(this));
      }
      this.setSources(nextProps.getSources ? nextProps.getSources(this) : []);
    }

    render() {
      return (<div className="modal-content">
        <Header title={this.props.title || "Esper"} />
        <div className="modal-body esper-onboarding clearfix">
          {React.createElement(this.props.view, {
            ref: (c) => {this.currentSlide = c;},
            busy: this.state.busy,
            account: this.props.account,
            data: this.props.data,
            close: this.props.onFinish
          })}
        </div>
        { this.props.hideProgressBar ? null :
          <ProgressBar
            index={ this.props.index }
            total= { slides.length }
          />
        }
        { this.props.hideFooter ? null :
          <Footer
            firstSlide={ !this.props.index }
            lastSlide={ this.props.index + 1 >= slides.length }
            busy={this.state.busy}
            blocked={this.state.blocked}
            prev={this.handlePrev.bind(this)}
            next={this.handleNext.bind(this)}
          />
        }
      </div>);
    }

    handlePrev(): void {
      this.unmakeBusy();
      prevSlide();
    }

    handleNext(): void {
      var onFinish = this.props.onFinish;
      var lastSlide = this.props.index + 1 >= slides.length;
      var onDone = function() {
        if (lastSlide) {
          onFinish();
        } else {
          nextSlide();
        }
      }

      if (this.props.next) {
        this.makeBusy();
        this.props.next(this)
          .done(onDone)
          .fail(function() {
            // TODO: Show error message?
          })
          .always(this.unmakeBusy.bind(this));
      } else {
        onDone();
      }
    }

    protected makeBusy() {
      this.setState({ busy: true, blocked: false });
    }

    protected unmakeBusy() {
      this.setState({ busy: false, blocked: false });
    }
  }

  class Slide<S> extends ReactHelpers.Component<SlideProps, S> {}


  //////////

  interface HeaderProps {
    title: string;
  }

  class Header extends ReactHelpers.Component<HeaderProps, {}> {
    render() {
      return (<div className="modal-header">
        <i className="fa fa-close close btn btn-secondary"
           data-dismiss="modal"></i>
        <h4 className="modal-title">
          <img className="esper-modal-icon esper-brand-icon"
            src={chrome.extension.getURL("img/menu-logo-black.svg") } />
          {this.props.title}
        </h4>
      </div>);
    }
  }

  interface ProgressProps {
    index: number,
    total: number
  }

  class ProgressBar extends ReactHelpers.Component<ProgressProps, {}> {
    render() {
      var progress = Math.floor(
        ((this.props.index + 1) / this.props.total) * 100);
      return (
        <div className="progress skinny">
          <div className="progress-bar" role="progressbar"
            style={{ width: progress + "%" }}>
          </div>
        </div>
      );
    }
  }

  interface FooterProps {
    firstSlide: boolean;
    lastSlide: boolean;
    busy: boolean;
    blocked: boolean;
    prev: () => void;
    next: () => void;
  }

  class Footer extends ReactHelpers.Component<FooterProps, {}> {
    render() {
      return (
        <div className="modal-footer">
          { this.props.busy ? <span className="esper-spinner"></span> : null }
          {
            !this.props.firstSlide ?
            <button type="button" className="btn btn-default"
              onClick={this.props.prev}>Back</button> :
            null
          }
          <button type="button" disabled={this.props.busy || this.props.blocked}
            className="btn btn-primary btn-onboarding-next"
            onClick={this.props.next}>
            {this.props.lastSlide ? "Finish" : "Next"}
          </button>
        </div>
      );
    }
  }


  ///////////

  // Slide 0 => welcome slide
  class WelcomeSlide extends Slide<{}> {
    render() {
      return (<div>
        <p>
          We are here to supercharge your inbox so you can quickly and expertly
          handle any task. With Esper, you can now:
          <ul>
            <li>Send and edit calendar invites directly from your inbox</li>
            <li>Set customized confirmations and reminder emails for events</li>
            <li>Stay organized with automatically compiled Agendas and Task
            Lists</li>
            <li>See how you allocate time with TimeStats</li>
          </ul>
        </p>
        <p>
          To get started, Esper needs your permission to sync with your Google
          Calendar and Gmail. {" "}
          <span className="text-center esper-link" onClick={nextSlide}>
            Click next to continue.
          </span>
        </p>
        <p className="text-center">
          <span className="esper-remove-link" onClick={this.disable.bind(this)}>
            Or disable Esper for this Google account by clicking here.
          </span>
        </p>
      </div>);
    }

    disable() {
      var account = this.props.account;
      account.declined = true;
      EsperStorage.saveAccount(account, this.props.close);
      track(Analytics.Trackable.ClickOnboardingDisable, account);
    }
  }

  var welcomeSlideLogic: SlideLogic = {
    view: WelcomeSlide,
    title: "Thank you for installing Esper!"
  };


  ///////////

  // Slide 1 => get permissions
  class PermissionSlide extends Slide<{}> {
    render() {
      var url = chrome.extension.getURL;
      var content: JSX.Element;
      if (Login.loggedIn()) {
        content = (<div className="message">
          You are logged in as {this.props.account.googleAccountId}.<br />
          <span className="esper-link"
                onClick={nextSlide}>Click next to continue.</span>
        </div>);
      } else {
        content = (<div>
          <div className="message">
            Waiting for {this.props.account.googleAccountId} to sign in
          </div>
          <button className="esper-google-btn"
                  onClick={this.clickLoginButton.bind(this)}></button>
        </div>);
      }

      return (<div className="simple-content">{content}</div>);
    }

    componentDidMount() {
      // Open a new page for Google OAuth if we're not logged in
      if (! Login.loggedIn()) {
        this.openLoginTab();
      }
    }

    openLoginTab() {
      Auth.openLoginTab(this.props.account.googleAccountId);
    }

    clickLoginButton() {
      track(Analytics.Trackable.ClickOnboardingLogin);
      this.openLoginTab();
    }
  }

  var permissionSlideLogic: SlideLogic = {
    view: PermissionSlide,
    title: "Connect to Google",
    getState: function() {
      return { busy: !Login.loggedIn(), blocked: false };
    }
  };


  ///////////

  // Slide 2 => identify slide
  class IdentifySlide extends Slide<{}> {
    hasSelected: boolean = false;

    identifyUser(e) {
      this.hasSelected = true;
      this.props.data.supportsExecutive.set(e.target.value === "true");
      // Reset the number of stored request to be 1
      this.props.data.teamStore.reset();
      this.props.data.teamStore.add();
    }

    render() {
      return (<div>
        <p>
          Do you support an executive?
          <div>
            <input id="esper-support-executive"
              type="radio"
              value="true"
              onChange={this.identifyUser.bind(this)}
              name="esper-identify-slide-group"/>
            <label htmlFor="esper-support-executive">
              Yes, I support someone
            </label>
            <br />
            <input id="esper-support-myself"
              type="radio"
              value="false"
              onChange={this.identifyUser.bind(this)}
              name="esper-identify-slide-group"/>
            <label htmlFor="esper-support-myself">
              No, I support myself
            </label>
          </div>
        </p>
      </div>);
    }
  }

  var identifySlideLogic: SlideLogic = {
    view: IdentifySlide,
    title: "Getting to Know You",
    getState: function(instance: SlideWrapper) {
      var slide = instance.currentSlide as IdentifySlide;
      return {
        busy: false,
        blocked: !slide.hasSelected
      };
    },
    getSources: function(instance: SlideWrapper) {
      return [instance.props.data.supportsExecutive];
    }
  };


  //////////

  interface CalendarSlideState {
    calendars: ApiT.Calendar[];
    calendarsUpdating: boolean;
    teamRequests: [TeamRequest, Model.StoreMetadata][];
  }

  // Slide 3 => set calendar
  class CalendarSlide extends Slide<CalendarSlideState> {
    teamForms: {
      [index: string]: TeamForm
    };

    constructor(props: SlideProps) {
      ApiC.getCalendarList(); // Async call to populate stores
      super(props);
    }

    protected getState(): CalendarSlideState {
      var key = ApiC.getCalendarList.strFunc([]);
      var calData = ApiC.getCalendarList.store.val(key);
      var calMeta = ApiC.getCalendarList.store.metadata(key);
      var teamData = this.props.data.teamStore.getAll();
      return {
        calendars: calData && calData.calendars,
        calendarsUpdating: !(calMeta &&
                             calMeta.dataStatus === Model.DataStatus.READY),
        teamRequests: _.sortBy(teamData, function(team) {
          return team[0].createdOn;
        })
      };
    }

    registerTeamForms(id: string, form: TeamForm) {
      this.teamForms = this.teamForms || {};
      if (form) {
        this.teamForms[id] = form;
      } else {
        delete this.teamForms[id];
      }
    }

    render() {
      var calendars = this.state.calendars || [];
      var teams = this.state.teamRequests || [];
      var loading = (!calendars.length && this.state.calendarsUpdating);

      if (loading) {
        return (<div className="simple-content">
          <div className="message">
            Loading &hellip;
          </div>
        </div>);
      }

      else {
        var self = this;
        var teamStore = this.props.data.teamStore;
        var supportsExecutive = this.props.data.supportsExecutive.val();
        var registerTeamForms = this.registerTeamForms.bind(this);
        var teamForms = _.map(this.state.teamRequests, function(team) {
          var remove = () => { teamStore.remove(team[1]._id) };
          return <TeamForm key={team[1]._id}
            ref={(c) => {registerTeamForms(team[1]._id, c)}}
            first={_.first(self.state.teamRequests) === team}
            supportsExecutive={supportsExecutive}
            team={team[0]}
            metadata={team[1]}
            calendars={calendars}
            remove={remove}
          />;
        });
        return (<div>
          { supportsExecutive ?
            <div className="well">
              Thanks! We need to link the individuals you support to their
              respective calendars. Please add each individual you support to
              the list below and mark which calendars correspond to their
              schedule in the “Calendars associated with this Executive” list.
              If the calendar you’re looking for doesn’t appear in this list,
              ask the calendar owner to {" "}
              <a href="https://support.google.com/calendar/answer/37082?hl=en">
              share it with you first on Google</a>.
            </div> :
            <div className="well">
              Thanks! Please place a checkmark next to the calendars you wish
              to use for scheduling.
            </div>
          }
          { teamForms }
          <div>
            { supportsExecutive ?
              <button className="btn btn-secondary"
                      onClick={this.addExec.bind(this)}>
                <i className="fa fa-fw fa-plus"></i> Add Another Executive
              </button> : null
            }
          </div>
        </div>);
      }
    }

    addExec() {
      this.props.data.teamStore.add();
    }

    componentDidMount() {
      this.setSources([
        ApiC.getCalendarList.store,
        this.props.data.teamStore
      ]);
    }
  }

  var calendarSlideLogic: SlideLogic = {
    view: CalendarSlide,
    title: "Set Up Calendars",

    getState: function(instance: SlideWrapper) {
      var key = ApiC.getCalendarList.strFunc([]);
      var calData = ApiC.getCalendarList.store.val(key);
      var calMeta = ApiC.getCalendarList.store.metadata(key);
      var calendars = (calData && calData.calendars) || [];

      return {
        busy: !calendars.length &&
              !(calMeta && calMeta.dataStatus !== Model.DataStatus.READY),
        blocked: false
      };
    },

    getSources: function(instance: SlideWrapper) {
      return [ApiC.getCalendarList.store];
    },

    next: function(instance: SlideWrapper) {
      var slide = instance.currentSlide as CalendarSlide;
      var teamStore = instance.props.data.teamStore;
      var supportsExecutive = instance.props.data.supportsExecutive.val();

      // Set to false if ANY of our teams are invalid
      var isValid = true;

      // A list of new team creation requests to send
      var newRequests: [string, TeamRequest][] = [];

      // Validate each team and save if status is unsaved
      _.each(slide.teamForms, function(form: TeamForm, _id: string) {
        var oldMetadata = teamStore.metadata(_id);
        if (oldMetadata &&
            oldMetadata.dataStatus === Model.DataStatus.UNSAVED) {
          var request = form.validate();
          if (request) {
            newRequests.push([_id, request]);
          } else {
            isValid = false;
          }
        }
      });

      _.each(newRequests, function(tuple) {
        teamStore.update(tuple[0], tuple[1], {
          dataStatus: (isValid ?
            Model.DataStatus.UNSAVED : Model.DataStatus.INFLIGHT)
        });
      });

      // Tracking
      var newRequestsList = _.map(newRequests, function(tuple) {
        return tuple[1];
      });
      track(Analytics.Trackable.ClickOnboardingCreateTeams, null, {
        isValid: isValid,
        teamCount: newRequestsList.length,
        requests: newRequestsList
      });

      if (isValid) {
        var promises = [];
        _.each(newRequests, function(tuple) {
          let localId = tuple[0];
          let request = tuple[1];
          teamStore.update(localId, request, {
            dataStatus: Model.DataStatus.INFLIGHT
          });
          let body;
          if (supportsExecutive) {
            body = {
              executive_name: request.name,
              executive_email: request.email
            }
          } else {
            body = {
              executive_name: request.name
            }
          }

          let promise = Api.createTeam(body)
            .then(function(team) {
              // Put calendars
              var calendars = _.map<string, ApiT.Calendar>(
                _.without(request.calendars, request.defaultCal),
                function(calId) {
                  return {
                    google_cal_id: calId,
                    calendar_title: "", // This gets replaced with actual
                                        // calendar title elsewhere
                    calendar_default_agenda: true,
                    calendar_default_view: true
                  };
                });
              calendars.push({
                google_cal_id: request.defaultCal,
                calendar_title: "", // This gets replaced with actual calendar
                                    // title elsewhere
                is_primary: true,
                calendar_default_view: true,
                calendar_default_write: true,
                calendar_default_agenda: true
              });
              return Api.putTeamCalendars(team.teamid, calendars);
            })

            .then(function(team) {
              let updatedRequest = _.extend({}, request, {
                teamid: team.teamid
              }) as TeamRequest;
              teamStore.update(localId, updatedRequest, {
                dataStatus: Model.DataStatus.READY
              });
            }, function(err) {
              Log.e(err);
              var error: TeamRequestError = TeamRequestError.Unknown;
              if (err.status === 403) {
                error = TeamRequestError.Duplicate;
              }
              let updatedRequest = _.extend({}, request, {
                error: error
              }) as TeamRequest;
              teamStore.update(localId, updatedRequest, {
                dataStatus: Model.DataStatus.UNSAVED
              });
              return err;
            });
          promises.push(promise);
        });
        return Promise.join2(promises);
      }
      else {
        return Promise.fail(null);
      }
    }
  };

  interface TeamFormProps {
    key?: string;
    ref?: (c: TeamForm) => void;
    first: boolean;
    supportsExecutive: boolean;
    team: TeamRequest;
    metadata: Model.StoreMetadata;
    calendars: ApiT.Calendar[];
    remove: () => void;
  }

  interface TeamFormState {
    nameHasError: boolean;
    emailHasError: boolean;
  }

  class TeamForm extends ReactHelpers.Component<TeamFormProps, TeamFormState> {
    constructor(props) {
      super(props);
      this.state = {
        nameHasError: false,
        emailHasError: false
      };
    }

    render() {
      var team = this.props.team;
      var first = this.props.first;
      var supportsExecutive = this.props.supportsExecutive;

      // Disable editing unless this is not yet saved
      // TODO: Allow editing of already created teams
      var disabled = (
        this.props.metadata.dataStatus !== Model.DataStatus.UNSAVED);
      var saved = (
        this.props.metadata.dataStatus === Model.DataStatus.READY);

      // Display appropriate error message -- save function will store error
      // in status
      var errorMsg: JSX.Element;
      if (team.error === TeamRequestError.Duplicate) {
        errorMsg = (<span>
          A team already exists for this executive. Please ask an existing
          member of the team to add you or {" "}
          <a href="http://esper.com/contact">contact Esper for support</a>.
        </span>);
      } else if (team.error) {
        errorMsg = (<span>
          There was an error while creating this team. Please {" "}
          <a href="http://esper.com/contact">contact Esper for support</a>.
        </span>);
      }
      errorMsg = errorMsg && (<div className="alert alert-danger">
        {errorMsg}
      </div>);

      var sortedCalendars = _.sortBy(this.props.calendars, function(cal) {
        return cal.calendar_title.toLowerCase();
      });
      var calCheckboxes = _.map(sortedCalendars, function(cal) {
        var checked = _.includes(team.calendars, cal.google_cal_id);
        return (<div className="checkbox" key={cal.google_cal_id}>
          <label>
            <input type="checkbox" value={cal.google_cal_id}
              disabled={disabled}
              name="calendars" defaultChecked={checked} />
            {cal.calendar_title}
          </label>
        </div>);
      });

      var calOptions = _.map(sortedCalendars, function(cal) {
        return (<option value={cal.google_cal_id} key={cal.google_cal_id}>
          {cal.calendar_title}
        </option>);
      });

      return (<div>
        {errorMsg}
        <div className="row clearfix form-set">
          <div className="col-sm-6"><div className="esper-col-spacer">
            <div className={"form-group " +
                (this.state.nameHasError ? "has-error" : "")}>
              <label htmlFor={this.getId("name")}
                className="control-label">
                { supportsExecutive ? "Executive's Name" : "Your Name" }
              </label>
              <input id={this.getId("name")} name="name"
                type="text" className="form-control"
                defaultValue={team.name}
                disabled={disabled}
                placeholder="Tony Stark" />
            </div>
            { supportsExecutive ?
              <div className={"form-group " +
                  (this.state.emailHasError ? "has-error" : "")}>
                <label htmlFor={this.getId("email")}
                  className="control-label">
                  Executive's Email
                </label>
                <input id={this.getId("email") } type="email" name="email"
                  defaultValue={team.email}
                  disabled={disabled}
                  className="form-control" placeholder="tony@stark.com" />
              </div> : null
            }
            <div className="form-group">
              <label htmlFor={this.getId("default-cal")}
                className="control-label">
                Default Calendar to Add Events
              </label>
              <select id={this.getId("default-cal")}
                value={team.defaultCal}
                name="default-cal"
                disabled={disabled}
                className="form-control">
                {calOptions}
              </select>
            </div>
            {
              disabled || !supportsExecutive || first ? "" :
              <div className="esper-remove-link form-group"
                onClick={this.props.remove}>
                <i className="fa fa-fw fa-close"></i>
                Remove
              </div>
            }
            {
              saved ?
              <div className="form-group">
                <div className="label label-success">
                  <i className="fa fa-fw fa-check"></i>
                  Team Created
                </div>
              </div> : ""
            }
          </div></div>
          <div className="col-sm-6 form-group">
            <div className="esper-col-spacer">
              <label className="group-heading">
                { supportsExecutive ? "Calendars Associated with this Executive"
                  : "Other Calendars to Sync"}
              </label>
              <div className="esper-sync-calendars">{calCheckboxes}</div>
            </div>
          </div>
        </div>
      </div>);
    }

    // Validate inputs for this component, set error state if invalid, and
    // return the TeamRequest if valid. Called by SlideLogic.next for this
    // slide.
    validate(): TeamRequest {
      /* Using jQuery selectors here is unfortunately not type-checkable.
         TODO: Use React's ref attribute with enums or properties */
      var supportsExecutive = this.props.supportsExecutive;
      var name = this.find("input[name=name]").val();
      var nameIsValid = !!name;

      if (supportsExecutive) {
        var email = this.find("input[name=email]").val();
        var emailIsValid =
          email.match(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i) !== null;
      }

      if ((nameIsValid && !supportsExecutive)
           || (nameIsValid && emailIsValid)) {
        var defaultCal = this.find("[name=default-cal]").val();
        var calendars = this.find("[name=calendars]:checked").map(
          function() {
            return this.value;
          }).get();
        if (!_.contains(calendars, defaultCal)) {
          calendars.push(defaultCal);
        }

        var teamProps;
        if (supportsExecutive) {
          teamProps = {
            name: name,
            email: email,
            defaultCal: defaultCal,
            calendars: calendars
          }
        } else {
          teamProps = {
            name: name,
            defaultCal: defaultCal,
            calendars: calendars
          }
        }

        return _.extend({}, this.props.team, teamProps) as TeamRequest;
      } else {
        this.setState({
          nameHasError: !nameIsValid,
          emailHasError: !supportsExecutive || !emailIsValid
        });
      }
    }
  }


  ///////////

  // Slide 4 => videos + final stuff
  class FinishSlide extends Slide<{}> {
    render() {
      var videoList: [string, string][] = [
        ["Create a Task", "https://youtu.be/vQ-XcwQQDNg?list=PLSnIFyt-XjI7b9tyHHTmWI4M9Qqy2D-FA"],
        ["Create Events", "https://youtu.be/_mum9uSodUo?list=PLSnIFyt-XjI7b9tyHHTmWI4M9Qqy2D-FA"],
        ["Link Events", "https://youtu.be/oqhnF6wHY7Q?list=PLSnIFyt-XjI7b9tyHHTmWI4M9Qqy2D-FA"],
        ["Draft Emails", "https://youtu.be/rA-deetbleQ?list=PLSnIFyt-XjI7b9tyHHTmWI4M9Qqy2D-FA"],
        ["Linking Emails together with Task Notes", "https://youtu.be/e-EPFLAcOQo?list=PLSnIFyt-XjI7b9tyHHTmWI4M9Qqy2D-FA"],
        ["Insert Emails into the Calendar Event Description", "https://youtu.be/AnUhbTkbquU?list=PLSnIFyt-XjI7b9tyHHTmWI4M9Qqy2D-FA"],
        ["Send Event Invitation", "https://youtu.be/zuBE2d1YobA?list=PLSnIFyt-XjI7b9tyHHTmWI4M9Qqy2D-FA"],
        ["Schedule Event Reminders", "https://youtu.be/1KORUttWy1k?list=PLSnIFyt-XjI7b9tyHHTmWI4M9Qqy2D-FA"],
        ["Esper Agenda", "https://youtu.be/Nk2b1-msHUk?list=PLSnIFyt-XjI7b9tyHHTmWI4M9Qqy2D-FA"],
        ["Use Esper Workflows", "https://youtu.be/reWgAs2hE9o?list=PLSnIFyt-XjI7b9tyHHTmWI4M9Qqy2D-FA"],
        ["Esper TimeStats", "https://youtu.be/qSP5DcLtMqs?list=PLSnIFyt-XjI7b9tyHHTmWI4M9Qqy2D-FA"],
        ["Supporting Multiple Executives", "https://youtu.be/f1gx4OdYbEs?list=PLSnIFyt-XjI7b9tyHHTmWI4M9Qqy2D-FA"]
      ];

      var self = this;
      var videoLinks = _.map(videoList, function(tuple) {
        var name = tuple[0];
        var href = tuple[1];

        // NB: Use onMouseDown instead of onClick because user may want to
        // right-click and open in new tab
        return (<li key={"video-" + name}>
          <a href={href} target="_blank"
             onMouseDown={self.trackOutbound.bind(self)}>
            <i className="fa fa-fw fa-la fa-youtube-play"></i>
            {name}
          </a>
        </li>);
      });

      return (<div>
        <p>
          To get the most out of Esper view the instructional videos below so
          you can master all of these time-saving features.
        </p>

        <p>
          Let us know if you’re interested in a personalized training session
          {" "}<a href="http://esper.com/request-demo" target="_blank">here</a>.
        </p>

        <h4>LIST OF VIDEOS</h4>

        <ol>
          {videoLinks}
        </ol>
      </div>);
    }

    trackOutbound(e) {
      track(Analytics.Trackable.ClickOnboardingYouTube, null, {
        url: e.currentTarget.href
      });
    }
  }

  var finishSlideLogic: SlideLogic = {
    view: FinishSlide,
    title: "How to Use Esper",
    next: function() {
      track(Analytics.Trackable.ClickOnboardingFinish);
      return Promise.defer(null);
    }
  };


  // Index of all slides
  var slides: SlideLogic[] = [
    welcomeSlideLogic,
    permissionSlideLogic,
    identifySlideLogic,
    calendarSlideLogic,
    finishSlideLogic
  ];
}