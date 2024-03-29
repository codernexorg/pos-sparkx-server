import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { EmpDesignation } from "../types";
import Product from "./product";
import Showroom from "./showroom";

@Entity()
export default class Employee extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  empName: string;

  @Column()
  empPhone: string;

  @Column({ enum: EmpDesignation, type: "enum" })
  designation: EmpDesignation;

  @Column({ nullable: true })
  empEmail: string;

  @Column({ nullable: true })
  empAddress: string;

  @Column({ nullable: true, default: 0 })
  empSalary: number;

  @OneToMany(() => Product, (p) => p.employee, {
    eager: true,
    cascade: true,
  })
  sales: Product[];

  @ManyToMany(() => Product, (p) => p.returnedEmployee, {
    eager: true,
  })
  @JoinTable()
  returnSales: Product[];

  @Column({ nullable: true })
  joiningDate: Date;

  @ManyToOne(() => Showroom, (sr) => sr.employees, {
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  })
  showroom: Showroom;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  async addSale(product: Product): Promise<void> {
    if (this.sales == null) {
      this.sales = new Array<Product>();
    }
    this.sales.push(product);
  }
  returnSale(product: Product) {
    if (this.returnSales == null) {
      this.returnSales = new Array<Product>();
    }
    const productPurchased = this.sales.find((p) => p.id === product.id);
    console.log(productPurchased);
    if (productPurchased) {
      this.sales = this.sales.filter((p) => p.id !== product.id);
      this.returnSales.push(product);
    }
  }
}
