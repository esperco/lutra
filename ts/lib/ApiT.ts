/// <reference path="./Variant.ts" />

module Esper.ApiT {
  /*
    The following type definitions were translated manually
    from wolverine/types/api.atd.
    We might want to generate them with atdgen in the future.
  */

  type uid = string;
  type email = string;

  export type ErrorDetails = Variant.Variant;
    /*
      See wolverine/types/error_details.atd for the different possible cases.
    */

  /*
    One of the possible values for ErrorDetails,
    tagged "Login_required"
  */
  interface LoginRequired {
    uid: uid;
    email: email;
  }

  interface ListResponse<T> {
    items: T[]
  }

  export interface BatchHttpRequests<T> {
    sequential?: boolean;
    requests: HttpRequest<T>[];
  }

  export interface HttpRequest<T> {
    request_method: HttpMethod;
    request_uri: string; // including query if any
    request_body?: T;
  }

  export type HttpMethod = 'DELETE'
    | 'GET'
    | 'HEAD'
    | 'OPTIONS'
    | 'PATCH'
    | 'POST'
    | 'PUT';

  export interface BatchHttpResponses<T> {
    responses: HttpResponse<T>[];
  }

  export interface HttpResponse<T> {
    response_status: number; // HTTP status code
    response_body: T;
  }

  export interface ClientError {
    http_status_code: number; // 4xx
    error_message: string;
    error_details: ErrorDetails;
  }

  export interface ClockResponse {
    timestamp: string;
  }

  export interface TeamCreationRequest {
    chrome_extension?: boolean;
    groups_only?: boolean;
    executive_email?: string;
    executive_name: string;
    executive_timezone: string;
    executive_first_name?: string;
    executive_last_name?: string;
    executive_address?: string;
    executive_phone?: string;
    executive_gender?: string;
    team_email_aliases?: string[];
  }

  export interface TeamApi {
    team_exec_email: string;
    team_labels: LabelInfo[];
    team_subscription?: TeamSubscription;
  }

  export interface Team {
    teamid: string;
    team_api: TeamApi;
    team_name: string;
    team_approved: boolean;
    groups_only: boolean;
    team_active_until?: string; // timestamp
    team_executive: string;
    team_assistants: string[];
    team_owner: string;
    team_cal_user: string;
    team_timestats_calendars?: string[];
    team_email_aliases: string[];
  }

  export type TeamList = ListResponse<Team>;

  export interface TeamOption {
    team?: Team;
  }

  export type GroupList = ListResponse<Group>;

  export type GroupRole = "Member"|"Manager"|"Owner";

  export interface Group extends GroupUpdate {
    groupid: string;
    group_labels?: LabelInfo[];
    group_member_role?: GroupRole;
    group_teams?: GroupMember[];
    group_individuals?: GroupIndividual[];
  }

  export interface GroupUpdate {
    group_name: string;
    group_timezone: string;
  }

  export interface GroupMember {
    teamid: string;
    email?: string;
    name?: string;
  }

  export interface GroupIndividual {
    uid?: string;
    role: GroupRole;
    email?: string;
    invite_sent?: string;
  }

  export interface GroupInviteResponse {
    gim: GroupIndividual;
    opt_gm?: GroupMember;
  }

  export interface Customer {
    id: string;
    name?: string;
    teamid?: string;
    primary_contact: CustomerContact;
    secondary_contacts: CustomerContact[];
    subscription: SubscriptionSummary;
    seats: CustomerSeat[];
    seat_requests: CustomerSeat[];
    filter: CustomerTeamFilter;
  }

  export type CustomerList = ListResponse<Customer>;

  export interface CustomerContact {
    uid: string;
    email: string;
  }

  export interface CustomerSeat {
    teamid: string;
    email: string;
  }

  export interface CustomerRequestSeatResponse {
    seat_request_status: "Accepted"|"Pending"|"Rejected";
  }

  export interface CustomerTeamFilter {
    cusid: string;
    blacklist: EmailFilter;
    whitelist: EmailFilter;
  }

  export interface CustomerTeamFilterReq {
    blacklist: EmailFilter;
    whitelist: EmailFilter;
  }

  export interface EmailFilter {
    addresses: string[];
    domains: string[];
  }

  export interface GenericCalendar {
    id: string;
    title: string;
    access_role?: string;
      // one of: None, FreeBusyReader, Owner, Reader, Writer
  }

  export interface GenericCalendars {
    calendars: GenericCalendar[];
  }

  export interface EventLookupResult {
    teamid: string;
    event: GenericCalendarEvent;
  }

  export interface EventLookupResponse {
    result?: EventLookupResult;
  }

  export interface GuestEventFeedback  {
    uid: uid;
    stars?: number; // 1 - 5
    is_organizer?: boolean;
    didnt_attend?: boolean;
    notes?: string;
    agenda?: boolean;
    on_time?: boolean;
    good_time_mgmt?: boolean;
    contributed?: boolean;
    presence_useful?: boolean;
    action_items?: boolean;
  }

