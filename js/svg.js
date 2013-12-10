/*
 * Replace all SVG images with inline SVG
 */

var svg = (function() {
    var mod = {};

    mod.loadImg = function(img, url) {
      return $.ajax({
        url: url,
        type: "GET",
        dataType: "xml"
      })
        .then(function(data) {
          var svgRoot = $(data).find('svg')
            .attr("id", img.attr("id"))
            .attr("src", url)
            .attr("class", img.attr("class"));
          img.replaceWith(svgRoot);
          return svgRoot;
        });
    };
/*
      return $.get(url, function(data) {
        var svgRoot = $(data).find('svg')
          .attr("id", img.attr("id"))
          .attr("src", url)
          .attr("class", img.attr("class"));
        img.replaceWith(svgRoot);
        return svgRoot;
      }, 'xml');
*/

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
