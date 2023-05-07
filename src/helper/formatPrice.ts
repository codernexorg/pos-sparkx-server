export function formatPrice(num: string | number): string {
  const price = typeof num === "string" ? parseFloat(num) : num;
  if (isNaN(price)) return "";

  return price.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