  export interface PredictedLabel {
    label: LabelInfo;
    score: number; // Float between 0 and 1
  }

  export interface HashtagApi {
    original: string;
    normalized: string;
  }

  export interface HashtagState {
    hashtag: HashtagApi;
    label?: LabelInfo;
    approved?: boolean;
  }

  export interface MatchingEvent {
    id: string;
    calendar_id: string;
  }

  export interface GenericCalendarEvent {
    id: string;
    calendar_id: string;
    duplicates: MatchingEvent[];
    start: string; // timestamp;
    end: string;   // timestamp;
    timezone?: string;
    title?: string;
    description?: string;
    description_messageids: string[];
    labels?: LabelInfo[];
    hidden?: boolean;
    labels_confirmed?: boolean;
    labels_predicted?: boolean;
    // predicted_attended?: number;      // Exists, but deprecate
    // hashtags: HashtagState[];         // Exists, but deprecate
    feedback?: GuestEventFeedback;
    location?: string;
    all_day: boolean;
    guests: Attendee[];
    has_recurring_labels: boolean;
    transparent: boolean;
    recurrence?: Recurrence;
    recurring_event_id?: string;
  }

  export interface GenericCalendarEvents {
    events: GenericCalendarEvent[];
  }

  export interface Profile {
    profile_uid: string;
    email: string;
    other_emails: string[];
    google_access: boolean;
    display_name: string;
    gender?: string; // "Female" or "Male"
    image_url?: string;
    has_ios_app: boolean;
  }

  export interface ProfileList {
    profile_list: Profile[];
  }

  export interface Guest {
    display_name?: string;
    image_url?: string;
    email: string;
  }

  export interface Attendee {
    display_name?: string;
    email: string;
    response: "Needs_action"|"Declined"|"Tentative"|"Accepted";
  }

  export interface FeatureFlags {
    uid: string;
    team_charts: boolean;   // EA/Exec Charts (/time)
    group_charts: boolean;  // Group Charts (/groups)
    tb: boolean; // Agenda
    fb: boolean; // Feedback
  }

  export interface FeatureFlagsPatch {
    team_charts?: boolean;   // EA/Exec Charts (/time)
    group_charts?: boolean;  // Group Charts (/groups)
    tb?: boolean; // Agenda
    fb?: boolean; // Feedback
  }

  export interface LoginResponse {
    uid: string;
    uid_hash: string;
    api_secret: string;
    account_created: string; // timestamp
    is_admin: boolean;
    is_alias: boolean;
    platform?: string; // Google | Nylas
    is_sandbox_user: boolean;
    email: string;
    teams: Team[];
    groups: string[];
    team_members: TeamMember[];
    landing_url?: string;
    feature_flags: FeatureFlags;
  }

  export interface TokenInfo {
    is_valid: boolean;
    needs_auth: boolean;
    description: Variant.Variant; // token_description
  }

  export interface TokenResponse {
    token_value: Variant.Variant; // token_value
  }

  export interface InviteCreateTeam {
    from_uid: string;
    from_name?: string;
    from_email?: string;
    personal_message?: string;
    expires?: string;
  }

  export interface InviteJoinTeam extends InviteCreateTeam {
    teamid: string;
    role: string;
    force_email?: string;
  }

  export interface UnsubEmail {
    uid: string;
    teamids: string[];
  }

  export interface GoogleAuthInfo {
    has_token: boolean;
    google_auth_scope: string;
    need_google_auth: boolean;
    google_auth_url: string;
  }

  export interface TeamMember {
    member_email: string;
    member_uid: string;
    member_other_emails: string[];
  }

  export interface Preferences {
    uid?: string;
    teamid?: string;
    email_types: EmailTypes;
    label_reminder?: SimpleEmailPref;
    slack_address?: SlackAddress;
    event_link?: boolean;
    general: GeneralPrefs;
    notes: string;
  }

  export interface GroupPreferencesList {
    prefs_list: GroupPreferences[];
  }

  export interface GroupPreferences {
    groupid: string;
    uid: string;
    daily_breakdown: boolean;
    weekly_breakdown: boolean;
    bad_meeting_warning: boolean;
    bad_duration: number;
    bad_attendees: number;
  }

  export interface SlackAddress {
    slack_teamid: string;
    slack_username: string;
  }

  export interface SlackAuthInfo {
    slack_auth_url: string;
    slack_authorized: boolean;
  }

  export interface PreferencesList {
    preferences_list: Preferences[];
  }

  export interface TeamPreferences {
    team : Team;
    prefs: Preferences;
  }

  export interface TeamPreferencesList {
    team_prefs: TeamPreferences[];
  }

  export interface HourMinute {
    hour : number; /* 0 to 23 */
    minute: number;
  }

