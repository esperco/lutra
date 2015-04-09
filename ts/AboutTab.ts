/*
  Team Settings - About Tab
*/

module AboutTab {

  function finishOnboarding(team) {
    window.location.hash = "#!team-settings/" + team.teamid;
  }

  export function load(team : ApiT.Team, onboarding : boolean) {
'''
<div #view>
  <div class="table-header">Understanding How Esper Works</div>
  <ul class="table-list">
    <li class="table-row clearfix" >
      <div class="about-paragraph">
        You can Cc or email your assistants directly to help with any
        scheduling task. Your assistant will use your calendar and preferences
        to pick times that work best for you and propose these to your guest.
        Esper will respond to any email within 1 hour.
      </div>
    </li>
    <li class="table-row clearfix">
      <div class="about-quote">
        <p>Hi Riki,</p>
        <p>Happy to help you and Tavin find a time. Would one of the following
           times work for you?</p>
        <p>
          Wednesday, April 8 at 11:30 am PDT<br/>
          Thursday, April 9 at 4:00 pm PDT<br/>
          Saturday, April 11 at 11:00 am PDT
        </p>
        <p>If not, please let me know some times that would work better for
           you. I can send an invite once we confirm a time.</p>
        <p>Is <span class="fake-link">909-999-9999</span> the best number
           to reach you at in case of any last-minute coordination?</p>
        <p>
          Thanks,<br/>
          Blake Esper<br/>
          <em>Powered by <span class="fake-link">Esper</span></em>
        <p>
      </div>
    </li>
    <li class="table-row clearfix">
      <div class="about-paragraph">
        Once the guest responds and a date is settled, we will send a
        calendar invite to your guest and finalize the event on your
        calendar.
      </div>
    </li>
    <li class="table-row clearfix">
      <div class="no-whitespace">
        <img src="/assets/img/sample-calendar.png" alt="Sample calendar">
      </div>
    </li>
    <li class="table-row clearfix">
      <div class="about-paragraph">
        24 hours before the event, your guest will receive a reminder about
        the meeting, ensuring they show up on time.
      </div>
    </li>
    <li class="table-row clearfix">
      <div class="about-quote">
        <p>Hi Riki,</p>
        <p>This is a friendly reminder that you are scheduled for Call with
           Tavin. The details are below, please feel free to contact me if
           you have any questions regarding this meeting.
        </p>
        <p>
          Call with Tavin<br/>
          Wednesday, April 8 at 11:30 am Pacific Time<br/>
          Tavin to call Riki at <span class="fake-link">909-999-9999</span>
        </p>
        <p>
          Thanks,<br/>
          Blake Esper
        </p>
      </div>
    </li>
    <li class="table-row clearfix">
      <div class="about-paragraph">
        <p>
          You can also send small non-scheduling tasks directly to your
          assistant. Example tasks include:
        </p>
        <ul class="small-task-types">
          <li>» Restaurant reservations</li>
          <li>» Travel arrangements/research (trains, planes, cars, etc.)</li>
          <li>» Tracking down missing packages</li>
          <li>» Event research: venues, caterers, activities</li>
          <li>» Send you reminders</li>
          <li>» Research on miles and points cards</li>
          <li>» Compile shopping list from recipes</li>
          <li>» Populate spreadsheets with readily available data</li>
        </ul>
      </div>
    </li>
  </ul>
  <button #done class="button-primary done-button">Done</button>
</div>
'''
    if (!onboarding) done.remove();
    else {
      done.click(function() {
        done.text("Loading...").attr("disabled", "true");
        finishOnboarding(team);
      });
    }

    return view;
  }

}
