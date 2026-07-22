// TODO: Move
export const LEGISLATION_ORIGIN = "https://www.legislation.gov.uk";

export type LegislationItem = {
  type: "ukpga" | "uksi";
  year: number;
  number: number;
  title: string;
  topics: string[];
  jurisdiction: "england-wales" | "uk";
};

export type SyncStatus = "downloaded" | "unchanged" | "failed";

export type SyncResult = {
  id: string;
  title: string;
  sourceUrl: string;
  objectKey: string;
  status: SyncStatus;
  statusCode?: number;
  bytes?: number;
  error?: string;
};

export type StoredDocumentMetadata = {
  id: string;
  title: string;
  sourceUrl: string;
  legislationType: string;
  year: string;
  number: string;
  topics: string;
  jurisdiction: string;
  downloadedAt: string;
  sourceEtag?: string;
  sourceLastModified?: string;
};

export const LEASEHOLD_LEGISLATION: readonly LegislationItem[] = [
  // {
  //   type: "ukpga",
  //   year: 1967,
  //   number: 88,
  //   title: "Leasehold Reform Act 1967",
  //   topics: ["houses", "enfranchisement", "lease-extension"],
  //   jurisdiction: "england-wales",
  // },
  // {
  //   type: "ukpga",
  //   year: 1985,
  //   number: 70,
  //   title: "Landlord and Tenant Act 1985",
  //   topics: [
  //     "service-charges",
  //     "section-20",
  //     "repairs",
  //     "information-rights",
  //   ],
  //   jurisdiction: "england-wales",
  // },
  // {
  //   type: "ukpga",
  //   year: 1987,
  //   number: 31,
  //   title: "Landlord and Tenant Act 1987",
  //   topics: [
  //     "right-of-first-refusal",
  //     "management",
  //     "landlord-information",
  //   ],
  //   jurisdiction: "england-wales",
  // },
  // {
  //   type: "ukpga",
  //   year: 1993,
  //   number: 28,
  //   title: "Leasehold Reform, Housing and Urban Development Act 1993",
  //   topics: [
  //     "collective-enfranchisement",
  //     "lease-extension",
  //     "valuation",
  //   ],
  //   jurisdiction: "england-wales",
  // },
  // {
  //   type: "ukpga",
  //   year: 1996,
  //   number: 52,
  //   title: "Housing Act 1996",
  //   topics: [
  //     "service-charges",
  //     "leasehold-valuation-tribunal",
  //     "administration",
  //   ],
  //   jurisdiction: "england-wales",
  // },
  {
    type: "ukpga",
    year: 2002,
    number: 15,
    title: "Commonhold and Leasehold Reform Act 2002",
    topics: [
      "right-to-manage",
      "administration-charges",
      "service-charges",
      "commonhold",
    ],
    jurisdiction: "england-wales",
  },
  {
    type: "ukpga",
    year: 2022,
    number: 1,
    title: "Leasehold Reform (Ground Rent) Act 2022",
    topics: ["ground-rent", "regulated-leases"],
    jurisdiction: "england-wales",
  },
  {
    type: "ukpga",
    year: 2022,
    number: 30,
    title: "Building Safety Act 2022",
    topics: [
      "building-safety",
      "remediation",
      "service-charges",
      "qualifying-leases",
    ],
    jurisdiction: "uk",
  },
  {
    type: "ukpga",
    year: 2024,
    number: 22,
    title: "Leasehold and Freehold Reform Act 2024",
    topics: [
      "leasehold-reform",
      "enfranchisement",
      "service-charges",
      "estate-management",
    ],
    jurisdiction: "england-wales",
  },
];
