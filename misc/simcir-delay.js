//
// SimcirJS - Delay
//
// Copyright (c) 2017 Kazuhiko Arase
//
// URL: http://www.d-project.com/
//
// Licensed under the MIT license:
//  http://www.opensource.org/licenses/mit-license.php
//

// includes following device types:
//  Delay

!function($s) {

  'use strict';

  var $ = $s.$;

  // unit size
  var unit = $s.unit;

  var connectNode = function(in1, out1, delay) {
    // set input value to output without inputValueChange event.
    var in1_super_setValue = in1.setValue;
    in1.setValue = function(value, force) {
      var changed = in1.getValue() !== value;
      in1_super_setValue(value, force);
      if (changed || force) {
        var value = in1.getValue();
        window.setTimeout(function() { out1.setValue(value); }, delay);
      }
    };
  };

  var createDelayFactory = function() {

    var maxFadeCount = 16;
    var fadeTimeout = 100;

    var defaultDelay = 50;
    var defaultDelayColor = '#ff0000';

    var Direction = { WE : 0, NS : 1, EW : 2, SN : 3 };

    return function(device) {

      var delay = Math.max(0, device.deviceDef.delay || defaultDelay);
      var color = device.deviceDef.color || defaultDelayColor;

      var in1 = device.addInput();
      var out1 = device.addOutput();
      connectNode(in1, out1, delay);

      var state = device.deviceDef.state || { direction : Direction.WE };
      device.getState = function() {
        return state;
      };

      device.getSize = function() {
        return { width : unit, height : unit };
      };

      var super_createUI = device.createUI;
      device.createUI = function() {
        super_createUI();

        var $label = device.$ui.children('.simcir-device-label');
        $label.attr('y', $label.attr('y') - unit / 4);

        var $point = $s.createSVGElement('circle').
          css('pointer-events', 'none').css('opacity', 0).attr('r', 2).
          addClass('simcir-connector').addClass('simcir-joint-point');
        device.$ui.append($point);

        var $path = $s.createSVGElement('path').
          css('pointer-events', 'none').css('opacity', 0).
          addClass('simcir-connector').css('stroke', color);
        device.$ui.append($path);

        var $title = $s.createSVGElement('title').
          text('Double-Click to change a direction.');

        var updatePoint = function() {
          $point.css('display', out1.getInputs().length > 1? '' : 'none');
        };

        updatePoint();

        var super_connectTo = out1.connectTo;
        out1.connectTo = function(inNode) {
          super_connectTo(inNode);
          updatePoint();
        };
        var super_disconnectFrom = out1.disconnectFrom;
        out1.disconnectFrom = function(inNode) {
          super_disconnectFrom(inNode);
          updatePoint();
        };

        var updateUI = function() {
          var x0, y0, x1, y1;
          x0 = y0 = x1 = y1 = unit / 2;
          var d = unit / 2;
          var direction = state.direction;
          if (direction == Direction.WE) {
            x0 -= d;
            x1 += d;
          } else if (direction == Direction.NS) {
            y0 -= d;
            y1 += d;
          } else if (direction == Direction.EW) {
            x0 += d;
            x1 -= d;
          } else if (direction == Direction.SN) {
            y0 += d;
            y1 -= d;
          }
          $path.attr('d', 'M' + x0 + ' ' + y0 + 'L' + x1 + ' ' + y1);
          $s.transform(in1.$ui, x0, y0);
          $s.transform(out1.$ui, x1, y1);
          $point.attr({cx : x1, cy : y1});
          if (direction == Direction.EW || direction == Direction.WE) {
            device.$ui.children('.simcir-device-body').
              attr({x: 0, y: unit / 4, width: unit, height: unit / 2});
          } else {
            device.$ui.children('.simcir-device-body').
              attr({x: unit / 4, y: 0, width: unit / 2, height: unit});
          }
        };

        updateUI();

        // fadeout a body.
        var fadeCount = 0;
        var setOpacity = function(opacity) {
          device.$ui.children('.simcir-device-body,.simcir-node').
            css('opacity', opacity);
          $path.css('opacity', 1 - opacity);
          $point.css('opacity', 1 - opacity);
        };
        var fadeout = function() {
          window.setTimeout(function() {
            if (fadeCount > 0) {
              fadeCount -= 1;
              setOpacity(fadeCount / maxFadeCount);
              fadeout();
            }
          }, fadeTimeout);
        };

        var isEditable = function($dev) {
          var $workspace = $dev.closest('.simcir-workspace');
          return !!$s.controller($workspace).data().editable;
        };
        var device_mouseoutHandler = function(event) {
          if (!isEditable($(event.target) ) ) {
            return;
          }
          if (!device.isSelected() ) {
            fadeCount = maxFadeCount;
            fadeout();
          }
        };
        var device_dblclickHandler = function(event) {
          if (!isEditable($(event.target) ) ) {
            return;
          }
          state.direction = (state.direction + 1) % 4;
          updateUI();
          // update connectors.
          $(this).trigger('mousedown').trigger('mouseup');
        };

        device.$ui.on('mouseover', function(event) {
            if (!isEditable($(event.target) ) ) {
              $title.text('');
              return;
            }
            setOpacity(1);
            fadeCount = 0;
          }).on('deviceAdd', function() {
            if ($(this).closest('BODY').length == 0) {
              setOpacity(0);
            }
            $(this).append($title).on('mouseout', device_mouseoutHandler).
              on('dblclick', device_dblclickHandler);
            // hide a label
            $label.css('display', 'none');
          }).on('deviceRemove', function() {
            $(this).off('mouseout', device_mouseoutHandler).
              off('dblclick', device_dblclickHandler);
            $title.remove();
            // show a label
            $label.css('display', '');
          }).on('deviceSelect', function() {
            if (device.isSelected() ) {
              setOpacity(1);
              fadeCount = 0;
            } else {
              if (fadeCount == 0) {
                setOpacity(0);
              }
            }
          });
        device.doc = {
          labelless: true,
          params: [
            {name: 'delay', type: 'number',
              defaultValue: defaultDelay,
              description: 'time delay in milli-seconds.'},
            {name: 'color', type: 'string',
              defaultValue: defaultDelayColor,
              description: 'color in hexadecimal.'}],
          code: '{"type":"' + device.deviceDef.type + '","delay":50}'
        };
      };
    };
  };

  $s.registerDevice('Delay', createDelayFactory() );

}(simcir);
