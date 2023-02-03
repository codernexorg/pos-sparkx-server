import {Customer, Invoice, Product, Showroom} from '../entities';
import {ControllerFn} from '../types';
import ErrorHandler from '../utils/errorHandler';

export const createInvoice: ControllerFn = async (req, res, next) => {
    interface Items {
        itemCodes: string[];
        quantity: number;
    }

    const {
        items: {itemCodes},
        invoiceAmount, customerId
    } = req.body as { items: Items; invoiceAmount: number, customerId: number };

    if (!itemCodes) {
        return next(new ErrorHandler('No product to sell', 404));
    }

    let showroom: Showroom | null = null;

    if (req.showroomId) {
        showroom = await Showroom.findOne({
            where: {id: req.showroomId},
            relations: {invoices: true}
        });
    }

    let customer: Customer | null = null;

    if (customerId) {
        customer = await Customer.findOne({where: {id: customerId}, relations: {products: true}})
    }

    if (!customer && Number(req.body?.invoiceAmount) > Number((req.body?.paidAmount + req.body?.discountAmount))) {
        return next(new ErrorHandler('Due Only Possible With Registered Customer', 404))
    }

    const products: Product[] = [];


    for (let i = 0; i < itemCodes.length; i++) {
        let product;
        if (showroom) {
            console.log("Checking Showroom Product")
            product = await Product.findOne({where: {itemCode: itemCodes[i], showroomName: showroom.showroomName}});
        } else product = await Product.findOne({where: {itemCode: itemCodes[i]}});
        if (product) {
            products.push(product);
        }
    }

    const unsoldItems = products.filter(
        product => product.sellingStatus === 'Unsold'
    );

    if (unsoldItems.length === 0) {
        return next(new ErrorHandler('No unsold items found', 404));
    } else {
        unsoldItems.every(async product => {
            product.sellingStatus = 'Sold';

            await Product.update({id: product.id}, {sellingStatus: "Sold"})

            await product.save({
                reload: true
            });
        });
    }

    const prevInvoice = await Invoice.find();

    const invoice = new Invoice();

    invoice.products = unsoldItems;
    invoice.invoiceStatus =
        invoiceAmount <= (req.body?.paidAmount + req.body?.discountAmount)
            ? 'Paid'
            : 'Due';
    invoice.invoiceAmount = Number(req.body?.invoiceAmount);
    invoice.paidAmount = Number(req.body?.paidAmount);
    invoice.changeAmount =
        Number(req.body?.invoiceAmount <= (req.body?.paidAmount + req.body?.discountAmount)
            ? (req.body?.paidAmount +
                req.body?.discountAmount) -
            req.body?.invoiceAmount
            : 0)
    invoice.dueAmount =
        Number(req.body?.invoiceAmount > (req.body?.paidAmount + req.body?.discountAmount)
            ? (req.body?.invoiceAmount -
                (req.body?.paidAmount + req.body?.discountAmount))
            : 0)
    invoice.customerName = req.body?.customerName;
    invoice.customerMobile = req.body?.customerMobile;
    invoice.quantity = unsoldItems.length;
    invoice.discountAmount = Number(req.body?.discountAmount);
    invoice.invoiceNo = prevInvoice[prevInvoice.length - 1]?.invoiceNo
        ? (parseInt(prevInvoice[prevInvoice.length - 1]?.invoiceNo) + 1)
            .toString()
            .padStart(6, '0')
        : '000001';


    if (customer) {
        customer.products.push(...invoice.products)
        customer.due = customer.due + invoice.dueAmount
        customer.paid = customer.paid + invoice.paidAmount
        await customer.save();
    }

    if (showroom) {
        showroom.invoices.push(invoice)
        await showroom.save()
        invoice.showroomInvoiceCode = showroom.showroomCode + showroom?.invoices[showroom?.invoices.length - 1].invoiceNo
        invoice.showroomAddress = showroom.showroomAddress
        invoice.showroomMobile = showroom.showroomMobile
        invoice.showroomName = showroom.showroomName
    }
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

    await invoice.softRemove({reload: true});

    res.status(200).json({message: 'Invoice Deleted'});
};

export const updateInvoice: ControllerFn = async (req, res, next) => {
    const {id} = req.params;

    const invoice = await Invoice.findOne({
        where: {
            id
        }
    });
    if (!invoice) {
        return next(new ErrorHandler('No such invoice found', 404));
    }

    invoice.invoiceStatus =
        req.body?.invoiceAmount === req.body?.paidAmount ? 'Paid' : 'Due';
    invoice.invoiceAmount = req.body?.invoiceAmount;
    invoice.paidAmount = req.body?.paidAmount;
    invoice.customerName = req.body?.customerName;
    invoice.customerMobile = req.body?.customerMobile;

    await invoice.save({reload: true});

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
