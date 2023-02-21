import {ControllerFn, InvoiceStatus, ProductStatus} from '../types';
import ErrorHandler from '../utils/errorHandler';
import Product from "../entities/product";
import Showroom from "../entities/showroom";
import Employee from "../entities/employee";
import Customer from "../entities/customer";
import Invoice from "../entities/invoice";

export const createInvoice: ControllerFn = async (req, res, next) => {

    const {
        items,
        subtotal, customerName, empName, discounts, vat, paidAmount, discountTk, payable
    } = req.body as { items: Product[]; subtotal: number, customerName: string, empName: string, discounts: number[], vat: number, paidAmount: number, discountTk: number[], payable: number[] };

    if (!items || !items.length) {
        return next(new ErrorHandler('No product to sell', 404));
    }

    if (!empName) {
        return next(new ErrorHandler('Please Select An Employee', 404));
    }

    const employee = await Employee.findOne({where: {empName: empName}})

    if (!employee) {
        return next(new ErrorHandler('No Employee Found', 404))
    }

    let showroom: Showroom | null = null;

    if (req.showroomId) {
        showroom = await Showroom.findOne({
            where: {id: req.showroomId},
            relations: {invoices: true}
        });
    }

    const customer = await Customer.findOne({where: {customerName: customerName}, relations: {products: true}})
    if (!customer) {
        return next(new ErrorHandler('No Customer Found', 404));
    }

    const netAmount = payable.reduce((a, b) => a + b) + Math.round((subtotal / 100) * (vat))
    const discountAmount = discountTk.reduce((a, b) => a + b)

    if (req.body.invoiceStatus !== 'Hold') {
        if (!customer && netAmount > Number((req.body?.paidAmount))) {
            return next(new ErrorHandler('Due Only Possible With Registered Customer', 404))
        }
    }


    const products: Product[] = [];


    for (let i = 0; i < items.length; i++) {
        let product;
        if (showroom) {
            product = await Product.findOne({
                where: {
                    itemCode: items[i].itemCode,
                    showroomName: showroom.showroomName
                }
            });
        } else product = await Product.findOne({where: {itemCode: items[i].itemCode}});
        if (product) {
            products.push(product);
        }
    }


    if (req.body?.invoiceStatus === 'Hold') {
        const isHold = products.every(item => item.sellingStatus === 'Hold');
        if (isHold) {
            return next(new ErrorHandler('Products Already In Hold', 400))
        }
    } else {
        const isSold = products.every(item => item.sellingStatus === 'Sold');
        if (isSold) {
            return next(new ErrorHandler('No Unsold Items Found', 400))
        }
    }


    if (products.length === 0) {
        return next(new ErrorHandler('No unsold items found', 404));
    } else {
        for (let i = 0; i < products.length; i++) {
            for (let i = 0; i < products.length; i++) {
                products[i].sellingStatus = ProductStatus.Sold;
                const discount = Math.round(discounts[i] * 100 / products[i].sellPrice)
                const sellPriceAfterDiscount = Math.round(Number((products[i].sellPrice) - discountTk[i]))
                if (req.body.invoiceStatus === 'Hold') {
                    Object.assign(products[i], {
                        sellingStatus: ProductStatus.Hold,
                        discount,
                        sellPriceAfterDiscount: sellPriceAfterDiscount
                    })
                } else {
                    Object.assign(products[i], {
                        sellingStatus: 'Sold',
                        discount,
                        sellPriceAfterDiscount: sellPriceAfterDiscount
                    })
                }

                await products[i].save()
            }
        }
    }

    const prevInvoice = await Invoice.find();


    const invoice = new Invoice();

    invoice.products = products;
    invoice.businessName = 'SPARKX Lifestyle';
    if (req.body.invoiceStatus === 'Hold') {
        invoice.invoiceStatus = InvoiceStatus.Hold
    } else {
        invoice.invoiceStatus =
            netAmount <= paidAmount
                ? InvoiceStatus.Paid
                : InvoiceStatus.Due;
    }
    invoice.invoiceAmount = Number(netAmount);
    invoice.paidAmount = Number(paidAmount);
    invoice.changeAmount = Number(netAmount <= paidAmount
        ? paidAmount -
        netAmount
        : 0)
    invoice.dueAmount = Number(netAmount > paidAmount
        ? (netAmount - paidAmount)
        : 0)
    invoice.customerName = customer.customerName;
    invoice.customerMobile = customer.customerPhone;
    invoice.quantity = products.length;
    invoice.discountAmount = Number(discountAmount);
    invoice.vat = vat
    invoice.invoiceNo = prevInvoice[prevInvoice.length - 1]?.invoiceNo
        ? (parseInt(prevInvoice[prevInvoice.length - 1]?.invoiceNo) + 1)
            .toString()
            .padStart(8, '0')
        : '00000001';


    if (customer && req.body.invoiceStatus !== 'Hold') {
        customer.products.push(...invoice.products)
        customer.due = Math.round(customer.due + invoice.dueAmount)
        customer.paid = Math.round(customer.paid + invoice.paidAmount)
        await customer.save();
    }

    if (showroom) {

        invoice.showroomInvoiceCode = showroom.showroomCode + (showroom?.invoices.length + 1).toString().padStart(8, '0')
        invoice.showroomAddress = showroom.showroomAddress
        invoice.showroomMobile = showroom.showroomMobile
        invoice.showroomName = showroom.showroomName
        showroom.invoices.push(invoice)
        await showroom.save()

    } else {
        invoice.showroomInvoiceCode = 'HO' + invoice.invoiceNo
        invoice.showroomName = 'Head Office'
    }

    employee.sales.push(invoice)

    await employee.save()

    await invoice.save();
    res.status(200).json(invoice);
};

