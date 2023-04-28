import {BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn} from 'typeorm';

@Entity()
export default class WareHouse extends BaseEntity {
    @PrimaryGeneratedColumn()
    whId: number;

    @Column()
    whCode: string;

    @Column()
    whName: string;

    @Column({nullable: true})
    whMobile: string

    @Column({nullable: true})
    whLocation: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
