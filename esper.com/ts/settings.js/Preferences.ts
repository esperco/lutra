/*
  Team Settings - Preferences
*/

module Esper.Preferences {

  export var transportationTypes = ["Walking", "Bicycle", "Public", "Car",
                                    "Zipcar", "Taxi", "Uber", "Lyft"];
  export var meals = ["breakfast", "brunch", "lunch",
                      "coffee", "dinner", "drinks"];

  function weekdays(fromHour, toHour) {
    return [
      {
        avail_from: { day: "Mon", time: { hour: fromHour, minute: 0 } },
        avail_to: { day: "Mon", time: { hour: toHour, minute: 0 } }
      },
      {
        avail_from: { day: "Tue", time: { hour: fromHour, minute: 0 } },
        avail_to: { day: "Tue", time: { hour: toHour, minute: 0 } }
      },
      {
        avail_from: { day: "Wed", time: { hour: fromHour, minute: 0 } },
        avail_to: { day: "Wed", time: { hour: toHour, minute: 0 } }
      },
      {
        avail_from: { day: "Thu", time: { hour: fromHour, minute: 0 } },
        avail_to: { day: "Thu", time: { hour: toHour, minute: 0 } }
      },
      {
        avail_from: { day: "Fri", time: { hour: fromHour, minute: 0 } },
        avail_to: { day: "Fri", time: { hour: toHour, minute: 0 } }
      }
    ];
  }

  function weekends(fromHour, toHour) {
    return [
      {
        avail_from: { day: "Sat", time: { hour: fromHour, minute: 0 } },
        avail_to: { day: "Sat", time: { hour: toHour, minute: 0 } }
      },
      {
        avail_from: { day: "Sun", time: { hour: fromHour, minute: 0 } },
        avail_to: { day: "Sun", time: { hour: toHour, minute: 0 } }
      }
    ];
  }

  /** Returns an object that contains the preferences for a form that
   *  hasn't been filled out at all.
   */
  export function defaultPreferences() {
    var emptyLocation = {
      title: "",
      address: ""
    };

    var inOffice = weekdays(9, 18);

    var defaults    = {
      workplaces: [
        {
          location: emptyLocation,
          duration: { hour: 1, minute: 0 },
          buffer: { hour: 0, minute: 15 },
          availability: inOffice
        }
      ],
      transportation: ["Walking"],
      meeting_types: {
        phone_call: {
          duration: { hour: 0, minute: 30 },
          buffer: { hour: 0, minute: 0 },
          phones: [],
          availability: inOffice
        },
        video_call: {
          duration: { hour: 0, minute: 30 },
          buffer: { hour: 0, minute: 0 },
          accounts: [],
          availability: inOffice
        },
        breakfast: {
          duration: { hour: 1, minute: 0 },
          buffer: { hour: 0, minute: 30 },
          available: false,
          availability: weekdays(8, 10),
          favorites: []
        },
        brunch: {
          duration: { hour: 1, minute: 0 },
          buffer: { hour: 0, minute: 30 },
          available: false,
          availability: weekends(9, 12),
          favorites: []
        },
        lunch: {
          duration: { hour: 1, minute: 0 },
          buffer: { hour: 0, minute: 30 },
          availability: weekdays(12, 14),
          favorites: []
        },
        coffee: {
          duration: { hour: 1, minute: 0 },
          buffer: { hour: 0, minute: 30 },
          availability: weekdays(10, 18),
          favorites: []
        },
        dinner: {
          duration: { hour: 1, minute: 0 },
          buffer: { hour: 0, minute: 30 },
          availability: weekdays(18, 20),
          favorites: []
        },
        drinks: {
          duration: { hour: 1, minute: 0 },
          buffer: { hour: 0, minute: 30 },
          availability: [],
          favorites: []
        }
      },
      general: {
        send_exec_confirmation: true,
        send_exec_reminder: false,
        use_duplicate_events: false,
        bcc_exec_on_reply: true,
        exec_daily_agenda: false
      }
    };

    // Deep copy object to return a new instance:
    return $.extend(true, {}, defaults);
  }
}
