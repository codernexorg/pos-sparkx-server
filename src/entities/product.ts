import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { ProductStatus } from "../types";
import TransferProduct from "./transfer";
import Purchase from "./purchase";
import Invoice from "./invoice";
import Customer from "./customer";
import Employee from "./employee";
import HoldInvoice from "./holdInvoice";
import ReturnProduct from "./returnProduct";

@Entity()
export default class Product extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  itemCode: string;

  @Column()
  productGroup: string;

  @Column({ nullable: true })
  productCode: string;

  @Column({ nullable: true })
  invoiceNumber: string;

  @Column({ nullable: true })
  invoiceDate: Date;

  @Column({ nullable: true })
  lotNumber: string;

  @Column({ nullable: true })
  invoiceTotalPrice: number;

  @Column({ nullable: true })
  supplierName: string;

  @Column({ nullable: true, default: 1 })
  totalItem: number;

  @Column({ nullable: true })
  transportationCost: number;
  @Column({ type: "float" })
  unitCost: number;

  @Column({ nullable: true, type: "float" })
  unitTotalCost: number;

  @Column({ nullable: true })
  whName: string;

  @Column({ nullable: true })
  showroomName: string;

  @Column({ nullable: true })
  grossProfit: string;

  @Column({ nullable: true })
  grossMargin: string;

  @Column({
    default: ProductStatus.Unsold,
    type: "enum",
    enum: ProductStatus,
    nullable: true,
  })
  sellingStatus: ProductStatus;

  @Column({ default: false })
  returnStatus: boolean;

  @Column({ nullable: true })
  deliveryDate: Date;

  @Column({ nullable: true })
  challanNumber: string;

  @Column({ nullable: true })
  size: string;

  @Column({ nullable: true })
  purchaseName: string;

  @Column({ nullable: true })
  brand: string;

  @Column({ nullable: true, default: 0, type: "float" })
  discount: number;

  @Column({ type: "float", default: 0, nullable: true })
  sellPrice: number;

  @Column({ type: "float", default: 0, nullable: true })
  sellPriceAfterDiscount: number;

  @ManyToOne(() => TransferProduct, (t) => t.transferredProducts, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    nullable: true,
  })
  transferredHistory: TransferProduct;

  @Column({ default: 1 })
  quantity: number;

  @ManyToMany(() => Purchase, (purchase) => purchase.products)
  purchases: Purchase[];

  @ManyToMany(() => Invoice, (invoice) => invoice.products)
  invoice: Invoice;

  @ManyToMany(() => Customer, (customer) => customer.returnedProducts)
  returnedCustomer: Customer;

  @ManyToMany(() => Customer, (customer) => customer.purchasedProducts)
  purchasedCustomer: Customer;

  @ManyToOne(() => Employee, (emp) => emp.sales, {
    onUpdate: "CASCADE",
    onDelete: "NO ACTION",
  })
  employee: Employee;

  @ManyToMany(() => Employee, (emp) => emp.returnSales)
  returnedEmployee: Employee;

  @Column({ type: "boolean", default: false })
  tagless: boolean;

  @ManyToOne(() => HoldInvoice, (h) => h.items, {
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  })
  hold: HoldInvoice;

  @ManyToMany(() => ReturnProduct, (r) => r.returnProducts)
  returnProduct: ReturnProduct;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn({ nullable: true })
  updatedAt: Date;
}
