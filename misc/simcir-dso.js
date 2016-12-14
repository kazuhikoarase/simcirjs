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

!function($, $s) {

  'use strict';

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
      "0":[0x0e,0x11,0x19,0x15,0x13,0x11,0x0e],
      "1":[0x04,0x06,0x04,0x04,0x04,0x04,0x0e],
      "2":[0x0e,0x11,0x10,0x08,0x04,0x02,0x1f],
      "3":[0x1f,0x08,0x04,0x08,0x10,0x11,0x0e],
      "4":[0x08,0x0c,0x0a,0x09,0x1f,0x08,0x08],
      "5":[0x1f,0x01,0x0f,0x10,0x10,0x11,0x0e],
      "6":[0x0c,0x02,0x01,0x0f,0x11,0x11,0x0e],
      "7":[0x1f,0x10,0x08,0x04,0x02,0x02,0x02],
      "8":[0x0e,0x11,0x11,0x0e,0x11,0x11,0x0e],
      "9":[0x0e,0x11,0x11,0x1e,0x10,0x08,0x06],
      "\u0020":[0x00,0x00,0x00,0x00,0x00,0x00,0x00],
      "!":[0x04,0x04,0x04,0x04,0x00,0x00,0x04],
      "\"":[0x0a,0x0a,0x0a,0x00,0x00,0x00,0x00],
      "#":[0x0a,0x0a,0x1f,0x0a,0x1f,0x0a,0x0a],
      "$":[0x04,0x1e,0x05,0x0e,0x14,0x0f,0x04],
      "%":[0x03,0x13,0x08,0x04,0x02,0x19,0x18],
      "&":[0x06,0x09,0x05,0x02,0x15,0x09,0x16],
      "'":[0x06,0x04,0x02,0x00,0x00,0x00,0x00],
      "(":[0x08,0x04,0x02,0x02,0x02,0x04,0x08],
      ")":[0x02,0x04,0x08,0x08,0x08,0x04,0x02],
      "*":[0x00,0x04,0x15,0x0e,0x15,0x04,0x00],
      "+":[0x00,0x04,0x04,0x1f,0x04,0x04,0x00],
      ",":[0x00,0x00,0x00,0x00,0x06,0x04,0x02],
      "-":[0x00,0x00,0x00,0x1f,0x00,0x00,0x00],
      ".":[0x00,0x00,0x00,0x00,0x00,0x06,0x06],
      "/":[0x00,0x10,0x08,0x04,0x02,0x01,0x00],
      ":":[0x00,0x06,0x06,0x00,0x06,0x06,0x00],
      ";":[0x00,0x06,0x06,0x00,0x06,0x04,0x02],
      "<":[0x08,0x04,0x02,0x01,0x02,0x04,0x08],
      "=":[0x00,0x00,0x1f,0x00,0x1f,0x00,0x00],
      ">":[0x02,0x04,0x08,0x10,0x08,0x04,0x02],
      "?":[0x0e,0x11,0x10,0x08,0x04,0x00,0x04],
      "@":[0x0e,0x11,0x10,0x12,0x15,0x15,0x0e],
      "A":[0x0e,0x11,0x11,0x11,0x1f,0x11,0x11],
      "B":[0x0f,0x11,0x11,0x0f,0x11,0x11,0x0f],
      "C":[0x0e,0x11,0x01,0x01,0x01,0x11,0x0e],
      "D":[0x07,0x09,0x11,0x11,0x11,0x09,0x07],
      "E":[0x1f,0x01,0x01,0x0f,0x01,0x01,0x1f],
      "F":[0x1f,0x01,0x01,0x0f,0x01,0x01,0x01],
      "G":[0x0e,0x11,0x01,0x1d,0x11,0x11,0x0e],
      "H":[0x11,0x11,0x11,0x1f,0x11,0x11,0x11],
      "I":[0x0e,0x04,0x04,0x04,0x04,0x04,0x0e],
      "J":[0x1c,0x08,0x08,0x08,0x08,0x09,0x06],
      "K":[0x11,0x09,0x05,0x03,0x05,0x09,0x11],
      "L":[0x01,0x01,0x01,0x01,0x01,0x01,0x1f],
      "M":[0x11,0x1b,0x15,0x15,0x11,0x11,0x11],
      "N":[0x11,0x11,0x13,0x15,0x19,0x11,0x11],
      "O":[0x0e,0x11,0x11,0x11,0x11,0x11,0x0e],
      "P":[0x0f,0x11,0x11,0x0f,0x01,0x01,0x01],
      "Q":[0x0e,0x11,0x11,0x11,0x15,0x09,0x16],
      "R":[0x0f,0x11,0x11,0x0f,0x05,0x09,0x11],
      "S":[0x1e,0x01,0x01,0x0e,0x10,0x10,0x0f],
      "T":[0x1f,0x04,0x04,0x04,0x04,0x04,0x04],
      "U":[0x11,0x11,0x11,0x11,0x11,0x11,0x0e],
      "V":[0x11,0x11,0x11,0x11,0x11,0x0a,0x04],
      "W":[0x11,0x11,0x11,0x15,0x15,0x15,0x0a],
      "X":[0x11,0x11,0x0a,0x04,0x0a,0x11,0x11],
      "Y":[0x11,0x11,0x11,0x0a,0x04,0x04,0x04],
      "Z":[0x1f,0x10,0x08,0x04,0x02,0x01,0x1f],
      "[":[0x0e,0x02,0x02,0x02,0x02,0x02,0x0e],
      "\\":[0x00,0x01,0x02,0x04,0x08,0x10,0x00],
      "]":[0x0e,0x08,0x08,0x08,0x08,0x08,0x0e],
      "^":[0x04,0x0a,0x11,0x00,0x00,0x00,0x00],
      "_":[0x00,0x00,0x00,0x00,0x00,0x00,0x1f],
      "`":[0x02,0x04,0x08,0x00,0x00,0x00,0x00],
      "a":[0x00,0x00,0x0e,0x10,0x1e,0x11,0x1e],
      "b":[0x01,0x01,0x01,0x0f,0x11,0x11,0x0f],
      "c":[0x00,0x00,0x1e,0x01,0x01,0x01,0x1e],
      "d":[0x10,0x10,0x10,0x1e,0x11,0x11,0x1e],
      "e":[0x00,0x00,0x0e,0x11,0x1f,0x01,0x1e],
      "f":[0x08,0x14,0x04,0x0e,0x04,0x04,0x04],
      "g":[0x00,0x00,0x1e,0x11,0x1e,0x10,0x0f],
      "h":[0x01,0x01,0x01,0x0f,0x11,0x11,0x11],
      "i":[0x00,0x04,0x00,0x04,0x04,0x04,0x04],
      "j":[0x08,0x00,0x08,0x08,0x08,0x09,0x06],
      "k":[0x02,0x02,0x12,0x0a,0x06,0x0a,0x12],
      "l":[0x06,0x04,0x04,0x04,0x04,0x04,0x0e],
      "m":[0x00,0x00,0x1b,0x15,0x15,0x15,0x11],
      "n":[0x00,0x00,0x0d,0x13,0x11,0x11,0x11],
      "o":[0x00,0x00,0x0e,0x11,0x11,0x11,0x0e],
      "p":[0x00,0x00,0x0f,0x11,0x0f,0x01,0x01],
      "q":[0x00,0x00,0x1e,0x11,0x1e,0x10,0x10],
      "r":[0x00,0x00,0x0d,0x13,0x01,0x01,0x01],
      "s":[0x00,0x00,0x1e,0x01,0x0e,0x10,0x0f],
      "t":[0x04,0x04,0x1f,0x04,0x04,0x14,0x08],
      "u":[0x00,0x00,0x11,0x11,0x11,0x11,0x0e],
      "v":[0x00,0x00,0x11,0x11,0x11,0x0a,0x04],
      "w":[0x00,0x00,0x11,0x11,0x15,0x15,0x0a],
      "x":[0x00,0x00,0x11,0x0a,0x04,0x0a,0x11],
      "y":[0x00,0x00,0x11,0x0a,0x04,0x04,0x02],
      "z":[0x00,0x00,0x1f,0x08,0x04,0x02,0x1f],
      "{":[0x0c,0x02,0x02,0x01,0x02,0x02,0x0c],
      "|":[0x04,0x04,0x04,0x04,0x04,0x04,0x04],
      "}":[0x06,0x08,0x08,0x10,0x08,0x08,0x06],
      "~":[0x10,0x0e,0x01,0x00,0x00,0x00,0x00]
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

}(jQuery, simcir);
