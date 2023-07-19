import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import Product from "./product";

@Entity()
export default class HoldInvoice extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  subtotal: number;
  @Column()
  paidAmount: number;
  @OneToMany(() => Product, (p) => p.hold, { cascade: true, eager: true })
  items: Product[];
  @Column({ nullable: true })
  customerPhone: string;
  @Column({ nullable: true })
  crmPhone: string;

  @Column({ nullable: true })
  vat: number;
  @Column({ nullable: true })
  paymentMethod: string;
  @Column({ nullable: true })
  cash: number;
  @Column({ nullable: true })
  bkash: number;
  @Column({ nullable: true })
  cbl: number;
  @Column({ nullable: true })
  invoiceNo: string;
  @CreateDateColumn()
  createdAt: Date;
  addProduct(product: Product): void {
    if (this.items == null) {
      this.items = new Array<Product>();
    }
    this.items.push(product);
  }
}
