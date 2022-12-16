import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import User from './user';
import WareHouse from './warehouse';

@Entity()
export default class Product extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  itemCode: number;

  @Column()
  productCode: number;

  @Column()
  productGroup: string;

  @Column()
  invoiceNumber: string;

  @Column()
  invoiceDate: string;

  @Column()
  lotNumber: number;

  @Column()
  invoiceTotalPrice: number;

  @Column()
  supplierName: string;

  @Column()
  totalItem: number;

  @Column()
  transportationCost: number;

  @Column()
  plannedShowroom: string;

  @Column()
  unitCost: number;

  @ManyToOne(() => WareHouse, wh => wh.products)
  @JoinColumn()
  whId: WareHouse;

  @ManyToOne(() => User, user => user.products)
  @JoinColumn()
  creator: User;

  @Column()
  sellPrice: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
