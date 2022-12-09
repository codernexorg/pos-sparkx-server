import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import Product from './product';
import User from './user';

@Entity()
export default class WareHouse extends BaseEntity {
  @PrimaryGeneratedColumn()
  whId: number;

  @Column()
  whName: string;

  @Column()
  whLocation: string;

  @ManyToOne(() => User, user => user.id, { nullable: true })
  creator: User;

  @OneToMany(() => Product, product => product.whId, { nullable: true })
  products: Product[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
