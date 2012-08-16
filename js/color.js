(function() {
  var abs = Math.abs;

  var fix = function(r, g, b, m) {
    return [
      ~~((r + m) * 255),
      ~~((g + m) * 255),
      ~~((b + m) * 255)
    ];
  };

  _.color = function(z, modulusType, luminanceFormula, hueOffset) {
    var m = _["|"](z);
    var hue = (_["arg_0_2pi"](z) + hueOffset) % pi2;
    var saturation;
    var lightness;

    if(modulusType === "contourLines") {
      var r0 = 0;
      var r1 = 1;

      while(m > r1) {
        r0 = r1;
        r1 = r1 * e;
      }

      var r = (m - r0) / (r1 - r0);

      var P = 2 * (r < 0.5 ? r : 1 - r);
      var Q = 1 - P;

      var P1 = 1 - Q * Q * Q;
      var Q1 = 1 - P * P * P;

      var S = 0.4 + 0.6 * P1;
      var V = 0.6 + 0.4 * Q1;

      var hs = (2 - S) * V;
      saturation = S * V / (hs < 1 ? hs : 2 - hs);
      lightness = hs / 2;

    } else if(modulusType === "luminance") {
      lightness = luminanceFormula(newComplex(m, 0)).re;
      saturation = 1;

    } else if(modulusType === "none") {
      lightness = 0.5;
      saturation = 1;
    }

    var C = (1 - abs(2 * lightness - 1)) * saturation;
    var hueAccent = hue / piD3;
    var X = C * (1 - abs(hueAccent % 2 - 1));
    var m = lightness - 0.5 * C;

    if(hueAccent <= 1) return fix(C, X, 0, m);
    if(hueAccent <= 2) return fix(X, C, 0, m);
    if(hueAccent <= 3) return fix(0, C, X, m);
    if(hueAccent <= 4) return fix(0, X, C, m);
    if(hueAccent <= 5) return fix(X, 0, C, m);
    if(hueAccent <= 6) return fix(C, 0, X, m);

    return fix(0, 0, 0, m);
  };
})();
