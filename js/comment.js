function viewOfComments(comments) {
  var view = $("<div class='comments'/>");

  var title = $("<h6/>")
    .text("Comments")
    .appendTo(view);

  for (var i in comments) {
    var a = comments[i];
    if ("string" === typeof a.comment_audio) {
      viewOfAudioComment(a)
        .appendTo(view);
    }
    if ("string" === typeof a.comment_text) {
      viewOfTextComment(a)
        .appendTo(view);
    }
  }
  return view;
}

function viewOfTextComment(comment) {
  var view = $("<div class='comment'/>")
    .text(comment.comment_text);
  profile.get(comment.comment_by)
    .done(function(obs_prof) {
      if (obs_prof) {
        var authorView = $("<span></span>")
          .append(profile.view.author(obs_prof))
          .appendTo(view);

        /* update automatically when profile changes */
        obs_prof.bind("change", function(ev, attr, how, newVal, oldVal) {
          authorView.children().replaceWith(profile.view.author(obs_prof));
        });
      }
    });
  return view;
}

/*
  TODO: for wider browser support we should offer both an mp3 and an ogg
  version of each audio recording.
  Sample sounds for testing:
  http://www.w3schools.com/html/horse.mp3
  http://www.w3schools.com/html/horse.ogg
*/
function viewOfAudioComment(comment) {
  var view = $("<div class='comment'/>");

  var player = $("<audio/>")
    .prop("controls", true)
    .text("Your browser doesn't support the audio element.")
    .appendTo(view);

  var source = $("<source/>")
    .attr("src", comment.comment_audio)
  //.attr("type", "audio/ogg")
    .appendTo(player);

  return view;
}
