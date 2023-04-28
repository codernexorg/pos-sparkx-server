import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import Product from "./product";
import Showroom from "./showroom";

@Entity()
export default class Returned extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  check: string;

  @Column({ nullable: true })
  amount: number;

  @Column({ nullable: true })
  invoiceNo: string;

  @Column()
  customerPhone: string;

  @OneToMany(() => Product, (product) => product.returned, {
    cascade: true,
    eager: true,
  })
  products: Product[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  salesDate: Date;

  @ManyToOne(() => Showroom, (sr) => sr.returned, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  })
  showroom: Showroom;

  addReturn(product: Product) {
    if (this.products == null) {
      this.products = new Array<Product>();
    }
    this.products.push(product);
  }
}
