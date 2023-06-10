import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export default class Barcode extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;
  @Column({ nullable: true })
  description: string;

  @Column({ default: 1, type: "float" })
  stickerWidth: number;
  @Column({ default: 1, type: "float" })
  stickerHeight: number;

  @Column({ default: 1, type: "float", nullable: true })
  stickerInRow: number;

  @Column({ default: 0.1, type: "float", nullable: true })
  columnGap: number;

  @Column({ default: 0.1, type: "float", nullable: true })
  rowGap: number;

  @Column({ default: 3, type: "float" })
  paperWidth: number;

  @Column({ default: 1, type: "float" })
  paperHeight: number;
}
