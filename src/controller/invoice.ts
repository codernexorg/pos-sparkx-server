import {ControllerFn} from "../types";
import {Invoice, Product} from "../entities";
import ErrorHandler from "../utils/errorHandler";

export const createInvoice: ControllerFn = async (req, res, next) => {

    interface Items {
        itemCodes: string[],
        quantity: number
    }

    const {items: {itemCodes}, invoiceAmount} = req.body as { items: Items, invoiceAmount: number }

    console.log(req.body)
    if (!itemCodes) {
        return next(new ErrorHandler("No product to sell", 404))
    }

    const products: Product[] = []

    for (let i = 0; i < itemCodes.length; i++) {
        const product = await Product.findOneBy({itemCode: itemCodes[i]})

        console.log(itemCodes[i])

        if (product) {
            products.push(product)
        }
    }

    const unsoldItems = products.filter(product => product.sellingStatus.toLowerCase() === "unsold")


    if (unsoldItems.length === 0) {
        return next(new ErrorHandler("No unsold items found", 404))
    } else {
        unsoldItems.every(async (product) => {
            product.sellingStatus = "Sold"

            await product.save({
                reload: true
            })
        })
    }


    const prevInvoice = await Invoice.find()

    const invoice = new Invoice()

    invoice.products = unsoldItems
    invoice.invoiceStatus = invoiceAmount <= req.body?.paidAmount ? "Paid" : "Due"
    invoice.invoiceAmount = req.body?.invoiceAmount
    invoice.paidAmount = req.body?.paidAmount
    invoice.changeAmount = req.body?.invoiceAmount < req.body?.paidAmount ? req.body?.paidAmount - req.body?.invoiceAmount : 0
    invoice.dueAmount = req.body?.invoiceAmount > req.body?.paidAmount ? req.body?.invoiceAmount - req.body?.paidAmount : 0
    invoice.customerName = req.body?.customerName
    invoice.customerMobile = req.body?.customerMobile
    invoice.quantity = unsoldItems.length
    invoice.invoiceNo = prevInvoice[prevInvoice.length - 1]?.invoiceNo ? (parseInt(prevInvoice[prevInvoice.length - 1]?.invoiceNo) + 1).toString().padStart(6, '0') : '000001'

    await invoice.save()

    res.status(200).json(invoice)
}

export const deleteInvoice: ControllerFn = async (req, res, next) => {
    const {id} = req.params

    const invoice = await Invoice.findOne({
        where: {
            id
        },
    })
    if (!invoice) {
        return next(new ErrorHandler("No such invoice found", 404))
    }


    await invoice.softRemove({reload: true})


    res.status(200).json({message: "Invoice Deleted"})

}

export const updateInvoice: ControllerFn = async (req, res, next) => {
    const {id} = req.params

    const invoice = await Invoice.findOne({
        where: {
            id
        },
    })
    if (!invoice) {
        return next(new ErrorHandler("No such invoice found", 404))
    }

    invoice.invoiceStatus = req.body?.invoiceAmount === req.body?.paidAmount ? "Paid" : "Due"
    invoice.invoiceAmount = req.body?.invoiceAmount
    invoice.paidAmount = req.body?.paidAmount
    invoice.customerName = req.body?.customerName
    invoice.customerMobile = req.body?.customerMobile

    await invoice.save({reload: true})


    res.status(200).json({message: "Invoice Updated", invoice})
}

export const getInvoices: ControllerFn = async (_req, res) => {
    const invoices = await Invoice.find({
        relations: {
            products: true
        }
    })


    res.status(200).json(invoices)
}

