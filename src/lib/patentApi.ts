export type PatentProvider = 'USPTO' | 'EPO' | 'WIPO' | 'Google Patents';

export interface ProviderInfo {
  id: PatentProvider;
  name: string;
  description: string;
  region: string;
}

export const PROVIDERS: ProviderInfo[] = [
  {
    id: 'USPTO',
    name: 'USPTO',
    description: 'United States Patent and Trademark Office',
    region: 'United States'
  },
  {
    id: 'EPO',
    name: 'EPO',
    description: 'European Patent Office',
    region: 'Europe'
  },
  {
    id: 'WIPO',
    name: 'WIPO',
    description: 'World Intellectual Property Organization',
    region: 'International'
  },
  {
    id: 'Google Patents',
    name: 'Google Patents',
    description: 'Google Patent Search (Multi-region)',
    region: 'Global'
  }
];

export interface Patent {
  id: string;
  patentNumber: string;
  title: string;
  abstract: string;
  inventors: string[];
  assignee: string;
  filingDate: string;
  grantDate: string;
  url: string;
  provider: PatentProvider;
}

export interface PatentSearchResult {
  patents: Patent[];
  total: number;
  error?: string;
  provider: PatentProvider;
}

// Mock patent data for demonstration - USPTO
const mockUSPTOPatents: Patent[] = [
  {
    id: "11847550",
    patentNumber: "US11847550",
    title: "Machine learning system for natural language processing with transformer architecture",
    abstract: "A system and method for processing natural language using deep learning transformer models. The invention includes attention mechanisms that enable parallel processing of sequential data, significantly improving translation accuracy and text generation capabilities.",
    inventors: ["John Smith", "Sarah Chen", "Michael Johnson"],
    assignee: "Google LLC",
    filingDate: "2021-03-15",
    grantDate: "2023-12-19",
    url: "https://patents.google.com/patent/US11847550",
    provider: 'USPTO'
  },
  {
    id: "11823017",
    patentNumber: "US11823017",
    title: "Autonomous vehicle navigation system using real-time sensor fusion",
    abstract: "An autonomous driving system that combines LiDAR, radar, and camera data through advanced sensor fusion algorithms. The system provides 360-degree environmental awareness and predictive path planning for safe navigation in complex urban environments.",
    inventors: ["Emily Rodriguez", "David Kim", "James Wilson"],
    assignee: "Tesla, Inc.",
    filingDate: "2020-08-22",
    grantDate: "2023-11-21",
    url: "https://patents.google.com/patent/US11823017",
    provider: 'USPTO'
  },
  {
    id: "11756684",
    patentNumber: "US11756684",
    title: "Blockchain-based decentralized identity verification system",
    abstract: "A distributed ledger technology system for secure identity management. The invention utilizes cryptographic proofs and smart contracts to enable self-sovereign identity verification without centralized authorities, ensuring privacy and security.",
    inventors: ["Alex Turner", "Maria Garcia"],
    assignee: "IBM Corporation",
    filingDate: "2019-11-08",
    grantDate: "2023-09-12",
    url: "https://patents.google.com/patent/US11756684",
    provider: 'USPTO'
  },
  {
    id: "11698432",
    patentNumber: "US11698432",
    title: "Quantum computing error correction using topological qubits",
    abstract: "A method for implementing fault-tolerant quantum computation using topological qubit encoding. The invention provides exponentially better error protection compared to conventional approaches, enabling practical quantum advantage for complex calculations.",
    inventors: ["Robert Zhang", "Lisa Anderson", "Kevin O'Brien", "Nina Patel"],
    assignee: "Microsoft Technology Licensing, LLC",
    filingDate: "2020-02-14",
    grantDate: "2023-07-11",
    url: "https://patents.google.com/patent/US11698432",
    provider: 'USPTO'
  },
  {
    id: "11654123",
    patentNumber: "US11654123",
    title: "Solar cell with perovskite-silicon tandem structure for enhanced efficiency",
    abstract: "A photovoltaic device combining perovskite and crystalline silicon layers in a tandem configuration. The invention achieves conversion efficiencies exceeding 30% through optimized band gap engineering and light management techniques.",
    inventors: ["Thomas Brown", "Jennifer Lee"],
    assignee: "SunPower Corporation",
    filingDate: "2021-05-03",
    grantDate: "2023-05-23",
    url: "https://patents.google.com/patent/US11654123",
    provider: 'USPTO'
  },
  {
    id: "11612890",
    patentNumber: "US11612890",
    title: "Wearable medical device for continuous glucose monitoring",
    abstract: "A non-invasive biosensor system for real-time blood glucose measurement. The device uses optical spectroscopy and machine learning algorithms to provide accurate readings without finger pricks, wirelessly transmitting data to companion applications.",
    inventors: ["Christopher Davis", "Amanda White", "Ryan Taylor"],
    assignee: "Abbott Laboratories",
    filingDate: "2020-09-17",
    grantDate: "2023-03-28",
    url: "https://patents.google.com/patent/US11612890",
    provider: 'USPTO'
  },
  {
    id: "11578234",
    patentNumber: "US11578234",
    title: "5G network slicing architecture for industrial IoT applications",
    abstract: "A telecommunications system enabling dynamic network resource allocation through software-defined slicing. The invention provides guaranteed quality of service for mission-critical industrial applications while maximizing spectrum efficiency.",
    inventors: ["Daniel Martinez", "Sophie Williams"],
    assignee: "Qualcomm Incorporated",
    filingDate: "2019-12-20",
    grantDate: "2023-02-14",
    url: "https://patents.google.com/patent/US11578234",
    provider: 'USPTO'
  },
  {
    id: "11534567",
    patentNumber: "US11534567",
    title: "CRISPR-based gene therapy delivery system using lipid nanoparticles",
    abstract: "A pharmaceutical composition for targeted gene editing in vivo. The invention combines CRISPR-Cas9 technology with optimized lipid nanoparticle carriers to achieve efficient cellular uptake and precise genome modification with minimal off-target effects.",
    inventors: ["Michelle Thompson", "Andrew Clark", "Jessica Moore", "Brian Hall"],
    assignee: "Moderna, Inc.",
    filingDate: "2021-01-28",
    grantDate: "2022-12-20",
    url: "https://patents.google.com/patent/US11534567",
    provider: 'USPTO'
  },
  {
    id: "11498901",
    patentNumber: "US11498901",
    title: "Augmented reality display system with holographic waveguide optics",
    abstract: "An optical system for immersive augmented reality experiences. The invention uses diffractive waveguides to project high-resolution virtual images into the user's field of view while maintaining transparency and a compact form factor suitable for everyday eyewear.",
    inventors: ["Steven Harris", "Laura Nelson"],
    assignee: "Apple Inc.",
    filingDate: "2020-06-11",
    grantDate: "2022-11-15",
    url: "https://patents.google.com/patent/US11498901",
    provider: 'USPTO'
  },
  {
    id: "11456789",
    patentNumber: "US11456789",
    title: "Electric vehicle battery thermal management system with phase change materials",
    abstract: "A cooling system for lithium-ion battery packs in electric vehicles. The invention integrates phase change materials with liquid cooling channels to maintain optimal operating temperatures, extending battery life and enabling faster charging rates.",
    inventors: ["Mark Robinson", "Catherine Young", "Paul King"],
    assignee: "Rivian Automotive, LLC",
    filingDate: "2021-07-09",
    grantDate: "2022-09-27",
    url: "https://patents.google.com/patent/US11456789",
    provider: 'USPTO'
  }
];

