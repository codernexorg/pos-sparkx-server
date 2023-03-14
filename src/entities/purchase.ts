import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { PurchaseStatus } from "../types";
import Product from "./product";

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
