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
  productGroup: string;

  @Column({ nullable: true })
  productCode: string;

  @Column()
  invoiceNumber: string;

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

  @Column()
  whName: string;

  @Column()
  showroomName: string;

  @Column({ default: 'unsold' })
  sellingStatus: string;

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
