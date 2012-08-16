(function() {
  self.drawPlot = function(obj, rowProcessed) {
    var f = obj.func.actual;
    var width = obj.size.width;
    var height = obj.size.height;

    var re = obj.ranges.re;
    var im = obj.ranges.im;
    re.step = (re.max - re.min) / width;
    im.step = (im.max - im.min) / height;

    var data = obj.imageData.data;
    var dataCounter = 0;

    var gridColumns = {};
    var gridRows = {};
    var gridValuesRe = {};
    var gridValuesIm = {};

    var reAxisJ;
    var imAxisI;

    var populateIJs = function(objPixels, objValues, min, max, step, d, partToPixel) {
      var should = true;
      var start = min - min % step;
      if(start === min || isNaN(start)) {
        start = min + step;
      }
      step = step || d;
      var zeroTolerance = -step / 4;

      for(var m = start; m < max; m += step) {
        var x = Math.round(partToPixel((m - min) / (max - min)));

        if(obj.grid.lines) {
          objPixels[x] = true;
          objValues[x] = m;
        }

        if(should && m >= zeroTolerance) {
          should = false;
          if(obj.grid.axes) {
            objPixels[x] = true;
            objValues[x] = m;
            objPixels[x - 1] = objPixels[x + 1] = 1;
          }
          if(objPixels === gridRows) {
            reAxisJ = x;
          } else {
            imAxisI = x;
          }
        }
      }
    };

    populateIJs(gridColumns, gridValuesRe, re.min, re.max, obj.grid.linesWidth, re.step, function(part) {
      return part * width;
    });

    populateIJs(gridRows, gridValuesIm, im.min, im.max, obj.grid.linesWidth, im.step, function(part) {
      return height - part * height;
    });

    var add = function(a, b, c) {
      data[dataCounter++] = a;
      data[dataCounter++] = b;
      data[dataCounter++] = c;
      data[dataCounter++] = 255;
    };

    jLoop: for(var j = 0; j < height; j++) {
      rowProcessed();

      if(gridRows[j]) {
        for(var m = 0; m < width; m++) {
          add(0, 0, 0);
        }
        continue jLoop;
      }

      iLoop: for(var i = 0; i < width; i++) {
        if(gridColumns[i]) {
          add(0, 0, 0);
          continue iLoop;
        }

        var z = newComplex(
          re.step * i + re.min,
          im.step * (height - j) + im.min
        );

        for(var t = 0; t < obj.func.iterations; t++) {
          z = f(z);
        }

        var color = _.color(z, obj.modulus.type, obj.modulus.luminanceFormula.actual, obj.argument.hueOffset);
        add(color[0], color[1], color[2]);
      }
    }

    return {
      imageData: obj.imageData,
      reAxisJ: reAxisJ,
      imAxisI: imAxisI,
      gridColumns: gridColumns,
      gridRows: gridRows,
      gridValuesRe: gridValuesRe,
      gridValuesIm: gridValuesIm
    };
  };
})();
