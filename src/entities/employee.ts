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
import { EmpDesignation } from "../types";
import Salary from "./salary";
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

  @OneToMany(() => Product, (p) => p.employee, { eager: true, cascade: true })
  sales: Product[];

  @Column({ nullable: true })
  joiningDate: Date;

  @OneToMany(() => Salary, (sl) => sl.employee, { cascade: true, eager: true })
  salary: Salary[];

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

    await this.save({ reload: true, listeners: true, transaction: true });
  }
  async returnSale(product: Product): Promise<void> {
    const productToReturn = this.sales.find(
      (p) => p.itemCode === product.itemCode
    );
    if (productToReturn) {
      this.sales = this.sales.filter((p) => p.id !== productToReturn.id);
      await this.save({ transaction: true, listeners: true, reload: true });
    }
  }
}