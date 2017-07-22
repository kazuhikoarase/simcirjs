//
// SimcirJS - Transmitter
//
// Copyright (c) 2016 Kazuhiko Arase
//
// URL: http://www.d-project.com/
//
// Licensed under the MIT license:
//  http://www.opensource.org/licenses/mit-license.php
//

// includes following device types:
//  Transmitter

!function($s) {

  'use strict';

  var $ = $s.$;

  // unit size
  var unit = $s.unit;

  var createTransmitterFactory = function() {

    var emptyGroup = {
      getValue : function() { return null; },
      setValue : function(value, force) {},
      getInput : function() { return null; },
      setInput : function(device) {}
    };

    var createGroup = function(devices) {
      var input = function() {
        for (var i = 0; i < devices.length; i += 1) {
          var inNode = devices[i].getInputs()[0];
          var outNode = inNode.getOutput();
          if (outNode != null) {
            return devices[i];
          }
        }
        return null;
      }();
      return {
        getValue : function() {
          return input != null? input.getInputs()[0].getValue() : null;
        },
        setValue : function(value, force) {
          for (var i = 0; i < devices.length; i += 1) {
            devices[i].getOutputs()[0].setValue(value, force);
          }
        },
        getInput : function() {
          return input;
        },
        setInput : function(device) {
          input = device;
          for (var i = 0; i < devices.length; i += 1) {
            if (devices[i] != device) {
              var inNode = devices[i].getInputs()[0];
              var outNode = inNode.getOutput();
              if (outNode != null) {
                outNode.disconnectFrom(inNode);
              }
            }
          }
        }
      };
    };

    var createGroupByLabel = function(devices) {
      var devicesByLabel = {};
      for (var id in devices) {
        var device = devices[id];
        var label = device.getLabel();
        if (!devicesByLabel[label]) {
          devicesByLabel[label] = [];
        }
        devicesByLabel[label].push(device);
      }
      var groupByLabel = {};
      for (var label in devicesByLabel) {
        groupByLabel[label] = createGroup(devicesByLabel[label]);
      }
      return groupByLabel;
    };

    var createGroupManager = function() {

      var devices = {};
      var idCount = 0;
      var groupCache = null;

      var register = function(device) {
        var id = 'id' + idCount++;
        if (device.headless) {
          devices[id] = device;
          reset();
        } else {
          device.$ui.on('deviceAdd', function() {
            devices[id] = device;
            reset();
          }).on('deviceRemove', function() {
            delete devices[id];
            reset();
          });
        }
      };

      var reset = function() {
        groupCache = null;
      };

      var getGroupByLabel = function(label) {
        if (!groupCache) {
          groupCache = createGroupByLabel(devices);
        }
        return groupCache[label] || emptyGroup;
      };

      return {
        register : register,
        reset : reset,
        getGroupByLabel : getGroupByLabel
      };
    };

    var maxFadeCount = 16;
    var fadeTimeout = 100;
    var getEmptyGroupByLabel = function(label) { return emptyGroup; };

    return function(device) {

      var getGroupByLabel = getEmptyGroupByLabel;
      if (device.scope) {
        var groupManager = device.scope.transmitterGroupManager;
        if (!groupManager) {
          groupManager = createGroupManager();
          device.scope.transmitterGroupManager = groupManager;
        }
        groupManager.register(device);
        getGroupByLabel = function(label) {
          return groupManager.getGroupByLabel(label);
        };
      }

      var in1 = device.addInput();
      var out1 = device.addOutput();
      var lastLabel = device.getLabel();

      var in1_super_setValue = in1.setValue;
      in1.setValue = function(value, force) {
        var changed = in1.getValue() !== value;
        in1_super_setValue(value, force);
        if (changed || force) {
          getGroupByLabel(device.getLabel() ).setValue(in1.getValue(), force);
        }
      };

      var in1_super_setOutput = in1.setOutput;
      in1.setOutput = function(outNode) {
        in1_super_setOutput(outNode);
        if (outNode != null) {
          getGroupByLabel(device.getLabel() ).setInput(device);
        }
      };

      device.getSize = function() {
        return { width : unit, height : unit };
      };

      var super_createUI = device.createUI;
      device.createUI = function() {
        super_createUI();

        device.$ui.children('.simcir-device-body').
          attr({x: 0, y: unit / 4, width: unit, height: unit / 2});

        var $label = device.$ui.children('.simcir-device-label');
        var defaultLabelX = +$label.attr('x');
        var defaultLabelY = +$label.attr('y');

        var $point = $s.createSVGElement('circle').
          css('pointer-events', 'none').css('opacity', 0).
          attr({cx: unit / 2, cy: unit / 2, r: 2}).
          addClass('simcir-connector').addClass('simcir-joint-point');
        device.$ui.append($point);

        var $path = $s.createSVGElement('path').
          css('pointer-events', 'none').css('opacity', 0).
          addClass('simcir-connector');
        device.$ui.append($path);

        var updateUI = function() {

          var isInSet = in1.getOutput() != null;
          var isOutSet = out1.getInputs().length > 0;

          var x0, y0, x1, y1, cx, cy;
          x0 = y0 = x1 = y1 = cx = cy = unit / 2;
          var d = unit / 2;
          x0 -= d;
          x1 += d;
          if (isInSet && isOutSet) {
          } else if (isInSet) {
            cx += d;
          } else if (isOutSet) {
            cx -= d;
          }
          $point.attr('cx', cx).attr('cy', cy);
          $path.attr('d', 'M' + x0 + ' ' + y0 + 'L' + x1 + ' ' + y1);

          var labelX = defaultLabelX;
          var labelY = defaultLabelY;
          var anchor = 'middle';
          if (isInSet && isOutSet) {
            labelY -= unit / 4;
          } else if (!isInSet && !isOutSet) {
            labelY -= unit / 4;
          } else if (isInSet) {
            labelX += unit;
            labelY -= unit;
            anchor = 'start';
          } else if (isOutSet) {
            labelX -= unit;
            labelY -= unit;
            anchor = 'end';
          }
          $label.attr('x', labelX).attr('y', labelY).
            attr('text-anchor', anchor);
        };

        updateUI();

        var in1_super_setOutput = in1.setOutput;
        in1.setOutput = function(outNode) {
          in1_super_setOutput(outNode);
          updateUI();
        };
        var super_connectTo = out1.connectTo;
        out1.connectTo = function(inNode) {
          super_connectTo(inNode);
          updateUI();
        };
        var super_disconnectFrom = out1.disconnectFrom;
        out1.disconnectFrom = function(inNode) {
          super_disconnectFrom(inNode);
          updateUI();
        };

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
            out1.setValue(getGroupByLabel(device.getLabel() ).getValue() );
            if ($(this).closest('BODY').length == 0) {
              setOpacity(0);
            }
            $(this).on('mouseout', device_mouseoutHandler);
          }).on('deviceRemove', function() {
            $(this).off('mouseout', device_mouseoutHandler);
          }).on('deviceLabelChange', function() {

            groupManager.reset();

            var lastGrp = getGroupByLabel(lastLabel);
            lastGrp.setValue(lastGrp.getValue() );

            var newLabel = device.getLabel();
            var newGrp = getGroupByLabel(newLabel);
            if (in1.getOutput() != null) {
              newGrp.setInput(device);
            }
            newGrp.setValue(newGrp.getValue() );

            lastLabel = newLabel;

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
          description:
            'Transmit a signal to another trasmitter that has same label.',
          params: [],
          code: '{"type":"' + device.deviceDef.type + '"}'
        };
      };
    };
  };

  $s.registerDevice('Transmitter', createTransmitterFactory() );

}(simcir);
