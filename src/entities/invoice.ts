import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { InvoiceStatus } from "../types";
import Product from "./product";
import Employee from "./employee";
import Showroom from "./showroom";
import { filter, find } from "underscore";
import Payment from "./Payment";
import ReturnProduct from "./returnProduct";

@Entity()
export default class Invoice extends BaseEntity {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id: number;

  @Column({
    nullable: true,
    default: InvoiceStatus.Paid,
    enum: InvoiceStatus,
    type: "enum",
  })
  invoiceStatus: InvoiceStatus;

  @Column({ nullable: true, default: "Spark X Fashion Wear Limited" })
  businessName: string;

  @Column({ nullable: true, default: "Dhaka, Dhaka, Bangladesh" })
  businessAddress: string;

  @Column({ nullable: true })
  customerName: string;

  @Column({ nullable: true })
  customerMobile: string;

  @OneToMany(() => Product, (product) => product.invoice, {
    cascade: true,
    eager: true,
  })
  products: Product[];

  @Column({ nullable: true })
  showroomName: string;

  @Column({ nullable: true })
  showroomAddress: string;

  @Column({ nullable: true })
  showroomInvoiceCode: string;

  @Column({ nullable: true })
  showroomMobile: string;

  @ManyToOne(() => Showroom, (sr) => sr.invoices, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  showroom: Showroom;

  @ManyToOne(() => Employee, (emp) => emp.sales, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  employee: Employee;

  @Column({ type: "float", nullable: true, default: 0 })
  invoiceAmount: number;

  @Column({ type: "float", nullable: true, default: 0 })
  netAmount: number;

  @Column({ type: "float", nullable: true, default: 0 })
  subtotal: number;

  @Column({ type: "float", nullable: true, default: 0 })
  cash: number;

  @Column({ type: "float", nullable: true, default: 0 })
  bkash: number;

  @Column({ type: "float", nullable: true, default: 0 })
  cbl: number;

  @Column({ nullable: true, type: "float", default: 0 })
  paidAmount: number;
  @Column({ nullable: true, type: "float", default: 0 })
  changeAmount: number;

  @Column({ nullable: true, default: 0, type: "float" })
  discountAmount: number;

  @Column({ nullable: true, default: 0, type: "float" })
  vat: number;
  @Column({ nullable: true, type: "int" })
  quantity: number;

  @Column({ nullable: true, default: 0 })
  returnQuantity: number;

  @OneToOne(() => Payment, {
    eager: true,
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  })
  @JoinColumn()
  paymentMethod: Payment;

  @OneToOne(() => ReturnProduct, {
    eager: true,
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  })
  @JoinColumn()
  returned: ReturnProduct;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