export const deleteInvoice: ControllerFn = async (req, res, next) => {
    const {id} = req.params;

    const invoice = await Invoice.findOne({
        where: {
            id
        }
    });
    if (!invoice) {
        return next(new ErrorHandler('No such invoice found', 404));
    }

    await invoice.remove()

    res.status(200).json(await Invoice.find());
};

export const updateInvoice: ControllerFn = async (req, res, next) => {
    const {id} = req.params;
    const {
        items,
        subtotal, customerName, empName, discounts, vat, paidAmount, discountTk, payable
    } = req.body as { items: Product[]; subtotal: number, customerName: string, empName: string, discounts: number[], vat: number, paidAmount: number, discountTk: number[], payable: number[] };
    const invoice = await Invoice.findOne({
        where: {
            id
        }
    });
    if (!invoice) {
        return next(new ErrorHandler('No such invoice found', 404));
    }


    if (!items || !items.length) {
        return next(new ErrorHandler('No product to sell', 404));
    }

    if (!empName) {
        return next(new ErrorHandler('Please Select An Employee', 404));
    }

    const employee = await Employee.findOne({where: {empName: empName}})

    if (!employee) {
        return next(new ErrorHandler('No Employee Found', 404))
    }

    let showroom: Showroom | null = null;

    if (req.showroomId) {
        showroom = await Showroom.findOne({
            where: {id: req.showroomId},
            relations: {invoices: true}
        });
    }

    const customer = await Customer.findOne({where: {customerName: customerName}, relations: {products: true}})

    if (!customer) {
        return next(new ErrorHandler('No Customer Found', 404));
    }

    const netAmount = payable.reduce((a, b) => a + b) + Math.round((subtotal / 100) * (vat))
    const discountAmount = discountTk.reduce((a: number, b: number) => a + b)

    if (!customer && netAmount > Number((req.body?.paidAmount))) {
        return next(new ErrorHandler('Due Only Possible With Registered Customer', 404))
    }

    const products: Product[] = [];

    if (req.body?.invoiceStatus === 'Hold') {
        return next(new ErrorHandler('Invoice Status Already In Hold', 400));
    }


    for (let i = 0; i < items.length; i++) {
        let product;
        if (showroom) {
            product = await Product.findOne({
                where: {
                    itemCode: items[i].itemCode,
                    showroomName: showroom.showroomName
                }
            });
        } else product = await Product.findOne({where: {itemCode: items[i].itemCode}});
        if (product) {
            products.push(product);
        }
    }

    if (products.length === 0) {
        return next(new ErrorHandler('No unsold items found', 404));
    } else {
        for (let i = 0; i < products.length; i++) {
            products[i].sellingStatus = ProductStatus.Sold;
            const discount = Math.round(discounts[i] * 100 / products[i].sellPrice)
            const sellPriceAfterDiscount = products[i].sellPrice - discountTk[i]
            Object.assign(products[i], {
                discount,
                sellPriceAfterDiscount: sellPriceAfterDiscount
            })

            await products[i].save()
        }
    }


    invoice.products = products;
    invoice.businessName = 'SPARKX Lifestyle';

    invoice.invoiceStatus =
        netAmount <= paidAmount
            ? InvoiceStatus.Paid
            : InvoiceStatus.Due;
    invoice.invoiceAmount = Number(netAmount);
    invoice.paidAmount = Number(paidAmount);
    invoice.changeAmount = Math.round(Number(netAmount <= paidAmount
        ? paidAmount -
        netAmount
        : 0))
    invoice.dueAmount = Math.round(Number(netAmount > paidAmount
        ? (netAmount - paidAmount)
        : 0))
    invoice.customerName = customer.customerName;
    invoice.customerMobile = customer.customerPhone;
    invoice.quantity = products.length;
    invoice.discountAmount = Number(discountAmount);
    invoice.vat = vat

    if (customer && req.body.invoiceStatus !== 'Hold') {
        customer.products.push(...invoice.products)
        customer.due = Math.round(customer.due + invoice.dueAmount)
        customer.paid = Math.round(customer.paid + invoice.paidAmount)
        await customer.save();
    }
    if (showroom) {

        invoice.showroomInvoiceCode = showroom.showroomCode + (showroom?.invoices.length + 1).toString().padStart(8, '0')
        invoice.showroomAddress = showroom.showroomAddress
        invoice.showroomMobile = showroom.showroomMobile
        invoice.showroomName = showroom.showroomName
        showroom.invoices.push(invoice)
        await showroom.save()
    } else {
        invoice.showroomInvoiceCode = 'HO' + invoice.invoiceNo
        invoice.showroomName = 'Head Office'
    }

    employee.sales.push(invoice)

    await employee.save()

    await invoice.save();
    res.status(200).json(invoice);
};

export const getInvoices: ControllerFn = async (req, res, _next) => {

    const showroom = await Showroom.findOne({where: {id: req.showroomId}})


    if (showroom && req.showroomId) {
        const invoices = await Invoice.find({
            relations: {
                products: true
            },
            where: {
                showroomName: showroom?.showroomName
            }
        })
        res.status(200).json(invoices)
    } else {
        const invoices = await Invoice.find({
            relations: {
                products: true
            }
        })

        res.status(200).json(invoices)
    }


};
