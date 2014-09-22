declare var api : any;
declare var login : any;

module Esper.ExecutivePreferences {

  var meals = ["Breakfast", "Brunch", "Lunch", "Coffee", "Dinner", "Drinks"];
  var loaded = false;

  export function load() {
    if (!loaded) {
      var startingPreferences = loadPreferences();

      $("#preferences-page").append(saveButton());

      $("#preferences-page").append(scaffolding());

      $(".preference-categories li.calls ul").append(phoneForm());
      $(".preference-categories li.calls ul").append(videoForm());

      meals.map(mealForm).forEach(function (element) {
        $(".preference-categories li.meals ul").append(element);
      });

      $(".preference-categories li.locations ul").append(locationForm());

      loaded = true;
    }
  }

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
              phone_type   : ""
            }
          ]
        },
        video_call : {
          availability : [],
          duration     : defaultDuration,
          accounts     : {
            video_type     : "Google",
            video_username : ""
          }
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

  export function saveToServer(teamid) {
    try {
      var preferences = currentPreferences();

      api.setPreferences(teamid, preferences);
    } catch (e) {
      if (e !== "typo") {
        throw e;
      }
    }
  }

  /** Returns the current values in the forms as JSON. */
  export function currentPreferences() {
    // Locations:
    var locations = [];
    $(".location-details").each(function (i, e) {
      locations.push({
        location : {
          title   : $(e).find(".location-address").val(),
          address : ""
        },
        duration     : findDuration($(e)),
        availability : findAvailability($(e))
      });
    });

    var meetings = {
      phone_call : {
        duration     : findDuration($(".phone-widget")),
        phones       : phoneNumberList(),
        availability : findAvailability($(".phone-widget"))
      },
      video_call : {
        duration     : findDuration($(".video-widget")),
        accounts     : videoAccountList(),
        availability : findAvailability($(".video-widget"))
      }
    };

    meals.forEach(function (meal) {
      meetings[meal.toLowerCase()] = mealInfo(meal);
    });

    return {
      workplaces    : locations,
      meeting_types : meetings
    };

    function findDuration(element) {
      return JSON.parse($(element).closest("li"). find(".durations select").val());
    }

    function findAvailability(element) {
      var availabilityWidget = $(element).closest("li").find(".customize-availability");
      
      var availabilities = []

      availabilityWidget.find(".availability").each(function(i, e) {
        var days  = $($(e).find("input")[0]).val();
        var start = $($(e).find("input")[1]).val();
        var end   = $($(e).find("input")[2]).val();

        if (days !== "" || start !== "" || end !== "") {

          start = toTime(start);
          end = toTime(end);

          if (start === null || end === null) {
            typo($(e));
          } else {
            days = days.split("").map(function (day) {
              switch (day.toLowerCase()) {
              case "m": return "Mon";
              case "t": return "Tue";
              case "w": return "Wed";
              case "r": return "Thu";
              case "f": return "Fri";
              case "s": return "Sat";
              case "u": return "Sun";

              default : return null;
              }
            });

            days.forEach(function (day) {
              if (day) {
                availabilities.push({
                  avail_from : {
                    day : day,
                    time : start
                  },
                  avail_to : {
                    day : day,
                    time : end
                  }
                });
              } else {
                typo($(e));
              }
            });
          }
        }
      });

      return availabilities;

      function toTime(str) {
        str = str.replace(/\s/g, "").toLowerCase();
        var parts = [0, 0];


        if (/\d\d?:\d\d/.test(str)) {
          parts = str.split(":");
        } else if (/\d\d?/.test(str)) {
          parts[0] = str;
        } else {
          return null;
        }
        
        return {
          hour   : parts[0],
          minute : parts[1]
        }
      }

      function typo(element) {
        element.css("background", "#A83245");
        throw "typo";
      }
    }

    function phoneNumberList() {
      var res = [];

      $(".phone-widget div.phone-number").each(function (i, e) {
        res.push({
          phone_type   : $(e).find("select").val(),
          phone_number : $(e).find("input").val()
        });
      });

      return res;
    }

    function videoAccountList() {
      var res = [];

      $(".video-widget div.video-account").each(function (i, e) {
        res.push({
          video_type     : $(e).find("select").val(),
          video_username : $(e).find("input").val()
        });
      });

      return res;
    }

    function mealInfo(meal) {
      var element = $("." + meal);

      var locations = [];
      element.find("input.restaurant-entry").each(function (i, e) {
        // Most fields not used, for now.
        locations.push({
          title   : $(e).val(),
          address : ""
        });
      });

      return {
        duration     : findDuration(element),
        availability : findAvailability(element),
        favorites    : locations
      };
    }
  }

  /** The HTML controls for saving the executive's preferences. */
  export function saveButton() {
'''
<div #container class="save-controls">
  <select id="teamSelect" #teamSelect>
  </select>
  <a href="#" #save>Save</a>
</div>
'''    
    login.getTeams().forEach(function (team) {
      var name   = team.team_name;
      var teamid = team.teamid;
      var option = $('<option value="' + teamid + '">').text(name);

      teamSelect.append(option);
    });

    save.click(function () {
      var teamid = teamSelect.val();

      if (teamid) {
        saveToServer(teamid);
      } else {
        alert("No valid team!");
      }

      return false;
    });
    
    return container;
  }

 /** Returns the ul element onto which everything else is added. */
  export function scaffolding() {
'''
<ul #container class="preference-categories">
  <li class="calls">
    <ul class="preference-options">
    </ul>
  </li>
  <li class="meals">
    <ul class="preference-options">
    </ul>
  </li>
  <li class="locations">
    <ul class="preference-options">
    </ul>
  </li>
</ul>
'''    

    return container;
  }

  /** The basic form widget which has a prominent on/off toggle and a
   *  link for customizing availability. The actual forms like meal
   *  times or calls are extensions of this.
   *
   *  The custom parts of the form should go in the div called "rest",
   *  below everything else.
   *
   *  The given title will be used for the form's header. The icon,
   *  if passed in, will go at the top.
   */
  export function form(title) {
'''
<li #container>
  <div #iconDiv></div>
  <h1 #header>  </h1>
    <form #form class="toggle">
    <label>  <input type="radio" name="toggle" /> <span>No</span> </label>
    <label>  <input type="radio" name="toggle" checked="checked" /> <span>Yes</span> </label>
  </form>

  <div #availabilityContainer class="customize-availability">
  </div>
  <a #availability href="#">Add availability</a>

  <hr />

  <div class="rest" #rest>
  </div>
</li>
'''    

    header.text(title);

    var possibleDurations = durations();
    form.after(possibleDurations.container);

    availability.click(function () {
      availabilityContainer.append(availabilityEntry());
      return false;
    });

    return _view;
  }

  /** Returns a drop-down menu for possible meeting durations. */
  export function durations() {
'''
<label class="durations" #container>
  Preferred duration
  <select #select>
    <option value='{ "hour" : 0, "minute" : 10 }'>0:10</option>
    <option value='{ "hour" : 0, "minute" : 20 }'>0:20</option>
    <option value='{ "hour" : 0, "minute" : 30 }'>0:30</option>
    <option value='{ "hour" : 0, "minute" : 40 }'>0:40</option>
    <option value='{ "hour" : 1, "minute" : 0 }'>1:00</option>
    <option value='{ "hour" : 1, "minute" : 30 }'>1:30</option>
    <option value='{ "hour" : 2, "minute" : 0 }'>2:00</option>
    <option value='{ "hour" : 2, "minute" : 30 }'>2:30</option>
  </select>
</label>
'''    

    return _view;
  }

  /** Returns the element containing the whole phone form. */
  export function phoneForm() {
    var phone = form("Phone");
    phone.rest.append(phoneWidget().container);
    phone.iconDiv.append($("<img src='/assets/img/phone-placeholder.png' alt='' />"));

    return phone.container;
  }

  /** A widget for entering any number of phone numbers.
   */
  export function phoneWidget() {
'''
<div class="phone-widget" #container>
  <div #phoneNumbers>
  </div>
  <br />
  <a href="#" #anotherNumber>Add another phone number</a>
</div>
'''
    phoneNumbers.append(phoneNumber().container);

    anotherNumber.click(function () {
      phoneNumbers.append(phoneNumber().container);
      return false;
    });

    return _view;
  }

  /** The select and textbox for a phone number of some sort. */
  export function phoneNumber() {
'''
<div class="phone-number" #container>
  <select class="phone-type" #select>
    <option value="Mobile" selected="selected">mobile</option>
    <option value="Work">work</option>
    <option value="Home">home</option>
    <option value="Other">other</option>
  </select>
  <input type="text" class="phone-number" />
</div>
'''

    return _view;
  }

  /** The form for adding accounts for video chat. */
  export function videoWidget() {
'''
<div class="video-widget" #container>
 <div #videoAccounts>
 </div>
 <br />
 <a href="#" #anotherAccount>Add another account</a>
</div>
'''
    videoAccounts.append(videoAccount().container);

    anotherAccount.click(function () {
      videoAccounts.append(videoAccount().container);
      return false;
    });

    return _view;
  }

  export function videoForm() {
    var video = form("Video");

    video.rest.append(videoWidget().container);
    video.iconDiv.append($("<img src='/assets/img/video-placeholder.png' alt='' />"));

    return video.container;
  }

  /** The individual entry for each type of account. */
  export function videoAccount() {
'''
<div class="video-account" #container>
  <select class="account-type" #select>
    <option value="Google" selected="selected">google</option>
    <option value="Skype">skype</option>
  </select>
  <input type="text" class="video-account" />
</div>
'''

    return _view;
  }  

  /** Creates a form for the given meal (ie "breakfast" or "lunch"). */
  export function mealForm(mealName) {
    var meal = form(mealName);

    meal.rest.append(restaurantWidget().container);

    meal.container.addClass(mealName);

    return meal.container;
  }

  /** A place to enter a bunch of restaurants to prefer. */
  export function restaurantWidget() {
'''
<div #container>
  <div #restaurants>
  </div>
  <br />
  <a href="#" #anotherRestaurant>Add another favorite location.</a>
</div>
'''

    restaurants.append(restaurantEntry());

    anotherRestaurant.click(function () {
      restaurants.append(restaurantEntry());
      return false;
    });

    return _view;
  }

  /** Returns the input element for a restaurant. */
  export function restaurantEntry() {
    return $("<input type='text' class='restaurant-entry' />");
  }

  export function locationForm() {
'''
<div #details class="location-details">
  <label>
    <span> Type:  </span>
    <input class="location-type" type="text" />
  </label>
  <br />
  <label>
    <span> Address: </span>
    <input class="location-address" type="text" />
  </label>
  <a href="#" #anotherLocation class="another-location"> Add another location. </a>
</div>
'''    
    
    var location = form("Location");

    location.rest.append(details);

    
    anotherLocation.click(function () {
      $(".preference-categories li.locations ul").append(locationForm());
      return false;
    });

    return location.container;
  }

  export function miscForm() {
'''
<div class="misc-preferences" #container>
  <h1 #header>Misc</h1>
  <textarea></textarea>
</div>
'''

    return container;
  }

  /** A single day/time range for entering a single available block of
   * time. It expects the day in MTWRFSU format.
   */
  export function availabilityEntry() {
'''
<div #container class="availability">
  <input type="text" class="day"></input>, from 
  <input type="text" class="start"></input> to
  <input type="text" class="end"></input>
</div>
'''    

    return container;
  }
}