// Mock patent data - European Patent Office (EPO)
const mockEPOPatents: Patent[] = [
  {
    id: "EP4123456",
    patentNumber: "EP4123456",
    title: "Wind turbine blade with adaptive aerodynamic surface control",
    abstract: "An innovative wind energy system featuring morphing blade technology. The invention employs smart materials and distributed sensors to dynamically adjust blade geometry in response to wind conditions, maximizing energy capture and reducing mechanical stress.",
    inventors: ["Klaus Schmidt", "Anna Müller", "Pierre Dubois"],
    assignee: "Siemens Gamesa Renewable Energy",
    filingDate: "2021-04-12",
    grantDate: "2023-10-18",
    url: "https://worldwide.espacenet.com/patent/EP4123456",
    provider: 'EPO'
  },
  {
    id: "EP4098765",
    patentNumber: "EP4098765",
    title: "Biodegradable polymer composite for sustainable packaging applications",
    abstract: "A novel bio-based material combining polylactic acid with natural fiber reinforcement. The invention provides mechanical properties comparable to conventional plastics while ensuring complete biodegradability in industrial and home composting conditions.",
    inventors: ["Sofia Rossi", "Hans Andersson"],
    assignee: "BASF SE",
    filingDate: "2020-11-25",
    grantDate: "2023-08-07",
    url: "https://worldwide.espacenet.com/patent/EP4098765",
    provider: 'EPO'
  },
  {
    id: "EP4067890",
    patentNumber: "EP4067890",
    title: "Neural interface system for prosthetic limb control with haptic feedback",
    abstract: "A bidirectional brain-computer interface enabling intuitive control of advanced prosthetics. The system translates neural signals into movement commands while providing tactile sensation feedback through peripheral nerve stimulation.",
    inventors: ["Dr. Emma Larsson", "Prof. Marco Bianchi", "Dr. Jean Martin"],
    assignee: "ETH Zurich",
    filingDate: "2021-09-03",
    grantDate: "2023-06-22",
    url: "https://worldwide.espacenet.com/patent/EP4067890",
    provider: 'EPO'
  },
  {
    id: "EP4045678",
    patentNumber: "EP4045678",
    title: "Hydrogen fuel cell system with integrated thermal energy recovery",
    abstract: "An efficient energy conversion system for stationary and mobile applications. The invention captures waste heat from fuel cell operation for building heating or additional power generation, achieving overall system efficiencies exceeding 85%.",
    inventors: ["Henrik Nielsen", "Francesca Romano"],
    assignee: "Hydrogenics Europe",
    filingDate: "2020-07-19",
    grantDate: "2023-04-11",
    url: "https://worldwide.espacenet.com/patent/EP4045678",
    provider: 'EPO'
  },
  {
    id: "EP4023456",
    patentNumber: "EP4023456",
    title: "Precision agriculture system using hyperspectral imaging and AI",
    abstract: "A remote sensing platform for crop health monitoring and yield optimization. The system combines drone-based hyperspectral cameras with machine learning algorithms to detect diseases, nutrient deficiencies, and water stress at early stages.",
    inventors: ["Carlos Fernández", "Ingrid Bergman"],
    assignee: "Bayer CropScience",
    filingDate: "2021-02-28",
    grantDate: "2023-03-15",
    url: "https://worldwide.espacenet.com/patent/EP4023456",
    provider: 'EPO'
  }
];

