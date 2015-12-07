/// <reference path="../marten/ts/Analytics.Web.ts" />
/// <reference path="./Esper.ts" />
/// <reference path="./Login.ts" />
/// <reference path="./Layout.tsx" />
/// <reference path="./Views.Index.tsx" />
/// <reference path="./Views.Profile.tsx" />
/// <reference path="./Views.NotFound.tsx" />
/// <reference path="./Views.LoginRequired.tsx" />
/// <reference path="./Views.Profile.tsx" />
/// <reference path="./Views.EditProfile.tsx" />
/// <reference path="./Views.Search.tsx" />

module Esper.Route {

  // Helper for displaying the login required page
  var loginRequired: PageJS.Callback = function(ctx, next) {
    Login.loginPromise.done(next);
    Login.loginPromise.fail(function() {
        Layout.render(<Views.LoginRequired />);
    });

    // If busy, then we keep showing spinner
  }

  // Helper for displaying the directory edit profile page first time login
  var myProfileRequired: PageJS.Callback = function(ctx, next) {
    DirProfile.profilePromise.done(next);
    DirProfile.profilePromise.fail(function(err: ApiT.Error) {
      if (err['status'] === 404) {
        nav.path("/edit-profile-new");
      } else {
        next();
      }
    });
  }

  var profileRequired: PageJS.Callback = function(ctx, next) {
    if (ctx.params.id !== Login.InfoStore.val().uid) {
      Api.getDirProfile(ctx.params.id).done(function(dirProfile) {
        DirProfile.GuestStore.set(dirProfile, { dataStatus: Model.DataStatus.READY });
        next();
      })
      .fail(function() {
        nav.path("/profile");
      });
    } else {
      DirProfile.GuestStore.set(DirProfile.Store.val(), { dataStatus: Model.DataStatus.READY });
      next();
    }
  }

  var noProfile: PageJS.Callback = function(ctx, next) {
    DirProfile.profilePromise.fail(next);
    DirProfile.profilePromise.done(function() {
      nav.path("/edit-profile");
    });
  }

  // Index page
  pageJs("/", loginRequired, function() {
    nav.path("/profile");
  });

  pageJs("/profile", loginRequired, function() {
    var id = Login.InfoStore.val().uid;
    nav.path("/profile/" + id);
  });

  pageJs("/search", loginRequired, function(ctx) {
    Layout.render(<Views.Search />);
  });

  pageJs("/profile/:id", loginRequired, myProfileRequired, profileRequired, function(ctx) {
    Layout.render(<Views.Profile />);
  });

  pageJs("/edit-profile", loginRequired, myProfileRequired, function() {
    Layout.render(<Views.EditProfile header="Edit Profile" esperProfile={undefined} 
      dirProfile={DirProfile.Store.val()}/>);
  });

  pageJs("/edit-profile-new", loginRequired, noProfile, function() {
    Api.getMyProfile().done(function(profile) {
      Layout.render(<Views.EditProfile header="Create New Profile"
        esperProfile={profile} dirProfile={undefined} />);
    });
  });

  // 404 page
  pageJs('*', function(ctx) {
    // To deal with weird issue where hrefs get too many slashes prepended.
    if (ctx.path.slice(0,2) === "//") {
      nav.path(ctx.path.slice(1));
    } else {
      Log.e(ctx);
      Layout.render(<Views.NotFound />, null, null);
    }
  });

  // Turn on router
  export function init() {
    pageJs({
      click: false,
      hashbang: true
    });
  }

  // Helper functions to navigate
  export module nav {
    // Normalize slashes and hashes
    export function normalize(frag: string) {
      if (frag[0] === "#") {
        frag = frag.slice(1);
      }
      if (frag[0] === "!") {
        frag = frag.slice(1);
      }
      if (frag[0] !== "/") {
        frag = "/" + frag;
      }
      return frag;
    }

    // Navigate to a particular page
    export function path(frag: string, callback?: () => any) {
      pageJs(normalize(frag));
    }

    // Navigate to home page
    export function home() {
      return path("");
    }
  }
}
