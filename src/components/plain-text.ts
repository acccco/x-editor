import ComponentFactory from ".";
import Component, { operatorType, IRawType } from "./component";
import Block, { IBlockSnapshoot } from "./block";
import ContentCollection from "./content-collection";
import StructureType from "../const/structure-type";
import updateComponent from "../util/update-component";
import { storeData } from "../decorate";
import { createError } from "../util/handle-error";

export interface IPlainTextSnapshoot extends IBlockSnapshoot {
  content: string;
}

abstract class PlainText extends Block {
  content: string[];
  structureType = StructureType.plainText;
  style: storeData = {
    overflow: "auto",
  };

  static exchangeOnly(
    componentFactory: ComponentFactory,
    component: Component,
    args: any[] = [],
  ): PlainText[] {
    throw createError("组件未实现 exchangeOnly 静态方法", this);
  }

  static exchange(
    componentFactory: ComponentFactory,
    block: Block,
    args: any[],
    customerUpdate: boolean = false,
  ): PlainText[] {
    let parent = block.getParent();
    let prev = parent.getPrev(block);
    if (prev instanceof PlainText) {
      prev.receive(block, customerUpdate);
      return [prev];
    } else {
      let newItem = this.exchangeOnly(componentFactory, block, args);
      block.replaceSelf(newItem, customerUpdate);
      return newItem;
    }
  }

  constructor(
    content: string = "",
    style: storeData = {},
    data: storeData = {},
  ) {
    super(style, data);
    // 纯文本最后必须有一个换行
    this.content = [...content];
    if (this.content[this.content.length - 1] !== "\n") {
      this.content.push("\n");
    }
  }

  getSize() {
    return this.content.length - 1;
  }

  getStatistic() {
    let res = super.getStatistic();
    res.word = this.content.length;
    return res;
  }

  getRaw(): IRawType {
    let raw = super.getRaw();
    raw.content = this.content.join("");
    return raw;
  }

  add(
    string: string,
    index?: number,
    customerUpdate: boolean = false,
  ): operatorType {
    if (typeof string !== "string") {
      throw createError("纯文本组件仅能输入文字", this);
    }
    index = index === undefined ? this.content.length : index;
    let saveString = [...string];
    this.content.splice(index, 0, ...saveString);
    updateComponent(this.editor, this, customerUpdate);
    return [this, index + saveString.length, index + saveString.length];
  }

  remove(
    start: number,
    end?: number,
    customerUpdate: boolean = false,
  ): operatorType {
    if (end === undefined) end = this.content.length;
    if (start < 0 && end === 0) {
      if (this.content.length <= 1) {
        return this.replaceSelf(this.getComponentFactory().buildParagraph());
      }
      return;
    }
    this.content.splice(start, end - start);
    updateComponent(this.editor, this, customerUpdate);
    return [this, start, start];
  }

  split(
    index: number,
    block?: Block | Block[],
    customerUpdate: boolean = false,
  ): operatorType {
    if (block) {
      throw createError("纯文本组件仅能输入文字", this);
    }
    return this.add("\n", index, customerUpdate);
  }

  receive(block?: Block, customerUpdate: boolean = false): operatorType {
    block?.removeSelf();
    let size = this.content.length;
    if (block instanceof ContentCollection) {
      this.add(block.children.map((item) => item.content).join("") + "\n");
    } else if (block instanceof PlainText) {
      this.content.push(...block.content);
    }
    return [this, size, size];
  }

  snapshoot(): IPlainTextSnapshoot {
    let snap = super.snapshoot() as IPlainTextSnapshoot;
    snap.content = this.content.join("");
    return snap;
  }

  restore(state: IPlainTextSnapshoot) {
    this.content = [...state.content];
    super.restore(state);
  }
}

export default PlainText;
