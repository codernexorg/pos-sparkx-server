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
import { ControllerFn, PaymentMethod } from "../types";
import Returned from "../entities/Returned";

interface MonthlySales {
  [month: string]: number;
}

function getMonthlySalesQTY(
  sales: Product[],
  returnSales: Product[]
): { date: string; quantity: number }[] {
  const monthlySales: MonthlySales = {};

  const filteredSales = sales.filter(
    (sale) => !returnSales.some((returnSale) => sale.id === returnSale.id)
  );

  filteredSales.forEach((sale) => {
    const month = moment(sale.updatedAt).format("MMM");
    const year = moment(sale.updatedAt).format("YYYY");
    const monthName = `${month.length < 3 ? "0" : ""}${month}-${year}`;
    if (!monthlySales[monthName]) {
      monthlySales[monthName] = 0;
    }
    monthlySales[monthName] += sale.quantity;
  });

  return Object.entries(monthlySales).map(([date, quantity]) => ({
    date,
    quantity,
    month: moment(date).month("M").format("MMMM"),
  }));
}

function getMonthlySalesAmount(
  sales: Product[],
  returnSales: Product[]
): { date: string; amount: number }[] {
  const monthlySales: MonthlySales = {};
  const filteredSales = sales.filter(
    (sale) => !returnSales.some((returnSale) => sale.id === returnSale.id)
  );

  filteredSales.forEach((sale) => {
    const month = moment(sale.updatedAt).format("MMM");
    const year = moment(sale.updatedAt).format("YYYY");
    const monthName = `${month.length < 3 ? "0" : ""}${month}-${year}`;
    if (!monthlySales[monthName]) {
      monthlySales[monthName] = 0;
    }
    monthlySales[monthName] += sale.sellPriceAfterDiscount;
  });

  return Object.entries(monthlySales).map(([date, amount]) => ({
    date,
    amount,
    month: moment(date).month("M").format("MMMM"),
  }));
}