  export interface EmailTypes {
    daily_agenda: EmailPref;
    tasks_update: EmailPref;
    feedback_summary?: EmailPref;
  }

  export interface EmailPref {
    recipients: string[];
    send_time: HourMinute;
    day_of?: boolean;
    html_format?: boolean;
    include_task_notes?: boolean;
  }

  export interface SimpleEmailPref {
    recipients_?: string[];
  }

  // This is used for API setting only
  export interface GeneralPrefsOpts {
    current_timezone?: string;
  }

  export interface GeneralPrefs extends GeneralPrefsOpts {
    current_timezone: string;
  }

  export interface CalendarRequest {
    window_start: string; // timestamp
    window_end: string; // timestamp
  }

  export interface CalendarAndTeam {
    calid: string;
    teamid: string;
  }

  export interface UrlResult {
    url: string;
  }

  export interface LabelInfo {
    original: string;
    normalized: string;
    color?: string;
  }

  export interface LabelInfos {
    label_infos: LabelInfo[];
  }

  export interface SetLabelColorRequest {
    label: string;
    color: string;
  }

  type EventSelection = ["Eventids", string[]] | ["Label", string];

  export interface LabelChangeRequest {
    selection: EventSelection;
    remove_all_labels?: boolean;
    remove_labels?: string[];
    add_labels?: string[];
  }

  export interface LabelsSetPredictRequest {
    set_labels: {
      id: string;
      labels?: string[];
      hidden?: boolean;
    }[];
    predict_labels: string[]; // Event IDs
  }

  export interface Random {
    random: string;
  }

  export interface AccountEmail {
    email: string;
    email_primary: boolean;
  }

  export interface EmailAddresses {
    emails: string[];
  }

  export interface EventDescription {
    description_text: string;
  }

  export type PlanId =
    "Basic_20161019"|"Executive_20161019"|"Enterprise_20160923"|
    "Employee_20150304";

  export type SubscriptionStatus =
    "Trialing"|"Active"|"Past_due"|"Canceled"|"Unpaid";

  export interface SubscriptionSummary {
    cusid: string;
    active: boolean;
    valid_payment_source: boolean;
    plan?: PlanId;
    status?: SubscriptionStatus;
  }

  export interface SubscriptionDetails {
    cusid: string;
    active: boolean;
    plan?: PlanId;
    status?: SubscriptionStatus;
    quantity?: number;

    /* timestamps */
    trial_end?: string;
    trial_start?: string;
    current_period_end?: string;
    current_period_start?: string;
    canceled_at?: string;
    ended_at?: string;

    cards: PaymentCard[];
  }

  export interface TeamSubscription extends SubscriptionSummary {
    teamid: string;
  }

  export type CardBrand =
    "Visa"|"American_express"|"Mastercard"|"Discover"|"Jcb"|"Diners_club";

  export interface PaymentCard {
    id: string;
    brand?: CardBrand;
    exp_month: number;
    exp_year: number;
    last4: string;

    name?: string;
    address_line1?: string;
    address_line2?: string;
    address_city?: string;
    address_zip?: string;
    address_state?: string;
    address_country?: string;
  }

  export interface Approval {
    approved_by: string; // uid
    approved_on: string; // timestamp
  }

  export interface CalendarEventColor {
    key: string;
    color: string;
  }

  export interface CalendarEventPalette {
    palette: CalendarEventColor[];
  }

  /** The status of a guest at some specific event. */
  export interface GuestStatus {
    guest        : Guest;
    availability : string; // "yes", "no" or "maybe"
  }

  export interface PossibleTime {
    guests   : GuestStatus[];
    event_id : string;
  }

  export interface GroupEvent {
    guests : Guest[];
    times  : PossibleTime[];
  }

  export interface GuestPreferences {
    taskid: string;
    email: string;
    timezone?: string;
  }

  export interface Recurrence {
    rrule : Recur[];
    exdate : string[];
    rdate : string[];
  }

  export type Freq = string; // We only use Daily, Weekly, Monthly, and Yearly
  export type Weekday = string; // Sunday, Monday, ..., Saturday

  export interface OrdWkDay {
    ord ?: number;
    day : Weekday;
  }

  export type DTConstr = string; // Date or Date_time
  export type DateTime = [DTConstr, string];

  export interface Recur {
    freq : Freq;
    until ?: DateTime; // local time
    count ?: number;
    interval ?: number;
    bysecond : number[];
    byminute : number[];
    byhour : number[];
    byday : OrdWkDay[];
    bymonthday : number[];
    byyearday : number[];
    byweekno : number[];
    bymonth : number[];
    bysetpos : number[];
    wkst ?: Weekday;
  }
}

module Esper.ApiT.GoogleDriveApi {
  export interface File {
    id: string;
    title: string;          // "" if none
    description: string;    // "" if none
    version: number;
  }
}
