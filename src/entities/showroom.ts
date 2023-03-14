import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import Expenses from "./expenses";
import Supplier from "./supplier";
import Customer from "./customer";
import Invoice from "./invoice";
import User from "./user";
import Account from "./account";
import Employee from "./employee";

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

  @OneToMany(() => Supplier, (sr) => sr.showroom, {
    cascade: true,
    eager: true,
  })
  supplier: Supplier[];

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

  @OneToOne(() => Account, {
    cascade: true,
    eager: true,
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  })
  @JoinColumn()
  accounts: Account;

  @OneToMany(() => User, (user) => user.showroom, {
    eager: true,
    cascade: true,
  })
  users: User[];

  @OneToMany(() => Employee, (emp) => emp.showroom, {
    eager: true,
    cascade: true,
  })
  employees: Employee[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
