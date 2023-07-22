import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import Product from './product';

@Entity()
export default class ReturnProduct {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  check: string;

  @Column({ default: false })
  exchange: boolean;

  @Column({ nullable: true })
  customerPhone?: string;

  @Column({ type: 'float' })
  amount: number;

  @ManyToMany(() => Product, p => p.returnProduct, {
    eager: true
  })
  @JoinTable()
  returnProducts: Product[];

  @Column({ default: 0, type: 'float' })
  cash: number;

  @Column({ default: 0, type: 'float' })
  bkash: number;

  @Column({ default: 0, type: 'float' })
  cbl: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  udpatedAt: Date;

  public addProduct(product: Product) {
    if (this.returnProducts == null) {
      this.returnProducts = new Array<Product>();
    }
    this.returnProducts.push(product);
  }
}
