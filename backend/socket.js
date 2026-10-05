// socket.js
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "./models/User.js";

let ioInstance = null;

export const initSocketServer = (httpServer, allowedOrigins) => {
  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
      methods: ["GET", "POST", "PATCH", "PUT"],
    },
    transports: ["websocket", "polling"],
  });

  ioInstance = io;

  // Authentication Middleware for all Socket.IO connections
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization ||
        socket.handshake.query?.token;

      if (!token) {
        return next(new Error("Authentication token required for WebSocket connection"));
      }

      const cleanToken = token.startsWith("Bearer ") ? token.slice(7) : token;
      const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id).select("-password -otp");
      if (!user) {
        return next(new Error("User account not found"));
      }

      socket.user = user;
      next();
    } catch (err) {
      console.error("[Socket.IO] Auth verification failed:", err.message);
      next(new Error("Authentication error: " + err.message));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.user;
    const displayName = user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim();

    // 1. Admin clients join the 'admins' room for receiving driver location updates
    if (user.role === "admin") {
      socket.join("admins");
      console.log(`[Socket.IO] Admin connected: ${user.email} (Socket: ${socket.id})`);

      // Allow admin to request all currently online / checked-in drivers immediately
      socket.on("admin:request_active_drivers", async (ack) => {
        try {
          const activeDrivers = await User.find({
            role: "driver",
            $or: [{ "tracking.isOnline": true }, { isCheckedIn: true }, { status: "CHECKED IN" }],
          })
            .select("fullName firstName lastName vehicleNumber vehicleType district status tracking lastLocation email isCheckedIn checkedInAt")
            .lean();

          const formatted = activeDrivers.map((d) => ({
            driverId: d._id,
            driverName: d.fullName || `${d.firstName || ""} ${d.lastName || ""}`.trim(),
            vehicleNumber: d.vehicleNumber || "N/A",
            vehicleType: d.vehicleType || "Lorry",
            district: d.district || "Salem",
            email: d.email || "",
            status: d.status || "CHECKED IN",
            isCheckedIn: Boolean(d.isCheckedIn || d.status === "CHECKED IN"),
            checkedInAt: d.checkedInAt || null,
            isOnline: Boolean(d.tracking?.isOnline),
            latitude: d.tracking?.latitude || d.lastLocation?.latitude || null,
            longitude: d.tracking?.longitude || d.lastLocation?.longitude || null,
            accuracy: d.tracking?.accuracy || d.lastLocation?.accuracy || 0,
            speed: d.tracking?.speed !== undefined ? d.tracking.speed : null,
            heading: d.tracking?.heading !== undefined ? d.tracking.heading : null,
            lastUpdated: d.tracking?.lastUpdated || d.lastLocation?.updatedAt || null,
          }));

          if (typeof ack === "function") ack(formatted);
          else socket.emit("admin:active_drivers_list", formatted);
        } catch (err) {
          console.error("[Socket.IO] Failed to retrieve active drivers:", err.message);
        }
      });
    }

    // 2. Driver clients join their own channel
    if (user.role === "driver") {
      socket.join(`driver:${user._id}`);
      console.log(`[Socket.IO] Driver connected: ${displayName} (${user.email})`);

      // TASK 2 & 3: Handle real-time GPS location emissions from drivers
      socket.on("driver:location", async (data, ack) => {
        try {
          // Security checks (TASK 3)
          // 1. Authenticate user exists and is a driver
          if (!socket.user || socket.user.role !== "driver") {
            if (typeof ack === "function") ack({ error: "Unauthorized: Driver role required" });
            return;
          }

          // 2. Verify driver is currently checked in
          const driver = await User.findById(socket.user._id);
          if (!driver) {
            if (typeof ack === "function") ack({ error: "Driver account not found" });
            return;
          }

          if (!driver.isCheckedIn && driver.status !== "CHECKED IN") {
            if (typeof ack === "function") ack({ error: "Driver must be checked in to send location" });
            return;
          }

          // 3. Validate GPS coordinates
          const latitude = Number(data.latitude);
          const longitude = Number(data.longitude);
          if (isNaN(latitude) || isNaN(longitude)) {
            if (typeof ack === "function") ack({ error: "Invalid latitude or longitude" });
            return;
          }

          const accuracy = Number(data.accuracy) || 0;
          const speed = data.speed !== null && data.speed !== undefined && !isNaN(Number(data.speed))
            ? Number(data.speed)
            : null;
          const heading = data.heading !== null && data.heading !== undefined && !isNaN(Number(data.heading))
            ? Number(data.heading)
            : null;
          const now = new Date();

          // 4. Update the driver's latest location (TASK 4: Do NOT save every GPS update as a new MongoDB document)
          const updateFields = {
            "tracking.isOnline": true,
            "tracking.latitude": latitude,
            "tracking.longitude": longitude,
            "tracking.accuracy": accuracy,
            "tracking.speed": speed,
            "tracking.heading": heading,
            "tracking.lastUpdated": now,
            "lastLocation.latitude": latitude,
            "lastLocation.longitude": longitude,
            "lastLocation.accuracy": accuracy,
            "lastLocation.speed": speed,
            "lastLocation.heading": heading,
            "lastLocation.updatedAt": now,
          };

          if (data.area) {
            updateFields["tracking.area"] = data.area;
            updateFields["lastLocation.area"] = data.area;
          }
          if (data.road) {
            updateFields["tracking.road"] = data.road;
            updateFields["lastLocation.road"] = data.road;
          }
          if (data.state) {
            updateFields["tracking.state"] = data.state;
            updateFields["lastLocation.state"] = data.state;
          }
          if (data.district) {
            updateFields["tracking.district"] = data.district;
            updateFields["lastLocation.district"] = data.district;
          }
          if (data.postcode) {
            updateFields["tracking.postcode"] = data.postcode;
            updateFields["lastLocation.postcode"] = data.postcode;
          }
          if (data.fullAddress) {
            updateFields["tracking.fullAddress"] = data.fullAddress;
            updateFields["lastLocation.fullAddress"] = data.fullAddress;
          }

          await User.findByIdAndUpdate(driver._id, { $set: updateFields });

          // 5. Broadcast location to authorized admin clients in 'admins' room
          const broadcastPayload = {
            driverId: driver._id,
            userId: driver._id,
            fleetDriverId: driver.driverId || null,
            driverName: driver.fullName || `${driver.firstName || ""} ${driver.lastName || ""}`.trim(),
            vehicleNumber: driver.vehicleNumber || "N/A",
            vehicleType: driver.vehicleType || "Lorry",
            district: data.district || driver.district || "Salem",
            area: data.area || null,
            road: data.road || null,
            state: data.state || null,
            postcode: data.postcode || null,
            fullAddress: data.fullAddress || null,
            latitude,
            longitude,
            accuracy,
            speed,
            heading,
            checkedInAt: driver.checkedInAt || null,
            isCheckedIn: Boolean(driver.isCheckedIn || driver.status === "CHECKED IN"),
            timestamp: data.timestamp || now.getTime(),
            lastUpdated: now.toISOString(),
          };

          io.to("admins").emit("admin:driver_location", broadcastPayload);

          if (typeof ack === "function") {
            ack({ success: true, timestamp: now.toISOString() });
          }
        } catch (err) {
          console.error("[Socket.IO] Error handling driver:location:", err.message);
          if (typeof ack === "function") ack({ error: err.message });
        }
      });
    }

    socket.on("disconnect", async (reason) => {
      if (user.role === "driver") {
        try {
          await User.findByIdAndUpdate(user._id, {
            $set: { "tracking.isOnline": false },
          });
          io.to("admins").emit("admin:driver_status_change", {
            driverId: user._id,
            userId: user._id,
            isOnline: false,
            lastUpdated: new Date().toISOString(),
          });
          console.log(`[Socket.IO] Driver ${displayName} disconnected (${reason})`);
        } catch (err) {
          console.error("[Socket.IO] Error handling driver disconnect:", err.message);
        }
      }
    });
  });

  return io;
};

export const getIO = () => ioInstance;
