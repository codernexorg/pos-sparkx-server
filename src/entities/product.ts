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
  invoiceNumber: number;

  @Column()
  invoiceDate: Date;

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
  unitCost: number;

  @ManyToOne(() => WareHouse, wh => wh.products, { nullable: true })
  whId: WareHouse;

  @ManyToOne(() => User, user => user.products)
  creator: User;

  @Column()
  sellPrice: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
