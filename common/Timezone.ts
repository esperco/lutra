/*
  Timezone date-time conversions
*/
module Esper.Timezone {

  /* Given an ISO 8601 timestamp in local time (without timezone info),
     assume its timezone is fromTZ (the calendar zone)
     and apply the necessary changes to express it in toTZ (display zone).
     Returns an ISO 8601 timestamp without timezone info.
  */
  export function shiftTime(timestamp: string,
                            fromTZ: string,
                            toTZ: string): string {

    // 2015-05-08T23:00:00.000Z -> 2015-05-08T23:00:00.000
    var local = timestamp.replace(/Z$/, "");

    var inCalendarTZ =
      /UTC$/.test(fromTZ) || /GMT$/.test(fromTZ) ?
      (<any> moment).utc(local) :
      (<any> moment).tz(local, fromTZ);

    var inDisplayTZ =
      /UTC$/.test(toTZ) || /GMT$/.test(toTZ) ?
      (<any> inCalendarTZ.utc()) :
      (<any> inCalendarTZ).tz(toTZ);

    var fullTimestamp = (<any> inDisplayTZ).format();

    // 2015-05-09T12:00:00.000+03:00 -> 2015-05-09T12:00:00.000
    var localTimestamp =
      fullTimestamp.replace(/([+-][0-9][0-9]:[0-9][0-9]|[A-Z]+)$/, "");

    return localTimestamp;
  }

  // Names and IANA IDs of timezones that we support
  interface ZoneName {
    id: string; // IANA timezone identifier
    name: string; // Full customary name
  }

  // Enriched variant of ZoneName
  export interface ZoneInfo {
    id: string;    // IANA timezone identifier: America/Los_Angeles
    name: string;  // Full customary name: Pacific Time
    label: string; // Richer text: (GMT-08:00) Pacific Time (PST)
  }

