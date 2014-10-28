/*
  Team Settings - Preferences
*/

module Preferences {

  export var transportationTypes = ["Walking", "Bicycle", "Public", "Car", "Zipcar", "Taxi", "Uber", "Lyft"];

  export var meals = ["breakfast", "brunch", "lunch", "coffee", "dinner", "drinks"];

  /** Returns an object that contains the preferences for a form that
   *  hasn't been filled out at all.
   */
  export function defaultPreferences() {
    var defaultDuration = {
      hour   : 1,
      minute : 0
    };

    var defaultLocation = {
      title   : "",
      address : ""
    };

    var defaults    = {
      meeting_types : {
        phone_call : {
          availability : [],
          duration     : defaultDuration,
          phones       : [
            {
              phone_number : "",
              phone_type   : "Mobile"
            }
          ]
        },
        video_call : {
          availability : [],
          duration     : defaultDuration,
          accounts     : [
            {
              video_type     : "Google",
              video_username : ""
            }
          ]
        }
      },
      workplaces    : [
        {
          availability : [],
          duration     : defaultDuration,
          location     : defaultLocation
        }
      ]
    };

    var defaultMealInfo = {
      availability : [],
      duration     : defaultDuration,
      favorites    : [ defaultLocation ]
    };

    meals.forEach(function (meal) {
      defaults.meeting_types[meal] = defaultMealInfo;
    });

    // Deep copy object to return a new instance:
    return $.extend(true, {}, defaults);
  }
}
