import {BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn} from 'typeorm';
import {UserRole} from '../types';

@Entity()
export default class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({unique: true})
    username: string;

    @Column({nullable: true})
    name: string;

    @Column({unique: true})
    email: string;

    @Column()
    password: string;

    @Column({nullable: true, default: 'All'})
    assignedShowroom: string


    @Column({default: UserRole.SA, type: 'enum', enum: UserRole})
    role: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