  /* We need this because moment-timezone doesn't supply the full names,
     and we want to show those in our menu.
  */
  var supportedTimezones: ZoneName[] = [
    /* US timezones first */
    { id: "America/Los_Angeles", name: "Pacific Time" },
    { id: "America/Denver", name: "Mountain Time" },
    { id: "America/Chicago", name: "Central Time" },
    { id: "America/New_York", name: "Eastern Time" },
    { id: "America/Anchorage", name: "Alaska Time" },
    { id: "America/Phoenix", name: "Mountain Time - Arizona" },
    { id: "America/Puerto_Rico", name: "Puerto Rico" },
    { id: "Pacific/Honolulu", name: "Hawaii Time" },

    /* Other timezones sorted alphabetically */
    { id: "Africa/Abidjan", name: "Abidjan" },
    { id: "Africa/Accra", name: "Accra" },
    { id: "Africa/Algiers", name: "Algiers" },
    { id: "Africa/Bissau", name: "Bissau" },
    { id: "Africa/Cairo", name: "Cairo" },
    { id: "Africa/Casablanca", name: "Casablanca" },
    { id: "Africa/Ceuta", name: "Ceuta" },
    { id: "Africa/El_Aaiun", name: "El Aaiun" },
    { id: "Africa/Johannesburg", name: "Johannesburg" },
    { id: "Africa/Khartoum", name: "Khartoum" },
    { id: "Africa/Lagos", name: "Lagos" },
    { id: "Africa/Maputo", name: "Maputo" },
    { id: "Africa/Monrovia", name: "Monrovia" },
    { id: "Africa/Nairobi", name: "Nairobi" },
    { id: "Africa/Ndjamena", name: "Ndjamena" },
    { id: "Africa/Tripoli", name: "Tripoli" },
    { id: "Africa/Tunis", name: "Tunis" },
    { id: "Africa/Windhoek", name: "Windhoek" },
    { id: "America/Antigua", name: "Antigua" },
    { id: "America/Araguaina", name: "Araguaina" },
    { id: "America/Argentina/Buenos_Aires", name: "Buenos Aires" },
    { id: "America/Asuncion", name: "Asuncion" },
    { id: "America/Bahia", name: "Salvador" },
    { id: "America/Barbados", name: "Barbados" },
    { id: "America/Belem", name: "Belem" },
    { id: "America/Belize", name: "Belize" },
    { id: "America/Boa_Vista", name: "Boa Vista" },
    { id: "America/Bogota", name: "Bogota" },
    { id: "America/Campo_Grande", name: "Campo Grande" },
    { id: "America/Caracas", name: "Caracas" },
    { id: "America/Cayenne", name: "Cayenne" },
    { id: "America/Cayman", name: "Cayman" },
    { id: "America/Costa_Rica", name: "Costa Rica" },
    { id: "America/Cuiaba", name: "Cuiaba" },
    { id: "America/Curacao", name: "Curacao" },
    { id: "America/Danmarkshavn", name: "Danmarkshavn" },
    { id: "America/Dawson_Creek", name: "Mountain Time - Dawson Creek" },
    { id: "America/Edmonton", name: "Mountain Time - Edmonton" },
    { id: "America/El_Salvador", name: "El Salvador" },
    { id: "America/Fortaleza", name: "Fortaleza" },
    { id: "America/Godthab", name: "Godthab" },
    { id: "America/Grand_Turk", name: "Grand Turk" },
    { id: "America/Guatemala", name: "Guatemala" },
    { id: "America/Guayaquil", name: "Guayaquil" },
    { id: "America/Guyana", name: "Guyana" },
    { id: "America/Halifax", name: "Atlantic Time - Halifax" },
    { id: "America/Havana", name: "Havana" },
    { id: "America/Hermosillo", name: "Mountain Time - Hermosillo" },
    { id: "America/Iqaluit", name: "Eastern Time - Iqaluit" },
    { id: "America/Jamaica", name: "Jamaica" },
    { id: "America/La_Paz", name: "La Paz" },
    { id: "America/Lima", name: "Lima" },
    { id: "America/Maceio", name: "Maceio" },
    { id: "America/Managua", name: "Managua" },
    { id: "America/Manaus", name: "Manaus" },
    { id: "America/Martinique", name: "Martinique" },
    { id: "America/Mazatlan", name: "Mountain Time - Chihuahua, Mazatlan" },
    { id: "America/Mexico_City", name: "Central Time - Mexico City" },
    { id: "America/Miquelon", name: "Miquelon" },
    { id: "America/Montevideo", name: "Montevideo" },
    { id: "America/Montreal", name: "Eastern Time - Montreal" },
    { id: "America/Nassau", name: "Nassau" },
    { id: "America/Noronha", name: "Noronha" },
    { id: "America/Panama", name: "Panama" },
    { id: "America/Paramaribo", name: "Paramaribo" },
    { id: "America/Port-au-Prince", name: "Port-au-Prince" },
    { id: "America/Port_of_Spain", name: "Port of Spain" },
    { id: "America/Porto_Velho", name: "Porto Velho" },
    { id: "America/Recife", name: "Recife" },
    { id: "America/Regina", name: "Central Time - Regina" },
    { id: "America/Rio_Branco", name: "Rio Branco" },
    { id: "America/Santiago", name: "Santiago" },
    { id: "America/Santo_Domingo", name: "Santo Domingo" },
    { id: "America/Sao_Paulo", name: "Sao Paulo" },
    { id: "America/Scoresbysund", name: "Scoresbysund" },
    { id: "America/St_Johns", name: "Newfoundland Time - St. Johns" },
    { id: "America/Tegucigalpa", name: "Central Time - Tegucigalpa" },
    { id: "America/Thule", name: "Thule" },
    { id: "America/Tijuana", name: "Pacific Time - Tijuana" },
    { id: "America/Toronto", name: "Eastern Time - Toronto" },
    { id: "America/Vancouver", name: "Pacific Time - Vancouver" },
    { id: "America/Whitehorse", name: "Pacific Time - Whitehorse" },
    { id: "America/Winnipeg", name: "Central Time - Winnipeg" },
    { id: "America/Yellowknife", name: "Mountain Time - Yellowknife" },
    { id: "Antarctica/Casey", name: "Casey" },
    { id: "Antarctica/Davis", name: "Davis" },
    { id: "Antarctica/Mawson", name: "Mawson" },
    { id: "Antarctica/Palmer", name: "Palmer" },
    { id: "Antarctica/Rothera", name: "Rothera" },
    { id: "Antarctica/Syowa", name: "Syowa" },
    { id: "Antarctica/Vostok", name: "Vostok" },
    { id: "Asia/Almaty", name: "Almaty" },
    { id: "Asia/Amman", name: "Amman" },
    { id: "Asia/Aqtau", name: "Aqtau" },
    { id: "Asia/Aqtobe", name: "Aqtobe" },
    { id: "Asia/Ashgabat", name: "Ashgabat" },
    { id: "Asia/Baghdad", name: "Baghdad" },
    { id: "Asia/Baku", name: "Baku" },
    { id: "Asia/Bangkok", name: "Bangkok" },
    { id: "Asia/Beirut", name: "Beirut" },
    { id: "Asia/Bishkek", name: "Bishkek" },
    { id: "Asia/Brunei", name: "Brunei" },
    { id: "Asia/Choibalsan", name: "Choibalsan" },
    { id: "Asia/Colombo", name: "Colombo" },
    { id: "Asia/Damascus", name: "Damascus" },
    { id: "Asia/Dhaka", name: "Dhaka" },
    { id: "Asia/Dili", name: "Dili" },
    { id: "Asia/Dubai", name: "Dubai" },
    { id: "Asia/Dushanbe", name: "Dushanbe" },
    { id: "Asia/Gaza", name: "Gaza" },
    { id: "Asia/Hong_Kong", name: "Hong Kong" },
    { id: "Asia/Hovd", name: "Hovd" },
    { id: "Asia/Irkutsk", name: "Moscow+05 - Irkutsk" },
    { id: "Asia/Jakarta", name: "Jakarta" },
    { id: "Asia/Jayapura", name: "Jayapura" },
    { id: "Asia/Jerusalem", name: "Jerusalem" },
    { id: "Asia/Kabul", name: "Kabul" },
    { id: "Asia/Kamchatka", name: "Moscow+08 - Petropavlovsk-Kamchatskiy" },
    { id: "Asia/Karachi", name: "Karachi" },
    { id: "Asia/Krasnoyarsk", name: "Moscow+04 - Krasnoyarsk" },
    { id: "Asia/Kuala_Lumpur", name: "Kuala Lumpur" },
    { id: "Asia/Macau", name: "Macau" },
    { id: "Asia/Magadan", name: "Moscow+08 - Magadan" },
    { id: "Asia/Makassar", name: "Makassar" },
    { id: "Asia/Manila", name: "Manila" },
    { id: "Asia/Nicosia", name: "Nicosia" },
    { id: "Asia/Omsk", name: "Moscow+03 - Omsk, Novosibirsk" },
    { id: "Asia/Pyongyang", name: "Pyongyang" },
    { id: "Asia/Qatar", name: "Qatar" },
    { id: "Asia/Rangoon", name: "Rangoon" },
    { id: "Asia/Riyadh", name: "Riyadh" },
    { id: "Asia/Seoul", name: "Seoul" },
    { id: "Asia/Shanghai", name: "China Time - Beijing" },
    { id: "Asia/Singapore", name: "Singapore" },
    { id: "Asia/Taipei", name: "Taipei" },
    { id: "Asia/Tashkent", name: "Tashkent" },
    { id: "Asia/Tbilisi", name: "Tbilisi" },
    { id: "Asia/Tehran", name: "Tehran" },
    { id: "Asia/Thimphu", name: "Thimphu" },
    { id: "Asia/Tokyo", name: "Tokyo" },
    { id: "Asia/Ulaanbaatar", name: "Ulaanbaatar" },
    { id: "Asia/Vladivostok", name: "Moscow+07 - Yuzhno-Sakhalinsk" },
    { id: "Asia/Yakutsk", name: "Moscow+06 - Yakutsk" },
    { id: "Asia/Yekaterinburg", name: "Moscow+02 - Yekaterinburg" },
    { id: "Asia/Yerevan", name: "Yerevan" },
    { id: "Atlantic/Azores", name: "Azores" },
    { id: "Atlantic/Bermuda", name: "Bermuda" },
    { id: "Atlantic/Canary", name: "Canary Islands" },
    { id: "Atlantic/Cape_Verde", name: "Cape Verde" },
    { id: "Atlantic/Faroe", name: "Faeroe" },
    { id: "Atlantic/Reykjavik", name: "Reykjavik" },
    { id: "Atlantic/South_Georgia", name: "South Georgia" },
    { id: "Atlantic/Stanley", name: "Stanley" },
    { id: "Australia/Adelaide", name: "Central Time - Adelaide" },
    { id: "Australia/Brisbane", name: "Eastern Time - Brisbane" },
    { id: "Australia/Darwin", name: "Central Time - Darwin" },
    { id: "Australia/Hobart", name: "Eastern Time - Hobart" },
    { id: "Australia/Perth", name: "Western Time - Perth" },
    { id: "Australia/Sydney", name: "Eastern Time - Melbourne, Sydney" },
    { id: "Europe/Amsterdam", name: "Amsterdam" },
    { id: "Europe/Andorra", name: "Andorra" },
    { id: "Europe/Athens", name: "Athens" },
    { id: "Europe/Belgrade", name: "Central European Time - Belgrade" },
    { id: "Europe/Berlin", name: "Berlin" },
    { id: "Europe/Brussels", name: "Brussels" },
    { id: "Europe/Bucharest", name: "Bucharest" },
    { id: "Europe/Budapest", name: "Budapest" },
    { id: "Europe/Chisinau", name: "Chisinau" },
    { id: "Europe/Copenhagen", name: "Copenhagen" },
    { id: "Europe/Dublin", name: "Dublin" },
    { id: "Europe/Gibraltar", name: "Gibraltar" },
    { id: "Europe/Helsinki", name: "Helsinki" },
    { id: "Europe/Istanbul", name: "Istanbul" },
    { id: "Europe/Kaliningrad", name: "Moscow-01 - Kaliningrad" },
    { id: "Europe/Kiev", name: "Kiev" },
    { id: "Europe/Lisbon", name: "Lisbon" },
    { id: "Europe/London", name: "London" },
    { id: "Europe/Luxembourg", name: "Luxembourg" },
    { id: "Europe/Madrid", name: "Madrid" },
    { id: "Europe/Malta", name: "Malta" },
    { id: "Europe/Minsk", name: "Minsk" },
    { id: "Europe/Monaco", name: "Monaco" },
    { id: "Europe/Moscow", name: "Moscow+00" },
    { id: "Europe/Oslo", name: "Oslo" },
    { id: "Europe/Paris", name: "Paris" },
    { id: "Europe/Prague", name: "Central European Time - Prague" },
    { id: "Europe/Riga", name: "Riga" },
    { id: "Europe/Rome", name: "Rome" },
    { id: "Europe/Samara", name: "Moscow+00 - Samara" },
    { id: "Europe/Sofia", name: "Sofia" },
    { id: "Europe/Stockholm", name: "Stockholm" },
    { id: "Europe/Tallinn", name: "Tallinn" },
    { id: "Europe/Tirane", name: "Tirane" },
    { id: "Europe/Vienna", name: "Vienna" },
    { id: "Europe/Vilnius", name: "Vilnius" },
    { id: "Europe/Warsaw", name: "Warsaw" },
    { id: "Europe/Zurich", name: "Zurich" },
    { id: "Indian/Chagos", name: "Chagos" },
    { id: "Indian/Christmas", name: "Christmas" },
    { id: "Indian/Cocos", name: "Cocos" },
    { id: "Indian/Kerguelen", name: "Kerguelen" },
    { id: "Indian/Mahe", name: "Mahe" },
    { id: "Indian/Maldives", name: "Maldives" },
    { id: "Indian/Mauritius", name: "Mauritius" },
    { id: "Indian/Reunion", name: "Reunion" },
    { id: "Pacific/Apia", name: "Apia" },
    { id: "Pacific/Auckland", name: "Auckland" },
    { id: "Pacific/Chuuk", name: "Truk" },
    { id: "Pacific/Easter", name: "Easter Island" },
    { id: "Pacific/Efate", name: "Efate" },
    { id: "Pacific/Enderbury", name: "Enderbury" },
    { id: "Pacific/Fakaofo", name: "Fakaofo" },
    { id: "Pacific/Fiji", name: "Fiji" },
    { id: "Pacific/Funafuti", name: "Funafuti" },
    { id: "Pacific/Galapagos", name: "Galapagos" },
    { id: "Pacific/Gambier", name: "Gambier" },
    { id: "Pacific/Guadalcanal", name: "Guadalcanal" },
    { id: "Pacific/Guam", name: "Guam" },
    { id: "Pacific/Kiritimati", name: "Kiritimati" },
    { id: "Pacific/Kosrae", name: "Kosrae" },
    { id: "Pacific/Kwajalein", name: "Kwajalein" },
    { id: "Pacific/Majuro", name: "Majuro" },
    { id: "Pacific/Marquesas", name: "Marquesas" },
    { id: "Pacific/Midway", name: "Midway" },
    { id: "Pacific/Nauru", name: "Nauru" },
    { id: "Pacific/Niue", name: "Niue" },
    { id: "Pacific/Norfolk", name: "Norfolk" },
    { id: "Pacific/Noumea", name: "Noumea" },
    { id: "Pacific/Pago_Pago", name: "Pago Pago" },
    { id: "Pacific/Palau", name: "Palau" },
    { id: "Pacific/Pitcairn", name: "Pitcairn" },
    { id: "Pacific/Pohnpei", name: "Ponape" },
    { id: "Pacific/Port_Moresby", name: "Port Moresby" },
    { id: "Pacific/Rarotonga", name: "Rarotonga" },
    { id: "Pacific/Saipan", name: "Saipan" },
    { id: "Pacific/Tahiti", name: "Tahiti" },
    { id: "Pacific/Tarawa", name: "Tarawa" },
    { id: "Pacific/Tongatapu", name: "Tongatapu" },
    { id: "Pacific/Wake", name: "Wake" },
    { id: "Pacific/Wallis", name: "Wallis" }
  ];

