import { LessThan } from "typeorm";
import HoldInvoice from "../../entities/holdInvoice";
import dataSource from "../../typeorm.config";

export async function deleteExpiredHoldInvoices() {
  const holdInvoiceRepository = dataSource.getRepository(HoldInvoice);
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    const expiredHoldInvoices = await holdInvoiceRepository.find({
      where: {
        createdAt: LessThan(twentyFourHoursAgo),
      },
    });

    if (expiredHoldInvoices.length > 0) {
      await holdInvoiceRepository.remove(expiredHoldInvoices);
      console.log(`${expiredHoldInvoices.length} HoldInvoices deleted.`);
    } else {
      console.log("No expired HoldInvoices found.");
    }
  } catch (error) {
    console.error("Error deleting expired HoldInvoices:", error);
  }
}
