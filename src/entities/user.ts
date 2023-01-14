import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { UserRole } from '../types';
import Brand from './brand';
import Category from './category';
import Product from './product';
import Showroom from './showroom';
import Supplier from './supplier';
import WareHouse from './warehouse';

@Entity()
export default class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column({ nullable: true })
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ default: UserRole.MA, type: 'enum', enum: UserRole })
  role: UserRole;

  @OneToMany(() => Product, product => product.creator)
  products: Product[];

  @OneToMany(() => Supplier, sup => sup.creator)
  suppliers: Supplier[];

  @OneToMany(() => WareHouse, wh => wh.creator)
  warehouses: WareHouse[];

  @OneToMany(() => Showroom, sr => sr.creator)
  showrooms: Showroom[];

  @OneToMany(() => Category, cat => cat.user)
  @JoinColumn()
  categories: Category[];

  @OneToMany(() => Brand, brand => brand.creator)
  brands: Brand[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
