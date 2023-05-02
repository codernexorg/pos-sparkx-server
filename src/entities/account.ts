import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity()
export default class Account extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "float", default: 0 })
  accountBalance: number;

  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
}