// Mock patent data - World Intellectual Property Organization (WIPO)
const mockWIPOPatents: Patent[] = [
  {
    id: "WO2023123456",
    patentNumber: "WO2023/123456",
    title: "Carbon capture and utilization system for industrial emissions",
    abstract: "An integrated solution for capturing CO2 from industrial exhaust streams and converting it into valuable chemical feedstocks. The invention employs novel catalyst systems and process optimization to achieve economically viable carbon recycling.",
    inventors: ["Dr. Yuki Tanaka", "Dr. Priya Sharma", "Dr. Ahmed Hassan"],
    assignee: "International Climate Solutions Inc.",
    filingDate: "2022-06-15",
    grantDate: "2023-12-28",
    url: "https://patentscope.wipo.int/search/WO2023123456",
    provider: 'WIPO'
  },
  {
    id: "WO2023098765",
    patentNumber: "WO2023/098765",
    title: "Modular nuclear fusion reactor with magnetic confinement",
    abstract: "A compact fusion energy system based on advanced tokamak design. The invention features high-temperature superconducting magnets and novel plasma heating techniques to achieve sustained fusion reactions in a commercially scalable form factor.",
    inventors: ["Dr. Vladimir Petrov", "Dr. Chen Wei", "Dr. Maria Santos"],
    assignee: "Commonwealth Fusion Systems",
    filingDate: "2022-04-08",
    grantDate: "2023-10-19",
    url: "https://patentscope.wipo.int/search/WO2023098765",
    provider: 'WIPO'
  },
  {
    id: "WO2023087654",
    patentNumber: "WO2023/087654",
    title: "Quantum-resistant cryptographic protocol for blockchain networks",
    abstract: "A post-quantum security framework protecting distributed ledger systems against future quantum computer attacks. The protocol implements lattice-based cryptography with efficient verification suitable for high-throughput blockchain applications.",
    inventors: ["Prof. Hiroshi Nakamoto", "Dr. Elena Kowalski"],
    assignee: "Quantum Security Technologies",
    filingDate: "2022-09-22",
    grantDate: "2023-11-30",
    url: "https://patentscope.wipo.int/search/WO2023087654",
    provider: 'WIPO'
  },
  {
    id: "WO2023076543",
    patentNumber: "WO2023/076543",
    title: "Vertical farming system with optimized LED spectrum and automation",
    abstract: "An indoor agriculture platform maximizing crop yield per square meter. The system uses AI-controlled lighting, climate management, and nutrient delivery to grow fresh produce year-round with 95% less water than traditional farming.",
    inventors: ["Dr. Sarah Johnson", "Eng. Mohamed Ali", "Dr. Lisa Chen"],
    assignee: "AeroFarms Global",
    filingDate: "2022-03-11",
    grantDate: "2023-09-14",
    url: "https://patentscope.wipo.int/search/WO2023076543",
    provider: 'WIPO'
  },
  {
    id: "WO2023065432",
    patentNumber: "WO2023/065432",
    title: "Brain-inspired neuromorphic chip for edge AI computing",
    abstract: "A specialized processor architecture mimicking biological neural networks. The invention achieves ultra-low power consumption for AI inference tasks, enabling sophisticated machine learning capabilities in battery-powered devices.",
    inventors: ["Dr. Kai Zhang", "Dr. Rajesh Kumar", "Dr. Sophie Laurent"],
    assignee: "Intel Corporation",
    filingDate: "2022-01-20",
    grantDate: "2023-07-25",
    url: "https://patentscope.wipo.int/search/WO2023065432",
    provider: 'WIPO'
  }
];

