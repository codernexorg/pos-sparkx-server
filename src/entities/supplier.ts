import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import User from './user';

@Entity()
export default class Supplier extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  supplierName: string;

  @Column()
  supplierEmail: string;

  @Column()
  contactPersonName: string;

  @Column()
  contactPersonNumber: string;

  @Column()
  altContactNumber: string;

  @Column()
  supplierAddress: string;

  @Column()
  extraInfo: string;

  @ManyToOne(() => User, user => user.suppliers)
  creator: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
