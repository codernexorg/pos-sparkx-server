//Sells Reports
import Invoice from "../entities/invoice";
import { NextFunction, Request, Response } from "express";
import { Repository } from "typeorm";
import dataSource from "../typeorm.config";
import moment from "moment";
import wdate from "../helper/wdate";
import ErrorHandler from "../utils/errorHandler";
import Employee from "../entities/employee";
import Product from "../entities/product";
import Showroom from "../entities/showroom";
import Customer from "../entities/customer";

interface MonthlySales {
  [month: string]: number;
}

function getMonthlySalesQTY(sales: Product[]): {date:string, quantity:number}[] {
  const monthlySales: MonthlySales = {};

  sales.forEach((sale) => {
    const month = moment(sale.updatedAt).format('MMM');
    const year = moment(sale.updatedAt).format('YYYY');
    const monthName = `${month.length < 3 ? '0' : ''}${month}-${year}`;
    if (!monthlySales[monthName]) {
      monthlySales[monthName] = 0;
    }
    monthlySales[monthName] += sale.quantity;
  });

  return Object.entries(monthlySales).map(([date, quantity]) => ({date, quantity,month:moment(date).month('M').format(
      'MMMM'
    )}));
}
function getMonthlySalesAmount(sales: Product[]): {date:string, amount:number}[] {
  const monthlySales: MonthlySales = {};

  sales.forEach((sale) => {
    const month = moment(sale.updatedAt).format('MMM');
    const year = moment(sale.updatedAt).format('YYYY');
    const monthName = `${month.length < 3 ? '0' : ''}${month}-${year}`;
    if (!monthlySales[monthName]) {
      monthlySales[monthName] = 0;
    }
    monthlySales[monthName] += sale.sellPriceAfterDiscount;
  });

  return Object.entries(monthlySales).map(([date, amount]) => ({date, amount,month:moment(date).month('M').format(
        'MMMM'
    )}));
}

function getDailySales(sales:Product[]){
  const salesByDay: Record<string, number> = {};
  sales.forEach((sale) => {
    //moment(sale.updatedAt).format("DD-MM-YYYY")
    const saleDate = new Date(sale.updatedAt).toLocaleDateString(
        "en-US",
        {
          year: "numeric",
          month: "numeric",
          day: "numeric",
        }
    );
    salesByDay[saleDate] =
        (salesByDay[saleDate] || 0) + sale.sellPriceAfterDiscount;
  });
  return Object.entries(salesByDay).map(([date, total]) => ({
    date:moment(date).format('DD-MM-YYYY'),
    total,
    day: wdate(new Date(date).getDay()),
  }));
}
export default class ReportController {
  public static invoiceRepository: Repository<Invoice>;

  public static async sellReport(
    req: Request,
    res: Response,
    _next: NextFunction
  ) {
    const { to_date, from_date = new Date(Date.now()), today } = req.query;

    const qb = this.invoiceRepository
      .createQueryBuilder("invoice")
      .orderBy("createdAt");

    if (to_date && from_date) {
      qb.where("Date(invoice.createdAt) <= :from_date", {
        from_date,
      }).andWhere("Date(invoice.createdAt) >= :to_date", { to_date });
    }
    if (today) {
      qb.where("Date(invoice.createdAt) = :today", {
        today,
      });
    }

    const sells = await qb.getMany();

    return res.status(200).json(sells);
  }

  public static async dailySalesReport(
    req: Request,
    res: Response,
    _next: NextFunction
  ) {
    try {
      const { month,showroom } = req.query;
      if (
        !month ||
        !month.length ||
        typeof month !== "string" ||
        !month.match(/^[0-9]+$/)
      ) {
        return _next(new ErrorHandler("Invalid month", 400));
      }

      if (!showroom) {
        return _next(new ErrorHandler("Must Select Showroom", 404));
      }

      //Dynamically create a date object

      const date = moment(Number(month), "M", true).format("YYYY-MM-DD");

      //Start OF Month
      const startOfMonth = moment(date).startOf("month").format("YYYY-MM-DD");
      //End OF Month
      const endOfMonth = moment(date).endOf("month").format("YYYY-MM-DD");

      const showroomData= await Showroom.findOne({where:{showroomCode:showroom as string}})
      const rawSales = await dataSource
        .getRepository(Invoice)
        .createQueryBuilder("invoice")
        .select("Date(invoice.createdAt)", "date")
        .addSelect("SUM(invoice.invoiceAmount)", "total")
        .addSelect("SUM(invoice.quantity)", "quantity")
        .where("invoice.createdAt >= :start_date", { start_date: startOfMonth })
        .andWhere("invoice.createdAt <= :end_date", { end_date: endOfMonth })
          .andWhere('invoice.showroom=:showroom', { showroom: showroomData?.id })
        .groupBy("Date(invoice.createdAt)")
        .getRawMany();
      const sales = rawSales.map(({ date, total, quantity }, _idx, arr) => {
        const totalQty = Number(
          arr.reduce((a, b) => a + Number(b.quantity), 0)
        );
        const totalAmount = Number(
          arr.reduce((a, b) => a + Number(b.total), 0)
        );

        return {
          date: moment(date).format("DD-MM-YYYY"),
          total,
          day: wdate(moment(date).isoWeekday()),
          quantity,
          month: moment(Number(month), "M", true).format("MMMM"),
          average: total / quantity,
          year: moment(Number(month), "M", true).format("YYYY"),
          totalQty,
          totalAmount,
          totalAverage: Math.round(Number(totalAmount / totalQty)),
        };
      });

      res.status(200).json(Array.from(sales));
    } catch (e) {
      res.status(500).json({ error: e.message, success: false });
    }
  }

