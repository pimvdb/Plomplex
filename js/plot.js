// import("use_strict.js");
// import("utils.js")
// import("jquery.xVal.js")
// import("jquery.persistForm.js")
// import("measureTextHeight.js")

(function() {
  var savedVersion = +localStorage["whats_new_version"] || 0;

  var preventDefault  = function(e) { e.preventDefault(); };
  var stopPropagation = function(e) { e.stopPropagation(); };

  var clamp = function(x, a, b) {
    return x < a ? a : x > b ? b : x;
  };

  var clearSelection = function() {
    // prevent text cursor when dragging, but don't steal input focus
    if(!$(":focus").is("input")) {
      window.getSelection().removeAllRanges();
    }
  };

  $.fn.bindRange = function() {
    return this.each(function() {
      var $range = $(this);
      var $input = $("<input>", { type: "text", val: $range.xVal() })
                     .insertAfter(this)
                     .addClass("bindRange");

      $input.on("change", function() {
        $range.xVal($input.xVal());
        $input.xVal($range.xVal());  // redisplay values, may be fixed due to
                                     // range errors
      });

      $range.on("change", function() {
        $input.xVal($range.xVal());
      });

      $range.add($input).wrapAll(
        $("<div>").addClass("bindRange")
      );
    });
  };

  $(function() {
    var worker;
    var $plot = $("canvas.plot");
    var cv = $plot.get(0);
    var ctx = cv.getContext("2d");
    var $progress = $("progress");
    var $plot_container = $(".container.plot");
    var $width = $("input.width");
    var $height = $("input.height");

    // Hide through jQuery so that it remembers the defined `display` CSS value
    // (to prevent it from using the default `display` value).
    $.each([
      "div.busy"
    ], function(i, selector) {
      $(selector).hide();
    });

    var initiateWorker = function() {
      worker = new Worker("worker.js");

      $(worker)
        .on("terminate", function(e) {
          this.terminate();
          enableControls();
          initiateWorker();
        })
        .on("message", function(e) {
          var obj = e.originalEvent.data;

          if(typeof obj === "number") {
            $progress.xVal(obj);
          } else if("exception" in obj) {
            showError(obj.exception);
          } else {
            $(".welcome").hide();
            $plot_container.on("dragstart", preventDefault);
            $progress.xVal(1);

            $plot.show().attr({
              width:  obj.size.width,
              height: obj.size.height
            }).css({
              width:  obj.size.resWidth,
              height: obj.size.resHeight
            });

            updatePlotSizeCache();
            fixPanning();

            ctx.putImageData(obj.imageData, 0, 0);
            ctx.textBaseline = "top";
            ctx.textAlign = "center";
            ctx.font = "15pt Segoe UI";
            ctx.strokeStyle = "black";

            if(obj.grid.labels) {
              $.each([
                {
                  pixels: obj.gridColumns,
                  values: obj.gridValuesRe
                },
                {
                  pixels: obj.gridRows,
                  values: obj.gridValuesIm
                }
              ], function(j, combi) {
                $.each(combi.pixels, function(i, v) {
                  if(v === true) {
                    var args = [+combi.values[i].toFixed(10)];

                    if(j === 0) {
                      args.push(+i, obj.reAxisJ);
                    } else {
                      args.push(obj.imAxisI, +i);
                    }

                    var width = ctx.measureText.apply(ctx, args).width;
                    var vertical = measureTextHeight(ctx.font, args[0]);

                    args[2] -= vertical.height + 2;

                    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
                    ctx.fillRect(args[1] - width / 2 - 5,
                                 args[2] + vertical.first - 5,
                                 width + 10,
                                 vertical.height + 10);
                    ctx.fillStyle = "black";
                    ctx.fillText.apply(ctx, args);
                  }
                });
              });
            }

            enableControls();
            console.timeEnd("plot");
          }
        });
    };

    initiateWorker();

    var showError = function(err) {
      console.error(err);

      var details = err.message || err.code ||
                      (typeof err !== "object" ? err : "(no message)");

      $("div.error").text(details).show();

      enableControls();
      console.timeEnd("plot");
    };

    var enableControls = function() {
      $("body").removeClass("busy");
      $(".busy").fadeOut(200);
      $(".mainButtons .submit").prop("disabled", false);
      $(".mainButtons .openImage").prop("disabled", !$plot.is(":visible"));
    };

    $(".cancelPlotting").on("click", function() {
      $(worker).trigger("terminate");
      $(".fakeLink.referencePlot").next("div").remove();
    });

    $(".luminance.container .toggleLink").on("click", function(e) {
      var $formula = $(this).siblings("input").toggle();

      if($formula.is(":visible")) {
        $formula.focus();
      } else {
        e.preventDefault();
      }
    });

    $(".gridLinesWidth")
      .on("input", function() {
        $("input.gridLines").xVal(true);
      })
      // prevent toggling of checkbox (because of label)
      .on("click", preventDefault);

    $(".whatsNew").toggle(savedVersion < version);

    $(".whatsNew .dismiss").on("click", function() {
      localStorage["whats_new_version"] = version;
      $(".whatsNew").hide();
    });

    $("form.plot").persistForm("load");
    if($("input.luminanceFormula").xVal().trim() === "") {
      $("input.luminanceFormula").xVal("atan(ln(x))/pi+0.5");
    }
    $("input.luminanceFormula").hide();

    (function() {
      var last = 0;
      var timeout = null;

      var persist = function() {
        last = Date.now();
        timeout = null;
        $("form.plot").persistForm("save");
      };

      $("form.plot :input").on("change input", function() {
        if(Date.now() - last < 1000) {
          if(timeout == null) {
            timeout = setTimeout(persist, 1000);
          }
        } else {
          persist();
        }
      });

      $(window).on("beforeunload", persist);
    })();

    $(document)
      .on("click", "a[href='#']", preventDefault)
      .on("selectstart", "summary, .fakeLink", preventDefault)
      .on("click", "label", function() {
        var selector = $(this).data("for");
        var $elem = $(selector);
        if($elem.is(":checkbox, :radio")) {
          $elem.prop("checked", function(i, value) {
            return !value;
          });
        } else {
          $elem.focus();
        }
      });

    $(".fakeLink.help").on("click", function() {
      $(".help.container").fadeIn("fast");
    });

    var closeHelp = function() {
      $(".help.container").fadeOut("fast");
      clearSelection();
    };

    $(".help .close").on("click", closeHelp);

    $("body").on("keyup", function(e) {
      if(e.which === 27) {
        closeHelp();
      }
    });

    var plotFunction = function(str, iterations, reMin) {
      $("input.formula").xVal(str);
      $("input.iterations").xVal(iterations);
      $(".ranges input").xVal("");
      $(".ranges.re input.min").xVal(reMin);
      $("form.plot").persistForm("save").submit();
    };

    $(".fakeLink.referencePlot").on("click", function(e) {
      var $pleaseWait = $(this).next(".pleaseWait");
      if(!$pleaseWait.is(":visible")) {
        $pleaseWait.show();
        plotFunction("z", 1, -5);
      }
    });

    (function() {
      var $ranges = $(".ranges input");
      $ranges.on("focus keydown", function() {
        $ranges.attr("placeholder", "");
      });
    })();

    $(window).on("resize", function() {
      updatePlotSizeCache();
      fixPanning();
    });

    $("input.quality, input.argument").bindRange();

    $("form.plot").on("submit", function(e) {
      e.preventDefault();

      if($(":focus").is("input.bindRange")) {
        return;
      }

      console.time("plot");
      clearSelection();
      $("div.error").text("").hide();
      $("div.busy").show();
      $(".mainButtons input").prop("disabled", true);

      var assert = function(cond, msg) {
        if(!cond) {
          throw msg;
        }
      };

      try {
        var funcString     = $("input.formula").xVal();
        var width          = $("input.width").xVal();
        var height         = $("input.height").xVal();
        var quality        = $("input.quality").xVal();
        var resWidth       = ~~Math.max(1, width * quality);
        var resHeight      = ~~Math.max(1, height * quality);
        var iterations     = $("input.iterations").xVal();
        var gridLines      = $("input.gridLines").xVal();
        var gridLinesWidth = +$("input.gridLinesWidth").xVal();
        var gridAxes       = $("input.gridAxes").xVal();
        var gridLabels     = $("input.gridLabels").xVal();
        var modulusType    = $("form.plot").radioValue("modulusType");

        assert(funcString.trim() !== "", "No formula entered");
        assert(gridLinesWidth > 0, "Bad grid unit");

        var imageData = ctx.getImageData(0, 0, resWidth, resHeight);

        var checkDefault = function(axis, type, def) {
          var selector = ".ranges.% input.%".printf(axis, type);
          var manual = $(selector).xVal();

          if(manual.trim() !== "") {
            return +manual;
          } else {
            def = +def.toFixed(10);
            $(selector).xVal("").attr("placeholder", def);
            return def;
          }
        };

        var reMin = checkDefault("re", "min", -5);
        var reMax = checkDefault("re", "max", -reMin);

        var imTot = (reMax - reMin) * height / width;

        var imMin = checkDefault("im", "min", -imTot / 2);
        var imMax = checkDefault("im", "max", imTot + imMin);

        assert(![reMin, reMax, imMin, imMax].some(Number.isNaN), "Bad ranges");
        assert(reMin < reMax && imMin < imMax, "Bad ranges");

        var enableProgress = $("input.enableProgress").xVal();
        $progress.toggle(enableProgress).xVal(0);

        worker.webkitPostMessage({
          imageData: imageData,
          enableProgress: enableProgress,
          compress: compress,
          func: {
            source: funcString,
            iterations: iterations
          },
          size: {
            width: resWidth,
            height: resHeight,
            resWidth: width,
            resHeight: height
          },
          grid: {
            lines: gridLines,
            linesWidth: gridLinesWidth,
            axes: gridAxes,
            labels: gridLabels
          },
          ranges: {
            re: {
              min: reMin,
              max: reMax
            },
            im: {
              min: imMin,
              max: imMax
            }
          },
          argument: {
            hueOffset: $("input.argument").xVal()
          },
          modulus: {
            type: modulusType,
            luminanceFormula: {
              source: $("input.luminanceFormula").xVal()
            }
          }
        });

        $("body").addClass("busy");
      } catch(err) {
        showError(err);
      }
    });

    var plotWidth, plotHeight;
    var contWidth, contHeight;
    var plotLeft = 0, plotTop = 0;

    var updatePlotSizeCache = function() {
      plotWidth = $plot.width();
      plotHeight = $plot.height();
      contWidth = $plot_container.width();
      contHeight = $plot_container.height();
    };

    updatePlotSizeCache();

    var fixPanning = function() {
      var marginWidth = contWidth - plotWidth;
      var marginHeight = contHeight - plotHeight;
      var left = plotWidth < contWidth
                   ? marginWidth / 2
                   : clamp(plotLeft, marginWidth, 0);
      var top = plotHeight < contHeight
                  ? marginHeight / 2
                  : clamp(plotTop, marginHeight, 0);

      $plot.css({
        left: ~~left,
        top:  ~~top
      });
    };

    $(".openImage").on("click", function() {
      var popup = window.open("image.html");

      $(popup).on("load", function() {
        $("<h1>", {
          text: "Please wait...",
          css: {
            "font": "300% sans-serif",
            "padding-top": "50px",
            "text-align": "center"
          }
        }).appendTo(this.document.body);
      }).on("close", function() {
        $(this).off("load");
      });

      // Trim leading "data:image/png;base64,"
      var data = atob(cv.toDataURL("image/png").slice(22));

      window.webkitRequestFileSystem(
        window.TEMPORARY,
        data.length,
        function(fs) {
          fs.root.getFile("plot.png", { create: true }, function(fileEntry) {
            fileEntry.createWriter(function(fileWriter) {
              if(!delete fileWriter.length) return popup.close();

              var arr = new Uint8Array(data.length);

              for(var i = 0; i < data.length; i++) {
                arr[i] = data.charCodeAt(i) & 0xff;
              }

              var blob = new Blob([arr]);

              $(fileWriter)
                .on("writeend", function() {
                  $(popup).off("load");
                  if(popup.location) {
                    popup.location.href = fileEntry.toURL();
                  }
                })
                .on("error", function(e) {
                  popup.close();
                  showError(e);
                });

              fileWriter.write(blob);
            }, showError);
          }, showError);
        },
        showError
      );
    });

    var down = false, startX, startY, startLeft, startTop;

    $("html")
      .on("mouseup", function() {
        down = false;
      })
      .on("mousemove", function(e) {
        if(!down) return;

        plotLeft = e.pageX - startX + startLeft;
        plotTop = e.pageY - startY + startTop;

        fixPanning();
      });

    $plot_container
      .on("mousedown", function(e) {
        down = true;

        startX = e.pageX;
        startY = e.pageY;

        var offset = $plot.offset();
        startLeft = offset.left;
        startTop = offset.top;
      });

    $(".help.content").on("click", "summary", function() {
      var $thisDetails = $(this).closest("details");
      $(".help.content details").not($thisDetails).prop("open", false);
    });

    $(".help .exampleFunctions").on("click", "li", function() {
      var funcData = $(this).data("func");
      plotFunction(funcData.func, funcData.iterations || 1, funcData.reMin);
      closeHelp();
    });

    $("code:contains('f(z) = z')").wrap("<nobr>");
  });
})();
