import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import Product from "./product";

@Entity()
export default class ReturnProduct {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  check: string;

  @Column({ default: false })
  exchange: boolean;

  @Column()
  customerPhone: string;

  @Column({ type: "float" })
  amount: number;

  @OneToMany(() => Product, (p) => p.returnProduct, {
    cascade: true,
    eager: true,
  })
  returnProducts: Product[];

  @Column({ default: 0, type: "float" })
  cash: number;

  @Column({ default: 0, type: "float" })
  bkash: number;

  @Column({ default: 0, type: "float" })
  cbl: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  udpatedAt: Date;

  public addProduct(product: Product) {
    if (this.returnProducts == null) {
      this.returnProducts = new Array<Product>();
    }
    this.returnProducts.push(product);
  }
}
