import dotenv from "dotenv";
import mongoose from "mongoose";
import Booking from "./models/Booking.js";
import Goods from "./models/Goods.js";
import Driver from "./models/Driver.js";

const getUnitPrice = (goods) => {
  if (goods.material === "Bricks") return Number(goods.pricePerBrick) || 0;
  if (goods.material === "M-Sand" || goods.material === "River Sand") return Number(goods.pricePerUnit) || 0;
  if (goods.material === "Dry Grass Rolls") return Number(goods.pricePerRoll) || 0;
  return 0;
};

const snapshotGoods = (goods, unitPrice = getUnitPrice(goods)) => ({
  _id: goods._id,
  material: goods.material,
  title: goods.title,
  location: goods.location,
  unitPrice,
});

const snapshotDriver = (driver) => driver ? ({
  name: driver.name,
  phone: driver.phone,
  vehicle: driver.vehicle,
}) : null;

const migrate = async () => {
  dotenv.config();
  await mongoose.connect(process.env.MONGO_URI);

  const bookings = await Booking.collection.find({}).toArray();
  let migrated = 0;

  for (const booking of bookings) {
    let goodsSnapshot;
    let driverSnapshot;
    let estimatedAmount = Number(booking.estimatedAmount) || 0;

    if (booking.goodsData?._id) {
      const oldGoods = booking.goodsData;
      const unitPrice = Number(oldGoods.unitPrice)
        || Number(oldGoods.pricePerBrick)
        || Number(oldGoods.pricePerUnit)
        || Number(oldGoods.pricePerRoll)
        || (Number(booking.orderQty) ? estimatedAmount / Number(booking.orderQty) : 0);
      goodsSnapshot = snapshotGoods(oldGoods, unitPrice);
      driverSnapshot = snapshotDriver(booking.driverData);
    } else {
      if (!booking.goods) continue;
      const goods = await Goods.findById(booking.goods).lean();
      if (!goods) continue;

      const driverId = booking.assignedDriver || goods.assignedDriver;
      const driver = driverId ? await Driver.findById(driverId).lean() : null;
      const unitPrice = Number(booking.pricePerBrick ?? booking.pricePerUnit ?? booking.pricePerRoll) || getUnitPrice(goods);
      goodsSnapshot = snapshotGoods(goods, unitPrice);
      driverSnapshot = snapshotDriver(driver);
      estimatedAmount ||= (Number(booking.orderQty) || 0) * unitPrice;
    }

    await Booking.collection.updateOne(
      { _id: booking._id },
      {
        $set: {
          goodsData: goodsSnapshot,
          driverData: driverSnapshot,
          estimatedAmount,
        },
        $unset: {
          goods: "",
          assignedDriver: "",
          material: "",
          title: "",
          location: "",
          brickType: "",
          howManyBricks: "",
          pricePerBrick: "",
          quantityMin: "",
          quantityMax: "",
          units: "",
          pricePerUnit: "",
          noOfRolls: "",
          pricePerRoll: "",
          availableLorries: "",
        },
      }
    );
    migrated += 1;
  }

  console.log(`Migrated ${migrated} booking(s).`);
  await mongoose.disconnect();
};

migrate().catch(async (error) => {
  console.error("Booking migration failed:", error.message);
  await mongoose.disconnect();
  process.exitCode = 1;
});
