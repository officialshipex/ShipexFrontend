import { useState } from "react";
import { IoChevronForward, IoCopyOutline } from "react-icons/io5";

// Admin API access scopes the Shopify app must have for order sync + fulfilment push-back.
export const SHOPIFY_SCOPES = [
  "read_orders", "read_all_orders", "write_orders",
  "read_order_edits", "write_order_edits",
  "read_locations",
  "read_fulfillments", "write_fulfillments",
  "read_merchant_managed_fulfillment_orders", "write_merchant_managed_fulfillment_orders",
  "read_assigned_fulfillment_orders", "write_assigned_fulfillment_orders",
  "read_third_party_fulfillment_orders", "write_third_party_fulfillment_orders",
];

const ScopesDetail = () => {
  const [copied, setCopied] = useState(false);
  const copyAll = () => {
    try {
      navigator.clipboard.writeText(SHOPIFY_SCOPES.join(","));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) { /* clipboard blocked: the scopes are still listed to copy by hand */ }
  };
  return (
    <div className="space-y-2">
      <p>
        Open the app → Versions/Configuration → Admin API access scopes and enable all of the
        scopes below, then click Release/Deploy the version.
      </p>
      <div className="flex flex-wrap gap-1.5">
        {SHOPIFY_SCOPES.map((s) => (
          <span key={s} className="px-2 py-0.5 rounded-md bg-gray-100 border border-gray-200 text-[10px] font-mono text-gray-700">{s}</span>
        ))}
      </div>
      <button
        type="button"
        onClick={copyAll}
        className="flex items-center gap-1.5 h-7 px-2.5 rounded-full border border-brand-primary text-brand-primary text-[10px] font-[600]"
      >
        <IoCopyOutline /> {copied ? "Copied!" : "Copy all scopes"}
      </button>
    </div>
  );
};

const STEPS = [
  { title: "Create the Shopify App", detail: "Go to dev.shopify.com/dashboard → Apps → Create app → Start from Dev Dashboard. Enter an app name and click Create." },
  { title: "Enable the required API scopes", detail: <ScopesDetail /> },
  { title: "Install the app on your store", detail: "Open the app's Home page → Install app → select the correct Shopify store → review permissions → click Install. Wait for Shopify to confirm installation." },
  { title: "Copy Client ID and Client Secret", detail: "Open the app → Settings → Credentials. Copy the Client ID and the Client Secret. Keep both values safe — never share the Client Secret publicly." },
  { title: "Enter credentials here", detail: "Paste your Store URL (abc-store.myshopify.com), Client ID and Client Secret into the form fields on the left and click Add Channel. The access token is generated and kept fresh automatically — you never need to create or paste one." },
  { title: "Orders older than 60 days", detail: "Shopify limits orders to the last 60 days unless the read_all_orders scope is approved for your app. If Shopify refuses to release the version because of read_all_orders, remove just that scope and release again — orders from the last 60 days will still sync. Contact us if you need older orders." },
];

const ShopifyGuideSteps = () => {
  const [openIndex, setOpenIndex] = useState(null);
  return (
    <ol className="space-y-1.5 mt-2">
      {STEPS.map((step, i) => {
        const isOpen = openIndex === i;
        return (
          <li key={i} className="rounded-lg border border-gray-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="w-5 h-5 rounded-full bg-brand-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
              <span className="flex-1 text-[10px] sm:text-[12px] font-[600] text-gray-700">{step.title}</span>
              <IoChevronForward className={`text-gray-400 shrink-0 transition-transform ${isOpen ? "rotate-90" : ""}`} />
            </button>
            {isOpen && (
              <div className="px-4 pb-3 pt-2 text-[10px] sm:text-[12px] text-gray-600 leading-relaxed border-t border-gray-100 bg-gray-50">
                {step.detail}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
};

export default ShopifyGuideSteps;
