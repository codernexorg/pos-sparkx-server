import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import Product from "./product";

@Entity()
export default class Returned extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  note: string;

  @Column({ nullable: true })
  amount: number;

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

  addReturn(product: Product) {
    if (this.products == null) {
      this.products = new Array<Product>();
    }
    this.products.push(product);
  }
}
