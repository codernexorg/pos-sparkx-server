import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import Expenses from "./expenses";
import Customer from "./customer";
import Invoice from "./invoice";
import Employee from "./employee";
import Purchase from "./purchase";

@Entity()
export default class Showroom extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  showroomName: string;

  @Column()
  showroomCode: string;

  @Column({ nullable: true })
  showroomMobile: string;

  @Column()
  showroomAddress: string;

  @OneToMany(() => Expenses, (ex) => ex.showroom, {
    cascade: true,
    eager: true,
  })
  expenses: Expenses[];

  @OneToMany(() => Customer, (cm) => cm.showroom, {
    cascade: true,
    eager: true,
  })
  customer: Customer[];

  @OneToMany(() => Invoice, (invoice) => invoice.showroom, {
    eager: true,
    cascade: true,
  })
  invoices: Invoice[];

  @OneToMany(() => Employee, (emp) => emp.showroom, {
    eager: true,
    cascade: true,
  })
  employees: Employee[];

  @OneToMany(() => Purchase, (p) => p.showroom, { cascade: true, eager: true })
  purchases: Purchase[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
