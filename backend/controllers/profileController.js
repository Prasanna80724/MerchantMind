import db from "../config/db.js";

export const getProfile = async (req, res) => {
  const user_id = req.user.user_id;
  try {
    const [rows] = await db.query(
      `SELECT user_id, username, email, company_name, company_address,
              company_phone, company_email, company_gst, company_website, company_logo_url, created_at
       FROM users WHERE user_id = ?`,
      [user_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

export const updateCompanyProfile = async (req, res) => {
  const user_id = req.user.user_id;
  const {
    company_name,
    company_address,
    company_phone,
    company_email,
    company_gst,
    company_website,
    company_logo_url,
  } = req.body;

  if (!company_name || String(company_name).trim().length < 2) {
    return res.status(400).json({ error: "Company name is required (min 2 characters)" });
  }

  try {
    await db.query(
      `UPDATE users SET
         company_name = ?,
         company_address = ?,
         company_phone = ?,
         company_email = ?,
         company_gst = ?,
         company_website = ?,
         company_logo_url = ?
       WHERE user_id = ?`,
      [
        company_name.trim(),
        company_address || null,
        company_phone || null,
        company_email || null,
        company_gst || null,
        company_website || null,
        company_logo_url || null,
        user_id,
      ]
    );
    res.json({ message: "Company profile updated" });
  } catch (err) {
    console.error("Error updating company profile:", err);
    res.status(500).json({ error: "Failed to update company profile" });
  }
};
