import { useEffect, useRef } from "react";
import { FiInfo } from "react-icons/fi";

export default function OverheadCharges({ data, mode = "view", onChange }) {
  const valuesRef = useRef(JSON.parse(JSON.stringify(data)));

  useEffect(() => {
    valuesRef.current = JSON.parse(JSON.stringify(data));
  }, [data]);

  const commit = () => {
    onChange({ ...valuesRef.current });
  };

  const Input = ({ path, width = "w-16", placeholder = "" }) => {
    const [key, field] = path;
    return (
      <input
        defaultValue={valuesRef.current[key]?.[field] ?? ""}
        placeholder={placeholder}
        className={`${width} border rounded px-2 py-1 text-[12px]
        focus:outline-none focus:ring-1 focus:ring-[#0192ED] text-gray-800`}
        onChange={(e) => {
          if (!valuesRef.current[key]) valuesRef.current[key] = {};
          valuesRef.current[key][field] = e.target.value;
        }}
        onBlur={commit}
      />
    );
  };

  const Row = ({ label, description, children }) => (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 px-3 py-2.5 last:border-b-0 hover:bg-gray-50/50 transition-colors">
      <div className="flex flex-col">
        <span className="text-[12px] font-[600] text-gray-700">
          {label}
        </span>
        {description && (
          <span className="text-[10px] text-gray-400 font-[400] leading-tight mt-0.5">
            {description}
          </span>
        )}
      </div>
      <div className="text-[12px] font-[600] text-gray-800 flex-shrink-0 self-start sm:self-auto mt-1 sm:mt-0">
        {children}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-xl border mt-4 shadow-sm">
      <div className="px-4 py-3 border-b bg-gray-50 rounded-t-xl flex justify-between items-center">
        <div>
          <h3 className="text-[13px] font-[700] text-gray-700">
            Overhead Charges & Calculation Rules
          </h3>
          <p className="text-[11px] text-gray-500 font-[400] mt-0.5">
            Define percentages, flat amounts, and minimum floor thresholds for B2B cargo calculation.
          </p>
        </div>
      </div>

      {/* Info Banner for Admins */}
      <div className="mx-3 sm:mx-4 mt-3 p-2.5 bg-blue-50/70 border border-blue-100 rounded-lg flex items-start gap-2 text-[11px] text-blue-800">
        <FiInfo className="mt-0.5 text-blue-600 text-sm flex-shrink-0" />
        <div>
          <span className="font-[600]">Calculation Breakdown: </span>
          <span className="text-blue-700">
            When both <strong>% (or ₹/Kg)</strong> and <strong>Min ₹</strong> are set, the system charges <strong>WHICHEVER IS HIGHER</strong>.{" "}
            <strong>Percentage (%)</strong> is computed on Base Freight (Fuel/Pickup) or Invoice Value (COD/ROV).
          </span>
        </div>
      </div>

      {/* ================= RESPONSIVE GRID (MOBILE & DESKTOP) ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 sm:p-4">
        {/* LEFT */}
        <div className="border rounded-lg divide-y bg-white">
          <Row 
            label="Pickup Charge" 
            description="% of Freight or Min ₹ Floor (Whichever is higher)"
          >
            {mode === "view"
              ? `${data.pickupCharge?.value}% OR Min ₹${data.pickupCharge?.min} (Whichever is higher)`
              : (
                <div className="flex flex-wrap items-center gap-1.5">
                  <div className="flex items-center gap-1">
                    <Input path={["pickupCharge", "value"]} placeholder="%" />
                    <span className="text-gray-500 text-[11px]">%</span>
                  </div>
                  <span className="text-gray-400 text-[11px]">|</span>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500 text-[11px]">Min ₹</span>
                    <Input path={["pickupCharge", "min"]} placeholder="Min ₹" />
                  </div>
                </div>
              )}
          </Row>

          <Row 
            label="Handling Charge" 
            description="Flat ₹ fee per shipment for cargo handling"
          >
            {mode === "view"
              ? `₹${data.handlingCharge?.value}`
              : (
                <div className="flex items-center gap-1">
                  <span className="text-gray-500 text-[11px]">₹</span>
                  <Input path={["handlingCharge", "value"]} placeholder="Flat ₹" />
                </div>
              )}
          </Row>

          <Row 
            label="COD Charges" 
            description="% of Order Invoice Value or Min ₹ Floor (Whichever is higher)"
          >
            {mode === "view"
              ? `${data.codCharges?.value}% OR Min ₹${data.codCharges?.min} (Whichever is higher)`
              : (
                <div className="flex flex-wrap items-center gap-1.5">
                  <div className="flex items-center gap-1">
                    <Input path={["codCharges", "value"]} placeholder="%" />
                    <span className="text-gray-500 text-[11px]">%</span>
                  </div>
                  <span className="text-gray-400 text-[11px]">|</span>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500 text-[11px]">Min ₹</span>
                    <Input path={["codCharges", "min"]} placeholder="Min ₹" />
                  </div>
                </div>
              )}
          </Row>

          <Row 
            label="To Pay Charges (FOD)" 
            description="Flat ₹ fee when freight is collected at destination"
          >
            {mode === "view"
              ? `₹${data.fodCharges?.value}`
              : (
                <div className="flex items-center gap-1">
                  <span className="text-gray-500 text-[11px]">₹</span>
                  <Input path={["fodCharges", "value"]} placeholder="Flat ₹" />
                </div>
              )}
          </Row>

          <Row 
            label="ROV Owner Risk" 
            description="% of Declared Value or Min ₹ Floor (Whichever is higher)"
          >
            {mode === "view"
              ? `${data.rovOwner?.value}% OR Min ₹${data.rovOwner?.min} (Whichever is higher)`
              : (
                <div className="flex flex-wrap items-center gap-1.5">
                  <div className="flex items-center gap-1">
                    <Input path={["rovOwner", "value"]} placeholder="%" />
                    <span className="text-gray-500 text-[11px]">%</span>
                  </div>
                  <span className="text-gray-400 text-[11px]">|</span>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500 text-[11px]">Min ₹</span>
                    <Input path={["rovOwner", "min"]} placeholder="Min ₹" />
                  </div>
                </div>
              )}
          </Row>

          <Row 
            label="ROV Carrier Risk" 
            description="% of Declared Value or Min ₹ Floor (Whichever is higher)"
          >
            {mode === "view"
              ? `${data.rovCarrier?.value}% OR Min ₹${data.rovCarrier?.min} (Whichever is higher)`
              : (
                <div className="flex flex-wrap items-center gap-1.5">
                  <div className="flex items-center gap-1">
                    <Input path={["rovCarrier", "value"]} placeholder="%" />
                    <span className="text-gray-500 text-[11px]">%</span>
                  </div>
                  <span className="text-gray-400 text-[11px]">|</span>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500 text-[11px]">Min ₹</span>
                    <Input path={["rovCarrier", "min"]} placeholder="Min ₹" />
                  </div>
                </div>
              )}
          </Row>
        </div>

        {/* RIGHT */}
        <div className="border rounded-lg divide-y bg-white">
          <Row 
            label="ODA Charge (Out of Area)" 
            description="₹/Kg on Billable Weight or Min ₹ Floor (Whichever is higher)"
          >
            {mode === "view"
              ? `₹${data.odaCharges?.value}/Kg OR Min ₹${data.odaCharges?.min} (Whichever is higher)`
              : (
                <div className="flex flex-wrap items-center gap-1.5">
                  <div className="flex items-center gap-1">
                    <Input path={["odaCharges", "value"]} placeholder="₹/Kg" />
                    <span className="text-gray-500 text-[11px]">/Kg</span>
                  </div>
                  <span className="text-gray-400 text-[11px]">|</span>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500 text-[11px]">Min ₹</span>
                    <Input path={["odaCharges", "min"]} placeholder="Min ₹" />
                  </div>
                </div>
              )}
          </Row>

          <Row 
            label="Fuel Surcharge (FSC)" 
            description="% of Base Freight (Fuel adjustment fee)"
          >
            {mode === "view"
              ? `${data.fuelCharge?.value}%`
              : (
                <div className="flex items-center gap-1">
                  <Input path={["fuelCharge", "value"]} placeholder="%" />
                  <span className="text-gray-500 text-[11px]">%</span>
                </div>
              )}
          </Row>

          <Row 
            label="Docket Charge" 
            description="Flat ₹ fee per LR / Waybill document"
          >
            {mode === "view"
              ? `₹${data.docketCharge?.value}`
              : (
                <div className="flex items-center gap-1">
                  <span className="text-gray-500 text-[11px]">₹</span>
                  <Input path={["docketCharge", "value"]} placeholder="Flat ₹" />
                </div>
              )}
          </Row>

          <Row 
            label="Appointment Delivery" 
            description="Flat ₹ fee for time-slot scheduled delivery"
          >
            {mode === "view"
              ? `₹${data.appointmentDelivery?.value}`
              : (
                <div className="flex items-center gap-1">
                  <span className="text-gray-500 text-[11px]">₹</span>
                  <Input path={["appointmentDelivery", "value"]} placeholder="Flat ₹" />
                </div>
              )}
          </Row>

          <Row 
            label="Green Tax" 
            description="Flat ₹ eco/environmental state surcharge"
          >
            {mode === "view"
              ? `₹${data.greenTax?.value}`
              : (
                <div className="flex items-center gap-1">
                  <span className="text-gray-500 text-[11px]">₹</span>
                  <Input path={["greenTax", "value"]} placeholder="Flat ₹" />
                </div>
              )}
          </Row>

          <Row 
            label="Volumetric Divisor" 
            description="Divisor for volumetric weight: (L×W×H / Divisor)"
          >
            {mode === "view"
              ? data.divisor?.value
              : <Input width="w-24" path={["divisor", "value"]} placeholder="e.g. 5000" />}
          </Row>

          <Row 
            label="Minimum Freight" 
            description="Minimum base freight threshold per booking"
          >
            {mode === "view"
              ? `₹${data.minimumFreight?.value}`
              : (
                <div className="flex items-center gap-1">
                  <span className="text-gray-500 text-[11px]">₹</span>
                  <Input path={["minimumFreight", "value"]} placeholder="Min ₹" />
                </div>
              )}
          </Row>

          <Row 
            label="GST Rate" 
            description="GST percentage applied on final subtotal (default 18%)"
          >
            {mode === "view"
              ? `${data.gst?.value ?? 18}%`
              : (
                <div className="flex items-center gap-1">
                  <Input path={["gst", "value"]} placeholder="18" />
                  <span className="text-gray-500 text-[11px]">%</span>
                </div>
              )}
          </Row>
        </div>
      </div>
    </div>
  );
}

