"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";

interface BareAct {
  id: string;
  name: string;
  shortName: string;
  year: string;
  category: string;
  description: string;
  sections: { number: string; title: string; content: string }[];
  url: string;
}

const bareActs: BareAct[] = [
  {
    id: "ipc",
    name: "Indian Penal Code, 1860",
    shortName: "IPC",
    year: "1860",
    category: "Criminal",
    description: "The primary criminal code of India covering offenses against the human body, property, and public tranquility.",
    sections: [
      { number: "302", title: "Punishment for murder", content: "Whoever commits murder shall be punished with death, or imprisonment for life, and shall also be liable to fine." },
      { number: "304", title: "Culpable homicide not amounting to murder", content: "Whoever commits culpable homicide not amounting to murder shall be punished with imprisonment for life, or imprisonment which may extend to ten years, and shall also be liable to fine." },
      { number: "376", title: "Punishment for rape", content: "Whoever commits rape shall be punished with rigorous imprisonment for a term which shall not be less than ten years but which may extend to imprisonment for life." },
      { number: "420", title: "Cheating and dishonestly inducing delivery of property", content: "Whoever cheats and thereby dishonestly induces the person deceived to deliver any property to any person shall be punished with imprisonment which may extend to seven years, and shall also be liable to fine." },
      { number: "498A", title: "Cruelty by husband or his relatives", content: "Whoever, being the husband or the relative of the husband of a woman, subjects such woman to cruelty shall be punished with imprisonment for a term which may extend to three years and shall also be liable to fine." },
    ],
    url: "https://www.indiacode.nic.in/",
  },
  {
    id: "bns",
    name: "Bharatiya Nyaya Sanhita, 2023",
    shortName: "BNS",
    year: "2023",
    category: "Criminal",
    description: "Replaced the Indian Penal Code (IPC) from July 1, 2024. Modern criminal law for India.",
    sections: [
      { number: "100", title: "Murder", content: "Whoever causes death by doing an act with the intention of causing death, or with the intention of causing such bodily injury as is likely to cause death, commits murder." },
      { number: "115", title: "Voluntarily causing hurt", content: "Whoever voluntarily causes hurt shall be punished with imprisonment which may extend to one year, or with fine which may extend to ten thousand rupees, or with both." },
      { number: "69", title: "Sexual intercourse by deceitful means", content: "Whoever has sexual intercourse with a woman who has not given consent, or whose consent was obtained through deceitful means, shall be punished." },
    ],
    url: "https://www.indiacode.nic.in/",
  },
  {
    id: "crpc",
    name: "Code of Criminal Procedure, 1973",
    shortName: "CrPC",
    year: "1973",
    category: "Criminal Procedure",
    description: "Procedures for administration of criminal law in India. Now largely replaced by BNSS, 2023.",
    sections: [
      { number: "154", title: "Information in cognizable cases", content: "Every information relating to the commission of a cognizable offence, if given orally to an officer in charge of a police station, shall be reduced to writing by him or under his direction." },
      { number: "41", title: "When police may arrest without warrant", content: "Any police officer may without an order from a Magistrate and without a warrant, arrest any person who has been concerned in any cognizable offence." },
      { number: "437", title: "Bail in non-bailable offences", content: "When any person has been arrested or detained without warrant by an officer in charge of a police station, such person may be released on bail." },
    ],
    url: "https://www.indiacode.nic.in/",
  },
  {
    id: "bnss",
    name: "Bharatiya Nagarik Suraksha Sanhita, 2023",
    shortName: "BNSS",
    year: "2023",
    category: "Criminal Procedure",
    description: "Replaced CrPC from July 1, 2024. Modern criminal procedure code for India.",
    sections: [
      { number: "173", title: "First Information Report", content: "Every information relating to the commission of a cognizable offence shall be reduced to writing and signed by the person giving it." },
      { number: "480", title: "Bail provisions", content: "Provisions for bail in various categories of offences including bailable and non-bailable offences." },
    ],
    url: "https://www.indiacode.nic.in/",
  },
  {
    id: "cpc",
    name: "Code of Civil Procedure, 1908",
    shortName: "CPC",
    year: "1908",
    category: "Civil",
    description: "Procedures for administration of civil law in India. Governs civil litigation processes.",
    sections: [
      { number: "9", title: "Courts to try all civil suits unless barred", content: "The Courts shall have jurisdiction to try all suits of a civil nature excepting suits of which cognizance is either expressly or impliedly barred." },
      { number: "11", title: "Res judicata", content: "No court shall try any suit or issue in which the matter directly and substantially in issue has been directly and substantially in issue in a former suit between the same parties." },
      { number: "100", title: "Second appeal", content: "Second appeal shall lie to the High Court from every decree passed in appeal by any Court subordinate to the High Court on substantial questions of law." },
    ],
    url: "https://www.indiacode.nic.in/",
  },
  {
    id: "tpa",
    name: "Transfer of Property Act, 1882",
    shortName: "TPA",
    year: "1882",
    category: "Property",
    description: "Governs transfer of property between living persons in India.",
    sections: [
      { number: "5", title: "Transfer of property defined", content: "Transfer of property means an act by which a living person conveys property, in present or in future, to one or more other living persons." },
      { number: "54", title: "Sale defined", content: "Sale is a transfer of ownership in exchange for a price paid or promised or part-paid and part-promised." },
    ],
    url: "https://www.indiacode.nic.in/",
  },
  {
    id: "eia",
    name: "Indian Evidence Act, 1872",
    shortName: "IEA",
    year: "1872",
    category: "Evidence",
    description: "Governs the law of evidence in India. Now replaced by BSA, 2023.",
    sections: [
      { number: "3", title: "May presume", content: "Whenever any fact is especially within the knowledge of any person, the burden of proving that fact is upon him." },
      { number: "27", title: "How much of information received from accused may be proved", content: "So much of such information, whether it amounts to a confession or not, as relates distinctly to the fact thereby discovered, may be proved." },
    ],
    url: "https://www.indiacode.nic.in/",
  },
  {
    id: "bsa",
    name: "Bharatiya Sakshya Adhiniyam, 2023",
    shortName: "BSA",
    year: "2023",
    category: "Evidence",
    description: "Replaced the Indian Evidence Act from July 1, 2024. Modern evidence law for India.",
    sections: [
      { number: "23", title: "Electronic and digital records", content: "Electronic and digital records shall be admissible as evidence in any proceeding." },
    ],
    url: "https://www.indiacode.nic.in/",
  },
  {
    id: "nia",
    name: "Negotiable Instruments Act, 1881",
    shortName: "NI Act",
    year: "1881",
    category: "Commercial",
    description: "Governs negotiable instruments like cheques, bills of exchange, and promissory notes.",
    sections: [
      { number: "138", title: "Dishonour of cheque for insufficiency of funds", content: "Where any cheque drawn by a person on an account maintained by him with a banker is returned unpaid, he shall be deemed to have committed an offence." },
      { number: "142", title: "Penalty for dishonour of cheque", content: "Whoever commits the offence defined in section 138 shall be punished with imprisonment which may extend to two years, or with fine which may extend to twice the amount of the cheque." },
    ],
    url: "https://www.indiacode.nic.in/",
  },
  {
    id: "ita",
    name: "Income Tax Act, 1961",
    shortName: "ITA",
    year: "1961",
    category: "Tax",
    description: "Governs income tax on individuals, Hindu undivided families, firms, companies, and other entities in India.",
    sections: [
      { number: "2", title: "Definitions", content: "In this Act, unless the context otherwise requires, 'Appellate Tribunal' means the Income-tax Appellate Tribunal constituted under section 250; 'Assessment' includes reassessment." },
      { number: "4", title: "Charge of income-tax", content: "Where any Central Act enacts that income-tax shall be charged for any assessment year at any rate or rates, tax at that rate or those rates shall be charged for that year in accordance with the provisions of this Act." },
      { number: "80C", title: "Deductions in respect of investments in certain assets", content: "In computing the total income of an assessee, there shall be allowed a deduction from the amount of income-tax payable on his total income, in respect of sums paid or deposited by him for securing a policy of life insurance." },
      { number: "139", title: "Return of income", content: "Every person whose total income during the previous year exceeded the maximum amount which is not chargeable to income-tax shall, on or before the due date, furnish a return of his income." },
      { number: "143", title: "Assessment", content: "Where a return has been furnished under section 139, the Assessing Officer shall examine the return and accompanying documents and shall make an assessment." },
      { number: "234A", title: "Interest for default in furnishing return of income", content: "Where the return of income for any assessment year is furnished after the due date, or is not furnished, the assessee shall be liable to pay simple interest at the rate of one percent for every month." },
      { number: "271", title: "Penalty for failure to furnish returns of income", content: "If any person who is required to furnish a return of income fails to furnish such return in due time, the Assessing Officer may direct that such person shall pay by way of penalty a sum equal to ten percent of the tax payable." },
    ],
    url: "https://www.indiacode.nic.in/",
  },
  {
    id: "cgst",
    name: "Central Goods and Services Tax Act, 2017",
    shortName: "CGST",
    year: "2017",
    category: "Tax",
    description: "Governs the levy and collection of the Central Goods and Services Tax on intra-State supply of goods or services.",
    sections: [
      { number: "7", title: "Scope of supply", content: "Supply of goods or services or both shall be deemed to be a supply of goods or services or both if it is made for a consideration by a person in the course or furtherance of business." },
      { number: "9", title: "Levy and collection", content: "There shall be levied a tax called the Central goods and services tax on all intra-State supplies of goods or services or both, except on the supply of alcoholic liquor for human consumption." },
      { number: "16", title: "Eligibility and conditions for taking input tax credit", content: "Every registered person shall, subject to such conditions and restrictions as may be prescribed, be entitled to take credit of input tax charged on any supply of goods or services or both to him." },
      { number: "22", title: "Persons liable for registration", content: "Every supplier shall be liable to be registered under this Act if his aggregate turnover in a State or Union territory exceeds twenty lakh rupees." },
      { number: "31", title: "Tax invoice", content: "A registered person supplying taxable goods or services shall issue a tax invoice showing the description, quantity, value of goods or services, and the amount of tax charged thereon." },
      { number: "39", title: "Furnishing of returns", content: "Every registered person, other than an Input Service Distributor or a person paying tax under the composition scheme, shall furnish a return in the prescribed form for every calendar month." },
    ],
    url: "https://www.indiacode.nic.in/",
  },
  {
    id: "ca",
    name: "Companies Act, 2013",
    shortName: "CA",
    year: "2013",
    category: "Corporate",
    description: "Regulates incorporation of companies, responsibilities of directors, and dissolution of companies in India.",
    sections: [
      { number: "2", title: "Definitions", content: "In this Act, unless the context otherwise requires, 'company' means a company incorporated under this Act or under any previous company law; 'Board of Directors' means the board of directors of a company." },
      { number: "3", title: "Formation of company", content: "Any seven or more persons, or where the company to be formed is to be a private company, any two or more persons, associated for any lawful purpose may subscribe their names to a memorandum of association." },
      { number: "7", title: "Documents to be filed with Registrar", content: "There shall be filed with the Registrar within whose jurisdiction the registered office of the company is proposed to be situated, the memorandum of association and the articles of association." },
      { number: "135", title: "Corporate Social Responsibility", content: "Every company having a net worth of rupees five hundred crore or more, or a turnover of rupees one thousand crore or more, shall constitute a Corporate Social Responsibility Committee of the Board." },
      { number: "166", title: "Duties of directors", content: "A director of a company shall act in accordance with the articles of the company and shall act in good faith in order to promote the objects of the company for the benefit of its members." },
      { number: "185", title: "Loan and investment by company", content: "No company shall, directly or indirectly, make any loan to any director or give any guarantee or provide any security in connection with any loan taken by any director." },
    ],
    url: "https://www.indiacode.nic.in/",
  },
  {
    id: "aca",
    name: "Arbitration and Conciliation Act, 1996",
    shortName: "ACA",
    year: "1996",
    category: "Arbitration",
    description: "Governs arbitration and conciliation proceedings in India, providing a framework for domestic and international arbitration.",
    sections: [
      { number: "2", title: "Definitions", content: "In this Act, unless the context otherwise requires, 'arbitration' means any arbitration whether or not referred to as an arbitration; 'award' includes an interim award." },
      { number: "3", title: "Capacity to refer to arbitration", content: "An arbitration agreement shall be deemed to be valid if it is in writing and signed by the parties, and provides for the settlement of disputes arising out of a defined legal relationship." },
      { number: "8", title: "Power to refer parties to arbitration where an agreement exists", content: "A judicial authority shall, when seised of an action in a matter which is the subject of an arbitration agreement, refer the parties to arbitration." },
      { number: "11", title: "Appointment of arbitrators", content: "A person of any nationality may be an arbitrator, unless otherwise agreed by the parties. Where parties fail to agree on the appointment, the court shall make the appointment." },
      { number: "17", title: "Interim measures by arbitral tribunal", content: "Unless otherwise agreed by the parties, the arbitral tribunal may, at the request of a party, order any party to take such interim measures of protection as the arbitral tribunal may consider necessary." },
      { number: "34", title: "Application for setting aside arbitral award", content: "Recourse to a court against an arbitral award may be made only by an application for setting aside such award in accordance with the provisions of this section." },
    ],
    url: "https://www.indiacode.nic.in/",
  },
  {
    id: "mva",
    name: "Motor Vehicles Act, 1988",
    shortName: "MVA",
    year: "1988",
    category: "Motor",
    description: "Consolidates and amends the law relating to motor vehicles, covering registration, licensing, traffic rules, and liability.",
    sections: [
      { number: "2", title: "Definitions", content: "In this Act, unless the context otherwise requires, 'motor vehicle' means any vehicle including a three-wheeled vehicle propelled by mechanical power; 'licence' means a licence issued under this Act." },
      { number: "112", title: "Limits of speed", content: "No person shall drive a motor vehicle or cause or allow a motor vehicle to be driven in any public place at a speed exceeding the maximum speed specified for the type of vehicle." },
      { number: "130", title: "Duty of driver in case of accident and discharge of insurance liabilities", content: "The driver of a vehicle shall, in the case of an accident, take reasonable steps to secure medical attention for any person injured." },
      { number: "134", title: "Duty in case of accident and insurance", content: "Where an accident occurs involving the death of, or bodily injury to, any person, the owner or driver of the vehicle shall report the matter to the nearest police station." },
      { number: "166", title: "Claims tribunal", content: "The State Government shall, by notification in the official gazette, constitute one or more Motor Accidents Claims Tribunals for any area for the purpose of adjudicating upon claims for compensation." },
      { number: "185", title: "Driving by a drunken person or under influence of drugs", content: "No person who, under the influence of drink or a drug to such an extent as to be incapable of exercising proper control over the vehicle, shall drive a motor vehicle." },
    ],
    url: "https://www.indiacode.nic.in/",
  },
  {
    id: "rtia",
    name: "Right to Information Act, 2005",
    shortName: "RTI",
    year: "2005",
    category: "RTI",
    description: "Empowers citizens to request information from public authorities, promoting transparency and accountability in governance.",
    sections: [
      { number: "2", title: "Definitions", content: "In this Act, unless the context otherwise requires, 'information' means any material in any form including documents, memos, e-mails, opinions, etc.; 'public authority' means any authority constituted under the Constitution or any law." },
      { number: "3", title: "Right to information", content: "Subject to the provisions of this Act, all citizens shall have the right to information which shall include the right to inspect works, documents, records, taking notes, certified copies." },
      { number: "4", title: "Obligations of public authorities", content: "Every public authority shall maintain all its records duly catalogued and indexed in a manner which facilitates the right to information under this Act." },
      { number: "6", title: "Request for obtaining information", content: "A person who desires to obtain any information under this Act shall make a request in writing or through electronic means in English or Hindi or the official language of the area." },
      { number: "8", title: "Exemption from disclosure of information", content: "Notwithstanding anything contained in this Act, there shall be no obligation to give any citizen any information which is exempt from disclosure under the Official Secrets Act." },
      { number: "19", title: "First appeal", content: "Any person who, on a request for information, is denied the right may prefer a first appeal to the appellate authority within thirty days from the date of expiry of the prescribed period." },
    ],
    url: "https://www.indiacode.nic.in/",
  },
  {
    id: "ipa",
    name: "Indian Partnership Act, 1932",
    shortName: "IPA",
    year: "1932",
    category: "Partnership",
    description: "Defines and amends the law relating to the formation, rights, and liabilities of partnerships in India.",
    sections: [
      { number: "2", title: "Definitions", content: "In this Act, unless there is anything repugnant in the subject or context, 'partnership' is the relation between persons who have agreed to share the profits of a business carried on by all or any of them acting for all." },
      { number: "4", title: "Definition of partnership, partner, firm, and firm name", content: "Partnership is the relation between persons who have agreed to share the profits of a business. Persons who have entered into partnership with one another are called individually 'partners' and collectively a 'firm'." },
      { number: "9", title: "Mutual relations of partners", content: "The mutual rights and duties of partners of a firm may be determined by contract between the partners, and such contract may be express or implied by a course of dealing." },
      { number: "11", title: "Rights and duties of partners", content: "Subject to contract between the partners, the following rules shall apply as regards to the mutual rights and duties of partners: partners are bound to carry on the business of the firm to their greatest common advantage." },
      { number: "12", title: "Duty of partners to render accounts", content: "Every partner is bound to render true and fullest accounts of all money received and paid by him on behalf of the firm, and to account for all money received by him on behalf of the firm." },
      { number: "30", title: "Mode of determining existing liability", content: "Where there are joint creditors, they may sue all the partners jointly, or any one or more of them, without including the others." },
    ],
    url: "https://www.indiacode.nic.in/",
  },
  {
    id: "sra",
    name: "Specific Relief Act, 1963",
    shortName: "SRA",
    year: "1963",
    category: "Civil",
    description: "Provides for specific relief and enforcement of civil rights, including performance of contracts and recovery of property.",
    sections: [
      { number: "10", title: "Contracts not specifically enforced", content: "The following contracts cannot be specifically enforced: contracts in which compensation is an adequate relief; contracts running into a period of more than three years from the date of formation." },
      { number: "14", title: "Contracts not specifically enforceable", content: "A contract shall not be specifically enforced if it is in its nature determinable; or where compensation is an adequate relief; or where the performance of the contract is in part the performance of another contract." },
      { number: "16", title: "Who may obtain specific performance", content: "Specific performance of a contract may be obtained by any party thereto, his assignee or representative, unless the court is of the opinion that the contract cannot be specifically enforced." },
      { number: "20", title: "Substituted performance of contract", content: "Where a party to a contract has failed to perform it and the other party has substituted performance by way of a suit, the court may order specific performance in lieu of damages." },
      { number: "21", title: "Discretionary relief", content: "The court may in its discretion refuse to grant specific performance of a contract where compensation would be an adequate relief, or where the grant would cause undue hardship." },
      { number: "38", title: "Recovery of specific immovable property", content: "A person entitled to the possession of specific immovable property may recover the same in the manner prescribed by the Code of Civil Procedure, 1908." },
    ],
    url: "https://www.indiacode.nic.in/",
  },
  {
    id: "cpa",
    name: "Consumer Protection Act, 2019",
    shortName: "CPA",
    year: "2019",
    category: "Consumer",
    description: "Protects the rights and interests of consumers, providing for establishment of consumer dispute redressal commissions.",
    sections: [
      { number: "2", title: "Definitions", content: "In this Act, unless the context otherwise requires, 'consumer' means any person who buys any goods for a consideration; 'complaint' means any allegation in writing made by a consumer." },
      { number: "8", title: "Central Consumer Protection Authority", content: "The Central Government shall establish a consumer protection authority to regulate matters related to violation of consumer rights, unfair trade practices, and false or misleading advertisements." },
      { number: "34", title: "Jurisdiction of District Commission", content: "The District Commission shall have jurisdiction to entertain complaints where the value of goods or services paid as consideration does not exceed one crore rupees." },
      { number: "37", title: "Jurisdiction of State Commission", content: "The State Commission shall have jurisdiction to entertain complaints where the value of goods or services paid as consideration exceeds one crore rupees but does not exceed ten crore rupees." },
      { number: "69", title: "Central Authority's powers", content: "The Central Authority shall have power to investigate complaints regarding violation of consumer rights, unfair trade practices, and false or misleading advertisements." },
    ],
    url: "https://www.indiacode.nic.in/",
  },
  {
    id: "ica",
    name: "Indian Contract Act, 1872",
    shortName: "ICA",
    year: "1872",
    category: "Contract",
    description: "Governs the formation and enforcement of contracts and agreements in India, including breach, indemnity, and agency.",
    sections: [
      { number: "2", title: "Definitions", content: "In this Act, unless there is anything repugnant in the subject or context, 'agreement' means every promise and every set of promises forming the consideration for each other; 'contract' is an agreement enforceable by law." },
      { number: "10", title: "What agreements are contracts", content: "All agreements are contracts if they are made by the free consent of parties competent to contract, for a lawful consideration and with a lawful object, and are not hereby expressly declared to be void." },
      { number: "23", title: "What considerations and objects are lawful", content: "The consideration or object of an agreement is lawful, unless it is forbidden by law; or is of such a nature that, if permitted, it would defeat the provisions of any law; or is fraudulent." },
      { number: "73", title: "Compensation for loss or damage caused by breach of contract", content: "When a contract has been broken, the party who suffers by such breach is entitled to receive compensation for any loss or damage caused to him thereby, which naturally arose in the usual course of things." },
      { number: "124", title: "Contract of indemnity defined", content: "A contract by which one party promises to save the other from loss caused to him by the conduct of the promisor himself or by the conduct of any other person, is a contract of indemnity." },
      { number: "182", title: "Agent defined", content: "An agent is a person employed to do any act for another or to represent another in dealings with third persons. The person for whom such act is done, or who is so represented, is called the principal." },
    ],
    url: "https://www.indiacode.nic.in/",
  },
];

