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

  @Column({ nullable: true })
  supplierEmail: string;

  @Column()
  contactPersonName: string;

  @Column({ nullable: true })
  contactPersonNumber: string;

  @Column({ nullable: true })
  altContactNumber: string;

  @Column({ nullable: true })
  supplierAddress: string;

  @Column({ nullable: true })
  extraInfo: string;

  @ManyToOne(() => User, user => user.suppliers)
  creator: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
