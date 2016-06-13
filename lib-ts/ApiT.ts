/// <reference path="./Variant.ts" />

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

  interface ListResponse<T> {
    items: T[]
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
    next_index: number;
    prev_index: number;
  }

  export interface Invite {
    email_list: string[];
  }

  export interface TeamCreationRequest {
    chrome_extension?: boolean;
    executive_email?: string;
    executive_name: string;
    executive_first_name?: string;
    executive_last_name?: string;
    executive_timezone?: string;
    executive_address?: string;
    executive_phone?: string;
    executive_gender?: string;
    team_email_aliases?: string[];
  }

  export interface Team {
    teamid: string;
    team_name: string;
    team_approved: boolean;
    team_active_until?: string; // timestamp
    team_executive: string;
    team_assistants: string[];
    team_owner: string;
    team_cal_user: string;
    team_labels: string[];
    team_labels_norm: string[];
    team_label_urgent: string;
    team_label_new: string;
    team_label_in_progress: string;
    team_label_pending: string;
    team_label_done: string;
    team_label_canceled: string;
    team_timestats_calendars?: string[];
    team_email_aliases: string[];
    team_calendar_accounts: string[];
  }

  export interface TeamOption {
    team?: Team;
  }

  export type GroupList = ListResponse<Group>;

  export type GroupLabels = ListResponse<string>;

  export interface Group {
    groupid: string;
    group_name: string;
    group_labels?: string[];
    group_labels_norm?: string[];
    group_member_role?: string;
    group_teams?: GroupMember[];
    group_individuals?: GroupIndividual[];
  }

  export interface GroupMember {
    teamid: string;
    email?: string;
    name?: string;
  }

  export interface GroupIndividual {
    uid?: string;
    role: string;
    email?: string;
    invite_sent?: string;
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

  export interface EventFeedback {
    calid?: string;
    notes?: string;
    attended?: boolean;
    rating?: number;
  }

  export type EventFeedbackAction = string;

  export interface PredictedLabel {
    label: string;
    label_norm: string;
    score: number; // Float between 0 and 1
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
    labels?: string[];
    labels_norm?: string[];
    predicted_labels?: PredictedLabel[]; // Sorted by score desc
    feedback: EventFeedback;
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

  export interface GenericCalendarEventsCollection {
    [calId: string]: GenericCalendarEvents;
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
    response: "NeedsAction"|"Declined"|"Tentative"|"Accepted";
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
    landing_url?: string;
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
    transportation?: string[];
    email_types: EmailTypes;
    label_reminder?: SimpleEmailPref;
    slack_address?: SlackAddress;
    timestats_notify?: TimestatsNotifyPrefs;
    general: GeneralPrefs;
    coworkers: string;
    notes: string;
  }

  export interface SlackAddress {
    slack_teamid: string;
    slack_username: string;
  }

  export interface TimestatsNotifyPrefs {
    email_for_meeting_feedback: boolean;
    slack_for_meeting_feedback: boolean;
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
    send_exec_confirmation?: boolean;
    send_exec_reminder?: boolean;
    send_followup_reminders?: boolean;
    double_booking_warning?: boolean;
    no_location_warning?: boolean;
    link_email_warning?: boolean;
    use_duplicate_events?: boolean;
    delete_holds_inquiry?: boolean;
    bcc_exec_on_reply?: boolean;
    current_timezone?: string;
    hold_event_color?: CalendarEventColor;
  }

  export interface GeneralPrefs extends GeneralPrefsOpts {
    send_exec_confirmation: boolean;
    send_exec_reminder: boolean;
    send_followup_reminders: boolean;
    double_booking_warning: boolean;
    no_location_warning: boolean;
    link_email_warning: boolean;
    use_duplicate_events: boolean;
    delete_holds_inquiry: boolean;
    bcc_exec_on_reply: boolean;
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

  // calendar_stats2 in api.atd
  export interface CalendarStats {
    window_start: string; // timestamp
    partition: CalendarStatEntry[];
  }

  export interface CalendarStatEntry {
    event_labels: string[];       // Display versions
    event_labels_norm: string[];  // Normalized versions
    event_count: number;    // integer
    event_duration: number; // seconds
  }

  // calendar_stats_result2 in api.atd
  export type CalendarStatsResult = ListResponse<CalendarStats>;

  export interface CalendarAndTeam {
    calid: string;
    teamid: string;
  }

  export interface DailyStatsRequest {
    window_start: string; // timestamp
    window_end: string; // timestamp
    calendars: CalendarAndTeam[];
  }

  export interface DailyStatsResponse {
    has_domain_analysis: boolean;
    guest_stats: GuestStat[];
    daily_stats: DailyStats[];
  }

  export interface GuestStat {
    guests: Identity[];
    count: number;
    time: number;   // Seconds
  }

  export interface Identity {
    email: string;
    name?: string;
  }

  export interface DailyStats {
    window_start: string;         // timestamp
    scheduled: number[];          // Seconds list
    with_guests: number[];        // Seconds list
    internal?: number[];          // Seconds list
    external?: number[];          // Seconds list
    chunks: number[];             // Seconds list, alternating +/- (+ = busy)
    chunks_with_guests: number[]; // Seconds list, alternating +/- (+ = busy)
  }

  export interface UrlResult {
    url: string;
  }

  export interface Labels {
    labels: string[];
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
      labels: string[]
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

  export interface Approval {
    approved_by: string; // uid
    approved_on: string; // timestamp
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
