//
// SimcirJS - DSO
//
// Copyright (c) 2016 Kazuhiko Arase
//
// URL: http://www.d-project.com/
//
// Licensed under the MIT license:
//  http://www.opensource.org/licenses/mit-license.php
//

// includes following device types:
//  DSO

!function($s) {

  'use strict';

  var $ = $s.$;

  // unit size
  var unit = $s.unit;

  var createDSOFactory = function() {

    var colors = [
      '#ff00cc',
      '#ffcc00',
      '#ccff00',
      '#00ffcc',
      '#00ccff',
      '#cc00ff'
    ];
    var timeRanges = [10000, 5000, 2000, 1000];
    var maxTimeRange = timeRanges[0];

    var createProbe = function(color) {

      var samples = [];

      var model = {
        valueRange : 1,
        timeRange : maxTimeRange
      };

      var $path = $s.createSVGElement('path').
        css('fill', 'none').
        css('stroke-width', 1).
        css('stroke-linejoin', 'bevel').
        css('stroke', color);

      var setValueRange = function(valueRange) {
        model.valueRange = valueRange;
      };

      var setTimeRange = function(timeRange) {
        model.timeRange = timeRange;
      };

      var update = function(ts, x, y, width, height) {
        var d = '';
        for (var i = samples.length - 1; i >= 0; i -= 1) {
          var last = i - 1 >= 0 && ts - samples[i - 1].ts > model.timeRange;
          var val = samples[i].value;
          if (!last && i > 0 && i + 1 < samples.length &&
              samples[i - 1].value === val &&
              samples[i + 1].value === val) {
            continue;
          }
          if (typeof val != 'number') {
            val = 0;
          }
          var sx = x + width - (ts - samples[i].ts) / model.timeRange * width;
          var sy = y + height - val / model.valueRange * height;
          d += d == ''? 'M' : 'L';
          d += sx + ' ' + sy;
          if (last) {
            break;
          }
        }
        $path.attr('d', d);
      };

      var sample = function(ts, value) {
        samples.push({ts: ts, value: value});
        while (ts - samples[0].ts > maxTimeRange) {
          samples.shift();
        }
      };

      return {
        $ui : $path,
        setValueRange : setValueRange,
        setTimeRange : setTimeRange,
        update : update,
        sample : sample
      };
    };

    var createPanel = function() {

      var $lcd = $s.createSVGElement('path').
        css('stroke', 'none').css('fill', '#ffcc00');
      var setLCDText = function(text) {
        $lcd.attr('d', createFontPath(text, 4, 4, 1) );
      };
      var $lcdPanel = $s.createSVGElement('g').
        append($s.createSVGElement('rect').
          css('stroke', 'none').
          css('fill', '#000000').
          attr({x : 0, y : 0, width: unit * 7, height : unit}) ).
        append($lcd).
        on('mousedown', function(event) {
          event.preventDefault();
          event.stopPropagation();
          $panel.trigger('timeRangeDown');
        });
      $s.transform($lcdPanel, unit * 1.5, 0);

      var $playing = $s.createSVGElement('path').
        attr('d', 'M' + unit / 4 + ' ' + unit / 4 +
            'L' + unit / 4 * 3 + ' ' + unit / 2 +
            'L' + unit / 4 + ' ' + unit / 4 * 3 + 'Z').
        css('stroke-width', 1);
      var btnAttr = {x : 0, y : 0, width : unit, height : unit,
          rx : 1, ry : 1};
      var $btnRect = $s.createSVGElement('rect').
        attr(btnAttr).
        css('stroke', 'none').
        css('fill', '#999999').
        css('opacity', 0);
      var $btn = $s.createSVGElement('g').
        append($btnRect).
        append($s.createSVGElement('rect').
            attr(btnAttr).
            css('stroke-width', 1).
            css('stroke', '#666666').
            css('fill', 'none') ).
        append($playing).
        on('mousedown', function(event) {
          event.preventDefault();
          event.stopPropagation();
          $panel.trigger('playDown');
        });

      var $panel = $s.createSVGElement('g').
        append($btn).append($lcdPanel);

      return {
        $ui : $panel,
        setPlaying : function(playing) {
          $playing.css('fill', playing? '#00ff00' : '#006600').
            css('stroke', playing? '#00cc00' : '#003300');
        },
        setTimeRange : function(timeRange) {
          var unit = 'ms';
          if (timeRange > 5000) {
            unit = 's';
            timeRange /= 1000;
          }
          setLCDText('TimeRange:' + timeRange + unit);
        }
      };
    };

    return function(device) {

      var numInputs = Math.max(1,
          device.deviceDef.numInputs || 4);
      var scale = 1;
      var gap = 2;

      for (var i = 0; i < numInputs; i += 1) {
        device.addInput();
      }

      var state = device.deviceDef.state ||
        { playing : true, rangeIndex : 0 };
      device.getState = function() {
        return state;
      };

      device.getSize = function() {
        return { width : unit * 4,
          height : unit * (numInputs * scale + 2) };
      };

      var super_createUI = device.createUI;
      device.createUI = function() {
        super_createUI();

        var $display = $s.createSVGElement('g');
        device.$ui.append($display);
        $s.transform($display, unit / 2, unit / 2);

        var $rect = $s.createSVGElement('rect').
          css('stroke', 'none').css('fill', '#000000').
          attr({x: 0, y: 0, width: unit * 3,
            height: unit * numInputs * scale });
        $display.append($rect);

        var probes = [];
        for (var i = 0; i < device.getInputs().length; i += 1) {
          var inNode = device.getInputs()[i];
          $s.transform(inNode.$ui, 0, unit *
              (0.5 + 0.5 * scale + i * scale) );
          var probe = createProbe(colors[i % colors.length]);
          probes.push(probe);
          $display.append(probe.$ui);
        }

        var setTimeRange = function(timeRange) {
          panel.setTimeRange(timeRange);
          for (var i = 0; i < probes.length; i += 1) {
            probes[i].setTimeRange(timeRange);
          }
        };

        var panel = createPanel();
        panel.$ui.on('playDown', function(event){
            state.playing = !state.playing;
            panel.setPlaying(state.playing);
          }).on('timeRangeDown', function(event) {
            state.rangeIndex = (state.rangeIndex + 1) % timeRanges.length;
            setTimeRange(timeRanges[state.rangeIndex]);
          });
        device.$ui.append(panel.$ui.css('display', 'none') );
        $s.transform(panel.$ui, unit / 2,
            unit * numInputs * scale + unit / 4 * 3);

        panel.setPlaying(state.playing);
        setTimeRange(timeRanges[state.rangeIndex] || timeRanges[0]);

        var alive = false;
        var render = function(ts) {
          for (var i = 0; i < device.getInputs().length; i += 1) {
            probes[i].sample(ts, device.getInputs()[i].getValue() );
            if (state.playing) {
              probes[i].update(ts, 0, unit * i * scale + gap,
                  unit * 15, unit * scale - gap * 2);
            }
          }
          if (alive) {
            window.requestAnimationFrame(render);
          }
        };

        device.$ui.on('deviceAdd', function() {

          device.$ui.children('.simcir-device-body').
            attr('width', unit * 16);
          device.$ui.children('.simcir-device-label').
            attr('x', unit * 8);
          $rect.attr('width', unit * 15);
          panel.$ui.css('display', '');

          alive = true;
          window.requestAnimationFrame(render);

        }).on('deviceRemove', function() {
          alive = false;
        });

        device.doc = {
          params: [
            {name: 'numInputs', type: 'number',
              defaultValue: 4,
              description: 'number of inputs.'}
          ],
          code: '{"type":"' + device.deviceDef.type + '","numInputs":4}'
        };
      };
    };
  };

  var createFontPath = function() {
    var data = {
      "\u0020":[0,0,0,0,0,0,0],
      "!":[4,4,4,4,0,0,4],
      "\"":[10,10,10,0,0,0,0],
      "#":[10,10,31,10,31,10,10],
      "$":[4,30,5,14,20,15,4],
      "%":[3,19,8,4,2,25,24],
      "&":[6,9,5,2,21,9,22],
      "'":[6,4,2,0,0,0,0],
      "(":[8,4,2,2,2,4,8],
      ")":[2,4,8,8,8,4,2],
      "*":[0,4,21,14,21,4,0],
      "+":[0,4,4,31,4,4,0],
      ",":[0,0,0,0,6,4,2],
      "-":[0,0,0,31,0,0,0],
      ".":[0,0,0,0,0,6,6],
      "/":[0,16,8,4,2,1,0],
      "0":[14,17,25,21,19,17,14],
      "1":[4,6,4,4,4,4,14],
      "2":[14,17,16,8,4,2,31],
      "3":[31,8,4,8,16,17,14],
      "4":[8,12,10,9,31,8,8],
      "5":[31,1,15,16,16,17,14],
      "6":[12,2,1,15,17,17,14],
      "7":[31,16,8,4,2,2,2],
      "8":[14,17,17,14,17,17,14],
      "9":[14,17,17,30,16,8,6],
      ":":[0,6,6,0,6,6,0],
      ";":[0,6,6,0,6,4,2],
      "<":[8,4,2,1,2,4,8],
      "=":[0,0,31,0,31,0,0],
      ">":[2,4,8,16,8,4,2],
      "?":[14,17,16,8,4,0,4],
      "@":[14,17,16,18,21,21,14],
      "A":[14,17,17,17,31,17,17],
      "B":[15,17,17,15,17,17,15],
      "C":[14,17,1,1,1,17,14],
      "D":[7,9,17,17,17,9,7],
      "E":[31,1,1,15,1,1,31],
      "F":[31,1,1,15,1,1,1],
      "G":[14,17,1,29,17,17,14],
      "H":[17,17,17,31,17,17,17],
      "I":[14,4,4,4,4,4,14],
      "J":[28,8,8,8,8,9,6],
      "K":[17,9,5,3,5,9,17],
      "L":[1,1,1,1,1,1,31],
      "M":[17,27,21,21,17,17,17],
      "N":[17,17,19,21,25,17,17],
      "O":[14,17,17,17,17,17,14],
      "P":[15,17,17,15,1,1,1],
      "Q":[14,17,17,17,21,9,22],
      "R":[15,17,17,15,5,9,17],
      "S":[30,1,1,14,16,16,15],
      "T":[31,4,4,4,4,4,4],
      "U":[17,17,17,17,17,17,14],
      "V":[17,17,17,17,17,10,4],
      "W":[17,17,17,21,21,21,10],
      "X":[17,17,10,4,10,17,17],
      "Y":[17,17,17,10,4,4,4],
      "Z":[31,16,8,4,2,1,31],
      "[":[14,2,2,2,2,2,14],
      "\\":[0,1,2,4,8,16,0],
      "]":[14,8,8,8,8,8,14],
      "^":[4,10,17,0,0,0,0],
      "_":[0,0,0,0,0,0,31],
      "`":[2,4,8,0,0,0,0],
      "a":[0,0,14,16,30,17,30],
      "b":[1,1,1,15,17,17,15],
      "c":[0,0,30,1,1,1,30],
      "d":[16,16,16,30,17,17,30],
      "e":[0,0,14,17,31,1,30],
      "f":[8,20,4,14,4,4,4],
      "g":[0,0,30,17,30,16,15],
      "h":[1,1,1,15,17,17,17],
      "i":[0,4,0,4,4,4,4],
      "j":[8,0,8,8,8,9,6],
      "k":[2,2,18,10,6,10,18],
      "l":[6,4,4,4,4,4,14],
      "m":[0,0,27,21,21,21,17],
      "n":[0,0,13,19,17,17,17],
      "o":[0,0,14,17,17,17,14],
      "p":[0,0,15,17,15,1,1],
      "q":[0,0,30,17,30,16,16],
      "r":[0,0,13,19,1,1,1],
      "s":[0,0,30,1,14,16,15],
      "t":[4,4,31,4,4,20,8],
      "u":[0,0,17,17,17,17,14],
      "v":[0,0,17,17,17,10,4],
      "w":[0,0,17,17,21,21,10],
      "x":[0,0,17,10,4,10,17],
      "y":[0,0,17,10,4,4,2],
      "z":[0,0,31,8,4,2,31],
      "{":[12,2,2,1,2,2,12],
      "|":[4,4,4,4,4,4,4],
      "}":[6,8,8,16,8,8,6],
      "~":[16,14,1,0,0,0,0]
    };
    var getCharPath = function(c, x, y, s) {
      var d = '';
      var cdata = data[c] || data['?'];
      for (var cy = 0; cy < cdata.length; cy += 1) {
        for (var cx = 0; cx < 5; cx += 1) {
          if ( (cdata[cy] >> cx) & 1) {
            d += 'M' + (x + cx) * s + ' ' + (y + cy) * s;
            d += 'L' + (x + cx + 1) * s + ' ' + (y + cy) * s;
            d += 'L' + (x + cx + 1) * s + ' ' + (y + cy + 1) * s;
            d += 'L' + (x + cx) * s + ' ' + (y + cy + 1) * s;
            d += 'Z';
          } 
        }
      }
      return d;
    };
    return function(s, x, y, scale) {
      scale = scale || 1;
      var d = '';
      for (var i = 0; i < s.length; i += 1) {
        d += getCharPath(s.charAt(i), x + i * 6, y, scale);
      }
      return d;
    };
  }();

  $s.registerDevice('DSO', createDSOFactory() );

}(simcir);