  public static async dailySalesEmployee(
    req: Request,
    res: Response,
    _next: NextFunction
  ) {
    try {
      const { showroom, month } = req.query;

      if (!showroom) {
        return _next(new ErrorHandler("Must Select Showroom", 404));
      }
      // //Dynamically create a date object
      //
      const date = moment(Number(month), "M", true).format("YYYY-MM-DD");
      //
      //Start OF Month
      const startOfMonth = moment(date).startOf("month").format("YYYY-MM-DD");
      //End OF Month
      const endOfMonth = moment(date).endOf("month").format("YYYY-MM-DD");
      const showroomData= await Showroom.findOne({where:{showroomCode:showroom as string}})
      const data = await dataSource
        .getRepository(Employee)
        .createQueryBuilder("emp")
        .leftJoinAndSelect("emp.sales", "sales")
          .where('emp.showroom=:showroom',{showroom:showroomData?.id})
        .andWhere("emp.updatedAt >= :start_date", { start_date: startOfMonth })
        .andWhere("emp.updatedAt <= :end_date", { end_date: endOfMonth })
        .getMany();


      const newData = data.map((employee) => {
        
        return {
          empName: employee.empName,
          sales: getDailySales(employee.sales),
          month: moment(Number(month), "M", true).format("MMMM"),
          year: moment(Number(month), "M", true).format("YYYY"),
        };
      });

      res.status(200).json(newData);
    } catch (e) {
      console.log(e);
      res.status(500).json({ error: e.message, success: false });
    }
  }

  public static async employeeMoMSalesQTY(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { showroom,year } = req.query;

      if (!showroom) {
        return next(new ErrorHandler("Must Select Showroom", 404));
      }
      const showroomData= await Showroom.findOne({where:{showroomCode:showroom as string}})
      const data = await dataSource
        .getRepository(Employee)
        .createQueryBuilder("emp")
        .leftJoinAndSelect("emp.sales", "sale")
          .where('DATE_FORMAT(emp.updatedAt,"%Y")=:year',{year})
          .andWhere('emp.showroom=:showroom',{showroom:showroomData?.id})
        .getMany();

    const newData=  data.map((employee) => {
        const monthlySales=getMonthlySalesQTY(employee.sales)
        return {empName: employee.empName, monthlySales};
      })

      res.status(200).json(newData);
    } catch (e) {
      console.log(e);
      res.status(500).json({ error: e.message, success: false });
    }
  }

  public static async employeeMoMSalesAmount(
      req: Request,
      res: Response,
      next: NextFunction
  ) {
    try {
      const { showroom,year } = req.query;

      if (!showroom) {
        return next(new ErrorHandler("Must Select Showroom", 404));
      }
      const showroomData= await Showroom.findOne({where:{showroomCode:showroom as string}})
      const data = await dataSource
          .getRepository(Employee)
          .createQueryBuilder("emp")
          .leftJoinAndSelect("emp.sales", "sale")
          .where('DATE_FORMAT(emp.updatedAt,"%Y")=:year',{year})
          .andWhere('emp.showroom=:showroom',{showroom:showroomData?.id})
          .getMany();

      const newData=  data.map((employee) => {
        const monthlySales=getMonthlySalesAmount(employee.sales)
        return {empName: employee.empName, monthlySales};
      })

      res.status(200).json(newData);
    } catch (e) {
      console.log(e);
      res.status(500).json({ error: e.message, success: false });
    }
  }

  public static async customerYOYQty(_req:Request,res:Response,_next:NextFunction){
    try{
      const data= await dataSource.getRepository(Customer)
          .createQueryBuilder('customer')
          .leftJoinAndSelect('customer.purchasedProducts', 'product')
          .select([
            'customerName',
            'customerPhone',
            'SUM(product.quantity) as quantity'
          ])
          .where('YEAR(product.updatedAt) = :year', { year: moment().year() })
          .groupBy('customer.id')
          .getRawMany();

      res.status(200).json(data)
    }catch (e){
      res.status(500).json({message:e.message})
    }
  }
}
