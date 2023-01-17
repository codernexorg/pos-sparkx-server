import {ControllerFn} from "../types";
import {Invoice, Product} from "../entities";

export const createInvoice: ControllerFn = async (req, res, _next) => {

    const {itemCodes, totalPrice} = req.body as { itemCodes: string[], totalPrice: number }

    const products: Product[] = []

    for (let i = 0; i < itemCodes.length; i++) {
        const product = await Product.findOne({
            where: {
                itemCode: itemCodes[i]
            }
        })

        if (product) {
            products.push(product)
        }
    }

    const invoice = new Invoice()

    invoice.products = products
    invoice.invoiceAmount = totalPrice

    await invoice.save()

    res.status(200).json(invoice)
}

export const deleteInvoice: ControllerFn = async () => {
}

export const updateInvoice: ControllerFn = async () => {
}

export const getInvoices: ControllerFn = async () => {
}