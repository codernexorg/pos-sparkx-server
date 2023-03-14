import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import Payment from "./Payment";

@Entity()
export default class Account extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "float", default: 0 })
  accountBalance: number;

  @OneToMany(() => Payment, (payment) => payment.account, {
    eager: true,
    cascade: true,
  })
  payments: Payment[];

  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
}
