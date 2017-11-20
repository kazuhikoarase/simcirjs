//
// SimcirJS - TypeScript Declaration File
//
// Copyright (c) 2016 Kazuhiko Arase
//
// URL: http://www.d-project.com/
//
// Licensed under the MIT license:
//  http://www.opensource.org/licenses/mit-license.php
//

interface SimcirPoint { x: number, y: number }
interface SimcirSize { width: number, height: number }
interface SimcirRect extends SimcirPoint, SimcirSize {}

interface SimcirEvent { target: JQuery, type: string }

interface SimcirGraphics {
  attr: { [name : string] : (string|number) };
  moveTo(x: number, y: number) : void;
  lineTo(x: number, y: number) : void;
  curveTo(x1: number, y1: number, x: number, y: number) : void;
  closePath(close?: boolean) : void;
  drawRect(x: number, y: number, width: number, height: number) : void;
  drawCircle(x: number, y: number, r: number) : void;
}

interface SimcirNode {
  type: string;
  label: string;
  description: string;
  $ui: JQuery;
  headless: boolean;
  getValue() : any;
  setValue(value : any, force? : boolean) : void;
}

interface SimcirInputNode extends SimcirNode {
  setOutput(outNode : SimcirNode) : void;
  getOutput() : SimcirOutputNode;
}

interface SimcirOutputNode extends SimcirNode {
  getInputs() : SimcirInputNode[];
  connectTo(inNode : SimcirInputNode) : void;
  disconnectFrom(inNode : SimcirInputNode) : void;
}

interface SimcirDeviceDefBase { [id : string] : string|number }

interface SimcirDeviceDef extends SimcirDeviceDefBase {
  type: string;
  label?: string;
}

interface SimcirDeviceInstance extends SimcirDeviceDef {
  id: string;
  x: number;
  y: number;
}

interface SimcirDocument { params: SimcirParamDescription[]; code: string; }

interface SimcirParamDescription {
  name: string;
  type: string;
  defaultValue: any;
  description: string;
}

interface SimcirDevice<Def extends SimcirDeviceDef> {
  $ui: JQuery;
  doc: SimcirDocument;
  halfPitch: boolean;
  headless: boolean;
  scope: any;
  deviceDef: Def;
  addInput(label? : string, description? : string) : SimcirInputNode;
  getInputs() : SimcirInputNode[];
  addOutput(label? : string, description? : string) : SimcirOutputNode;
  getOutputs() : SimcirOutputNode[];
  getLabel() : string;
  getSize() : SimcirSize;
  createUI() : void;
  getState() : any;
}

interface SimcirConnectorDef { from: string; to: string; }

interface SimcirData {
  width?: number;
  height?: number;
  toolbox?: SimcirDeviceDef[];
  showToolbox?: boolean;
  editable?: boolean;
  layout? : SimcirCustomLayout;
  devices?: SimcirDeviceInstance[];
  connectors?: SimcirConnectorDef[];
}

interface SimcirCustomLayout {
  rows: number;
  cols: number;
  hideLabelOnWorkspace?: boolean;
  nodes: { [label : string] : string };
}

type SimcirTypeFactory = <Def extends SimcirDeviceDef>(device : Def) => void;

interface Simcir {
  unit: number;
  createSVGElement(tagName: string) : JQuery;
  graphics($target: JQuery) : SimcirGraphics;
  offset($o: JQuery) : SimcirPoint;
  transform($o: JQuery, x: number, y: number, rotate: number) : void;
  transform($o: JQuery) : { x: number; y: number; rotate: number; };
  enableEvents($o: JQuery, enable: boolean) : void;
  controller($ui: JQuery, controller: any) : void;
  controller($ui: JQuery) : any;
  registerDevice(type: string, factory: SimcirTypeFactory) : void;
  registerDevice(type: string, data: SimcirData) : void;
  clearSimcir($placeHolder: JQuery) : JQuery;
  setupSimcir($placeHolder: JQuery, data: SimcirData) : JQuery;
  createWorkspace(data: SimcirData) : JQuery;
}

declare var simcir : Simcir;
