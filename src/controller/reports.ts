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
import { ControllerFn, ProductStatus } from "../types";

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
      const startOfMonth = moment(date).startOf("month").format("YYYY-MM-DD");
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
        .where(
          "DATE(invoice.createdAt) >= :start_date AND DATE(invoice.createdAt) <= :end_date",
          { start_date: startOfMonth, end_date: endOfMonth }
        )
        .andWhere("invoice.showroom = :showroom", {
          showroom: showroomData?.id,
        })
        .getMany();

      interface DailySalesResponse {
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

      const dailySales: Map<string, DailySalesResponse> = new Map();

      rawSales.forEach((iv) => {
        const createdAt = moment(iv.createdAt);
        const currentDate = createdAt.format("DD-MM-YYYY");
        const currentMonth = createdAt.format("MMMM");
        const currentYear = createdAt.format("YYYY");

        const bkashAmount = iv.bkash;
        const cblAmount = iv.cbl;
        const cashAmount = iv.cash;
        const gapAmount = iv.invoiceAmount - (iv.bkash + iv.cbl + iv.cash);
        const taglessTotal = iv.products
          .filter((p) => p.tagless)
          .reduce((sum, p) => {
            return sum + p.sellPriceAfterDiscount;
          }, 0);

        const withOutTaglessTotal = iv.products
          .filter((p) => p.tagless === false)
          .reduce((sum, p) => {
            return sum + p.sellPriceAfterDiscount;
          }, 0);

        if (dailySales.has(currentDate)) {
          const salesItem = dailySales.get(currentDate)!;

          salesItem.total += iv.invoiceAmount;
          salesItem.taglessTotal += taglessTotal;
          salesItem.withOutTaglessTotal += withOutTaglessTotal;
          salesItem.bkashAmount += bkashAmount;
          salesItem.cashAmount += cashAmount;
          salesItem.cblAmount += cblAmount;
          salesItem.gapAmount += gapAmount;
        } else {
          dailySales.set(currentDate, {
            date: currentDate,
            month: currentMonth,
            year: currentYear,
            quantity: iv.products.length - iv.returnQuantity,
            total: iv.invoiceAmount,
            taglessTotal,
            withOutTaglessTotal,
            bkashAmount,
            cblAmount,
            cashAmount,
            gapAmount,
          });
        }
      });

      // Convert the Map values to an array of DailySalesReponse
      const optimizedDailySales: DailySalesResponse[] = Array.from(
        dailySales.values()
      );

      res.status(200).json(
        optimizedDailySales.map((d, _idx, arr) => {
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
      const startOfMonth = moment(date).startOf("month").format("MMMM-YYYY");
      //End OF Month
      const endOfMonth = moment(date).endOf("month").format("MMMM-YYYY");
      const showroomData = await dataSource
        .getRepository(Showroom)
        .createQueryBuilder("showroom")
        .leftJoinAndSelect("showroom.employees", "employees")
        .where("showroom.showroomCode=:showroomCode", {
          showroomCode: showroom as string,
        })
        .getOne();

      if (!showroomData) {
        return _next(
          new ErrorHandler("Happeing Problem To Find Showroom", 404)
        );
      }

      const data = await dataSource
        .getRepository(Employee)
        .createQueryBuilder("emp")
        .leftJoinAndSelect("emp.sales", "sales")
        .leftJoinAndSelect("emp.returnSales", "returnSales")
        .leftJoinAndSelect("emp.showroom", "showroom")
        .where("showroom.id = :id", { id: showroomData.id })
        .andWhere(
          'DATE_FORMAT(sales.updatedAt,"%M-%Y") >= :start_date AND DATE_FORMAT(sales.updatedAt,"%M-%Y") <= :end_date',
          {
            start_date: startOfMonth,
            end_date: endOfMonth,
          }
        )
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
}

export const getTopCustomer: ControllerFn = async (_req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-based month

    const customers = await dataSource
      .getRepository(Customer)
      .createQueryBuilder("customer")
      .leftJoinAndSelect("customer.showroom", "showroom")
      .leftJoinAndSelect("customer.purchasedProducts", "purchasedProducts")
      .getMany();

    //All Customer Data

    let filteredCustomer: Customer[];

    if (_req.showroomId) {
      filteredCustomer = customers.filter(
        (customer) => customer.showroom.id === _req.showroomId
      );
    } else {
      filteredCustomer = customers;
    }

    const finalData = filteredCustomer
      .map((customer) => {
        const productPurchasedOnThisMonth = customer?.purchasedProducts?.filter(
          (product) => {
            const month = new Date(product.updatedAt).getMonth() + 1;

            return month === currentMonth;
          }
        );

        return {
          customerName: customer.customerName,
          quantity: productPurchasedOnThisMonth?.length,
          showroomName: customer.showroom.showroomName,
          customerPhone: customer.customerPhone,
        };
      })
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    res.status(200).json(finalData);
  } catch (e) {
    console.log(e);

    res.status(500).json({ message: e.message });
  }
};

export const salesQtyReport: ControllerFn = async (req, res, _next) => {
  try {
    const { to_date, from_date = new Date(Date.now()), today } = req.query;

    let qb;

    if (req.showroomId) {
      qb = dataSource
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
      qb = dataSource
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