// Mock patent data - Google Patents (aggregated from multiple sources)
const mockGooglePatents: Patent[] = [
  {
    id: "CN114567890",
    patentNumber: "CN114567890",
    title: "High-energy density solid-state battery with lithium metal anode",
    abstract: "An advanced battery technology featuring ceramic electrolyte and lithium metal negative electrode. The invention delivers energy density exceeding 500 Wh/kg while eliminating flammability risks associated with liquid electrolytes.",
    inventors: ["Dr. Li Ming", "Dr. Wang Hui"],
    assignee: "CATL (Contemporary Amperex Technology)",
    filingDate: "2021-08-15",
    grantDate: "2023-05-30",
    url: "https://patents.google.com/patent/CN114567890",
    provider: 'Google Patents'
  },
  {
    id: "JP2023987654",
    patentNumber: "JP2023-987654",
    title: "Humanoid robot with soft actuators for safe human interaction",
    abstract: "A service robotics platform incorporating pneumatic artificial muscles and compliant mechanisms. The design enables natural movement patterns and inherently safe physical interaction, suitable for healthcare and domestic assistance applications.",
    inventors: ["Dr. Takeshi Yamamoto", "Dr. Keiko Suzuki"],
    assignee: "Toyota Motor Corporation",
    filingDate: "2021-10-07",
    grantDate: "2023-08-18",
    url: "https://patents.google.com/patent/JP2023987654",
    provider: 'Google Patents'
  },
  {
    id: "KR102345678",
    patentNumber: "KR10-2345678",
    title: "Foldable OLED display with enhanced durability and minimal crease",
    abstract: "A flexible display technology using ultra-thin glass substrate and optimized hinge mechanism. The innovation maintains optical quality through hundreds of thousands of folding cycles while minimizing visible creasing in the bent region.",
    inventors: ["Dr. Kim Sung-ho", "Dr. Park Ji-won"],
    assignee: "Samsung Display Co., Ltd.",
    filingDate: "2021-06-25",
    grantDate: "2023-04-05",
    url: "https://patents.google.com/patent/KR102345678",
    provider: 'Google Patents'
  },
  {
    id: "AU2023234567",
    patentNumber: "AU2023234567",
    title: "Water desalination system using solar thermal distillation",
    abstract: "A sustainable freshwater production method powered entirely by solar energy. The system combines parabolic concentrators with multi-effect distillation to achieve energy-efficient operation suitable for remote and coastal communities.",
    inventors: ["Dr. James Cooper", "Dr. Aisha Patel"],
    assignee: "Desolenator B.V.",
    filingDate: "2022-05-12",
    grantDate: "2023-11-08",
    url: "https://patents.google.com/patent/AU2023234567",
    provider: 'Google Patents'
  },
  {
    id: "BR1020230123456",
    patentNumber: "BR102023012345-6",
    title: "Bioethanol production from lignocellulosic waste using engineered enzymes",
    abstract: "An improved biofuel manufacturing process utilizing genetically optimized cellulase enzymes. The technology enables efficient conversion of agricultural residues and forestry waste into ethanol, supporting sustainable energy production.",
    inventors: ["Dr. Carlos Silva", "Dr. Ana Costa"],
    assignee: "Raízen S.A.",
    filingDate: "2022-02-18",
    grantDate: "2023-09-29",
    url: "https://patents.google.com/patent/BR1020230123456",
    provider: 'Google Patents'
  }
];

