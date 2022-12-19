import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';

@Entity()
export default class ProductGroup extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  productCode: string;

  @Column()
  productName: string;

  @Column()
  productCategory: string;

  @Column({ nullable: true, default: 0 })
  requiredQuantity: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
