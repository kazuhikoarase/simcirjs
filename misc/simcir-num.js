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
    var lsize = Math.max(size.width / 2, size.height / 2);
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

  var createTxFactory = function(type) {

    var maxFadeCount = 16;
    var fadeTimeout = 100;

    return function(device) {

      var in1 = type == 'dsp'? device.addInput() : null;
      var out1 = type == 'src'? device.addOutput() : null;

      var on = false;
      var updateOutput = function() {};

      if (type == 'src') {
        if (device.deviceDef.state) {
          on = device.deviceDef.state.on;
        }
        device.getState = function() {
          return { on : on };
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
      }

      device.getSize = function() {
        return { width : unit * 2, height : unit };
      };

      var super_createUI = device.createUI;
      device.createUI = function() {
        super_createUI();

        var $label = device.$ui.children('.simcir-device-label');
        var size = device.getSize();
        var $button = null;

        if (type == 'src') {
          $button = $s.createSVGElement('rect').css('opacity', 0).
            attr({x: size.width / 4, y: 1,
              width: size.width / 2, height: size.height - 2,
              rx: 2, ry: 2, stroke: 'none', fill: '#999999'});
          device.$ui.append($button);
          var button_mouseDownHandler = function(event) {
            event.preventDefault();
            event.stopPropagation();
            on = !on;
            updateOutput();
            $(document).on('mouseup', button_mouseUpHandler);
            $(document).on('touchend', button_mouseUpHandler);
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
          });
          device.$ui.on('deviceRemove', function() {
            $s.enableEvents($button, false);
            $button.off('mousedown', button_mouseDownHandler);
            $button.off('touchstart', button_mouseDownHandler);
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
        }
        if (type == 'dsp') {
          $s.controller($numLabel).setOn(false);
          device.$ui.on('inputValueChange', function() {
            $s.controller($numLabel).setOn(in1.getValue() != null);
          });
        }

        var $path = $s.createSVGElement('path').
          css('pointer-events', 'none').css('opacity', 0).
          addClass('simcir-connector');
        !function() {
          var x0 = type == 'dsp'? 0 : size.width - unit / 2;
          var y0 = size.height / 2;
          var x1 = type == 'src'? size.width : unit / 2;
          var y1 = size.height / 2;
          $path.attr('d', 'M' + x0 + ' ' + y0 + 'L' + x1 + ' ' + y1);
        }();
        device.$ui.append($path);

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

        var device_mouseoutHandler = function(event) {
          if (!device.isSelected() ) {
            fadeCount = maxFadeCount;
            fadeout();
          }
        };

        device.$ui.on('mouseover', function(event) {
            setOpacity(1);
            fadeCount = 0;
          }).on('deviceAdd', function() {
            if ($(this).closest('BODY').length == 0) {
              setOpacity(0);
            }
            $(this).on('mouseout', device_mouseoutHandler);
            // hide a label
            $label.css('display', 'none');
          }).on('deviceRemove', function() {
            $(this).off('mouseout', device_mouseoutHandler);
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

  $s.registerDevice('NumSrc', createTxFactory('src') );
  $s.registerDevice('NumDsp', createTxFactory('dsp') );

}(simcir);