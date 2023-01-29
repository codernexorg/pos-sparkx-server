import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from 'typeorm';
import {Invoice} from "./index";

@Entity()
export default class Showroom extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;
    @Column()
    showroomName: string;

    @Column()
    showroomCode: string;

    @Column({nullable: true})
    showroomMobile: string

    @Column()
    showroomAddress: string;

    @OneToMany(() => Invoice, invoice => invoice.showroomId)
    invoices: Invoice[]

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
