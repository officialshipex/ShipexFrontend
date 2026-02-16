import React from 'react';

const ImportantTerms = () => {
  const terms = [
    "Above mentioned prices are inclusive of GST.",
    "Fixed COD charge or COD % of the order value whichever is higher will be considered while calculating the COD fee.",
    "The above pricing is subject to change based on fuel surcharges and courier company base rates.",
    "Dead/Dry weight or volumetric weight whichever is higher will be considered while calculating the freight charges.",
    "Volumetric weight is calculated L × B × H (in cms) / 5000 for all courier companies. In case of Ecom Express EGS Shipments it is L × B × H (in cms) / 4500.",
    "RTO (return to origin) shipment will be charged differently from the forward delivery rate.",
    "Pickup services may face issues due to operational concerns of the courier company.",
    "Return charges may apply over and above the freight fee in case of Ecom Express.",
    "Other Charges like Octroi charges, State Entry Tax and Fees, Address Correction charges if applicable shall be charged extra.",
    "Billing issues should be escalated within 7 days from the date of Invoice.",
    "Lost or damaged products claims will be handled as per the carrier terms and conditions.",
    "The Customer/Seller shall not book/handover or allows to be handed over any Product which is banned, restricted, illegal, prohibited, stolen, infringing of any third-party rights, liquid materials, hazardous or dangerous or in breach of any law or regulation in force in India for the purpose of the logistics or delivery services.",
    "Additional government rules and norms can be applicable while shipping to certain states and subject to change without prior intimation and will abide by them.",
    "Detailed terms and conditions can be reviewed on <span style='color: blue;'>Shipex's Terms of services</span>.",
    "For any queries reach out to us at https://carrier.shipex.in/support or write to us at <a href='mailto:support@shipex.in' style='color: blue; text-decoration: underline;'>support@shipex.in</a>."
  ];

  return (
  <div className="bg-green-50 p-4 md:p-4 lg:p-4 rounded-lg shadow-md mx-auto lg:shadow-[0_2px_8px_rgba(12,187,125,0.3)]">
  <h2 className="text-[14px] font-[600] text-gray-700 mb-2">Important Terms</h2>
  <ol className="list-decimal pl-4 space-y-2 text-gray-700 text-[12px]">
    {terms.map((term, index) => (
      <li key={index} className="leading-relaxed" dangerouslySetInnerHTML={{ __html: term }} />
    ))}
  </ol>
</div>

  );
};

export default ImportantTerms;
