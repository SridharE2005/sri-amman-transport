import AdminHistory from "../models/AdminHistory.js";

export const getAdminHistory = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
    const validStatuses = [
      "Rejected",
      "Revoked",
      "Delivered",
      "CANCELLED_BY_USER",
      "CANCELLED_BY_ADMIN",
      "Cancelled by User",
      "Cancelled by Admin",
    ];

    const query = {};

    if (req.query.status === "Cancelled") {
      query.status = {
        $in: [
          "CANCELLED_BY_USER",
          "CANCELLED_BY_ADMIN",
          "Cancelled by User",
          "Cancelled by Admin",
        ],
      };
    } else if (req.query.status && req.query.status !== "All") {
      query.status = req.query.status;
    } else {
      query.status = { $in: validStatuses };
    }

    if (req.query.search) {
      const s = req.query.search.trim();
      query.$or = [
        { bookingId: { $regex: s, $options: "i" } },
        { customerName: { $regex: s, $options: "i" } },
        { customerEmail: { $regex: s, $options: "i" } },
        { customerPhone: { $regex: s, $options: "i" } },
        { material: { $regex: s, $options: "i" } },
        { title: { $regex: s, $options: "i" } },
      ];
    }

    // Count aggregates for status tabs
    const [totalValid, deliveredCount, rejectedCount, revokedCount, cancelledCount] = await Promise.all([
      AdminHistory.countDocuments({ status: { $in: validStatuses } }),
      AdminHistory.countDocuments({ status: "Delivered" }),
      AdminHistory.countDocuments({ status: "Rejected" }),
      AdminHistory.countDocuments({ status: "Revoked" }),
      AdminHistory.countDocuments({
        status: {
          $in: [
            "CANCELLED_BY_USER",
            "CANCELLED_BY_ADMIN",
            "Cancelled by User",
            "Cancelled by Admin",
          ],
        },
      }),
    ]);

    const counts = {
      All: totalValid,
      Delivered: deliveredCount,
      Rejected: rejectedCount,
      Revoked: revokedCount,
      Cancelled: cancelledCount,
    };

    const filteredTotal = await AdminHistory.countDocuments(query);
    const totalPages = Math.ceil(filteredTotal / limit) || 1;

    // Check if client requested pagination
    if (req.query.page || req.query.limit || req.query.paginate === "true") {
      const history = await AdminHistory.find(query)
        .populate("booking", "bookingId")
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      return res.json({
        data: history,
        total: filteredTotal,
        page,
        limit,
        totalPages,
        counts,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      });
    }

    // Unpaginated fallback
    const history = await AdminHistory.find(query)
      .populate("booking", "bookingId")
      .sort({ updatedAt: -1 })
      .lean();
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch admin history" });
  }
};

export const deleteAdminHistory = async (req, res) => {
  const history = await AdminHistory.findByIdAndDelete(req.params.id);
  if (!history) return res.status(404).json({ message: "History record not found" });
  res.json({ message: "History deleted" });
};