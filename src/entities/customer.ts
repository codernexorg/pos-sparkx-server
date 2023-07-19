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
import Showroom from "./showroom";
import Product from "./product";
import ErrorHandler from "../utils/errorHandler";

@Entity()
export default class Customer extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  customerName: string;

  @Column()
  customerPhone: string;

  @Column({ nullable: true })
  customerEmail: string;

  @Column({ nullable: true })
  customerAddress: string;

  @Column({ nullable: true, default: 0 })
  credit: number;

  @Column({ nullable: true, default: 0 })
  paid: number;

  @OneToMany(() => Product, (iv) => iv.purchasedCustomer, {
    eager: true,
    cascade: true,
  })
  purchasedProducts: Product[];

  @OneToMany(() => Product, (rp) => rp.returnedCustomer, {
    eager: true,
    cascade: true,
  })
  returnedProducts: Product[];

  @ManyToOne(() => Showroom, (sr) => sr.customer, {
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  })
  showroom: Showroom;

  @Column({ nullable: true })
  crm: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  addPurchase(product: Product): void {
    if (this.purchasedProducts == null) {
      this.purchasedProducts = new Array<Product>();
    }
    this.purchasedProducts.push(product);
  }

  returnPurchase(product: Product) {
    if (this.returnedProducts == null) {
      this.returnedProducts = new Array<Product>();
    }
    if (this.purchasedProducts) {
      const productPurchased = this.purchasedProducts.find(
        (p) => p.id === product.id
      );
      if (productPurchased) {
        this.purchasedProducts = this.purchasedProducts.filter(
          (p) => p.id !== product.id
        );
        this.returnedProducts.push(product);
      } else {
        throw new ErrorHandler(
          "Product Not Found On This Customer's Purchase List",
          404
        );
      }
    }
  }
}
