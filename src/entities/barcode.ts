import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export default class Barcode extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 2 })
  width: number;

  @Column({ default: 1 })
  height: number;
}
