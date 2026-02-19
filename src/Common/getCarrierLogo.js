import Bluedart from "../assets/bluedart.png";
import Delehivery from "../assets/delehivery.png";
import EcomExpress from "../assets/ecom-expresss.avif";
import Shadowfax from "../assets/shadowfax.png";
import Xpressbees from "../assets/xpressbees.png";
import Shiprocket from "../assets/shiprocket.webp";
import NimbusPost from "../assets/nimbuspost.webp";
import ShreeMaruti from "../assets/shreemaruti.png";
import Amazon from "../assets/amazon.jpg";
import Smartship from "../assets/bluedart.png";
import DTDC from "../assets/dtdc.png";
import Ekart from "../assets/ekart.png";

export const getCarrierLogo = (courierServiceName = "") => {
  const name = courierServiceName?.toLowerCase();

  if (name?.includes("delhivery")) return Delehivery;
  if (name?.includes("bluedart")) return Bluedart;
  if (name?.includes("ecom")) return EcomExpress;
  if (name?.includes("shadowfax")) return Shadowfax;
  if (name?.includes("xpressbees")) return Xpressbees;
  if (name?.includes("nimbus")) return NimbusPost;
  if (name?.includes("shiprocket")) return Shiprocket;
  if (name?.includes("shree")) return ShreeMaruti;
  if (name?.includes("dtdc")) return DTDC;
  if (name?.includes("amazon")) return Amazon;
  if (name?.includes("smartship")) return Smartship;
  if (name?.includes("ekart")) return Ekart;

  return ""; // default fallback
};