  interface Dictionary {
    [index: string]: string;
  }
  var idOfValue: Dictionary;
  var valueOfId: Dictionary;
  var timezones: Bloodhound<string>;
  var rawTimezoneValues: string[];

  export var list: ZoneInfo[] = [];

  export function init() {
    rawTimezoneValues = [];
    valueOfId = {};
    idOfValue = {};
    List.iter(supportedTimezones, function(z) {
      var mom = (<any> moment).tz(moment(), z.id);
      var offset = mom.format("Z"), abbr = mom.format("z");
      var value = "(GMT" + offset + ") " + z.name + " (" + abbr + ")";

      rawTimezoneValues.push(value);
      idOfValue[value] = z.id;
      valueOfId[z.id] = value;
      list.push({
        id: z.id,
        name: z.name,
        label: value
      });
    });

    timezones = new Esper.bloodhound({
      local: function(){return rawTimezoneValues;},
      queryTokenizer: Esper.bloodhound.tokenizers.nonword,
      datumTokenizer: Esper.bloodhound.tokenizers.nonword
    });
  }

  export function appendDropdownMenu(parent: JQuery,
                                     id: string,
                                     selected: string,
                                     onSelect?: () => void) {
    parent.renderReact(Dropdown.Menu, {
      id: id,
      dataEngine: timezones,
      initialData: rawTimezoneValues,
      selectedOption: valueOfId[selected],
      onSelect: onSelect
    });
  }

  export function appendTimezoneSelector(parent, selected, display="block") {
'''
<input #selector class="typeahead" type="text"/>
'''
    parent.append(selector);
    selector.typeahead(
      { highlight: true },
      { name: "timezones",
        source: function(query, sync, async) {
          timezones.search(query, sync, async);
        }
      }
    );
    var value = valueOfId[selected];
    if (value) {
      selector.typeahead('val', value);
    }

    if (display) {
      selector.parent().css("display", display);
    }

    return selector;
  }

  export function getValueFromId(id: string) {
    return valueOfId[id];
  }

  export function getIdFromValue(value: string) {
    return idOfValue[value];
  }
}
