import ComponentFactory from ".";
import { OperatorType, IRawType } from "./component";
import Block from "./block";
import ContentCollection from "./content-collection";
import StructureCollection from "./structure-collection";
import BaseBuilder from "../builder/base-builder";
import ComponentType from "../const/component-type";
import { StoreData } from "../decorate";
import { ICollectionSnapshoot } from "./collection";
import { createError } from "../util/handle-error";
import nextTick from "../util/next-tick";

type tableCellType = string | string[];

interface ITableSnapshoot extends ICollectionSnapshoot<TableRow> {
  col: number;
  needHead: boolean;
}

class Table extends StructureCollection<TableRow> {
  type: ComponentType = ComponentType.table;

  static getTable(block: Block): Table | undefined {
    let table: Table | undefined;
    if (block instanceof TableItem) {
      table = block.parent?.parent?.parent;
    } else if (block instanceof TableCell) {
      table = block.parent?.parent;
    } else if (block instanceof TableRow) {
      table = block.parent;
    } else if (block instanceof Table) {
      table = block;
    }
    return table;
  }

  static create(componentFactory: ComponentFactory, raw: IRawType): Table {
    let children = (raw.children || []).map((each) => {
      return TableRow.create(componentFactory, each);
    });

    let table = componentFactory.buildTable(0, 0, [], [], raw.style, raw.data);
    table.addChildren(0, children);
    return table;
  }

  constructor(
    row: number,
    col: number,
    head: tableCellType[] | boolean = true,
    rows: tableCellType[][] = [],
    style?: StoreData,
    data?: StoreData,
  ) {
    super(style, data);

    let tableRows = [];
    if (head) {
      if (head === true) {
        head = [];
      }
      tableRows.push(new TableRow(col, "th", head));
    }

    for (let i = 0; i < row; i++) {
      tableRows.push(new TableRow(col, "td", rows[i]));
    }

    this.add(0, ...tableRows);
  }

  addRow(index: number) {
    let cellSize = this.getChild(0).getSize();
    let newTableRow = new TableRow(cellSize);
    this.add(index, newTableRow);
  }

  addCol(index: number) {
    this.children.forEach((each) => each.addCell(index));
  }

  removeRow(start: number, end: number = start + 1) {
    this.remove(start, end);
  }

  removeCol(start: number, end: number = start + 1) {
    this.children.forEach((each) => each.remove(start, end));
  }

  setRow(row: number) {
    let size = this.getSize();
    let cellSize = this.getChild(0).getSize();
    let hasHead = this.getChild(0).cellType === "th";
    let rowSize = hasHead ? size - 1 : size;

    if (row === rowSize) return;

    if (row > rowSize) {
      let list = [];
      for (let i = rowSize; i < row; i++) {
        let each = new TableRow(cellSize);
        list.push(each);
      }
      this.add(-1, ...list);
    } else {
      this.remove(row, size);
    }
  }

  setCol(col: number) {
    this.children.forEach((each) => each.setSize(col));
  }

  setHead(head: boolean) {
    let hasHead = this.getChild(0).cellType === "th";

    if (head === hasHead) return;

    if (head) {
      let colNumber = this.getChild(0).getSize();
      this.add(0, new TableRow(colNumber, "th", []));
    } else {
      this.remove(0, 1);
    }
  }

  receive(block: Block): OperatorType {
    this.removeSelf();
    return [[block], { id: block.id, offset: 0 }];
  }

  restore(state: ITableSnapshoot) {
    super.restore(state);
  }

  render(contentBuilder: BaseBuilder) {
    return contentBuilder.buildTable(
      this.id,
      () => this.children.toArray().map((each) => each.render(contentBuilder)),
      this.decorate.getStyle(),
      this.decorate.getData(),
    );
  }
}

class TableRow extends StructureCollection<TableCell> {
  type: ComponentType = ComponentType.tableRow;
  parent?: Table;
  cellType: "th" | "td";

  static create(componentFactory: ComponentFactory, raw: IRawType): TableRow {
    let tableRow = new TableRow(raw.children!.length, raw.cellType, [], raw.style, raw.data);
    let children = (raw.children || []).map((each) => TableCell.create(componentFactory, each));
    tableRow.addChildren(0, children);
    return tableRow;
  }

  constructor(
    size: number,
    cellType: "th" | "td" = "td",
    children: tableCellType[] = [],
    style?: StoreData,
    data?: StoreData,
  ) {
    super(style, data);
    this.cellType = cellType;

    let cells = [];
    for (let i = 0; i < size; i++) {
      if (children[i]) {
        cells.push(new TableCell(this.cellType, children[i]));
      } else {
        cells.push(new TableCell(this.cellType));
      }
    }

    super.addChildren(0, cells);
  }

