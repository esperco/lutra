module Esper.ApiT {
  /*
    The following type definitions were translated manually
    from wolverine/types/api.atd.
    We might want to generate them with atdgen in the future.
  */

  type uid = string;
  type email = string;

  type ErrorDetails = Variant.Variant;
    /*
      See wolverine/types/error_details.atd for the different possible cases.
    */

  /*
    One of the possible values for ErrorDetails,
    tagged "unauthorized_team_member"
  */
  interface UnauthorizedTeamMember {
    unauthorized_uid: uid;
    unauthorized_email: email;
  }

  export interface ClientError {
    http_status_code: number; // 4xx
    error_message: string;
    error_details: ErrorDetails;
  }

  export interface Contact {
    id: string;
    email: string;
    name: string;
    picture: string;
  }

  export interface ContactInfo {
    contact_list: Contact[];
    next_link: string;
    prev_link: string;
  }

  export interface Invite {
    email_list: string[];
  }

  export interface ChromeSupport {
    requested_version: string;
    must_upgrade: boolean;
    minimum_version: string;
    download_page: string;
  }

  export interface TeamCreationRequest {
    executive_email?: string;
    executive_name: string;
    executive_first_name?: string;
    executive_last_name?: string;
    executive_timezone?: string;
    executive_address?: string;
    executive_phone?: string;
    executive_gender?: string;
    team_calendars?: Calendar[];
    team_email_aliases?: string[];
  }

  export interface TeamCalendar {
    access_uid: string;
    google_calendar_id: string;
  }

  export interface Team {
    teamid: string;
    team_name: string;
    team_approved: boolean;
    team_executive: string;
    team_assistants: string[];
    team_primary_assistant?: string;
    team_labels: string[];
    team_label_urgent: string;
    team_label_new: string;
    team_label_in_progress: string;
    team_label_pending: string;
    team_label_done: string;
    team_label_canceled: string;
    team_calendars: Calendar[];
    team_email_aliases: string[];
    team_calendar_accounts: string[];
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

  export interface GenericCalendarEvent {
    id: string;
    calendar_id: string;
    start: string; // timestamp;
    end: string;   // timestamp;
    timezone?: string;
    title?: string;
    description?: string;
    description_messageids: string[];
    labels: string[];
    location?: string;
    all_day: boolean;
    guests: Attendee[];
    transparent: boolean;
    recurrence?: Recurrence;
    recurring_event_id?: string;
  }

  export interface GenericCalendarEvents {
    events: GenericCalendarEvent[];
  }

  export interface Calendar {
    google_cal_id: string;
    authorized_as?: any;
    calendar_title: string;
    calendar_timezone?: string;
    google_access_role?: string;
    is_primary?: boolean;
    calendar_default_view?: boolean;
    calendar_default_write?: boolean;
    calendar_default_dupe?: boolean;
    calendar_default_agenda?: boolean;
  }

  export interface Calendars {
    calendars: Calendar[];
  }

  export interface Phone {
    title: string;
    number: string;
  }

  export interface EmailEntry {
    title: string;
    email: string;
  }

  export interface FirstLastName {
    first: string;
    last: string;
  }

  export enum Role {
    Assistant,
    Executive
  }

  export interface LabelledItem {
    label: string;
    item: string;
  }

  export interface DirProfile {
    [index: string]: any;
    uid: string;
    image_url: string;
    display_name: string;
    other_names: LabelledItem[];
    company: string;
    company_title: string;
    company_location : string;
    other_emails: LabelledItem[];
    phones: LabelledItem[];
    addresses: LabelledItem[];
    custom_entries: LabelledItem[];
  }

  export interface DirLogin {
    email: string;
    password: string;
  }

  export interface DirProfileSearchResults {
    search_results: WeightedDirProfile[];
    search_count: number;
  }

  export interface WeightedDirProfile {
    profile_data: DirProfile;
    profile_score: number;
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
    response: string; // NeedsAction | Declined | Tentative | Accepted
  }

  export interface LoginResponse {
    uid: string;
    api_secret: string;
    account_created: string; // timestamp
    is_admin: boolean;
    is_alias: boolean;
    platform?: string; // Google | Nylas
    email: string;
    teams: Team[];
    team_members: TeamMember[];
    waiting_for_sync: boolean;
    has_ios_app: boolean;
  }

  export interface TokenInfo {
    token_is_valid: boolean;
    token_value: any /* token_response */;
  }

/*
type token_response = [
  | Invite_create_team of invite_create_team
      (* Invitation to create a team, without specifying which
         email address must be used for the account.
      *)

  | Invite_join_team of invite_join_team
      (* Invitation to join an existing team. *)

  | Login of login_response
      (* One-time login; usable for password reset. *)
]
*/

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

  export interface GoogleAuthInfo {
    has_token: boolean;
    is_assistant: boolean;
    is_executive: boolean;
    need_google_auth: boolean;
    google_auth_url: string;
  }

  export interface TeamMember {
    member_email: string;
    member_uid: string;
    member_other_emails: string[];
  }

  export interface CalendarTime {
    local: string; // RFC 3339 timestamp; local time = time read in UTC
    utc: string; // RFC 3339 timestamp
  }

  export interface Latlon {
    lat: number;
    lon: number;
  }

  export interface Location {
    title: string;
    address: string;
    public_notes?: string;
    private_notes?: string;
    coord?: Latlon; // optional
    timezone?: string; // required if coordinates are missing
  }

  export interface CalendarEvent {
    google_event_id: string;
    google_cal_id: string;
    start: CalendarTime;
    end: CalendarTime;

    /* optional fields */
    google_cal_url?: string;
    title?: string;
    description?: string;
    description_messageids: string[];
    labels: string[];
    location?: Location;
    all_day?: boolean;
    guests: Attendee[];
    transparent?: boolean;
    recurrence?: Recurrence;
    recurring_event_id?: string;
  }

  export interface CalendarEventOpt {
    event_opt?: CalendarEvent;
  }

  export interface CalendarEventEdit {
    google_event_id?: string;
    google_cal_id?: string;
    start: CalendarTime;
    end: CalendarTime;
    title?: string;
    description?: string;
    description_messageids?: string[];
    labels?: string[];
    location?: Location;
    all_day?: boolean;
    guests: Guest[];
    send_notifications?: boolean;
    color_id?: string;
    recurrence?: Recurrence;
    recurring_event_id?: string;
  }

  export interface AgendaEvent {
    event: CalendarEvent;
    notes?: string;
  }

  export interface AgendaEventList {
    agenda_events: AgendaEvent[];
  }

  export interface SyncedThread {
    esper_uid: string;
    gmail_thrid: string;
  }

  export interface EmailThread {
    gmail_thrid: string;
    subject: string;
    snippet: string;
  }
  export interface EmailThreadSearch {
      gmail_owner: string;
      gmail_thrid: string;
      first_subject: string;
      last_snippet: string;
      first_from: string;
      last_date: string;
  }

  export interface EmailThreadSearchList {
      items: EmailThreadSearch[];
  }

  export interface EmailMessage {
    message_id: string;
    message_owner: string;
    message_gmsgid: string;
    message_date: string;
    message_sender: string;
    message_snippet?: string;
    raw?: string;
  }

  export interface LinkedCalendarEvents {
    linked_events: TaskEvent[];
  }

  export interface LinkedEmailThreads {
    linked_threads: string[]; /* hexadecimal gthrids */
  }

  export interface CalendarEventList {
    events: CalendarEvent[];
  }

  export interface googleEvent {
    google_event_id: string;
  }

  export interface LinkCalendarEvents {
    google_events: googleEvent[];
  }

  export interface CreatedCalendarEvent {
    google_cal_id: string;
    google_event_id: string;
    creation_time: string; /* timestamp */
  }

  export interface CreatedCalendarEvents {
    created_events: CreatedCalendarEvent[];
  }

  export interface TeamCalendars {
    google_cal_ids: string[];
  }

  export interface Preferences {
    uid?: string;
    teamid?: string;
    workplaces?: Workplace[];
    transportation?: string[];
    meeting_types: MeetingTypes;
    email_types: EmailTypes;
    general: GeneralPrefs;
    coworkers: string;
    notes: string;
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

  export interface UserWorkplaces {
    workplace_list: Workplace[];
  }

  export interface UserTransportation {
    transportation_list: string[];
  }

  export interface Workplace {
    location: Location;
    duration: HourMinute;
    buffer: HourMinute;
    distance: number;
    availability: Availability[];
  }

  export interface MeetingTypes {
    phone_call?: PhoneInfo;
    video_call?: VideoInfo;
    breakfast?: MealInfo;
    brunch?: MealInfo;
    lunch?: MealInfo;
    coffee?: MealInfo;
    dinner?: MealInfo;
    drinks?: MealInfo;
  }

  export interface PhoneInfo {
    duration: HourMinute;
    buffer: HourMinute;
    available: boolean;
    availability: Availability[];
    phones: PhoneNumber[];
  }

  export interface PhoneNumber {
    phone_type: string;
    phone_number: string;
    share_with_guests?: boolean;
  }

  export interface VideoInfo {
    duration: HourMinute;
    buffer: HourMinute;
    available: boolean;
    availability: Availability[];
    accounts: VideoAccount[];
  }

  export interface VideoAccount {
    video_type: string;
    video_username: string;
  }

  export interface TimeOnDay {
    day: string; /* Sun, Mon, Tue... */
    time: HourMinute;
  }

  export interface HourMinute {
    hour : number; /* 0 to 23 */
    minute: number;
  }

  export interface Availability {
    avail_from: TimeOnDay;
    avail_to: TimeOnDay;
  }

  export interface MealInfo {
    duration: HourMinute;
    buffer: HourMinute;
    available: boolean;
    availability: Availability[];
    favorites: Location[];
  }

  export interface EmailTypes {
    daily_agenda: EmailPref;
    tasks_update: EmailPref;
  }

  export interface EmailPref {
    enabled: boolean;
    recipients: string[];
    send_time: HourMinute;
    day_of?: boolean;
    html_format?: boolean;
    include_task_notes?: boolean;
  }

  export interface GeneralPrefs {
    send_exec_confirmation: boolean;
    send_exec_reminder: boolean;
    send_followup_reminders: boolean;
    double_booking_warning: boolean;
    no_location_warning: boolean;
    link_email_warning: boolean;
    use_duplicate_events: boolean;
    delete_holds_inquiry: boolean;
    bcc_exec_on_reply: boolean;
    exec_daily_agenda: boolean;
    current_timezone: string;
    hold_event_color?: CalendarEventColor;
  }

  export interface CalendarEventColor {
    key: string;
    color: string;
  }

  export interface PreferenceChange {
    uid?: string;
    teamid: string;
    execid: string;
    changeid: string;
    timestamp: string;
    change_type : string[];
  }

  export interface PreferenceChanges {
    change_log: PreferenceChange[];
  }

  export interface GuestReminder {
    guest_email: string;
    guest_name?: string;
    reminder_message?: string;
  }

  export interface EventReminders {
    event_start_time: string;
    reminder_time: string;
    guest_reminders: GuestReminder[];
    remind_from_team?: string; // teamid
    remind_from_email?: string;
  }

  export interface DefaultReminder {
    default_message: string;
  }

  export interface CalendarRequest {
    window_start: string; // timestamp
    window_end: string; // timestamp
  }

  export interface CalendarStatsRequest {
    window_starts: string[]; // timestamp sorted ascendingly
    window_end: string; // timestamp
  }

  export interface CalendarStatsResult {
    stats: CalendarStats[];
  }
  export interface CalendarStats {
    by_label:   CalendarStatsByLabel;
    unlabelled: CalendarStatEntry;
    total:      CalendarStatEntry;
  }
  export interface CalendarStatsByLabel {
    [index: string]: CalendarStatEntry;
  }
  export interface CalendarStatEntry {
    event_count: number;
    event_duration: number; //in seconds
  }

  export interface Task {
    taskid: string;
    task_teamid: string;
    task_title: string;
    task_notes: string;
    task_notes_quill: string;
    task_archived: boolean;
    task_labels: string[];
    task_progress: string; // New | In_progress | Pending | Done | Canceled
    task_urgent: boolean;
    task_unread_emails?: number;
    task_threads: EmailThread[];
    task_messages: EmailMessage[];
    task_events: TaskEvent[];
    task_workflow_progress: TaskWorkflowProgress;
    task_meeting_type?: string;
  }

  export interface NewTask {
    task_title: string;

    // optional
    task_notes?: string;
    task_notes_quill?: string;
    task_archived?: boolean;
    task_labels?: string[];
    task_progress?: string;
    task_urgent?: boolean;
    task_workflow_progress?: TaskWorkflowProgress;
    task_meeting_type?: string;
  }

  export interface TaskThread {
    task_threadid: string; // hex
  }

  export interface TaskEvent {
    task_event: CalendarEvent;
  }

  export interface TaskList {
    tasks: Task[];
    next_page?: string; // url
  }

  export interface TaskSearchResults {
    search_results: WeightedTask[];
    search_count: number;
  }

  export interface WeightedTask {
    task_data: Task;
    task_weight: number;
  }

  export interface UrlResult {
    url: string;
  }

  export interface EmailLabels {
    labels: string[];
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

  export interface CalendarAcl {
    shared_emails: CalendarAclEntry[];
  }

  export interface CalendarAclEntry {
    acl_id: string;
    acl_email: string;
  }

  export interface EventDescription {
    description_text: string;
  }

  export interface CustomerStatus {
    teamid: string;
    active: boolean;
    plan?: string;
    status?: string; // subscription_status
  }

  export interface CustomerDetails extends CustomerStatus {
    /* timestamps */
    trial_end?: string;
    trial_start?: string;
    current_period_end?: string;
    current_period_start?: string;
    canceled_at?: string;
    ended_at?: string;
    cards: PaymentCard[];
  }

  export interface PaymentCard {
    id: string;
    brand?: string;  // card_brand option
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

  export interface TaskUsageList {
    items: TaskUsage[];
  }

  export interface TaskUsage {
    teamid: string;
    start: string; // RFC-3339 timestamp
    end: string; // RFC-3339 timestamp

    revision: number;
    approval?: Approval;
    frozen: boolean;
    stripe_charge?: string;
    charge_amount?: number;
    start_planid: string;
    end_planid: string;
    unlimited_usage: boolean;
    tasks: SingleTaskUsage[];
  }

  export interface Approval {
    approved_by: string; // uid
    approved_on: string; // timestamp
  }

  export interface SingleTaskUsage {
    taskid: string;
    title?: string;
    creation_date: string; // timestamp
    created_during_period: boolean;

    auto_scheduling_tasks_created: number;
    scheduling_tasks_created: number;

    auto_scheduling_time: number; // seconds
    scheduling_time: number; // seconds

    auto_generic_tasks_created: number;
    generic_tasks_created: number;

    auto_generic_time: number; // seconds
    generic_time: number; // seconds
  }

  export interface ExtraCharge {
    unlimited_usage: boolean;
    amount_due: number; // cents
    description: string;
    statement_descriptor: string;
  }

  export interface EmailSignature {
    signature: string;
  }

  export interface CalendarEventPalette {
    palette: CalendarEventColor[];
  }

  export interface Signup {
    first_name: string;
    last_name: string;
    phone: string;
    platform: string;
  }

  export interface TimeTrack {
    taskid: string;
    teamid: string;
    start: number;
    duration: number;
    user: string;
    ip_addr: string;
  }

  export interface TimeTrackPeriod {
    start: number;
    end: number;
    items: TimeTrack[];
  }

  // Smarter Scheduling

  export class Status {
    static yes   = "yes";
    static no    = "no";
    static maybe = "maybe";

    static next(current: string) {
      var availabilities: string[] = ["yes", "no", "maybe"];
      var nextIndex = availabilities.indexOf(current) + 1;

      return availabilities[nextIndex % availabilities.length];
    }
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

  export interface TaskPreferences {
    taskid: string;
    executive_timezone?: string;
    guest_timezone?: string;
    guest_preferences: GuestPreferences[];
  }

  export interface TaskMessageNotification {
    taskid: string;
    emails: string[];
    snippet: string;
  }

  export interface ThreadParticipants {
    messages: MessageParticipants[];
  }

  export interface MessageParticipants {
    from: Guest[];
    to: Guest[];
    cc: Guest[];
    bcc: Guest[];
  }

  export interface Workflow {
    id : string;
    title : string;
    notes : string;
    steps : WorkflowStep[];
  }

  export interface UserWorkflows {
    workflows : Workflow[];
  }

  export interface Template {
    id: string;
    title: string;
    content: string;
  }

  export interface UserTemplate {
    items: Template[];
  }

  type MeetingType = [string, PhoneInfo|VideoInfo|MealInfo];

  export interface WorkflowStep {
    id : string;
    title : string;
    notes : string;
    meeting_prefs? : MeetingType;
    checklist : CheckItem[];
  }

  export interface CheckItem {
    text : string;
    checked : boolean;
  }

  export interface TaskWorkflowProgress {
    workflow_id : string;
    step_id? : string;
    checklist : CheckItem[];
  }

  export interface Recurrence {
    rrule : Recur[];
    exdate : string[];
    rdate : string[];
  }

  export interface Error {
    [index: string]: any;
    responseText: string;
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
