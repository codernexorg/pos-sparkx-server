import { Repository } from "typeorm";
import Customer from "../../entities/customer";
import dataSource from "../../typeorm.config";
import Showroom from "../../entities/showroom";

export const customerRepository: Repository<Customer> =
  dataSource.getRepository(Customer);

export const showroomRepository: Repository<Showroom> =
  dataSource.getRepository(Showroom);
