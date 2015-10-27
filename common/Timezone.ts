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

  /* We need this because moment-timezone doesn't supply the full names,
     and we want to show those in our menu.
  */
  var supportedTimezones: ZoneName[] = [
    { id: "Pacific/Midway", name: "Midway" },
    { id: "Pacific/Niue", name: "Niue" },
    { id: "Pacific/Pago_Pago", name: "Pago Pago" },
    { id: "Pacific/Honolulu", name: "Hawaii Time" },
    { id: "Pacific/Rarotonga", name: "Rarotonga" },
    { id: "Pacific/Tahiti", name: "Tahiti" },
    { id: "Pacific/Marquesas", name: "Marquesas" },
    { id: "America/Anchorage", name: "Alaska Time" },
    { id: "Pacific/Gambier", name: "Gambier" },
    { id: "America/Los_Angeles", name: "Pacific Time" },
    { id: "America/Tijuana", name: "Pacific Time - Tijuana" },
    { id: "America/Vancouver", name: "Pacific Time - Vancouver" },
    { id: "America/Whitehorse", name: "Pacific Time - Whitehorse" },
    { id: "Pacific/Pitcairn", name: "Pitcairn" },
    { id: "America/Dawson_Creek", name: "Mountain Time - Dawson Creek" },
    { id: "America/Denver", name: "Mountain Time" },
    { id: "America/Edmonton", name: "Mountain Time - Edmonton" },
    { id: "America/Hermosillo", name: "Mountain Time - Hermosillo" },
    { id: "America/Mazatlan", name: "Mountain Time - Chihuahua, Mazatlan" },
    { id: "America/Phoenix", name: "Mountain Time - Arizona" },
    { id: "America/Yellowknife", name: "Mountain Time - Yellowknife" },
    { id: "America/Belize", name: "Belize" },
    { id: "America/Chicago", name: "Central Time" },
    { id: "America/Costa_Rica", name: "Costa Rica" },
    { id: "America/El_Salvador", name: "El Salvador" },
    { id: "America/Guatemala", name: "Guatemala" },
    { id: "America/Managua", name: "Managua" },
    { id: "America/Mexico_City", name: "Central Time - Mexico City" },
    { id: "America/Regina", name: "Central Time - Regina" },
    { id: "America/Tegucigalpa", name: "Central Time - Tegucigalpa" },
    { id: "America/Winnipeg", name: "Central Time - Winnipeg" },
    { id: "Pacific/Galapagos", name: "Galapagos" },
    { id: "America/Bogota", name: "Bogota" },
    { id: "America/Cayman", name: "Cayman" },
    { id: "America/Guayaquil", name: "Guayaquil" },
    { id: "America/Havana", name: "Havana" },
    { id: "America/Iqaluit", name: "Eastern Time - Iqaluit" },
    { id: "America/Jamaica", name: "Jamaica" },
    { id: "America/Lima", name: "Lima" },
    { id: "America/Montreal", name: "Eastern Time - Montreal" },
    { id: "America/Nassau", name: "Nassau" },
    { id: "America/New_York", name: "Eastern Time" },
    { id: "America/Panama", name: "Panama" },
    { id: "America/Port-au-Prince", name: "Port-au-Prince" },
    { id: "America/Rio_Branco", name: "Rio Branco" },
    { id: "America/Toronto", name: "Eastern Time - Toronto" },
    { id: "Pacific/Easter", name: "Easter Island" },
    { id: "America/Caracas", name: "Caracas" },
    { id: "America/Antigua", name: "Antigua" },
    { id: "America/Asuncion", name: "Asuncion" },
    { id: "America/Barbados", name: "Barbados" },
    { id: "America/Boa_Vista", name: "Boa Vista" },
    { id: "America/Campo_Grande", name: "Campo Grande" },
    { id: "America/Cuiaba", name: "Cuiaba" },
    { id: "America/Curacao", name: "Curacao" },
    { id: "America/Grand_Turk", name: "Grand Turk" },
    { id: "America/Guyana", name: "Guyana" },
    { id: "America/Halifax", name: "Atlantic Time - Halifax" },
    { id: "America/La_Paz", name: "La Paz" },
    { id: "America/Manaus", name: "Manaus" },
    { id: "America/Martinique", name: "Martinique" },
    { id: "America/Port_of_Spain", name: "Port of Spain" },
    { id: "America/Porto_Velho", name: "Porto Velho" },
    { id: "America/Puerto_Rico", name: "Puerto Rico" },
    { id: "America/Santo_Domingo", name: "Santo Domingo" },
    { id: "America/Thule", name: "Thule" },
    { id: "Atlantic/Bermuda", name: "Bermuda" },
    { id: "America/St_Johns", name: "Newfoundland Time - St. Johns" },
    { id: "America/Araguaina", name: "Araguaina" },
    { id: "America/Argentina/Buenos_Aires", name: "Buenos Aires" },
    { id: "America/Bahia", name: "Salvador" },
    { id: "America/Belem", name: "Belem" },
    { id: "America/Cayenne", name: "Cayenne" },
    { id: "America/Fortaleza", name: "Fortaleza" },
    { id: "America/Godthab", name: "Godthab" },
    { id: "America/Maceio", name: "Maceio" },
    { id: "America/Miquelon", name: "Miquelon" },
    { id: "America/Montevideo", name: "Montevideo" },
    { id: "America/Paramaribo", name: "Paramaribo" },
    { id: "America/Recife", name: "Recife" },
    { id: "America/Santiago", name: "Santiago" },
    { id: "America/Sao_Paulo", name: "Sao Paulo" },
    { id: "Antarctica/Palmer", name: "Palmer" },
    { id: "Antarctica/Rothera", name: "Rothera" },
    { id: "Atlantic/Stanley", name: "Stanley" },
    { id: "America/Noronha", name: "Noronha" },
    { id: "Atlantic/South_Georgia", name: "South Georgia" },
    { id: "America/Scoresbysund", name: "Scoresbysund" },
    { id: "Atlantic/Azores", name: "Azores" },
    { id: "Atlantic/Cape_Verde", name: "Cape Verde" },
    { id: "Africa/Abidjan", name: "Abidjan" },
    { id: "Africa/Accra", name: "Accra" },
    { id: "Africa/Bissau", name: "Bissau" },
    { id: "Africa/Casablanca", name: "Casablanca" },
    { id: "Africa/El_Aaiun", name: "El Aaiun" },
    { id: "Africa/Monrovia", name: "Monrovia" },
    { id: "America/Danmarkshavn", name: "Danmarkshavn" },
    { id: "Atlantic/Canary", name: "Canary Islands" },
    { id: "Atlantic/Faroe", name: "Faeroe" },
    { id: "Atlantic/Reykjavik", name: "Reykjavik" },
    { id: "Europe/Dublin", name: "Dublin" },
    { id: "Europe/Lisbon", name: "Lisbon" },
    { id: "Europe/London", name: "London" },
    { id: "Africa/Algiers", name: "Algiers" },
    { id: "Africa/Ceuta", name: "Ceuta" },
    { id: "Africa/Lagos", name: "Lagos" },
    { id: "Africa/Ndjamena", name: "Ndjamena" },
    { id: "Africa/Tunis", name: "Tunis" },
    { id: "Africa/Windhoek", name: "Windhoek" },
    { id: "Europe/Amsterdam", name: "Amsterdam" },
    { id: "Europe/Andorra", name: "Andorra" },
    { id: "Europe/Belgrade", name: "Central European Time - Belgrade" },
    { id: "Europe/Berlin", name: "Berlin" },
    { id: "Europe/Brussels", name: "Brussels" },
    { id: "Europe/Budapest", name: "Budapest" },
    { id: "Europe/Copenhagen", name: "Copenhagen" },
    { id: "Europe/Gibraltar", name: "Gibraltar" },
    { id: "Europe/Luxembourg", name: "Luxembourg" },
    { id: "Europe/Madrid", name: "Madrid" },
    { id: "Europe/Malta", name: "Malta" },
    { id: "Europe/Monaco", name: "Monaco" },
    { id: "Europe/Oslo", name: "Oslo" },
    { id: "Europe/Paris", name: "Paris" },
    { id: "Europe/Prague", name: "Central European Time - Prague" },
    { id: "Europe/Rome", name: "Rome" },
    { id: "Europe/Stockholm", name: "Stockholm" },
    { id: "Europe/Tirane", name: "Tirane" },
    { id: "Europe/Vienna", name: "Vienna" },
    { id: "Europe/Warsaw", name: "Warsaw" },
    { id: "Europe/Zurich", name: "Zurich" },
    { id: "Africa/Cairo", name: "Cairo" },
    { id: "Africa/Johannesburg", name: "Johannesburg" },
    { id: "Africa/Maputo", name: "Maputo" },
    { id: "Africa/Tripoli", name: "Tripoli" },
    { id: "Asia/Amman", name: "Amman" },
    { id: "Asia/Beirut", name: "Beirut" },
    { id: "Asia/Damascus", name: "Damascus" },
    { id: "Asia/Gaza", name: "Gaza" },
    { id: "Asia/Jerusalem", name: "Jerusalem" },
    { id: "Asia/Nicosia", name: "Nicosia" },
    { id: "Europe/Athens", name: "Athens" },
    { id: "Europe/Bucharest", name: "Bucharest" },
    { id: "Europe/Chisinau", name: "Chisinau" },
    { id: "Europe/Helsinki", name: "Helsinki" },
    { id: "Europe/Istanbul", name: "Istanbul" },
    { id: "Europe/Kaliningrad", name: "Moscow-01 - Kaliningrad" },
    { id: "Europe/Kiev", name: "Kiev" },
    { id: "Europe/Riga", name: "Riga" },
    { id: "Europe/Sofia", name: "Sofia" },
    { id: "Europe/Tallinn", name: "Tallinn" },
    { id: "Europe/Vilnius", name: "Vilnius" },
    { id: "Africa/Khartoum", name: "Khartoum" },
    { id: "Africa/Nairobi", name: "Nairobi" },
    { id: "Antarctica/Syowa", name: "Syowa" },
    { id: "Asia/Baghdad", name: "Baghdad" },
    { id: "Asia/Qatar", name: "Qatar" },
    { id: "Asia/Riyadh", name: "Riyadh" },
    { id: "Europe/Minsk", name: "Minsk" },
    { id: "Europe/Moscow", name: "Moscow+00" },
    { id: "Asia/Tehran", name: "Tehran" },
    { id: "Asia/Baku", name: "Baku" },
    { id: "Asia/Dubai", name: "Dubai" },
    { id: "Asia/Tbilisi", name: "Tbilisi" },
    { id: "Asia/Yerevan", name: "Yerevan" },
    { id: "Europe/Samara", name: "Moscow+00 - Samara" },
    { id: "Indian/Mahe", name: "Mahe" },
    { id: "Indian/Mauritius", name: "Mauritius" },
    { id: "Indian/Reunion", name: "Reunion" },
    { id: "Asia/Kabul", name: "Kabul" },
    { id: "Antarctica/Mawson", name: "Mawson" },
    { id: "Asia/Aqtau", name: "Aqtau" },
    { id: "Asia/Aqtobe", name: "Aqtobe" },
    { id: "Asia/Ashgabat", name: "Ashgabat" },
    { id: "Asia/Dushanbe", name: "Dushanbe" },
    { id: "Asia/Karachi", name: "Karachi" },
    { id: "Asia/Tashkent", name: "Tashkent" },
    { id: "Asia/Yekaterinburg", name: "Moscow+02 - Yekaterinburg" },
    { id: "Indian/Kerguelen", name: "Kerguelen" },
    { id: "Indian/Maldives", name: "Maldives" },
    { id: "Asia/Colombo", name: "Colombo" },
    { id: "Antarctica/Vostok", name: "Vostok" },
    { id: "Asia/Almaty", name: "Almaty" },
    { id: "Asia/Bishkek", name: "Bishkek" },
    { id: "Asia/Dhaka", name: "Dhaka" },
    { id: "Asia/Omsk", name: "Moscow+03 - Omsk, Novosibirsk" },
    { id: "Asia/Thimphu", name: "Thimphu" },
    { id: "Indian/Chagos", name: "Chagos" },
    { id: "Asia/Rangoon", name: "Rangoon" },
    { id: "Indian/Cocos", name: "Cocos" },
    { id: "Antarctica/Davis", name: "Davis" },
    { id: "Asia/Bangkok", name: "Bangkok" },
    { id: "Asia/Hovd", name: "Hovd" },
    { id: "Asia/Jakarta", name: "Jakarta" },
    { id: "Asia/Krasnoyarsk", name: "Moscow+04 - Krasnoyarsk" },
    { id: "Indian/Christmas", name: "Christmas" },
    { id: "Antarctica/Casey", name: "Casey" },
    { id: "Asia/Brunei", name: "Brunei" },
    { id: "Asia/Choibalsan", name: "Choibalsan" },
    { id: "Asia/Hong_Kong", name: "Hong Kong" },
    { id: "Asia/Irkutsk", name: "Moscow+05 - Irkutsk" },
    { id: "Asia/Kuala_Lumpur", name: "Kuala Lumpur" },
    { id: "Asia/Macau", name: "Macau" },
    { id: "Asia/Makassar", name: "Makassar" },
    { id: "Asia/Manila", name: "Manila" },
    { id: "Asia/Shanghai", name: "China Time - Beijing" },
    { id: "Asia/Singapore", name: "Singapore" },
    { id: "Asia/Taipei", name: "Taipei" },
    { id: "Asia/Ulaanbaatar", name: "Ulaanbaatar" },
    { id: "Australia/Perth", name: "Western Time - Perth" },
    { id: "Asia/Dili", name: "Dili" },
    { id: "Asia/Jayapura", name: "Jayapura" },
    { id: "Asia/Pyongyang", name: "Pyongyang" },
    { id: "Asia/Seoul", name: "Seoul" },
    { id: "Asia/Tokyo", name: "Tokyo" },
    { id: "Asia/Yakutsk", name: "Moscow+06 - Yakutsk" },
    { id: "Pacific/Palau", name: "Palau" },
    { id: "Australia/Adelaide", name: "Central Time - Adelaide" },
    { id: "Australia/Darwin", name: "Central Time - Darwin" },
    { id: "Asia/Magadan", name: "Moscow+08 - Magadan" },
    { id: "Asia/Vladivostok", name: "Moscow+07 - Yuzhno-Sakhalinsk" },
    { id: "Australia/Brisbane", name: "Eastern Time - Brisbane" },
    { id: "Australia/Hobart", name: "Eastern Time - Hobart" },
    { id: "Australia/Sydney", name: "Eastern Time - Melbourne, Sydney" },
    { id: "Pacific/Chuuk", name: "Truk" },
    { id: "Pacific/Guam", name: "Guam" },
    { id: "Pacific/Port_Moresby", name: "Port Moresby" },
    { id: "Pacific/Saipan", name: "Saipan" },
    { id: "Pacific/Efate", name: "Efate" },
    { id: "Pacific/Guadalcanal", name: "Guadalcanal" },
    { id: "Pacific/Kosrae", name: "Kosrae" },
    { id: "Pacific/Noumea", name: "Noumea" },
    { id: "Pacific/Pohnpei", name: "Ponape" },
    { id: "Pacific/Norfolk", name: "Norfolk" },
    { id: "Asia/Kamchatka", name: "Moscow+08 - Petropavlovsk-Kamchatskiy" },
    { id: "Pacific/Auckland", name: "Auckland" },
    { id: "Pacific/Fiji", name: "Fiji" },
    { id: "Pacific/Funafuti", name: "Funafuti" },
    { id: "Pacific/Kwajalein", name: "Kwajalein" },
    { id: "Pacific/Majuro", name: "Majuro" },
    { id: "Asia/Taipei", name: "Taipei" },
    { id: "Asia/Ulaanbaatar", name: "Ulaanbaatar" },
    { id: "Australia/Perth", name: "Western Time - Perth" },
    { id: "Asia/Dili", name: "Dili" },
    { id: "Asia/Jayapura", name: "Jayapura" },
    { id: "Asia/Pyongyang", name: "Pyongyang" },
    { id: "Asia/Seoul", name: "Seoul" },
    { id: "Asia/Tokyo", name: "Tokyo" },
    { id: "Asia/Yakutsk", name: "Moscow+06 - Yakutsk" },
    { id: "Pacific/Palau", name: "Palau" },
    { id: "Australia/Adelaide", name: "Central Time - Adelaide" },
    { id: "Australia/Darwin", name: "Central Time - Darwin" },
    { id: "Asia/Magadan", name: "Moscow+08 - Magadan" },
    { id: "Asia/Vladivostok", name: "Moscow+07 - Yuzhno-Sakhalinsk" },
    { id: "Australia/Brisbane", name: "Eastern Time - Brisbane" },
    { id: "Australia/Hobart", name: "Eastern Time - Hobart" },
    { id: "Australia/Sydney", name: "Eastern Time - Melbourne, Sydney" },
    { id: "Pacific/Chuuk", name: "Truk" },
    { id: "Pacific/Guam", name: "Guam" },
    { id: "Pacific/Port_Moresby", name: "Port Moresby" },
    { id: "Pacific/Saipan", name: "Saipan" },
    { id: "Pacific/Efate", name: "Efate" },
    { id: "Pacific/Guadalcanal", name: "Guadalcanal" },
    { id: "Pacific/Kosrae", name: "Kosrae" },
    { id: "Pacific/Noumea", name: "Noumea" },
    { id: "Pacific/Pohnpei", name: "Ponape" },
    { id: "Pacific/Norfolk", name: "Norfolk" },
    { id: "Asia/Kamchatka", name: "Moscow+08 - Petropavlovsk-Kamchatskiy" },
    { id: "Pacific/Auckland", name: "Auckland" },
    { id: "Pacific/Fiji", name: "Fiji" },
    { id: "Pacific/Funafuti", name: "Funafuti" },
    { id: "Pacific/Kwajalein", name: "Kwajalein" },
    { id: "Pacific/Majuro", name: "Majuro" },
    { id: "Pacific/Nauru", name: "Nauru" },
    { id: "Pacific/Tarawa", name: "Tarawa" },
    { id: "Pacific/Wake", name: "Wake" },
    { id: "Pacific/Wallis", name: "Wallis" },
    { id: "Pacific/Apia", name: "Apia" },
    { id: "Pacific/Enderbury", name: "Enderbury" },
    { id: "Pacific/Fakaofo", name: "Fakaofo" },
    { id: "Pacific/Tongatapu", name: "Tongatapu" },
    { id: "Pacific/Kiritimati", name: "Kiritimati" }
  ];

  interface Dictionary {
    [index: string]: string;
  }
  var idOfValue: Dictionary;
  var valueOfId: Dictionary;
  var timezones: Bloodhound<string>;
  var rawTimezoneValues: string[];

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
      { highlight: true,
      },
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

  export function selectedTimezone(selector) {
    return idOfValue[selector.typeahead('val')];
  }
}
