import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { PurchaseStatus } from "../types";
import Product from "./product";
import Showroom from "./showroom";

@Entity()
export default class Purchase extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  invoiceNo: string;

  @Column({ nullable: true })
  supplierName: string;

  @Column({ type: "float" })
  purchaseAmount: number;

  @Column({
    type: "enum",
    enum: PurchaseStatus,
    default: PurchaseStatus.Received,
  })
  purchaseStatus: PurchaseStatus;

  @ManyToMany(() => Product, (product) => product.purchases)
  @JoinTable({ name: "purchase__product" })
  products: Product[];

  @Column({ nullable: true, default: 0 })
  quantity: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Showroom, (sr) => sr.purchases, {
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  })
  showroom: Showroom;

  addPurchase(product: Product) {
    if (this.products == null) {
      this.products = new Array<Product>();
    }
    this.products.push(product);
  }
}
