module ApiT {
  /*
    The following type definitions were translated manually
    from wolverine/types/api.atd.
    We might want to generate them with atdgen in the future.
  */

  export interface ChromeSupport {
    requested_version: string;
    must_upgrade: boolean;
    minimum_version: string;
    download_page: string;
  }

  export interface TeamCalendar {
    access_uid: string;
    google_calendar_id: string;
  }

  export interface Team {
    teamid: string;
    team_name: string;
    team_executive: string;
    team_assistants: string[];
    team_calendars: Calendar[];
    team_email_aliases: string[];
  }

  export interface Calendar {
    google_cal_id: string;
    calendar_title: string;
    calendar_timezone?: string;
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

  export interface Profile {
    profile_uid: string;
    email: string;
    other_emails: string[];
    google_access: boolean;
    display_name: string;
    gender?: string; // "Female" or "Male"
    image_url?: string;
  }

  export interface Guest {
    display_name?: string;
    email: string;
  }

  export interface LoginResponse {
    uid: string;
    api_secret: string;
    is_admin: boolean;
    email: string;
    teams: Team[];
    team_members: TeamMember[];
    missing_shared_calendar: string; // teamid
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
    coord: Latlon; // optional
    timezone: string; // required if coordinates are missing
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
    location?: Location;
    all_day?: boolean;
    transparent?: boolean;
  }

  export interface CalendarEventEdit {
    google_event_id?: string;
    google_cal_id?: string;
    start: CalendarTime;
    end: CalendarTime;
    title?: string;
    description?: string;
    location?: Location;
    all_day?: boolean;
    guests: Guest[];
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

  export interface EventWithSyncInfo {
    event: CalendarEvent;
    synced_threads: SyncedThread[];
  }

  export interface LinkedCalendarEvents {
    linked_events: EventWithSyncInfo[];
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
    workplaces: Workplace[];
    transportation: string[];
    meeting_types: MeetingTypes;
    other: GeneralPrefs;
    notes?: string;
  }

  export interface Workplace {
    location: Location;
    duration: HourMinute;
    buffer?: HourMinute;
    distance?: number;
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
    buffer?: HourMinute;
    available: boolean;
    availability: Availability[];
    phones: PhoneNumber[];
  }

  export interface PhoneNumber {
    phone_type: string;
    phone_number: string;
  }

  export interface VideoInfo {
    duration: HourMinute;
    buffer?: HourMinute;
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
    minute: string;
  }

  export interface Availability {
    avail_from: TimeOnDay;
    avail_to: TimeOnDay;
  }

  export interface MealInfo {
    duration: HourMinute;
    buffer?: HourMinute;
    available: boolean;
    availability: Availability[];
    favorites: Location[];
  }

  export interface GeneralPrefs {
    send_exec_confirmation: boolean;
    send_exec_reminder: boolean;
    use_duplicate_events: boolean;
    bcc_exec_on_reply: boolean;
    exec_daily_agenda: boolean;
    current_timezone: string;
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
  }

  export interface DefaultReminder {
    default_message: string;
  }

  export interface CalendarRequest {
    window_start: string; // timestamp
    window_end: string; // timestamp
  }

  export interface Task {
    taskid: string;
    task_title: string;
    task_teamid: string;
    task_threads: TaskThread[];
    task_events: TaskEvent[];
  }

  export interface TaskThread {
    task_threadid: string; // hex
  }

  export interface TaskEvent {
    task_eventid: string;
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
    url : string;
  }

  export interface EmailLabels {
    labels : string[];
  }

  export interface Random {
    random : string;
  }

  export interface AccountEmail {
    email : string;
    email_primary : boolean;
  }

  export interface Calendars {
    calendars : Calendar[];
  }

  export interface EmailAddresses {
    emails : string[];
  }

  export interface CalendarAcl {
    shared_emails: CalendarAclEntry[];
  }

  export interface CalendarAclEntry {
    acl_id: string;
    acl_email: string;
  }

  export interface CustomerStatus {
    teamid : string;
    active : boolean;
    plan : string;
    status : string;
  }
  export interface PaymentCard {
    id : string;
    brand : string; //card_brand option
    last4 : string;
  }
  export interface CustomerDetails {
    teamid : string;
    active : boolean;
    plan : string;
    status : string;
    trial_end : string;
    trial_start : string;
    current_period_end : string;
    current_period_start : string;
    canceled_at : string;
    ended_at : string;
    cards : PaymentCard[];
  }

  export interface EmailSignature {
    signature : string;
  }
}
