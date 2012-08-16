// import("use_strict.js")
// import("utils.js")
// import("globals.js")
// import("peg_parser.js")
// import("parser_builder.js")
// import("complexnumber.js")
// import("color.js")
// import("generate.js")

self.addEventListener("message", function(e) {
  try {
    var obj = e.data;

    var formulaResult = parser.parse(obj.func.source);
    obj.func.actual = makeFunction("z", formulaResult.str);
    self._funcs = formulaResult.funcs;

    if(obj.modulus.type === "luminance") {
      var luminanceResult = parser.parse(obj.modulus.luminanceFormula.source);
      obj.modulus.luminanceFormula.actual
        = makeFunction("x", luminanceResult.str);
    }

    var res;
    if(obj.enableProgress) {
      (function() {
        var processedRows = 0;
        var totalRows = obj.size.height;
        var progress = 0;
        var lastProgress = 0;
        res = drawPlot(obj, function() {
          progress = processedRows++ / totalRows;
          if(progress - lastProgress > 0.05) {
            lastProgress = progress;
            self.webkitPostMessage(progress);
          }
        });
      })();
    } else {
      res = drawPlot(obj, function() {});
    }

    res.size = obj.size;
    res.grid = obj.grid;

    self.webkitPostMessage(res);
  } catch(e) {
    self.postMessage({
      exception: {
        stack:   e.stack,
        message: typeof e === "string" ? e : e.message
      }
    });
  }
}, false);