// Search function using mock data
export async function searchPatents(
  query: string, 
  provider: PatentProvider = 'USPTO',
  page: number = 1, 
  perPage: number = 25
): Promise<PatentSearchResult> {
  if (!query.trim()) {
    return { patents: [], total: 0, provider };
  }

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const lowerQuery = query.toLowerCase();
  
  // Select the appropriate data source based on provider
  let dataSource: Patent[];
  switch (provider) {
    case 'EPO':
      dataSource = mockEPOPatents;
      break;
    case 'WIPO':
      dataSource = mockWIPOPatents;
      break;
    case 'Google Patents':
      dataSource = mockGooglePatents;
      break;
    case 'USPTO':
    default:
      dataSource = mockUSPTOPatents;
      break;
  }
  
  // Filter patents based on query matching title, abstract, assignee, or inventor
  const filteredPatents = dataSource.filter(patent => 
    patent.title.toLowerCase().includes(lowerQuery) ||
    patent.abstract.toLowerCase().includes(lowerQuery) ||
    patent.assignee.toLowerCase().includes(lowerQuery) ||
    patent.inventors.some(inv => inv.toLowerCase().includes(lowerQuery))
  );

  const safePerPage = Math.max(1, perPage);
  const safePage = Math.max(1, page);
  const startIndex = (safePage - 1) * safePerPage;
  const endIndex = startIndex + safePerPage;
  const paginatedResults = filteredPatents.slice(startIndex, endIndex);

  return {
    patents: paginatedResults,
    total: filteredPatents.length,
    provider
  };
}

// Get all patents from all providers
export async function searchAllProviders(query: string): Promise<PatentSearchResult> {
  if (!query.trim()) {
    return { patents: [], total: 0, provider: 'Google Patents' };
  }

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  const lowerQuery = query.toLowerCase();
  const allPatents = [
    ...mockUSPTOPatents,
    ...mockEPOPatents,
    ...mockWIPOPatents,
    ...mockGooglePatents
  ];
  
  // Filter patents based on query
  const filteredPatents = allPatents.filter(patent => 
    patent.title.toLowerCase().includes(lowerQuery) ||
    patent.abstract.toLowerCase().includes(lowerQuery) ||
    patent.assignee.toLowerCase().includes(lowerQuery) ||
    patent.inventors.some(inv => inv.toLowerCase().includes(lowerQuery))
  );

  return {
    patents: filteredPatents,
    total: filteredPatents.length,
    provider: 'Google Patents' // Google Patents as aggregator
  };
}