function getDailySales(sales: Product[], returnSales: Product[]) {
  const salesByDay: Record<string, number> = {};
  const filteredSales = sales.filter(
    (sale) => !returnSales.some((returnSale) => sale.id === returnSale.id)
  );
  filteredSales.forEach((sale) => {
    //moment(sale.updatedAt).format("DD-MM-YYYY")
    const saleDate = new Date(sale.updatedAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
    salesByDay[saleDate] =
      (salesByDay[saleDate] || 0) + sale.sellPriceAfterDiscount;
  });
  return Object.entries(salesByDay).map(([date, total]) => ({
    date: moment(date).format("DD-MM-YYYY"),
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

    const qb = dataSource
      .getRepository(Invoice)
      .createQueryBuilder("invoice")
      .orderBy("createdAt");

    if (to_date && from_date) {
      qb.where("Date(invoice.createdAt) >= :from_date", {
        from_date,
      }).andWhere("Date(invoice.createdAt) <= :to_date", { to_date });
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
      const { month, showroom } = req.query;
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

      const showroomData = await dataSource
        .getRepository(Showroom)
        .createQueryBuilder("showroom")
        .where("showroom.showroomCode=:showroomCode", {
          showroomCode: showroom as string,
        })
        .getOne();
      const rawSales = await dataSource
        .getRepository(Invoice)
        .createQueryBuilder("invoice")
        .leftJoinAndSelect("invoice.products", "products")
        .leftJoinAndSelect("invoice.paymentMethod", "paymentMethod")
        .where("invoice.createdAt >= :start_date", { start_date: startOfMonth })
        .andWhere("invoice.createdAt <= :end_date", { end_date: endOfMonth })
        .andWhere("invoice.showroom=:showroom", { showroom: showroomData?.id })
        .getMany();

      interface DailySalesReponse {
        date: string;
        total: number;
        quantity: number;
        taglessTotal: number;
        withOutTaglessTotal: number;
        month: string;
        year: string;
        bkashAmount: number;
        cblAmount: number;
        cashAmount: number;
        gapAmount: number;
      }

      const dailySales: DailySalesReponse[] = [];

      rawSales.map((iv) => {
        const currentDate = moment(iv.createdAt).format("DD-MM-YYYY");
        const currentMonth = moment(iv.createdAt).format("MMMM");
        const currentYear = moment(iv.createdAt).format("YYYY");
        const isDateExist = dailySales.findIndex((i) => i.date === currentDate);

        if (isDateExist !== -1) {
          dailySales[isDateExist].total =
            dailySales[isDateExist].total + iv.invoiceAmount;
          dailySales[isDateExist].quantity =
            dailySales[isDateExist].quantity + iv.quantity;
          dailySales[isDateExist].taglessTotal =
            dailySales[isDateExist].taglessTotal +
            iv.products
              .filter((p) => p.tagless)
              .reduce((a, b) => a + b.sellPriceAfterDiscount, 0);
          dailySales[isDateExist].withOutTaglessTotal =
            dailySales[isDateExist].withOutTaglessTotal +
            iv.products
              .filter((p) => !p.tagless)
              .reduce((a, b) => a + b.sellPriceAfterDiscount, 0);
          dailySales[isDateExist].year = currentYear;
          dailySales[isDateExist].month = currentMonth;
          dailySales[isDateExist].date = currentDate;
          if (iv.paymentMethod.paymentMethod === PaymentMethod.BKASH) {
            dailySales[isDateExist].bkashAmount += iv.invoiceAmount;
          } else if (iv.paymentMethod.paymentMethod === PaymentMethod.CASH) {
            dailySales[isDateExist].cashAmount += iv.invoiceAmount;
          } else {
            dailySales[isDateExist].cblAmount += iv.invoiceAmount;
          }
          dailySales[isDateExist].gapAmount =
            dailySales[isDateExist].total -
            (dailySales[isDateExist].cashAmount +
              dailySales[isDateExist].bkashAmount +
              dailySales[isDateExist].cblAmount);
        } else {
          const taglessTotal = iv.products
            .filter((p) => p.tagless)
            .reduce((a, b) => a + b.sellPriceAfterDiscount, 0);
          const withOutTaglessTotal = iv.products
            .filter((p) => !p.tagless)
            .reduce((a, b) => a + b.sellPriceAfterDiscount, 0);

          const bkashAmount =
            iv.paymentMethod.paymentMethod === PaymentMethod.BKASH
              ? iv.invoiceAmount
              : 0;
          const cblAmount =
            iv.paymentMethod.paymentMethod === PaymentMethod.CBL
              ? iv.invoiceAmount
              : 0;
          const cashAmount =
            iv.paymentMethod.paymentMethod === PaymentMethod.CASH
              ? iv.invoiceAmount
              : 0;
          const gapAmount =
            iv.invoiceAmount - (cashAmount + bkashAmount + cblAmount);
          dailySales.push({
            date: currentDate,
            month: currentMonth,
            quantity: iv.quantity,
            total: iv.invoiceAmount,
            taglessTotal,
            withOutTaglessTotal,
            year: currentYear,
            bkashAmount,
            cblAmount,
            cashAmount,
            gapAmount,
          });
        }
      });

      res.status(200).json(
        dailySales.map((d, _idx, arr) => {
          const totalQty = arr.reduce((a, b) => a + b.quantity, 0);
          const totalAmount = arr.reduce((a, b) => a + b.total, 0);
          const totalTaglessAmount = arr.reduce(
            (a, b) => a + b.taglessTotal,
            0
          );
          const totalWithOutTaglessAmount = arr.reduce(
            (a, b) => a + b.withOutTaglessTotal,
            0
          );
          const totalCashAmount = arr.reduce((a, b) => a + b.cashAmount, 0);
          const totalBkashAmount = arr.reduce((a, b) => a + b.bkashAmount, 0);
          const totalCblAmount = arr.reduce((a, b) => a + b.cblAmount, 0);
          const totalGapAmount = arr.reduce((a, b) => a + b.gapAmount, 0);
          return {
            ...d,
            totalQty,
            totalAmount,
            average: d.total / d.quantity,
            totalAverage: totalAmount / totalQty,
            day: wdate(moment(d.date, "DD-MM-YYYY").isoWeekday()),
            id: _idx,
            totalTaglessAmount,
            totalWithOutTaglessAmount,
            totalCashAmount,
            totalBkashAmount,
            totalCblAmount,
            totalGapAmount,
          };
        })
      );
    } catch (e) {
      console.log(e);

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
      const showroomData = await dataSource
        .getRepository(Showroom)
        .createQueryBuilder("showroom")
        .where("showroom.showroomCode=:showroomCode", {
          showroomCode: showroom as string,
        })
        .getOne();
      const data = await dataSource
        .getRepository(Employee)
        .createQueryBuilder("emp")
        .leftJoinAndSelect("emp.sales", "sales")
        .leftJoinAndSelect("emp.returnSales", "returnSales")
        .where("emp.showroom=:showroom", { showroom: showroomData?.id })
        .andWhere("emp.updatedAt >= :start_date", { start_date: startOfMonth })
        .andWhere("emp.updatedAt <= :end_date", { end_date: endOfMonth })
        .getMany();

      const newData = data.map((employee) => {
        return {
          empName: employee.empName,
          sales: getDailySales(employee.sales, employee.returnSales),
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
      const { showroom, year } = req.query;

      if (!showroom) {
        return next(new ErrorHandler("Must Select Showroom", 404));
      }
      const showroomData = await dataSource
        .getRepository(Showroom)
        .createQueryBuilder("showroom")
        .where("showroom.showroomCode=:showroomCode", {
          showroomCode: showroom as string,
        })
        .getOne();
      const data = await dataSource
        .getRepository(Employee)
        .createQueryBuilder("emp")
        .leftJoinAndSelect("emp.sales", "sales")
        .leftJoinAndSelect("emp.returnSales", "returnSales")
        .where('DATE_FORMAT(emp.updatedAt,"%Y")=:year', { year })
        .andWhere("emp.showroom=:showroom", { showroom: showroomData?.id })
        .getMany();

      const currentYearData = data.map((employee) => {
        const monthlySales = getMonthlySalesQTY(
          employee.sales,
          employee.returnSales
        );

        return { empName: employee.empName, monthlySales };
      });

      const prevYear = Number(year) - 1;
      console.log("prev year", prevYear);

      const prevData = await dataSource
        .getRepository(Employee)
        .createQueryBuilder("emp")
        .leftJoinAndSelect("emp.sales", "sales")
        .leftJoinAndSelect("emp.returnSales", "returnSales")
        .where('DATE_FORMAT(emp.updatedAt,"%Y")=:year', { year: prevYear })
        .andWhere("emp.showroom=:showroom", { showroom: showroomData?.id })
        .getMany();

      const prevYearData = prevData.map((employee) => {
        const monthlySales = getMonthlySalesQTY(
          employee.sales,
          employee.returnSales
        );

        return { empName: employee.empName, monthlySales };
      });

      res.status(200).json({ currentYearData, prevYearData });
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
      const { showroom, year } = req.query;

      if (!showroom) {
        return next(new ErrorHandler("Must Select Showroom", 404));
      }
      const showroomData = await dataSource
        .getRepository(Showroom)
        .createQueryBuilder("showroom")
        .where("showroom.showroomCode=:showroomCode", {
          showroomCode: showroom as string,
        })
        .getOne();
      const data = await dataSource
        .getRepository(Employee)
        .createQueryBuilder("emp")
        .leftJoinAndSelect("emp.sales", "sales")
        .leftJoinAndSelect("emp.returnSales", "returnSales")
        .where('DATE_FORMAT(emp.updatedAt,"%Y")=:year', { year })
        .andWhere("emp.showroom=:showroom", { showroom: showroomData?.id })
        .getMany();

      const currentYearData = data.map((employee) => {
        const monthlySales = getMonthlySalesAmount(
          employee.sales,
          employee.returnSales
        );
        return { empName: employee.empName, monthlySales };
      });

      const prevYear = Number(year) - 1;

      const prevData = await dataSource
        .getRepository(Employee)
        .createQueryBuilder("emp")
        .leftJoinAndSelect("emp.sales", "sales")
        .leftJoinAndSelect("emp.returnSales", "returnSales")
        .where('DATE_FORMAT(emp.updatedAt,"%Y")=:year', { year: prevYear })
        .andWhere("emp.showroom=:showroom", { showroom: showroomData?.id })
        .getMany();

      const prevYearData = prevData.map((employee) => {
        const monthlySales = getMonthlySalesAmount(
          employee.sales,
          employee.returnSales
        );
        return { empName: employee.empName, monthlySales };
      });

      res.status(200).json({ currentYearData, prevYearData });
    } catch (e) {
      console.log(e);
      res.status(500).json({ error: e.message, success: false });
    }
  }

  public static async customerYOYQty(
    req: Request,
    res: Response,
    _next: NextFunction
  ) {
    try {
      const { showroomCode } = req.query;
      if (!showroomCode) {
        return _next(new ErrorHandler("Showroom Must Be Selected", 404));
      }
      const data = await dataSource
        .getRepository(Customer)
        .createQueryBuilder("customer")
        .leftJoinAndSelect("customer.purchasedProducts", "product")
        .leftJoinAndSelect("customer.showroom", "showroom")
        .select([
          "customerName",
          "customerPhone",
          "showroom",
          "crm",
          'DATE_FORMAT(customer.createdAt,"%d-%m-%y") as createdAt',
          'DATE_FORMAT(customer.updatedAt,"%Y") as year',
          "SUM(product.quantity) as quantity",
        ])
        .where("YEAR(product.updatedAt) BETWEEN :start AND :end", {
          start: 2020,
          end: moment().year(),
        })
        .andWhere("showroom.showroomCode=:showroomCode", { showroomCode })
        .groupBy("customer.id")
        .getRawMany();

      const newData = data.map(
        async ({
          customerName,
          customerPhone,
          crm,
          quantity,
          createdAt,
          year,
          showroom_showroomName,
        }) => {
          const emp = await dataSource
            .getRepository(Employee)
            .createQueryBuilder("emp")
            .where("emp.empPhone = :crm", { crm })
            .getOne();
          return {
            customerName,
            customerPhone,
            quantity,
            crm: emp?.empName,
            createdAt,
            year: Number(year),
            showroom: showroom_showroomName,
          };
        }
      );

      res.status(200).json(await Promise.all(newData));
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }

  public static async customerYOYAmount(
    req: Request,
    res: Response,
    _next: NextFunction
  ) {
    try {
      const { showroomCode } = req.query;
      if (!showroomCode) {
        return _next(new ErrorHandler("Showroom Must Be Selected", 404));
      }
      const data = await dataSource
        .getRepository(Customer)
        .createQueryBuilder("customer")
        .leftJoinAndSelect("customer.purchasedProducts", "product")
        .leftJoinAndSelect("customer.showroom", "showroom")
        .select([
          "customerName",
          "customerPhone",
          "showroom",
          'DATE_FORMAT(customer.createdAt,"%d-%m-%y") as createdAt',
          'DATE_FORMAT(customer.updatedAt,"%Y") as year',
          "crm",
          "SUM(product.sellPriceAfterDiscount) as amount",
        ])
        .where("YEAR(product.updatedAt) BETWEEN :start AND :end", {
          start: 2020,
          end: moment().year(),
        })
        .andWhere("showroom.showroomCode=:showroomCode", { showroomCode })
        .groupBy("customer.id")
        .getRawMany();

      const newData = data.map(
        async ({
          customerName,
          customerPhone,
          crm,
          amount,
          createdAt,
          year,
          showroom_showroomName,
        }) => {
          const emp = await dataSource
            .getRepository(Employee)
            .createQueryBuilder("emp")
            .where("emp.empPhone = :crm", { crm })
            .getOne();

          return {
            customerName,
            customerPhone,
            amount,
            crm: emp?.empName,
            createdAt,
            year: Number(year),
            showroom: showroom_showroomName,
          };
        }
      );

      res.status(200).json(await Promise.all(newData));
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }

  public static async soldUnsoldReport(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { supplierName, productGroup } = req.query;
      if (!productGroup) {
        return next(new ErrorHandler("Please Select A Product Group", 404));
      }
      if (supplierName) {
        console.log("With Supplier NAme");
        const products = await dataSource
          .getRepository(Product)
          .createQueryBuilder("product")
          .select(
            "product.showroomName, product.productGroup, product.sellingStatus, SUM(product.quantity) as quantity"
          )
          .groupBy("product.showroomName, product.sellingStatus")
          .where("supplierName=:supplierName", { supplierName })
          .andWhere("productGroup=:productGroup", { productGroup })
          .getRawMany();

        const showroomProducts = products.reduce((result, product) => {
          const { showroomName, productGroup, sellingStatus, quantity } =
            product;
          const key = `${showroomName}_${productGroup}`;
          const existingProduct = result.find((p: any) => p.key === key);

          if (!existingProduct) {
            result.push({
              key,
              showroomName,
              productGroup,
              sold: 0,
              unsold: 0,
              total: 0,
              rating: 0,
            });
          }

          const index = result.findIndex((p: any) => p.key === key);
          if (sellingStatus === "Sold") {
            result[index].sold += Number(quantity);
          } else if (sellingStatus === "Unsold") {
            result[index].unsold += Number(quantity);
          }
          result[index].total = result[index].sold + result[index].unsold;
          result[index].rating = Math.round(
            (result[index].sold / result[index].total) * 100
          );
          return result;
        }, []);

        // Convert keys to objects
        const showroomProductsArray = Object.values(showroomProducts);

        res.status(200).json(showroomProductsArray);
      } else {
        const products = await dataSource
          .getRepository(Product)
          .createQueryBuilder("product")
          .select(
            "product.showroomName, product.productGroup, product.sellingStatus, SUM(product.quantity) as quantity"
          )
          .groupBy("product.showroomName, product.sellingStatus")
          .andWhere("productGroup=:productGroup", { productGroup })
          .getRawMany();

        const showroomProducts = products.reduce((result, product) => {
          const { showroomName, productGroup, sellingStatus, quantity } =
            product;
          const key = `${showroomName}_${productGroup}`;
          const existingProduct = result.find((p: any) => p.key === key);

          if (!existingProduct) {
            result.push({
              key,
              showroomName,
              productGroup,
              sold: 0,
              unsold: 0,
              total: 0,
              rating: 0,
            });
          }

          const index = result.findIndex((p: any) => p.key === key);
          if (sellingStatus === "Sold") {
            result[index].sold += Number(quantity);
          } else if (sellingStatus === "Unsold") {
            result[index].unsold += Number(quantity);
          }
          result[index].total = result[index].sold + result[index].unsold;
          result[index].rating = Math.round(
            (result[index].sold / result[index].total) * 100
          );
          return result;
        }, []);

        // Convert keys to objects
        const showroomProductsArray = Object.values(showroomProducts);

        res.status(200).json(showroomProductsArray);
      }
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }

  public static async inventorySizeReport(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { sellingStatus, productGroup, supplierName } = req.query;

      if (!sellingStatus || !productGroup) {
        return next(
          new ErrorHandler(
            "Product Group | Selling Status must be selected",
            404
          )
        );
      }

      interface ProductData {
        showroomName: string;
        quantity: number;
        sellingStatus: string;
        size: number;
      }

      interface Showroom {
        showroomName: string;
        showroomProducts: ProductData[];
      }

      const groupCarsByShowroom = (products: ProductData[]): Showroom[] => {
        const showrooms: { [showroomName: string]: ProductData[] } = {};

        // Group products by showroomName
        products.forEach((product) => {
          if (showrooms[product.showroomName]) {
            showrooms[product.showroomName].push(product);
          } else {
            showrooms[product.showroomName] = [product];
          }
        });

        // Create new Showroom objects from grouped products
        const result: Showroom[] = [];
        for (const [showroomName, products] of Object.entries(showrooms)) {
          const showroom: Showroom = {
            showroomName,
            showroomProducts: products,
          };
          result.push(showroom);
        }

        return result;
      };
      if (supplierName) {
        const products = await dataSource
          .getRepository(Product)
          .createQueryBuilder("product")
          .select(
            "product.size,product.productGroup,product.sellingStatus,SUM(product.quantity) as quantity,product.showroomName"
          )
          .where("productGroup=:productGroup", { productGroup })
          .andWhere("sellingStatus=:sellingStatus", { sellingStatus })
          .andWhere("supplierName=:supplierName", { supplierName })
          .groupBy("product.showroomName,product.size")
          .getRawMany();
        res.status(200).json(groupCarsByShowroom(products));
      } else {
        const products = await dataSource
          .getRepository(Product)
          .createQueryBuilder("product")
          .select(
            "product.size,product.productGroup,product.sellingStatus,SUM(product.quantity) as quantity,product.showroomName "
          )
          .where("productGroup=:productGroup", { productGroup })
          .andWhere("sellingStatus=:sellingStatus", { sellingStatus })
          .groupBy("product.showroomName,product.size")
          .getRawMany();
        res.status(200).json(groupCarsByShowroom(products));
      }
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }

  async unitToUnitComparison(req: Request, res: Response, _next: NextFunction) {
    try {
      const { today, form_date } = req.query;

      if (today) {
        const sales = await dataSource
          .getRepository(Employee)
          .createQueryBuilder("employee")
          .leftJoinAndSelect("employee.sales", "sales")
          .select(
            "sales.productGroup as productGroup,SUM(sales.sellPriceAfterDiscount) as amount,sales.showroomName as showroom"
          )
          .where("DATE(sales.updatedAt)=:today", { today })
          .groupBy("productGroup")
          .getRawMany();
        res.status(200).json(sales);
      }

      if (form_date) {
        const currentDate = moment().format("YYYY-MM-DD");
        const sales = await dataSource
          .getRepository(Employee)
          .createQueryBuilder("employee")
          .leftJoinAndSelect("employee.sales", "sales")
          .select(
            "sales.productGroup as productGroup,SUM(sales.sellPriceAfterDiscount) as amount,sales.showroomName as showroom"
          )
          .where("DATE(sales.updatedAt)>=:form_date", { form_date })
          .andWhere("DATE(sales.updatedAt)<=:currentDate", { currentDate })
          .groupBy("productGroup,showroom")
          .getRawMany();
        res.status(200).json(sales);
      }
    } catch (e) {
      res.status(404).json({ message: e.message });
    }
  }

  public static async returnReport(
    req: Request,
    res: Response,
    _next: NextFunction
  ) {
    try {
      const returnRaw = await dataSource
        .getRepository(Returned)
        .createQueryBuilder("r")
        .leftJoinAndSelect("r.products", "products")
        .leftJoinAndSelect("products.employee", "employee")
        .getMany();

      const formattedReturn = returnRaw.map((r, id) => {
        return {
          id,
          day: wdate(moment(r.createdAt, "DD-MM-YYYY").isoWeekday()),
          date: moment(r.createdAt).format("DD-MM-YYYY"),
          tagPrice: r.products.flatMap((p) => p.sellPrice),
          finalPrice: r.products.flatMap((p) => p.sellPriceAfterDiscount),
          invoiceNo: r.invoiceNo,
          seller: r.products.flatMap((p) => ({
            empName: p.employee.empName,
            empPhone: p.employee.empPhone,
          })),
          check: r.check,
          customer: r.customerPhone,
          products: r.products.flatMap((p) => ({
            itemCode: p.itemCode,
            productName: p.productGroup,
          })),
        };
      });

      res.status(200).json(formattedReturn);
    } catch (e) {
      res.status(404).json({ message: e.message });
    }
  }
}

export const getTopCustomer: ControllerFn = async (_req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-based month

    let customers: any;

    if (_req.showroomId) {
      customers = await dataSource
        .getRepository(Showroom)
        .createQueryBuilder("showroom")
        .leftJoinAndSelect("showroom.customer", "customer")
        .leftJoinAndSelect("customer.purchasedProducts", "product")
        .select(
          "customer.customerName as customerName,SUM(product.quantity) as quantity,customer.customerPhone as customerPhone,showroom.showroomName as showroomName"
        )
        .where(`MONTH(product.updatedAt) = :month`, { month: currentMonth })
        .andWhere("showroom.id=:id", { id: _req.showroomId })
        .groupBy("customer.id")
        .orderBy("quantity", "DESC")
        .limit(5)
        .getRawMany();
    } else {
      customers = await dataSource
        .getRepository(Customer)
        .createQueryBuilder("customer")
        .leftJoinAndSelect("customer.purchasedProducts", "product")
        .leftJoinAndSelect("customer.showroom", "showroom")
        .select(
          "customerName,SUM(product.quantity) as quantity,customer.customerPhone as customerPhone,showroom.showroomName as showroomName"
        )
        .where(`MONTH(product.updatedAt) = :month`, { month: currentMonth })
        .groupBy("customer.id")
        .orderBy("quantity", "DESC")
        .limit(5)
        .getRawMany();
    }
    //All Customer Data
    console.log(customers);
    res.status(200).json(customers);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const salesQtyReport: ControllerFn = async (req, res, _next) => {
  try {
    const { to_date, from_date = new Date(Date.now()), today } = req.query;

    let qb: any;

    if (req.showroomId) {
      qb = await dataSource
        .getRepository(Showroom)
        .createQueryBuilder("showroom")
        .leftJoinAndSelect("showroom.invoices", "invoice")
        .select(
          "SUM(invoice.quantity) as quantity,Date(invoice.createdAt) as createdAt"
        )
        .where("showroom.id=:id", { id: req.showroomId })
        .orderBy("createdAt")
        .groupBy("Date(invoice.createdAt)");
    } else {
      qb = await dataSource
        .getRepository(Invoice)
        .createQueryBuilder("invoice")
        .select(
          "SUM(invoice.quantity) as quantity,Date(invoice.createdAt) as createdAt"
        )
        .orderBy("createdAt")
        .groupBy("Date(invoice.createdAt)");
    }

    if (to_date && from_date) {
      qb.where("Date(invoice.createdAt) >= :from_date", {
        from_date,
      }).andWhere("Date(invoice.createdAt) <= :to_date", { to_date });
    }
    if (today) {
      qb.where("Date(invoice.createdAt) = :today", {
        today,
      });
    }

    const sells: { quantity: number; createdAt: string }[] =
      await qb.getRawMany();

    const formattedData = sells.map(({ quantity, createdAt }, i) => {
      return {
        x: moment(createdAt).format("DD-MM-YY"),
        y: Number(quantity),
        id: i,
      };
    });

    console.log(formattedData);
    res.status(200).json(formattedData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const salesAmountReport: ControllerFn = async (req, res, _next) => {
  try {
    const { to_date, from_date = new Date(Date.now()), today } = req.query;

    let qb: any;

    if (req.showroomId) {
      qb = dataSource
        .getRepository(Showroom)
        .createQueryBuilder("showroom")
        .leftJoinAndSelect("showroom.invoices", "invoice")
        .select(
          "SUM(invoice.invoiceAmount) as amount,Date(invoice.createdAt) as createdAt"
        )
        .where("showroom.id=:id", { id: req.showroomId })
        .orderBy("createdAt")
        .groupBy("Date(invoice.createdAt)");
    } else {
      qb = dataSource
        .getRepository(Invoice)
        .createQueryBuilder("invoice")
        .select(
          "SUM(invoice.invoiceAmount) as amount,Date(invoice.createdAt) as createdAt"
        )
        .orderBy("createdAt")
        .groupBy("Date(invoice.createdAt)");
    }

    if (to_date && from_date) {
      qb.where("Date(invoice.createdAt) >= :from_date", {
        from_date,
      }).andWhere("Date(invoice.createdAt) <= :to_date", { to_date });
    }
    if (today) {
      qb.where("Date(invoice.createdAt) = :today", {
        today,
      });
    }

    const sells: { amount: number; createdAt: string; showroom: string }[] =
      await qb.getRawMany();
    const formattedData = sells.map(({ amount, createdAt, showroom }, i) => {
      return {
        x: moment(createdAt).format("DD-MM-YY"),
        y: Number(amount),
        id: i,
        showroom,
      };
    });
    res.status(200).json(formattedData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
