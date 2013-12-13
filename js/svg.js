/*
 * Replace all SVG images with inline SVG
 */

var svg = (function() {
  var mod = {};

  var access = {
    get: function(k) {
      return $.ajax({
        url: k,
        type: "GET",
        dataType: "text"
      });
    }
  };

  var svgCache = cache.create(300, 30, access);

  mod.loadImg = function(img, url) {
    return svgCache.getCached(url)
      .then(function(data) {
        var svgRoot = $(data)
          .attr("id", img.attr("id"))
          .attr("src", url)
          .attr("class", img.attr("class"));
        img.replaceWith(svgRoot);
        return svgRoot;
      });
  };

  mod.load = function(url) {
    var result = $("<img/>");
    mod.loadImg(result, url);
    return result;
  };

  mod.init = function() {
    $('img.svg').each(function(){
      var elt = $(this);
      var url = elt.attr('src');
      mod.loadImg(elt, url);
    });
  };

  return mod;
}());
