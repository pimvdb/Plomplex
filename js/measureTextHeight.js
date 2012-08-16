var measureTextHeight = function(font, text) {
  text = (text == null ? "gM" : String(text));

  var canvas = $("<canvas>").get(0);
  var ctx = canvas.getContext("2d");

  ctx.font = font;
  ctx.textBaseline = "top";
  ctx.fillText(text, 0, 0);

  var width = canvas.width;
  var height = canvas.height;
  var data = ctx.getImageData(0, 0, width, height).data;
  var first = null;
  var last = null;

  heightLoop:
  for(var j = 0; j < height; j++) {
    for(var i = 0; i < width; i++) {
      var index = (j * width + i) * 4 + 3;

      if(data[index]) {
        if(first === null) {
          first = j;
        }

        continue heightLoop;
      }
    }

    if(first !== null) {
      last = j;
      break heightLoop;
    }
  }

  first = first || 0;
  last = last || 0;

  return {
    first:  first,
    last:   last,
    height: last - first
  };
};
