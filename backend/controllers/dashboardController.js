import db from "../config/db.js";

export const getMonthlyStats = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const currentYear = new Date().getFullYear();
    const currentMonthNumber = new Date().getMonth() + 1; // JS months are 0-based

    // Properly format the month name
    const currentMonth = new Intl.DateTimeFormat("en-US", { month: "long" }).format(new Date(currentYear, currentMonthNumber - 1));

    console.log(`Fetching data for: ${currentMonth} (${currentMonthNumber}), ${currentYear} user: ${user_id}`);

    // Fetch total sales for the current month
    const [salesResult] = await db.query(`
      SELECT IFNULL(SUM(total_price), 0) AS totalSales 
      FROM sales 
      WHERE user_id = ? AND MONTH(sales_date) = ? AND YEAR(sales_date) = ?;
    `, [user_id, currentMonthNumber, currentYear]);

    // Fetch total purchase cost for the current month
    const [purchaseResult] = await db.query(`
      SELECT IFNULL(SUM(purchase_cost), 0) AS totalPurchase 
      FROM product_supplied 
      WHERE user_id = ? AND MONTH(supplied_date) = ? AND YEAR(supplied_date) = ?;
    `, [user_id, currentMonthNumber, currentYear]);

    // Calculate Profit or Loss
    const totalSales = salesResult[0]?.totalSales || 0;
    const totalPurchase = purchaseResult[0]?.totalPurchase || 0;
    const profitOrLoss = totalSales - totalPurchase;

    res.json({
      currentMonth,  // Month name will now be displayed correctly
      totalSales,
      totalPurchase,
      profitOrLoss
    });

  } catch (err) {
    console.error("Error in getMonthlyStats:", err.message);
    res.status(500).json({ error: err.message });
  }
};
