import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from 'typeorm';
import {Showroom} from "./index";

@Entity()
export default class Supplier extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    supplierName: string;

    @Column({nullable: true})
    supplierEmail: string;

    @Column({nullable: true})
    contactPersonName: string;

    @Column({nullable: true})
    contactPersonNumber: string;

    @Column({nullable: true})
    altContactNumber: string;

    @Column({nullable: true})
    supplierAddress: string;

    @Column({nullable: true})
    extraInfo: string;

    @ManyToOne(() => Showroom, sr => sr.supplier, {onDelete: 'CASCADE', onUpdate: 'CASCADE'})
    showroom: Supplier

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
