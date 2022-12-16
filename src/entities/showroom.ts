import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import User from './user';

@Entity()
export default class Showroom extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  showroomName: string;

  @Column()
  showroomCode: number;

  @Column()
  showroomAddress: string;

  @ManyToOne(() => User, user => user.showrooms)
  creator: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