const categories = [...new Set(bareActs.map((act) => act.category))].sort();

export default function BareActsPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [expandedAct, setExpandedAct] = useState<string | null>(null);

  const filteredActs = bareActs.filter((act) => {
    const matchesSearch =
      act.name.toLowerCase().includes(search.toLowerCase()) ||
      act.shortName.toLowerCase().includes(search.toLowerCase()) ||
      act.sections.some(
        (s) =>
          s.number.includes(search) ||
          s.title.toLowerCase().includes(search.toLowerCase())
      );
    const matchesCategory = categoryFilter === "all" || act.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bare Acts Reference</h1>
        <p className="text-[var(--text-secondary)]">Searchable Indian legal codes and statutes</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
          <Input
            placeholder="Search by act name, section number, or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-10 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        {filteredActs.map((act) => (
          <Card key={act.id}>
            <CardHeader
              className="cursor-pointer"
              onClick={() => setExpandedAct(expandedAct === act.id ? null : act.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[var(--surface-subtle)] flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-[var(--text-accent)]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{act.name}</CardTitle>
                      <Badge variant="secondary">{act.category}</Badge>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">{act.description}</p>
                  </div>
                </div>
                {expandedAct === act.id ? (
                  <ChevronUp className="h-5 w-5 text-[var(--text-tertiary)]" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-[var(--text-tertiary)]" />
                )}
              </div>
            </CardHeader>
            {expandedAct === act.id && (
              <CardContent className="border-t">
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-[var(--text-primary)]">Key Sections:</h4>
                  {act.sections
                    .filter(
                      (s) =>
                        !search ||
                        search === "" ||
                        s.number.includes(search) ||
                        s.title.toLowerCase().includes(search.toLowerCase()) ||
                        s.content.toLowerCase().includes(search.toLowerCase())
                    )
                    .map((section) => (
                      <div key={section.number} className="p-3 rounded-lg bg-[var(--background)] border">
                        <div className="flex items-start gap-2">
                          <Badge variant="outline" className="shrink-0">
                            Sec. {section.number}
                          </Badge>
                          <div>
                            <p className="font-medium text-sm">{section.title}</p>
                            <p className="text-sm text-[var(--text-secondary)] mt-1">{section.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  <a
                    href={act.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-[var(--text-accent)] hover:underline mt-2"
                  >
                    View full text on India Code
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {filteredActs.length === 0 && (
        <div className="text-center py-12 text-[var(--text-secondary)]">
          No bare acts found matching your search.
        </div>
      )}
    </div>
  );
}
