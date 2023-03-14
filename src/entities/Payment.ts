import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { PaymentType } from "../types";
import Account from "./account";

@Entity()
export default class Payment extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "enum", enum: PaymentType })
  paymentType: PaymentType;

  @Column({ type: "float" })
  amount: number;

  @Column({ nullable: true })
  paymentNote: string;

  @ManyToOne(() => Account, (account) => account.payments, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  account: Account;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
