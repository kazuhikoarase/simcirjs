//
// SimcirJS - altfulladder
//
// Copyright (c) 2017 Kazuhiko Arase
//
// URL: http://www.d-project.com/
//
// Licensed under the MIT license:
//  http://www.opensource.org/licenses/mit-license.php
//
// This file describes how to customize the layout of library.
//

// includes following device types:
//  AltFullAdder

simcir.registerDevice('AltFullAdder',
{
  "width":440,
  "height":200,
  "showToolbox":false,
  "toolbox":[
  ],
  "layout":{"rows":8,"cols":8,"hideLabelOnWorkspace":true,
    "nodes":{"A":"T2","B":"T6","S":"B4","Cin":"R4","Cout":"L4"}},
  "devices":[
    {"type":"In","id":"dev0","x":120,"y":32,"label":"Cin"},
    {"type":"In","id":"dev1","x":120,"y":80,"label":"A"},
    {"type":"In","id":"dev2","x":120,"y":128,"label":"B"},
    {"type":"Toggle","id":"dev3","x":72,"y":32,"label":"Toggle"},
    {"type":"Toggle","id":"dev4","x":72,"y":80,"label":"Toggle"},
    {"type":"Toggle","id":"dev5","x":72,"y":128,"label":"Toggle"},
    {"type":"DC","id":"dev6","x":24,"y":80,"label":"DC"},
    {"type":"HalfAdder","id":"dev7","x":168,"y":104,"label":"HalfAdder"},
    {"type":"HalfAdder","id":"dev8","x":248,"y":56,"label":"HalfAdder"},
    {"type":"OR","id":"dev9","x":328,"y":104,"label":"OR"},
    {"type":"Out","id":"dev10","x":376,"y":104,"label":"Cout"},
    {"type":"Out","id":"dev11","x":376,"y":48,"label":"S"}
  ],
  "connectors":[
    {"from":"dev0.in0","to":"dev3.out0"},
    {"from":"dev1.in0","to":"dev4.out0"},
    {"from":"dev2.in0","to":"dev5.out0"},
    {"from":"dev3.in0","to":"dev6.out0"},
    {"from":"dev4.in0","to":"dev6.out0"},
    {"from":"dev5.in0","to":"dev6.out0"},
    {"from":"dev7.in0","to":"dev1.out0"},
    {"from":"dev7.in1","to":"dev2.out0"},
    {"from":"dev8.in0","to":"dev0.out0"},
    {"from":"dev8.in1","to":"dev7.out0"},
    {"from":"dev9.in0","to":"dev8.out1"},
    {"from":"dev9.in1","to":"dev7.out1"},
    {"from":"dev10.in0","to":"dev9.out0"},
    {"from":"dev11.in0","to":"dev8.out0"}
  ]
}
);
