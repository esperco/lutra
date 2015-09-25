/*
  Module for managing the onboarding flow within the extension
*/

/// <reference path="../common/Esper.ts" />
/// <reference path="../common/Api.ts" />
/// <reference path="../common/Types.ts" />
/// <reference path="../marten/ts/Model.ts" />
/// <reference path="../marten/ts/Model.StoreOne.ts" />
/// <reference path="../marten/ts/ReactHelpers.ts" />
/// <reference path="../marten/ts/Query.ts" />
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
  }


  //////////////

  // Query manager for getting calendars for the *current* user -- must be
  // initialized with reference to a store of calendars
  class CalendarQuery extends Query.Manager<{}, ApiT.Calendar[]> {
    store: Model.StoreOne<ApiT.Calendars>;

    constructor(store: Model.StoreOne<ApiT.Calendars>) {
      super([store]);
      this.store = store;
    }

    getAsync(): JQueryPromise<any> {
      var store = this.store;
      return Api.getCalendarList()
        .then(function(calendars) {
          store.set(calendars);
        });
    }

    getData(): ApiT.Calendar[] {
      var val = this.store.val();
      return val && (val.calendars || []);
    }

    // Only fetch async if no data -- unlikely calendars have changed in
    // between calls
    shouldGetAsync(data, key): boolean {
      return !data;
    }

    // Only one set of calendars to return, so always empty object as key
    get() {
      return super.get({});
    }
  }

  // Interface for team creation requests
  // TODO: Conform to backend type
  interface TeamRequest {
    teamid?: string;       // _id server responds with after team creation
    name?: string;          // team name
    email?: string;         // e-mail address for sec
    defaultCal?: string;   // google_cal_id of primary calendar
    calendars?: [string];  // google_cal_ids of all other calendars

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


  /////////////

  // State elements that slide logic cannot (directly) change
  interface ModalState {
    slideIndex: number;
  }

  export class OnboardingModal
      extends ReactHelpers.Component<Types.Account, ModalState> {
    private calendarStore: Model.StoreOne<ApiT.Calendars>;
    private calendarQuery: CalendarQuery;
    private teamStore: TeamStore;

    constructor(props) {
      super(props);

      /*
        Create singleton instances of stores and queries we can pass around
        via props. These ares are only used for onboarding, so attach them
        to this component instance so they get cleaned up when the onboarding
        flow is complete.
      */

      // Store and query for accessing calendars this user has access to
      this.calendarStore = new Model.StoreOne<ApiT.Calendars>();
      this.calendarQuery = new CalendarQuery(this.calendarStore);

      // Store of pending / completed requests to create new teams
      this.teamStore = new TeamStore();
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
        account: this.props,
        index: this.state.slideIndex,
        onFinish: function() {
          self.jQuery().modal('hide');
        },

        data: {
          calendarQuery: this.calendarQuery,
          teamStore: this.teamStore
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
      elm.modal();

      var self = this;
      elm.on('hidden.bs.modal', function() {
        self.jQuery().parent().remove();
        $('html').removeClass('esper-bs');
      });
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
    calendarQuery: CalendarQuery;
    teamStore: TeamStore;
  }

  interface SlideWrapperProps extends SlideLogic {
    index: number;
    onFinish: () => void;
    account: Types.Account;
    data: DataSources;
  }

  interface SlideWrapperState {
    busy: boolean;
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
        this.props.getState(this) : { busy: false });
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
        <ProgressBar
          index={ this.props.index }
          total= { slides.length }
        />
        <Footer
          firstSlide={ !this.props.index }
          lastSlide={ this.props.index + 1 >= slides.length }
          busy={this.state.busy}
          prev={this.handlePrev.bind(this)}
          next={this.handleNext.bind(this)}
        />
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
            // Show error message?
          })
          .always(this.unmakeBusy.bind(this));
      } else {
        onDone();
      }
    }

    protected makeBusy() {
      this.setState({ busy: true });
    }

    protected unmakeBusy() {
      this.setState({ busy: false });
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
          <button type="button" disabled={this.props.busy}
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
        <h5 className="esper-subheading">Thanks for installing Esper!</h5>
        <p>
          We'll need you to login with Google to get started. Esper requires
          access to your Google Calendar and Gmail to function properly.
          Click next to continue.
        </p><p className="text-center">
          <span className="esper-link" onClick={this.disable.bind(this)}>
            You can disabled Esper for this Gmail account by clicking here.
          </span>
        </p>
      </div>);
    }

    disable() {
      var account = this.props.account;
      account.declined = true;
      EsperStorage.saveAccount(account, this.props.close);
    }
  }

  var welcomeSlideLogic: SlideLogic = {
    view: WelcomeSlide,
    title: "Welcome to Esper"
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
          Click next to continue.
        </div>);
      } else {
        content = (<div>
          <div className="message">
            Waiting for {this.props.account.googleAccountId} to sign in
          </div>

          <button className="esper-google-btn"
                  onClick={this.openLoginTab.bind(this)}></button>
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
  }

  var permissionSlideLogic: SlideLogic = {
    view: PermissionSlide,
    title: "Connect to Google",
    getState: function() {
      return { busy: !Login.loggedIn() };
    }
  };


  //////////

  interface CalendarSlideState {
    calendars: ApiT.Calendar[];
    calendarsUpdating: boolean;
    teamRequests: [TeamRequest, Model.StoreMetadata][];
  }

  // Slide 2 => set calendar
  class CalendarSlide extends Slide<CalendarSlideState> {
    teamForms: {
      [index: string]: TeamForm
    };

    protected getState(init = false): CalendarSlideState {
      var calData = this.props.data.calendarQuery.get();
      var teamData = this.props.data.teamStore.getAll();
      return {
        calendars: calData[0],
        calendarsUpdating: calData[1].updateInProgress,
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
        var teamStore = this.props.data.teamStore;
        var registerTeamForms = this.registerTeamForms.bind(this);
        var teamForms = _.map(this.state.teamRequests, function(team) {
          var remove = () => { teamStore.remove(team[1]._id) };
          return <TeamForm key={team[1]._id}
            ref={(c) => {registerTeamForms(team[1]._id, c)}}
            team={team[0]}
            metadata={team[1]}
            calendars={calendars}
            remove={remove}
          />;
        });
        return (<div>
          <div className="well">
            Thanks! We need to know who you support in your organization, and
            which calendars correspond to which executives. If you don't see
            a calendar, you'll need to have the executive {' '}
            <a href="https://support.google.com/calendar/answer/37082?hl=en">
            share it with you on Google</a>.
          </div>
          { teamForms }
          <div>
            <button className="btn btn-secondary"
                    onClick={this.addExec.bind(this)}>
              <i className="fa fa-fw fa-plus"></i> Add Another Executive
            </button>
          </div>
        </div>);
      }
    }

    addExec() {
      this.props.data.teamStore.add();
    }

    componentDidMount() {
      this.setSources([
        this.props.data.calendarQuery,
        this.props.data.teamStore
      ]);
    }
  }

  var calendarSlideLogic: SlideLogic = {
    view: CalendarSlide,
    title: "Set Up Esper",

    getState: function(instance: SlideWrapper) {
      var calData = instance.props.data.calendarQuery.get();
      var calendars = calData[0] || [];
      var calMetadata = calData[1];

      return {
        busy: !calendars.length && calMetadata.updateInProgress
      };
    },

    getSources: function(instance: SlideWrapper) {
      return [instance.props.data.calendarQuery];
    },

    next: function(instance: SlideWrapper) {
      var slide = instance.currentSlide as CalendarSlide;
      var isValid = true;
      var teamStore = instance.props.data.teamStore;
      var newRequests: [string, TeamRequest][] = [];
      _.each(slide.teamForms, function(form: TeamForm, _id: string) {
        var request = form.validate();
        if (request) {
          newRequests.push([_id, request]);
        } else {
          isValid = false;
        }
      });

      _.each(newRequests, function(tuple) {
        teamStore.update(tuple[0], tuple[1], {
          dataStatus: (isValid ?
            Model.DataStatus.UNSAVED : Model.DataStatus.INFLIGHT)
        });
      });

      if (isValid) {
        // TODO: Backend call
        var t = $.Deferred();
        t.resolve();
        return t.promise();
      } else {
        var d = $.Deferred();
        d.reject();
        return d.promise();
      }
    }
  };

  interface TeamFormProps {
    key?: string;
    ref?: (c: TeamForm) => void;
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
    }

    getState(init=false) {
      return {
        nameHasError: false,
        emailHasError: false
      }
    }

    render() {
      var team = this.props.team;
      var calCheckboxes = _.map(this.props.calendars, function(cal) {
        var checked = _.includes(team.calendars, cal.google_cal_id);
        return (<div className="checkbox">
          <label>
            <input type="checkbox" value={cal.google_cal_id}
              name="calendars" defaultChecked={checked} />
            {cal.calendar_title}
          </label>
        </div>);
      });

      var calOptions = _.map(this.props.calendars, function(cal) {
        return (<option value={cal.google_cal_id}>
          {cal.calendar_title}
        </option>);
      });

      return (<div className="row clearfix form-set">
        <div className="col-sm-6"><div className="esper-col-spacer">
          <div className={"form-group " +
              (this.state.nameHasError ? "has-error" : "")}>
            <label htmlFor={this.getId("name")}
              className="control-label">Name</label>
            <input id={this.getId("name")} name="name"
              type="text" className="form-control"
              defaultValue={team.name}
              placeholder="Tony Stark" />
          </div>
          <div className={"form-group " +
              (this.state.emailHasError ? "has-error" : "")}>
            <label htmlFor={this.getId("email")}
              className="control-label">Email</label>
            <input id={this.getId("email") } type="email" name="email"
              defaultValue={team.email}
              className="form-control" placeholder="tony@stark.com" />
          </div>
          <div className="form-group">
            <label htmlFor={this.getId("default-cal")}
              className="control-label">Default Calendar</label>
            <select id={this.getId("default-cal")}
              value={team.defaultCal}
              name="default-cal"
              className="form-control">
              {calOptions}
            </select>
          </div>
          <div className="esper-remove-link form-group"
               onClick={this.props.remove}>
            <i className="fa fa-fw fa-close"></i>
            Remove
          </div>
        </div></div>
        <div className="col-sm-6 form-group">
          <div className="esper-col-spacer">
            <label className="group-heading">Other Calendars</label>
            <div>{calCheckboxes}</div>
            </div>
          </div>
        </div>);
    }

    // Validate inputs for this component, set error state if invalid, and
    // return the TeamRequest if valid. Called by SlideLogic.next for this
    // slide.
    validate(): TeamRequest {
      var name = this.find("input[name=name]").val();
      var nameIsValid = !!name;

      var email = this.find("input[name=email]").val();
      var emailIsValid = !!email; // TODO: Validate email

      if (nameIsValid && emailIsValid) {
        var defaultCal = this.find("[name=default-cal]").val();
        var calendars = this.find("[name=calendars]:checked").map(
          function() {
            return this.value;
          }).get();
        if (!_.contains(calendars, defaultCal)) {
          calendars.push(defaultCal);
        }

        return _.extend({}, this.props.team, {
          name: name,
          email: email,
          defaultCal: defaultCal,
          calendars: calendars
        }) as TeamRequest;
      } else {
        this.setState({
          nameHasError: !nameIsValid,
          emailHasError: !emailIsValid
        })
      }
    }
  }


  ///////////

  // Slide 3 => videos + final stuff
  class FinishSlide extends Slide<{}> {
    render() {
      return (<div>
        <div className="esper-subheading">This is the last slide.</div>
        <div className="text-center">
          <iframe width="560" height="315"
            src="https://www.youtube.com/embed/fqqXBM6yMD8"
            frameBorder="0" allowFullScreen={true}></iframe>
        </div>
      </div>);
    }
  }

  var finishSlideLogic: SlideLogic = {
    view: FinishSlide,
    title: "How to Use Esper"
  };


  // Index of all slides
  var slides: SlideLogic[] = [
    welcomeSlideLogic,
    permissionSlideLogic,
    calendarSlideLogic,
    finishSlideLogic
  ];
}