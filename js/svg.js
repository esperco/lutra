/*
 * Replace all SVG images with inline SVG
 */

var svg = (function() {
    var mod = {};

    mod.loadImg = function(elt, url) {
        return $.get(url, function(data) {
            var svg = $(data).find('svg');
            elt.append(svg);
        }, 'xml');
    }

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

// $('img.svg').each(function(){
//     log("this is real");
//     var img = $(this);
//     var imgID = img.attr('id');
//     var imgClass = img.attr('class');
//     var imgURL = img.attr('src');

//     $.get(imgURL, function(data) {
//         // Get the SVG tag, ignore the rest
//         var svg = $(data).find('svg');

//         // Add replaced image's ID to the new SVG
//         if(typeof imgID !== 'undefined') {
//             svg = svg.attr('id', imgID);
//         }
//         // Add replaced image's classes to the new SVG
//         if(typeof imgClass !== 'undefined') {
//             svg = svg.attr('class', imgClass+' replaced-svg');
//         }

//         // Remove any invalid XML tags as per http://validator.w3.org
//         svg = svg.removeAttr('xmlns:a');

//         // Replace image with new SVG
//         img.replaceWith(svg);

//     }, 'xml');

// });