  addCell(index: number) {
    let newTableCell = new TableCell(this.cellType);
    this.add(index, newTableCell);
    return newTableCell;
  }

  setSize(size: number) {
    let cellSize = this.getSize();

    if (size === cellSize) return;

    if (size > cellSize) {
      let list = [];
      for (let i = cellSize; i < size; i++) {
        let each = new TableCell(this.cellType);
        list.push(each);
      }
      this.add(-1, ...list);
    } else {
      this.remove(size, cellSize);
    }
  }

  getRaw() {
    let raw = super.getRaw();
    raw.cellType = this.cellType;
    return raw;
  }

  addEmptyParagraph(bottom: boolean): OperatorType {
    let parent = this.getParent();
    return parent.addEmptyParagraph(bottom);
  }

  render(contentBuilder: BaseBuilder) {
    return contentBuilder.buildTableRow(
      this.id,
      () => this.children.map((each) => each.render(contentBuilder)).toArray(),
      this.decorate.getStyle(),
      this.decorate.getData(),
    );
  }
}

class TableCell extends StructureCollection<TableItem> {
  type: ComponentType = ComponentType.tableCell;
  parent?: TableRow;
  cellType: "th" | "td";

  static create(componentFactory: ComponentFactory, raw: IRawType): TableCell {
    let tableCell = new TableCell(raw.cellType, "", raw.style, raw.data);

    let children = (raw.children || []).map((each) => TableItem.create(componentFactory, each));
    tableCell.addChildren(0, children);

    return tableCell;
  }

  constructor(
    cellType: "th" | "td" = "td",
    children: tableCellType = "",
    style?: StoreData,
    data?: StoreData,
  ) {
    super(style, data);
    this.cellType = cellType;

    if (!Array.isArray(children)) {
      children = [children];
    }

    this.addChildren(
      0,
      children.map((each) => new TableItem(each)),
    );
  }

  isEmpty() {
    return this.getSize() === 1 && this.getChild(0).getSize() === 0;
  }

  removeChildren(start: number, end: number = -1) {
    let removed = super.removeChildren(start, end);
    // 若删除后仍在 active 状态，则至少保证有一个空行
    nextTick(() => {
      if (this.active && this.getSize() === 0) {
        this.add(0, new TableItem());
      }
    });
    return removed;
  }

  childHeadDelete(tableItem: TableItem): OperatorType {
    let prev = this.getPrev(tableItem);
    if (!prev) {
      return [[tableItem], { id: tableItem.id, offset: 0 }];
    }

    return tableItem.sendTo(prev);
  }

  addEmptyParagraph(bottom: boolean): OperatorType {
    let parent = this.getParent();
    return parent.addEmptyParagraph(bottom);
  }

  getRaw() {
    let raw = super.getRaw();
    raw.cellType = this.cellType;
    return raw;
  }

  render(contentBuilder: BaseBuilder) {
    return contentBuilder.buildTableCell(
      this.id,
      this.cellType,
      () => this.children.toArray().map((each) => each.render(contentBuilder)),
      this.decorate.getStyle(),
      this.decorate.getData(),
    );
  }
}

class TableItem extends ContentCollection {
  type = ComponentType.tableItem;
  parent?: TableCell;
  style: StoreData = {
    textAlign: "center",
  };

  static create(componentFactory: ComponentFactory, raw: IRawType): TableItem {
    let tableItem = new TableItem("", raw.style, raw.data);
    tableItem.addChildren(0, super.createChildren(componentFactory, raw));
    return tableItem;
  }

  static exchange(): TableItem[] {
    throw createError("不允许切换表格内段落");
  }

  exchangeTo(): Block[] {
    throw createError("表格内段落不允许切换类型", this);
  }

  createEmpty() {
    return new TableItem("", this.decorate.copyStyle(), this.decorate.copyData());
  }

  split(index: number, ...tableItem: TableItem[]): OperatorType {
    if (tableItem.length) {
      throw createError("表格组件不允许添加其他组件", this);
    }

    return super.split(index);
  }

  render(contentBuilder: BaseBuilder) {
    return contentBuilder.buildParagraph(
      this.id,
      () => this.getChildren(contentBuilder),
      this.decorate.getStyle(),
      this.decorate.getData(),
    );
  }
}

export default Table;
