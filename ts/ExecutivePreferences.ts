module Esper.ExecutivePreferences {

  var meals = ["breakfast", "brunch", "lunch", "coffee", "dinner", "drinks"];

  var loaded = false;
  var saved  = true;

  export function dayToThreeLetter(day) {
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
  }

  export function dayFromThreeLetter(day) {
    switch (day.toLowerCase()) {
    case "mon": return "m";
    case "tue": return "t";
    case "wed": return "w";
    case "thu": return "r";
    case "fri": return "f";
    case "sat": return "s";
    case "sun": return "u";

    default : return null;
    }
  }

  /** Parses a time from a string, returning null if the input is
   *  malformed.
   */
  function toTime(str) {
    str = str.replace(/\s/g, "").toLowerCase();
    var parts = [0, 0];
    var pm    = false;

    if (/pm/i.test(str)) {
      pm = true;
    }

    str = str.replace(/(am|pm)/ig, "");

    if (/^\d\d?:\d\d?$/.test(str)) {
      parts = str.split(":");
    } else if (/^\d\d??$/.test(str)) {
      parts[0] = str;
    } else {
      return null;
    }

    if (pm) {
      parts[0] = parts[0] * 1 + 12;
    }

    return {
      hour   : parts[0],
      minute : parts[1]
    }
  }

  function fromTime(time) {
    var minute = time.minute.toString();
    var paddedMinute = minute.length < 2 ? "0" + minute : minute;

    return time.hour + ":" + paddedMinute;
  }

  /** Parses a duration. If there is a :, it's parsed like a normal
   *  time; if there isn't, it's treated as minutes. Returns null if
   *  the input is malformed.
   */
  function parseDuration(str) {
    if (str.indexOf(":") >= 0) {
      return toTime(str);
    } else {
      if (/^\s*\d+\s*$/.test(str)) {
        return {
          hour   : 0,
          minute : str * 1
        }
      } else {
        return null; // should trigger typo warning
      }
    }
  }

  export function load() {
'''
<div #view class="preferences-container">
  <div class="header clearfix">
    <a #logoContainer href="http://esper.com" target="_blank"
       class="img-container-left"/>
    <div class="header-title">
      <span>Meeting Preferences of</span>
      <span #selector/>
    </div>
    <span #signOut class="header-signout clickable">Sign out</span>
  </div>
  <div class="divider"/>
  <div #form class="preference-form"></div>
</div>
'''
    var root = $("#preferences-page");
    root.children().remove();
    root.append(view);
    document.title = "Meeting Preferences - Esper";

    var logo = $("<img class='svg-block header-logo'/>")
      .appendTo(logoContainer);
    Svg.loadImg(logo, "/assets/img/logo.svg");

    selector.append(saveButton());

    loadForm();
  }

  /** Loads the actual preferences form, with saved data prefilled. */
  export function loadForm() {
    if (!loaded) {
      $(".preference-form").append(scaffolding());

      loadPreferences(function (startingPreferences) {
        $(".preference-categories li.calls ul")
          .append(phoneForm(startingPreferences.meeting_types.phone_call));
        $(".preference-categories li.calls ul")
          .append(videoForm(startingPreferences.meeting_types.video_call));

        meals.map(function (meal) {
          return mealForm(meal, startingPreferences.meeting_types[meal]);
        }).forEach(function (element) {
          $(".preference-categories li.meals ul").append(element);
        });

        startingPreferences.workplaces.forEach(function (place) {
          $(".preference-categories li.locations ul")
            .append(locationForm(place));
        });

        $(".preference-categories li.notes ul")
          .append(miscForm(startingPreferences.notes));

        // Turn off saved flag if anything is modified:
        $(".preference-categories input, .preference-categories select")
          .change(function () {
            saved = false;
        });
        $(".preference-categories a").click(function () {
          saved = false;
          return false;
        });

        loaded = true;
      });
    }
  }

  /** Remove the preference forms (but not the team select widget). */
  export function unloadForm() {
    if (loaded) {
      $("#preferences-page div.preference-form").empty();

      loaded = false;
    }
  }

  /** Reload the preference form. This refetches saved data for the
   *  currently selected team.
   */
  export function reloadForm() {
    var go = true;

    if (!saved) {
      go = confirm("Not saved. Continue without saving?");
    }

    if (go) {
      unloadForm();
      loadForm();
    }
  }

  /** Loads the preferences stored on the sever, filling them out any
   *  missing fields with the default preferences. Then passes them
   *  into the given callback.
   */
  export function loadPreferences(callback) {
    var teamid = $("#teamSelect").val();

    var preferences = Api.getPreferences(teamid);

    preferences.done(function (x) {
      Log.d("PREFERENCES", x);
      // wtf goin on here?
      //var p = JSON.parse(x.responseText) || {};

      callback($.extend(true, defaultPreferences(), x));
    });
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

  export function saveToServer(teamid) {
    try {
      var preferences = currentPreferences();

      Api.setPreferences(teamid, preferences);

      saved = true;
    } catch (e) {
      //Status.reportError("Didn't save:", e);
      if (e !== "typo") {
        throw e;
      }
    }
  }

  /** Signals that there was a typo in the given form. */
  function typo(element) {
    element.css("background", "#A83245");
    throw "typo";
  }

  /** Returns the current values in the forms as JSON. */
  export function currentPreferences() {
    // Locations:
    var locations = [];
    $(".location-details").each(function (i, e) {
      locations.push({
        location : {
          title   : $(e).find(".location-type").val(),
          address : $(e).find(".location-address").val()
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

    var notes = $(".misc-preferences").find("textarea").val();

    return {
      workplaces    : locations,
      meeting_types : meetings,
      notes         : notes
    };

    function findDuration(element) {
      var field    = $(element).closest("li").find(".durations input");
      var duration = parseDuration(field.val());

      if (duration === null) {
        typo(field); // throws error; no need to return
      } else {
        return duration;
      }
    }

    function findAvailability(element) {
      var availabilityWidget = $(element).closest("li")
        .find(".customize-availability");

      return availabilityWidget.data("availabilities");
    }

    function phoneNumberList() {
      var res = [];

      $(".phone-widget div.phone-number").each(function (i, e) {
        var share = $(e).find("input[type='checkbox']").is(":checked");
        res.push({
          phone_type   : $(e).find("select").val(),
          phone_number : $(e).find("input[type='text']").val(),
          share_with_guests : share
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
  <span class="save-buttons">
    <a href="#" #save>Save</a>
    <a href="#" #load>Load</a>
  </span>
</div>
'''
    Login.getTeams().forEach(function (team) {
      var name   = team.team_name;
      var teamid = team.teamid;
      var option = $('<option value="' + teamid + '">').text(name);

      teamSelect.append(option);
    });

    save.click(function () {
      var teamid = teamSelect.val();

      if (teamid) {
        saveToServer(teamid);
        container.css("background-color", "green");
        setTimeout(function () {
          container.css("background-color", "white");
        }, 300);
      } else {
        alert("No valid team!");
      }

      return false;
    });

    load.click(function () {
      reloadForm();

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
  <li class="notes">
    <ul class="preference-options">
    </ul>
  </li>
</ul>
'''

    return container;
  }

  function showAvailability(name, defaults, element) {
    CalPicker.createModal(name, defaults, element);
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
  export function form(title, defaults) {
'''
<li #container>
  <div #iconDiv></div>
  <h1 #header>  </h1>
    <form #form class="toggle">
    <label>
      <input type="radio" name="toggle" />
      <span>No</span>
    </label>
    <label>
      <input type="radio" name="toggle" checked="checked" />
      <span>Yes</span>
    </label>
  </form>
  <a class="customize-availability" #customizeAvailability href="#">
    Customize availability
  </a>

  <hr />

  <div class="rest" #rest>
  </div>
</li>
'''

    header.text(title);

    var possibleDurations = durations();
    form.after(possibleDurations.container);

    possibleDurations.input.val(fromTime(defaults.duration));

    // availability.click(function () {
    //   availabilityContainer.append(availabilityEntry());
    //   return false;
    // });

    // defaults.availability.forEach(function (availability) {
    //   addAvailability(_view, availability); // currying would make this prettier
    // });

    customizeAvailability.data("availabilities", defaults.availability);
    customizeAvailability.click(function() {
      showAvailability("text", defaults, customizeAvailability);
    });

    return _view;
  }

  /** Returns a text field for possible meeting durations. */
  export function durations() {
'''
<label class="durations" #container>
  Preferred duration
  <input #input type="text"></input>
</label>
'''

    return _view;
  }

  /** Adds an availiability entry prefilled with the given values. */
  export function addAvailability(form, availability) {
    var element = availabilityEntry();
    form.availabilityContainer.append(element);

    element.find(".day").val(dayFromThreeLetter(availability.avail_from.day));
    element.find(".start").val(fromTime(availability.avail_from.time));
    element.find(".end").val(fromTime(availability.avail_to.time));
  }

  /** Returns the element containing the whole phone form, with the
   *  values preset to the given set of defaults (which should be the
   *  phone_info object directly).
   */
  export function phoneForm(defaults) {
    var phone  = form("Phone", defaults);
    var widget = phoneWidget(defaults.phones);
    phone.rest.append(widget.container);
    phone.iconDiv.append(
      $("<img src='/assets/img/phone-placeholder.png' alt='' />"));

    return phone.container;
  }

  /** A widget for entering any number of phone numbers.
   */
  export function phoneWidget(phones) {
'''
<div class="phone-widget" #container>
  <div #phoneNumbers>
  </div>
  <br />
  <a href="#" #anotherNumber>Add another phone number</a>
</div>
'''
    phones.forEach(function (phone) {
      var element = phoneNumber().container;

      element.find('option[type="' + phone.phone_type + '"]')
        .attr("selected", "selected");
      element.find('input[type="text"]').val(phone.phone_number);

      var checkbox = element.find('input[type="checkbox"]');
      if (phone.share_with_guests) checkbox.prop("checked", true);
      else checkbox.prop("checked", false);

      phoneNumbers.append(element);
    });

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
  <input type="text" class="phone-number" size=12 />
  <input type="checkbox" #share /> Share
</div>
'''

    return _view;
  }

  /** The form for adding accounts for video chat. */
  export function videoWidget(defaults) {
'''
<div class="video-widget" #container>
 <div #videoAccounts>
 </div>
 <br />
 <a href="#" #anotherAccount>Add another account</a>
</div>
'''
    defaults.accounts.forEach(function (account) {
      var type     = account.video_type;
      var username = account.video_username;

      videoAccounts.append(videoAccount(type, username).container);
    });

    anotherAccount.click(function () {
      videoAccounts.append(videoAccount("google", "").container);
      return false;
    });

    return _view;
  }

  export function videoForm(defaults) {
    var video = form("Video", defaults);

    video.rest.append(videoWidget(defaults).container);
    video.iconDiv.append(
      $("<img src='/assets/img/video-placeholder.png' alt='' />"));

    return video.container;
  }

  /** The individual entry for each type of account. */
  export function videoAccount(type, username) {
'''
<div class="video-account" #container>
  <select class="account-type" #select>
    <option value="Google" selected="selected">Google Hangouts</option>
    <option value="Skype">Skype</option>
  </select>
  <input #account type="text" class="video-account" />
</div>
'''
    container.find('option[value="' + type + '"]').attr("selected", "selected");
    account.val(username);

    return _view;
  }

  /** Creates a form for the given meal (ie "breakfast" or "lunch"). */
  export function mealForm(mealName, defaults) {
    var meal = form(mealName.charAt(0).toUpperCase() + mealName.slice(1),
                    defaults);

    meal.rest.append(restaurantWidget(defaults).container);

    meal.container.addClass(mealName);

    return meal.container;
  }

  /** A place to enter a bunch of restaurants to prefer. */
  export function restaurantWidget(defaults) {
'''
<div #container>
  <div #restaurants>
  </div>
  <br />
  <a href="#" #anotherRestaurant>Add another favorite location.</a>
</div>
'''
    defaults.favorites.forEach(function (favorite) {
      restaurants.append(restaurantEntry(favorite));
    });

    anotherRestaurant.click(function () {
      restaurants.append(restaurantEntry({
 title   : "",
        address : ""
      }));
      return false;
    });

    return _view;
  }

  /** Returns the input element for a restaurant. */
  export function restaurantEntry(location) {
    var element = $("<input type='text' class='restaurant-entry' />");
    element.val(location.title);

    return element;
  }

  export function locationForm(defaults) {
'''
<div #details class="location-details">
  <label>
    <span> Type:  </span>
    <input #type class="location-type" type="text" />
  </label>
  <br />
  <label>
    <span> Address: </span>
    <input #address class="location-address" type="text" />
  </label>
  <a href="#" #anotherLocation class="another-location">
    Add another location.
  </a>
</div>
'''

    var location = form("Location", defaults);

    location.rest.append(details);

    type.val(defaults.location.title);
    address.val(defaults.location.address);

    anotherLocation.click(function () {
      $(".preference-categories li.locations ul")
        .append(locationForm(defaultPreferences().workplaces[0]));
      return false;
    });

    return location.container;
  }

  export function miscForm(text) {
'''
<div class="misc-preferences" #container>
  <h1 #header>Misc</h1>
  <textarea rows=5 #textBox></textarea>
</div>
'''
    textBox.val(text);
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
