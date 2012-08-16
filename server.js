var fs = require("fs");
var path = require("path");
var express = require("express");
var less_middleware = require("less-middleware");
var merge_js = require("merge-js");
var app = express.createServer();

var production = true;
var compress = {
  html: production || false,
  css:  production || true,
  js:   production || false
};

var relPath = (function() {
  var pathStart = __dirname + path.sep;
  return function(path) {
    return pathStart + path;
  };
})();

(function() {
  var readJSON = function(path) {
    return JSON.parse(fs.readFileSync(path));
  };
  var exampleFunctions = readJSON(relPath("/json/example_functions.json"));
  var tooltips = readJSON(relPath("/json/tooltips.json"));

  var pageviews = 0;
  var cached;

  app.get("/", function(req, res) {
    pageviews++;

    if(production && cached != null) {
      return res.send(cached);
    }

    res.render(relPath("/views/plot.jade"), {
      version: 1.4,
      compress: compress,
      tooltips: tooltips,
      exampleFunctions: exampleFunctions
    }, function(err, content) {
      if(err) return req.next(err);
      res.send(cached = content);
    });
  });

  app.get("/_LOG_PAGEVIEWS", function(req, res) {
    res.send(String(pageviews));
    req.next();
  });
})();

app.set("view options", {
  layout: false,
  pretty: !compress.html
});

app.use(less_middleware({
  src: relPath("/css"),
  dest: relPath("/gen"),
  compress: compress.css,
  once: production,
  debug: !production
}));

app.use(merge_js.middleware({
  src: relPath("/js"),
  dest: relPath("/gen"),
  uglify: compress.js,
  squeeze: compress.js,
  mangle: compress.js
}));

app.use(express.static(relPath("/public")));
app.use(express.static(relPath("/gen")));

app.on("listening", function() {
  console.log("app started");
}).listen(process.env["app_port"] || 3000);
