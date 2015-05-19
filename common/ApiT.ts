module Esper.ApiT {
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
    team_labels: string[];
    team_label_urgent: string;
    team_label_new: string;
    team_label_in_progress: string;
    team_label_done: string;
    team_label_canceled: string;
    team_calendars: Calendar[];
    team_email_aliases: string[];
  }

  export interface Calendar {
    google_cal_id: string;
    calendar_title: string;
    calendar_timezone?: string;
    calendar_default_view?: boolean;
    calendar_default_write?: boolean;
    calendar_default_dupe?: boolean;
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
    display_name?: string;
    gender?: string; // "Female" or "Male"
    image_url?: string;
    has_ios_app: boolean;
  }

  export interface Guest {
    display_name?: string;
    email: string;
  }

  export interface LoginResponse {
    uid: string;
    api_secret: string;
    email: string;
    teams: Team[];
    has_ios_app: boolean;
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
    location?: Location;
    all_day?: boolean;
    guests: Guest[];
    transparent?: boolean;
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
    location?: Location;
    all_day?: boolean;
    guests: Guest[];
    color_id?: string;
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
    uid: string;
    teamid: string;
    workplaces: Workplace[];
    transportation: string[];
    meeting_types: MeetingTypes;
    general: GeneralPrefs;
    coworkers: string;
    notes: string;
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
    minute: string;
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

  export interface GeneralPrefs {
    send_exec_confirmation: boolean;
    send_exec_reminder: boolean;
    use_duplicate_events: boolean;
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

  export interface Task {
    taskid: string;
    task_teamid: string;
    task_title: string;
    task_notes: string;
    task_archived: boolean;
    task_labels: string[];
    task_progress: string; // New | In_progress | Done | Canceled
    task_urgent: boolean;
    task_unread_emails?: number;
    task_threads: EmailThread[];
    task_events: TaskEvent[];
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
    brand?: string;
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

    static next(current) {
      var availabilities = ["yes", "no", "maybe"];
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
}
