/** This is the toplevel module for the UI that contains tools to help
 * with group scheduling.
 */
module Esper.GroupTab {
  /** Returns the top-level container for the group scheduling tab. */
  export function container() {
'''
<div #container class="esper-tab-container">
  <div class="esper-tab-header">
    <h1>
      Title
    </h1>
    <input #title type="text" class="esper-input"></input>
  </div>
  <div class="esper-section">
    <div class="esper-section-header esper-clearfix esper-open">
      <h1> Guests </h1>
      <span class="esper-hide-section esper-link">Hide</span>
    </div>
    <div class="esper-section-container">
      <ul #people class="esper-group-people">
      </ul>
    </div>
  </div>
</div>
'''
    var sections = container.find(".esper-section");
    sections.each(function (i, section) {
      $(section).find(".esper-hide-section").click(function () {
        $(section).find(".esper-section-container").slideToggle("fast");
      });
    });

    var availabilities = ["yes", "no", "maybe"];

    function nextAvailability(current) {
      var index = availabilities.indexOf(current);
      return availabilities[(index + 1) % availabilities.length];
    }

    function availabilityClass(availability) {
      return "esper-availability-" + availability;
    }

    var guests = [{ name : "Peter Esper", availability : "none" },
                  { name : "Lois Esper", availability : "none" },
                  { name : "Foo Bar", availability : "none" }];

    guests.forEach(function (guest) {
      var element = $("<li>").text(guest.name);
      element.addClass(availabilityClass("none"));

      element.mousedown(function (e) {
        e.preventDefault()
        return false;
      });

      element.click(function () {
        element.removeClass(availabilityClass(guest.availability));
        
        guest.availability = nextAvailability(guest.availability);

        element.addClass(availabilityClass(guest.availability));
      });

      var close = $("<div class=\"esper-close\">").text("x");
      close.click(function () {
        element.slideUp();
        guest.availability = "none";

        return false;
      });
      element.append(close);

      people.append(element);
    });

    return container;
    
  }

  /** A list element that contains a person's name and can be delete
   *  from the list with an "x".
   */
  export function personWidget(name: string) {
'''

'''
  }
}
