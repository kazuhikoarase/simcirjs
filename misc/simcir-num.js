//
// SimcirJS - Num
//
// Copyright (c) 2017 Kazuhiko Arase
//
// URL: http://www.d-project.com/
//
// Licensed under the MIT license:
//  http://www.opensource.org/licenses/mit-license.php
//

// includes following device types:
//  NumSrc
//  NumDsp

!function($s) {

  'use strict';

  var $ = $s.$;

  // unit size
  var unit = $s.unit;

  var createNumLabel = function(size) {
    var $label = $s.createSVGElement('g').
      css('pointer-events', 'none').
      attr('fill', 'none').
      attr('stroke-width', '2');
    $s.transform($label, size.width / 2, size.height / 2);
    var lsize = Math.max(size.width, size.height);
    var ratio = 0.65;
    $s.controller($label, {
      setOn : function(on) {
        $label.children().remove();
        if (on) {
          var w = lsize / 2 * ratio * 0.5;
          var x = w * 0.2;
          $label.append($s.createSVGElement('path').
              attr('d',
                  'M' + x + ' ' + (lsize / 2 * ratio) +
                  'L ' + x + ' ' + -lsize / 2 * ratio +
                  'Q' + (x - lsize / 2 * ratio * 0.125) +
                  ' ' + (-lsize / 2 * ratio * 0.6) +
                  ' ' + (x - w) +
                  ' ' + (-lsize / 2 * ratio * 0.5) ).
              attr('stroke-linecap' , 'square').
              attr('stroke-linejoin' , 'round') );
        } else {
          $label.append($s.createSVGElement('ellipse').
              attr({ cx : 0, cy : 0,
                rx : lsize / 2 * ratio * 0.6, ry : lsize / 2 * ratio}).
              attr('fill', 'none') );
        }
      },
      setColor : function(color) {
        $label.attr('stroke', color);
      }
    });
    return $label;
  };

  var createNumFactory = function(type) {

    var maxFadeCount = 16;
    var fadeTimeout = 100;

    var Direction = { WE : 0, NS : 1, EW : 2, SN : 3 };

    return function(device) {

      var in1 = type == 'dsp'? device.addInput() : null;
      var out1 = type == 'src'? device.addOutput() : null;

      var on = false;
      var updateOutput = null;

      var direction = null;
      if (device.deviceDef.state) {
        direction = device.deviceDef.state.direction;
      }
      if (typeof direction != 'number') {
        direction = type == 'src'? Direction.WE : Direction.EW;
      }

      if (type == 'src') {
        if (device.deviceDef.state) {
          on = device.deviceDef.state.on;
        }
        device.getState = function() {
          return { direction : direction, on : on };
        };
        device.$ui.on('inputValueChange', function() {
          if (on) {
            out1.setValue(in1.getValue() );
          }
        });
        updateOutput = function() {
          out1.setValue(on? 1 : null);
        };
        updateOutput();
      } else if (type == 'dsp') {
        device.getState = function() {
          return { direction : direction };
        };
      }

      device.getSize = function() {
        return { width : unit, height : unit };
      };

      var super_createUI = device.createUI;
      device.createUI = function() {
        super_createUI();

        var $label = device.$ui.children('.simcir-device-label');
        var size = device.getSize();

        device.$ui.css('fill', '#eeeeee');

        var $button = null;
        if (type == 'src') {
          $button = $s.createSVGElement('rect').
            attr({x: 1, y: 1, width: size.width - 2, height: size.height - 2,
              rx: 2, ry: 2, stroke: 'none', fill: '#cccccc'}).
            append($s.createSVGElement('title') );
          device.$ui.append($button);
          var button_mouseDownHandler = function(event) {
            event.preventDefault();
            event.stopPropagation();
            on = !on;
            updateOutput();
            $(document).on('mouseup', button_mouseUpHandler);
            $(document).on('touchend', button_mouseUpHandler);
          };
          var button_dblClickHandler = function(event) {
            event.preventDefault();
            event.stopPropagation();
          };
          var button_mouseUpHandler = function(event) {
            updateOutput();
            $(document).off('mouseup', button_mouseUpHandler);
            $(document).off('touchend', button_mouseUpHandler);
          };
          device.$ui.on('deviceAdd', function() {
            $s.enableEvents($button, true);
            $button.on('mousedown', button_mouseDownHandler);
            $button.on('touchstart', button_mouseDownHandler);
            $button.on('dblclick', button_dblClickHandler);
          });
          device.$ui.on('deviceRemove', function() {
            $s.enableEvents($button, false);
            $button.off('mousedown', button_mouseDownHandler);
            $button.off('touchstart', button_mouseDownHandler);
            $button.off('dblclick', button_dblClickHandler);
          });
          var out1_setValue = out1.setValue;
          out1.setValue = function(value) {
            out1_setValue(value);
            $s.controller($numLabel).setOn(out1.getValue() != null);
          };
        }

        var $numLabel = createNumLabel(size);
        $s.controller($numLabel).setColor('#000000');
        device.$ui.append($numLabel);

        if (type == 'src') {
          $s.controller($numLabel).setOn(out1.getValue() != null);
        } else if (type == 'dsp') {
          $s.controller($numLabel).setOn(false);
          device.$ui.on('inputValueChange', function() {
            $s.controller($numLabel).setOn(in1.getValue() != null);
          });
        }

        var $path = $s.createSVGElement('path').
          css('pointer-events', 'none').css('opacity', 0).
          addClass('simcir-connector');
        device.$ui.append($path);

        var $title = $s.createSVGElement('title').
          text('Double-Click to change a direction.');

        if (type == 'src') {

          var $point = $s.createSVGElement('circle').
            css('pointer-events', 'none').css('opacity', 0).
            attr('cx', size.width).attr('cy', size.height / 2).attr('r', 2).
            addClass('simcir-connector').addClass('simcir-joint-point');
          device.$ui.append($point);
    
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
        }

        var updateUI = function() {
          var x0, y0, x1, y1;
          x0 = y0 = x1 = y1 = unit / 2;
          var d = unit / 2;
          if (direction == Direction.WE) {
            x0 += d;
            x1 += unit;
          } else if (direction == Direction.NS) {
            y0 += d * 1.25;
            y1 += unit;
          } else if (direction == Direction.EW) {
            x0 -= d;
            x1 -= unit;
          } else if (direction == Direction.SN) {
            y0 -= d * 1.25;
            y1 -= unit;
          }
          $path.attr('d', 'M' + x0 + ' ' + y0 + 'L' + x1 + ' ' + y1);
          if (type == 'src') {
            $s.transform(out1.$ui, x1, y1);
            $point.attr({cx : x1, cy : y1});
          } else if (type == 'dsp') {
            $s.transform(in1.$ui, x1, y1);
          }
          if (direction == Direction.EW || direction == Direction.WE) {
            device.$ui.children('.simcir-device-body').
              attr({x: -unit / 2, y: 0, width: unit * 2, height: unit});
          } else {
            device.$ui.children('.simcir-device-body').
              attr({x: 0, y: -unit / 2, width: unit, height: unit * 2});
          }
        };

        updateUI();

        // fadeout a body.
        var fadeCount = 0;
        var setOpacity = function(opacity) {
          device.$ui.children('.simcir-device-body,.simcir-node').
            css('opacity', opacity);
          $path.css('opacity', 1 - opacity);
          if (type == 'src') {
            $button.css('opacity', opacity);
            $point.css('opacity', 1 - opacity);
          }
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
          direction = (direction + 1) % 4;
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
      };
    };
  };

  $s.registerDevice('NumSrc', createNumFactory('src') );
  $s.registerDevice('NumDsp', createNumFactory('dsp') );

}(simcir);
